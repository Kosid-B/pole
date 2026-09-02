import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_MEMBER_ROLES = new Set(["owner", "admin"]);

type AuthMode = "legacy" | "supabase";

type ProvisioningActor = {
  authMode: AuthMode;
  actorUserId: string | null;
  actorLabel: string;
  organizationId: string;
};

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

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isValidLegacyAccess(row: AccessRow, codeHash: string, now: number) {
  if (row.code_hash === codeHash) return true;

  return Boolean(
    row.temp_code_hash === codeHash &&
      row.temp_code_expires_at &&
      new Date(row.temp_code_expires_at).getTime() > now,
  );
}

function parseRedirectTo(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalhost)) {
      return null;
    }
    if (url.pathname !== "/auth/accept-invite") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function resolveLegacyActor(
  db: any,
  legacyCode: string,
  requestedOrganizationId: string,
): Promise<ProvisioningActor | null> {
  const codeHash = await sha256(legacyCode);
  const { data: accessRows, error: accessError } = await db
    .from("drying_yard_booking_access")
    .select("project_id,code_hash,temp_code_hash,temp_code_expires_at")
    .eq("active", true)
    .eq("role", "admin");

  if (accessError) throw accessError;

  const now = Date.now();
  const projectIds = [...new Set(
    ((accessRows || []) as AccessRow[])
      .filter((row) => isValidLegacyAccess(row, codeHash, now))
      .map((row) => String(row.project_id)),
  )];

  if (projectIds.length === 0) return null;

  const { data: projects, error: projectsError } = await db
    .from("core_projects")
    .select("id,organization_id,status")
    .in("id", projectIds)
    .eq("status", "active");

  if (projectsError) throw projectsError;

  const organizationIds = [...new Set(
    (projects || [])
      .map((project: any) => String(project.organization_id || ""))
      .filter(Boolean),
  )];

  let organizationId = requestedOrganizationId;
  if (!organizationId) {
    if (organizationIds.length !== 1) return null;
    organizationId = organizationIds[0];
  }

  if (!organizationIds.includes(organizationId)) return null;

  return {
    authMode: "legacy",
    actorUserId: null,
    actorLabel: "legacy-project-admin",
    organizationId,
  };
}

