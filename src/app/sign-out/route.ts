import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearSessionCookies,
  getSafeSignOutRedirectTarget,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  await clearSessionCookies();

  const redirectTo = getSafeSignOutRedirectTarget(
    request.nextUrl.searchParams.get("redirectTo"),
  );

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
