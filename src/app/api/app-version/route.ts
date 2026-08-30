import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "local";
  const explicitVersion = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  const buildTag = sha === "local" ? "local" : sha.slice(0, 7);
  const version = explicitVersion
    ? `${explicitVersion}+${buildTag}`
    : sha === "local"
      ? "dev-local"
      : `build-${buildTag}`;

  return NextResponse.json(
    {
      ok: true,
      app: "SiteCost Drying Yard 446",
      version,
      build: sha.slice(0, 12),
      ref: process.env.VERCEL_GIT_COMMIT_REF?.trim() || null,
      environment: process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    },
  );
}
