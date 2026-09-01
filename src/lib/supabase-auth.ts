import type { AppRole } from "@/lib/permissions";

export type SiteCostAuthProvider = "legacy" | "supabase";

type SupabaseUser = {
  id: string;
  email?: string | null;
};

type SupabasePasswordTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: SupabaseUser;
};

type CoreProfileRow = {
  full_name: string | null;
  role: string | null;
};

type OrganizationMembershipRow = {
  member_role: string;
};

export type SupabaseSiteCostIdentity = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

export type SupabaseSignInResult = {
  identity: SupabaseSiteCostIdentity;
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function getSupabaseAuthConfig() {
  const url = process.env.SITECOST_SUPABASE_URL?.trim();
  const publishableKey = process.env.SITECOST_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url: normalizeBaseUrl(url),
    publishableKey,
  };
}

export function getConfiguredAuthProvider(): SiteCostAuthProvider {
  return process.env.SITECOST_AUTH_PROVIDER?.trim().toLowerCase() === "supabase"
    ? "supabase"
    : "legacy";
}

function strongestRole(
  profileRole: string | null | undefined,
  memberships: OrganizationMembershipRow[],
): AppRole | null {
  if (profileRole === "admin") {
    return "ADMIN";
  }

  const roles = new Set(memberships.map((membership) => membership.member_role));

  if (roles.has("owner") || roles.has("executive")) {
    return "EXECUTIVE";
  }

  if (
    roles.has("admin") ||
    roles.has("pm") ||
    roles.has("commercial") ||
    roles.has("procurement") ||
    roles.has("finance")
  ) {
    return "ADMIN";
  }

  if (roles.has("field_leader")) {
    return "FIELD_LEADER";
  }

  return null;
}

export function mapSupabaseRole(
  profileRole: string | null | undefined,
  membershipRoles: string[],
) {
  return strongestRole(
    profileRole,
    membershipRoles.map((member_role) => ({ member_role })),
  );
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit,
  accessToken?: string,
): Promise<T | null> {
  const config = getSupabaseAuthConfig();

  if (!config) {
    return null;
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", config.publishableKey);
  headers.set("Accept", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function readIdentity(accessToken: string) {
  const user = await supabaseRequest<SupabaseUser>(
    "/auth/v1/user",
    { method: "GET" },
    accessToken,
  );

  if (!user?.id) {
    return null;
  }

  const encodedUserId = encodeURIComponent(user.id);
  const [profiles, memberships] = await Promise.all([
    supabaseRequest<CoreProfileRow[]>(
      `/rest/v1/core_profiles?select=full_name,role&id=eq.${encodedUserId}&limit=1`,
      { method: "GET" },
      accessToken,
    ),
    supabaseRequest<OrganizationMembershipRow[]>(
      `/rest/v1/core_organization_members?select=member_role&user_id=eq.${encodedUserId}&is_active=eq.true`,
      { method: "GET" },
      accessToken,
    ),
  ]);

  const profile = profiles?.[0] ?? null;
  const role = strongestRole(profile?.role, memberships ?? []);

  if (!role) {
    return null;
  }

  const email = user.email?.trim().toLowerCase() ?? "";

  return {
    id: user.id,
    email,
    name: profile?.full_name?.trim() || email || "SiteCost User",
    role,
  } satisfies SupabaseSiteCostIdentity;
}

export async function getSupabaseSiteCostIdentity(accessToken: string) {
  if (!accessToken) {
    return null;
  }

  return readIdentity(accessToken);
}

export async function signInWithSupabasePassword(
  email: string,
  password: string,
): Promise<SupabaseSignInResult | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const token = await supabaseRequest<SupabasePasswordTokenResponse>(
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    },
  );

  if (!token?.access_token || !token.user?.id) {
    return null;
  }

  const identity = await readIdentity(token.access_token);

  if (!identity) {
    return null;
  }

  return {
    identity,
    accessToken: token.access_token,
    refreshToken: token.refresh_token || null,
    expiresIn: Math.max(60, Number(token.expires_in) || 3600),
  };
}
