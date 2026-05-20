import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  APP_ROLES,
  type AppRole,
  getDefaultDashboardRoute,
  normalizeRole,
} from "@/lib/permissions";

export const ROLE_COOKIE_NAME = "pm-role";
export const EMAIL_COOKIE_NAME = "pm-email";

export type AppSession = {
  user: {
    email: string;
    name: string;
    role: AppRole;
  };
};

export function getSafeRedirectTarget(
  pathname: string | null | undefined,
  role: AppRole,
) {
  if (!pathname) {
    return getDefaultDashboardRoute(role);
  }

  const normalizedPath = pathname.trim();

  if (
    !normalizedPath.startsWith("/") ||
    normalizedPath.startsWith("//") ||
    normalizedPath.includes("\\")
  ) {
    return getDefaultDashboardRoute(role);
  }

  if (/[\r\n\t]/.test(normalizedPath)) {
    return getDefaultDashboardRoute(role);
  }

  return normalizedPath;
}

export function getSwitchRoleHref() {
  const params = new URLSearchParams({
    redirectTo: "/sign-in",
  });

  return `/sign-out?${params.toString()}`;
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(ROLE_COOKIE_NAME);
  cookieStore.delete(EMAIL_COOKIE_NAME);
}

export async function clearSessionAndRedirect(
  redirectTo: string | null | undefined = "/sign-in",
) {
  await clearSessionCookies();

  const destination = getSafeSignOutRedirectTarget(redirectTo);

  redirect(destination);
}

function sanitizeRedirect(pathname: string | null | undefined, role: AppRole) {
  return getSafeRedirectTarget(pathname, role);
}

export function getSafeSignOutRedirectTarget(pathname: string | null | undefined) {
  if (!pathname) {
    return "/sign-in";
  }

  const normalizedPath = pathname.trim();

  if (
    normalizedPath.startsWith("/") &&
    !normalizedPath.startsWith("//") &&
    !normalizedPath.includes("\\") &&
    !/[\r\n\t]/.test(normalizedPath)
  ) {
    return normalizedPath;
  }

  return "/sign-in";
}

export function getRoleOptions() {
  return APP_ROLES.map((role) => ({
    value: role,
    label: role.replace("_", " "),
  }));
}

export function getRoleFromEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  if (normalized.includes("field")) {
    return "FIELD_LEADER" satisfies AppRole;
  }

  if (normalized.includes("exec")) {
    return "EXECUTIVE" satisfies AppRole;
  }

  return "ADMIN" satisfies AppRole;
}

export async function getSession() {
  const cookieStore = await cookies();
  const role = normalizeRole(cookieStore.get(ROLE_COOKIE_NAME)?.value);

  if (!role) {
    return null;
  }

  const email = cookieStore.get(EMAIL_COOKIE_NAME)?.value ?? `${role.toLowerCase()}@example.com`;

  return {
    user: {
      email,
      name: email.split("@")[0].replace(/[._-]/g, " "),
      role,
    },
  } satisfies AppSession;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function signInWithRole(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestedRole = String(formData.get("role") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  const role = normalizeRole(requestedRole) ?? getRoleFromEmail(email || "admin@example.com");
  const safeEmail = email || `${role.toLowerCase()}@example.com`;
  const cookieStore = await cookies();

  cookieStore.set(ROLE_COOKIE_NAME, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(EMAIL_COOKIE_NAME, safeEmail, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(sanitizeRedirect(redirectTo, role));
}

export async function signOut() {
  "use server";

  await clearSessionAndRedirect("/sign-in");
}