async function resolveSupabaseActor(
  db: any,
  bearerToken: string,
  requestedOrganizationId: string,
): Promise<ProvisioningActor | null> {
  if (!requestedOrganizationId) return null;

  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser(bearerToken);

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await db
    .from("core_profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile?.role === "admin") {
    return {
      authMode: "supabase",
      actorUserId: user.id,
      actorLabel: profile.full_name || user.email || "platform-admin",
      organizationId: requestedOrganizationId,
    };
  }

  const { data: membership, error: membershipError } = await db
    .from("core_organization_members")
    .select("member_role")
    .eq("organization_id", requestedOrganizationId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("member_role", ["owner", "admin"])
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  return {
    authMode: "supabase",
    actorUserId: user.id,
    actorLabel: profile?.full_name || user.email || "organization-admin",
    organizationId: requestedOrganizationId,
  };
}

async function resolveActor(
  db: any,
  request: Request,
  body: Record<string, unknown>,
): Promise<ProvisioningActor | null> {
  const requestedOrganizationId = String(body.organization_id || "").trim();
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (bearerToken) {
    return resolveSupabaseActor(db, bearerToken, requestedOrganizationId);
  }

  const legacyCode = String(body.code || "").trim();
  if (!legacyCode) return null;

  return resolveLegacyActor(db, legacyCode, requestedOrganizationId);
}

async function findAuthUserByEmail(db: any, email: string) {
  const perPage = 200;

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const match = users.find(
      (user: any) => String(user.email || "").trim().toLowerCase() === email,
    );
    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

async function insertAudit(
  db: any,
  actor: ProvisioningActor,
  values: Record<string, unknown>,
) {
  const { data, error } = await db
    .from("core_user_provisioning_audit")
    .insert({
      organization_id: actor.organizationId,
      auth_mode: actor.authMode,
      actor_user_id: actor.actorUserId,
      actor_label: actor.actorLabel,
      ...values,
    })
    .select("id")
    .single();

  if (error) throw error;
  return String(data.id);
}

async function updateAudit(db: any, auditId: string, values: Record<string, unknown>) {
  const { error } = await db
    .from("core_user_provisioning_audit")
    .update(values)
    .eq("id", auditId);

  if (error) console.error("Unable to update provisioning audit", error);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let auditId: string | null = null;

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "invite_organization_admin");
    if (action !== "invite_organization_admin") {
      return json({ error: "UNKNOWN_ACTION" }, 400);
    }

    const actor = await resolveActor(db, request, body);
    if (!actor) return json({ error: "PROVISIONING_ACCESS_DENIED" }, 403);

    const email = normalizeEmail(body.email);
    const fullName = String(body.full_name || "").trim();
    const memberRole = String(body.member_role || "admin").trim().toLowerCase();
    const redirectRaw = String(body.redirect_to || "").trim();
    const redirectTo = parseRedirectTo(body.redirect_to);

    if (!EMAIL_RE.test(email)) return json({ error: "INVALID_EMAIL" }, 400);
    if (!fullName) return json({ error: "FULL_NAME_REQUIRED" }, 400);
    if (!ALLOWED_MEMBER_ROLES.has(memberRole)) {
      return json({ error: "INVALID_MEMBER_ROLE" }, 400);
    }
    if (redirectRaw && !redirectTo) {
      return json({ error: "INVALID_INVITE_REDIRECT" }, 400);
    }

    const { data: organization, error: organizationError } = await db
      .from("core_organizations")
      .select("id,org_name,status")
      .eq("id", actor.organizationId)
      .eq("status", "active")
      .maybeSingle();

    if (organizationError) throw organizationError;
    if (!organization) return json({ error: "ORGANIZATION_NOT_FOUND" }, 404);

    auditId = await insertAudit(db, actor, {
      target_email: email,
      target_member_role: memberRole,
      action: "invite_organization_admin",
      status: "requested",
      detail: {
        organization_name: organization.org_name,
        redirect_configured: Boolean(redirectTo),
      },
    });

    const existingUser = await findAuthUserByEmail(db, email);
    if (existingUser) {
      const { data: membership, error: membershipError } = await db
        .from("core_organization_members")
        .select("member_role,is_active")
        .eq("organization_id", actor.organizationId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (
        membership?.is_active &&
        (membership.member_role === "owner" || membership.member_role === "admin")
      ) {
        await updateAudit(db, auditId, {
          target_user_id: existingUser.id,
          status: "provisioned",
          detail: {
            organization_name: organization.org_name,
            idempotent: true,
            existing_member_role: membership.member_role,
          },
        });

        return json({
          ok: true,
          status: "already_provisioned",
          user_id: existingUser.id,
          email,
          organization_id: actor.organizationId,
          member_role: membership.member_role,
          invite_sent: false,
        });
      }

      await updateAudit(db, auditId, {
        target_user_id: existingUser.id,
        status: "failed",
        error_code: "AUTH_USER_ALREADY_EXISTS",
      });
      return json({ error: "AUTH_USER_ALREADY_EXISTS" }, 409);
    }

    const inviteOptions: Record<string, unknown> = {
      data: {
        full_name: fullName,
        sitecost_invite: "organization_admin",
      },
    };
    if (redirectTo) inviteOptions.redirectTo = redirectTo;

    const { data: inviteData, error: inviteError } = await db.auth.admin.inviteUserByEmail(
      email,
      inviteOptions,
    );

    if (inviteError || !inviteData?.user?.id) {
      await updateAudit(db, auditId, {
        status: "failed",
        error_code: "AUTH_INVITE_FAILED",
        detail: {
          organization_name: organization.org_name,
          message: inviteError?.message || "Invite did not return a user id",
        },
      });
      return json({ error: "AUTH_INVITE_FAILED" }, 502);
    }

    const userId = String(inviteData.user.id);
    await updateAudit(db, auditId, {
      target_user_id: userId,
      status: "invited",
    });

    const { error: profileError } = await db.from("core_profiles").insert({
      id: userId,
      full_name: fullName,
      role: "customer",
    });

    if (profileError) {
      await db.auth.admin.deleteUser(userId);
      await updateAudit(db, auditId, {
        status: "rolled_back",
        error_code: "PROFILE_CREATE_FAILED",
        detail: { message: profileError.message },
      });
      return json({ error: "PROFILE_CREATE_FAILED" }, 500);
    }

    const { error: membershipError } = await db.from("core_organization_members").insert({
      organization_id: actor.organizationId,
      user_id: userId,
      member_role: memberRole,
      is_active: true,
    });

    if (membershipError) {
      await db.auth.admin.deleteUser(userId);
      await updateAudit(db, auditId, {
        status: "rolled_back",
        error_code: "MEMBERSHIP_CREATE_FAILED",
        detail: { message: membershipError.message },
      });
      return json({ error: "MEMBERSHIP_CREATE_FAILED" }, 500);
    }

    await updateAudit(db, auditId, {
      target_user_id: userId,
      status: "provisioned",
      detail: {
        organization_name: organization.org_name,
        invite_sent: true,
        redirect_configured: Boolean(redirectTo),
      },
    });

    return json({
      ok: true,
      status: "invited",
      user_id: userId,
      email,
      organization_id: actor.organizationId,
      member_role: memberRole,
      invite_sent: true,
    });
  } catch (error) {
    console.error(error);

    if (auditId) {
      try {
        const db = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          { auth: { persistSession: false } },
        );
        await updateAudit(db, auditId, {
          status: "failed",
          error_code: "SERVER_ERROR",
          detail: {
            message: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (auditError) {
        console.error("Unable to persist provisioning failure audit", auditError);
      }
    }

    return json(
      {
        error: "SERVER_ERROR",
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
