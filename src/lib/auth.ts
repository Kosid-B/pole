import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import {
  type AppRole,
  canAccessRoute,
  getDefaultDashboardRoute,
  normalizeRole,
} from "@/lib/permissions";

export const USER_ID_COOKIE_NAME = "pm-user-id";
export const ROLE_COOKIE_NAME = "pm-role";
export const EMAIL_COOKIE_NAME = "pm-email";

export type AppSession = {
  user: {
    id: string;
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

  if (!canAccessRoute(role, normalizedPath)) {
    return getDefaultDashboardRoute(role);
  }

  return normalizedPath;
}

export function getChangeAccountHref() {
  const params = new URLSearchParams({
    redirectTo: "/sign-in",
  });

  return `/sign-out?${params.toString()}`;
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(USER_ID_COOKIE_NAME);
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

export async function verifyPasswordForUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const matches = await verifyPassword(password, user.passwordHash);

  if (!matches) {
    return null;
  }

  return user;
}

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_ID_COOKIE_NAME)?.value;
  const role = normalizeRole(cookieStore.get(ROLE_COOKIE_NAME)?.value);

  if (!userId || !role) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive || user.role !== role) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
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

export async function signInWithPassword(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const user = await verifyPasswordForUser(email, password);

  if (!user) {
    redirect("/sign-in?error=invalid-credentials");
  }

  const cookieStore = await cookies();

  cookieStore.set(USER_ID_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(ROLE_COOKIE_NAME, user.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(EMAIL_COOKIE_NAME, user.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(sanitizeRedirect(redirectTo, user.role));
}

export async function signOut() {
  "use server";

  await clearSessionAndRedirect("/sign-in");
}
