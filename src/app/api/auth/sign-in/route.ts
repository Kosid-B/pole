import { NextRequest, NextResponse } from "next/server";
import {
  EMAIL_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  USER_ID_COOKIE_NAME,
  getSafeRedirectTarget,
  verifyPasswordForUser,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const user = await verifyPasswordForUser(email, password);

  if (!user) {
    return NextResponse.redirect(
      new URL("/sign-in?error=invalid-credentials", request.url),
      303,
    );
  }

  const destination = getSafeRedirectTarget(redirectTo, user.role);
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.E2E_HTTP !== "1",
    path: "/",
  };

  response.cookies.set(USER_ID_COOKIE_NAME, user.id, cookieOptions);
  response.cookies.set(ROLE_COOKIE_NAME, user.role, cookieOptions);
  response.cookies.set(EMAIL_COOKIE_NAME, user.email, cookieOptions);

  return response;
}
