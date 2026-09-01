import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_PROVIDER_COOKIE_NAME,
  EMAIL_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  SUPABASE_ACCESS_TOKEN_COOKIE_NAME,
  USER_ID_COOKIE_NAME,
  authenticateCredentials,
  getSafeRedirectTarget,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const session = await authenticateCredentials(email, password);

  if (!session) {
    return NextResponse.redirect(
      new URL("/sign-in?error=invalid-credentials", request.url),
      303,
    );
  }

  const destination = getSafeRedirectTarget(redirectTo, session.user.role);
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.E2E_HTTP !== "1",
    path: "/",
  };

  response.cookies.set(USER_ID_COOKIE_NAME, session.user.id, cookieOptions);
  response.cookies.set(ROLE_COOKIE_NAME, session.user.role, cookieOptions);
  response.cookies.set(EMAIL_COOKIE_NAME, session.user.email, cookieOptions);
  response.cookies.set(AUTH_PROVIDER_COOKIE_NAME, session.provider, cookieOptions);

  if (session.provider === "supabase" && session.accessToken) {
    response.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE_NAME, session.accessToken, {
      ...cookieOptions,
      maxAge: session.expiresIn,
    });
  } else {
    response.cookies.delete(SUPABASE_ACCESS_TOKEN_COOKIE_NAME);
  }

  return response;
}
