export type SiteCostRequiredModule = "commercial" | "pm" | "procurement";

export type AuthorizedProjectScope = {
  ok: true;
  projectId: string;
  authMode: "legacy" | "supabase";
  actorUserId: string | null;
};

export type ProjectScopeFailure = {
  ok: false;
  status: number;
  error:
    | "AUTHENTICATION_REQUIRED"
    | "INVALID_SESSION"
    | "INVALID_ACCESS_CODE"
    | "PROJECT_ID_REQUIRED"
    | "PROJECT_ACCESS_DENIED"
    | "MODULE_ACCESS_DENIED";
};

export type ProjectAuthorizationResult = AuthorizedProjectScope | ProjectScopeFailure;

type AccessRow = {
  project_id: string;
  code_hash: string | null;
  temp_code_hash: string | null;
  temp_code_expires_at: string | null;
};

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function isValidLegacyAccess(row: AccessRow, codeHash: string, now: number) {
  if (row.code_hash === codeHash) return true;

  return Boolean(
    row.temp_code_hash === codeHash &&
      row.temp_code_expires_at &&
      new Date(row.temp_code_expires_at).getTime() > now,
  );
}

async function resolveSupabaseProjectAccess(
  db: any,
  bearerToken: string,
  requestedProjectId: string,
): Promise<{ allowed: boolean; actorUserId: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser(bearerToken);

  if (userError || !user) {
    return { allowed: false, actorUserId: null };
  }

  const { data: project, error: projectError } = await db
    .from("core_projects")
    .select("id,organization_id,status")
    .eq("id", requestedProjectId)
    .eq("status", "active")
    .maybeSingle();

  if (projectError) throw projectError;
  if (!project) return { allowed: false, actorUserId: user.id };

  const [{ data: profile, error: profileError }, { data: projectMember, error: memberError }] =
    await Promise.all([
      db.from("core_profiles").select("role").eq("id", user.id).maybeSingle(),
      db
        .from("core_project_members")
        .select("project_id")
        .eq("user_id", user.id)
        .eq("project_id", requestedProjectId)
        .maybeSingle(),
    ]);

  if (profileError) throw profileError;
  if (memberError) throw memberError;

  if (profile?.role === "admin" || projectMember) {
    return { allowed: true, actorUserId: user.id };
  }

  if (!project.organization_id) {
    return { allowed: false, actorUserId: user.id };
  }

  const { data: orgMember, error: orgMemberError } = await db
    .from("core_organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", project.organization_id)
    .eq("is_active", true)
    .in("member_role", ["owner", "executive", "admin"])
    .maybeSingle();

  if (orgMemberError) throw orgMemberError;

  return { allowed: Boolean(orgMember), actorUserId: user.id };
}

export async function authorizeProjectRequest(
  db: any,
  request: Request,
  body: Record<string, unknown>,
  requiredModule: SiteCostRequiredModule,
): Promise<ProjectAuthorizationResult> {
  const requestedProjectId = String(body.project_id || "").trim();
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const legacyCode = String(body.code || "").trim();

  let projectId = requestedProjectId;
  let authMode: "legacy" | "supabase";
  let actorUserId: string | null = null;

  if (bearerToken) {
    if (!projectId) {
      return { ok: false, status: 400, error: "PROJECT_ID_REQUIRED" };
    }

    const access = await resolveSupabaseProjectAccess(db, bearerToken, projectId);
    if (!access.actorUserId) {
      return { ok: false, status: 401, error: "INVALID_SESSION" };
    }
    if (!access.allowed) {
      return { ok: false, status: 403, error: "PROJECT_ACCESS_DENIED" };
    }

    authMode = "supabase";
    actorUserId = access.actorUserId;
  } else if (legacyCode) {
    const codeHash = await sha256(legacyCode);
    const { data: accessRows, error: accessError } = await db
      .from("drying_yard_booking_access")
      .select("project_id,code_hash,temp_code_hash,temp_code_expires_at")
      .eq("active", true)
      .eq("role", "admin");

    if (accessError) throw accessError;

    const now = Date.now();
    const matchingRows = ((accessRows || []) as AccessRow[]).filter((row) =>
      isValidLegacyAccess(row, codeHash, now),
    );

    if (matchingRows.length === 0) {
      return { ok: false, status: 401, error: "INVALID_ACCESS_CODE" };
    }

    const authorizedProjectIds = [...new Set(matchingRows.map((row) => String(row.project_id)))];

    // Backward compatibility for existing static admin clients: if the code is bound
    // to exactly one project, that project remains the implicit scope.
    if (!projectId) {
      if (authorizedProjectIds.length !== 1) {
        return { ok: false, status: 400, error: "PROJECT_ID_REQUIRED" };
      }
      projectId = authorizedProjectIds[0];
    }

    if (!authorizedProjectIds.includes(projectId)) {
      return { ok: false, status: 403, error: "PROJECT_ACCESS_DENIED" };
    }

    authMode = "legacy";
  } else {
    return { ok: false, status: 401, error: "AUTHENTICATION_REQUIRED" };
  }

  const { data: moduleRow, error: moduleError } = await db
    .from("core_project_modules")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("module_code", requiredModule)
    .eq("is_active", true)
    .maybeSingle();

  if (moduleError) throw moduleError;
  if (!moduleRow) {
    return { ok: false, status: 403, error: "MODULE_ACCESS_DENIED" };
  }

  return {
    ok: true,
    projectId,
    authMode,
    actorUserId,
  };
}
