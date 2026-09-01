import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

type ProjectRow = {
  id: string;
  organization_id: string | null;
  project_code: string;
  project_name: string;
  module: string;
  status: string;
};

type ProjectModuleRow = {
  project_id: string;
  module_code: string;
  is_enabled: boolean;
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (request.method !== "POST") {
    return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const body = await request.json().catch(() => ({}));
    const requestedProjectId = String(body.project_id || "").trim();
    const legacyCode = String(body.code || "").trim();
    const authorization = request.headers.get("authorization") || "";
    const bearerToken = authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : "";

    let authMode: "supabase" | "legacy";
    let actorUserId: string | null = null;
    let accessibleProjectIds: string[] = [];

    if (bearerToken) {
      const {
        data: { user },
        error: userError,
      } = await db.auth.getUser(bearerToken);

      if (userError || !user) {
        return json({ error: "INVALID_SESSION" }, 401);
      }

      authMode = "supabase";
      actorUserId = user.id;

      const [{ data: profile, error: profileError }, { data: projectMembers, error: projectMemberError }] =
        await Promise.all([
          db.from("core_profiles").select("role").eq("id", user.id).maybeSingle(),
          db.from("core_project_members").select("project_id").eq("user_id", user.id),
        ]);

      if (profileError) throw profileError;
      if (projectMemberError) throw projectMemberError;

      const explicitProjectIds = (projectMembers || []).map((row: any) => String(row.project_id));

      if (profile?.role === "admin") {
        const { data: allProjects, error: allProjectsError } = await db
          .from("core_projects")
          .select("id")
          .eq("status", "active");

        if (allProjectsError) throw allProjectsError;
        accessibleProjectIds = (allProjects || []).map((row: any) => String(row.id));
      } else {
        const { data: orgMemberships, error: orgMembershipError } = await db
          .from("core_organization_members")
          .select("organization_id,member_role,status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .in("member_role", ["owner", "executive", "admin"]);

        if (orgMembershipError) throw orgMembershipError;

        const leadershipOrgIds = unique(
          (orgMemberships || []).map((row: any) => String(row.organization_id)),
        );

        let organizationProjectIds: string[] = [];
        if (leadershipOrgIds.length > 0) {
          const { data: orgProjects, error: orgProjectsError } = await db
            .from("core_projects")
            .select("id")
            .eq("status", "active")
            .in("organization_id", leadershipOrgIds);

          if (orgProjectsError) throw orgProjectsError;
          organizationProjectIds = (orgProjects || []).map((row: any) => String(row.id));
        }

        accessibleProjectIds = unique([...explicitProjectIds, ...organizationProjectIds]);
      }
    } else if (legacyCode) {
      authMode = "legacy";
      const codeHash = await sha256(legacyCode);
      const { data: accessRows, error: accessError } = await db
        .from("drying_yard_booking_access")
        .select("project_id,code_hash,temp_code_hash,temp_code_expires_at")
        .eq("active", true)
        .eq("role", "admin");

      if (accessError) throw accessError;

      const now = Date.now();
      accessibleProjectIds = unique(
        (accessRows || [])
          .filter((row: any) => {
            if (row.code_hash === codeHash) return true;
            if (!row.temp_code_hash || row.temp_code_hash !== codeHash || !row.temp_code_expires_at) {
              return false;
            }
            return new Date(row.temp_code_expires_at).getTime() > now;
          })
          .map((row: any) => String(row.project_id)),
      );

      if (accessibleProjectIds.length === 0) {
        return json({ error: "INVALID_ACCESS_CODE" }, 401);
      }
    } else {
      return json({ error: "AUTHENTICATION_REQUIRED" }, 401);
    }

    if (accessibleProjectIds.length === 0) {
      return json({
        ok: true,
        auth_mode: authMode,
        actor_user_id: actorUserId,
        selected_project_id: null,
        projects: [],
      });
    }

    if (requestedProjectId && !accessibleProjectIds.includes(requestedProjectId)) {
      return json({ error: "PROJECT_ACCESS_DENIED" }, 403);
    }

    const [{ data: projects, error: projectsError }, { data: modules, error: modulesError }] =
      await Promise.all([
        db
          .from("core_projects")
          .select("id,organization_id,project_code,project_name,module,status")
          .in("id", accessibleProjectIds)
          .order("project_name"),
        db
          .from("core_project_modules")
          .select("project_id,module_code,is_enabled")
          .in("project_id", accessibleProjectIds)
          .eq("is_enabled", true),
      ]);

    if (projectsError) throw projectsError;
    if (modulesError) throw modulesError;

    const moduleMap = new Map<string, string[]>();
    for (const row of (modules || []) as ProjectModuleRow[]) {
      const current = moduleMap.get(row.project_id) || [];
      current.push(row.module_code);
      moduleMap.set(row.project_id, current);
    }

    const normalizedProjects = ((projects || []) as ProjectRow[]).map((project) => ({
      id: project.id,
      organization_id: project.organization_id,
      project_code: project.project_code,
      project_name: project.project_name,
      project_type: project.module,
      status: project.status,
      enabled_modules: (moduleMap.get(project.id) || []).sort(),
    }));

    const selectedProjectId = requestedProjectId || normalizedProjects[0]?.id || null;

    return json({
      ok: true,
      auth_mode: authMode,
      actor_user_id: actorUserId,
      selected_project_id: selectedProjectId,
      projects: normalizedProjects,
    });
  } catch (error) {
    console.error(error);
    return json(
      {
        error: "SERVER_ERROR",
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
