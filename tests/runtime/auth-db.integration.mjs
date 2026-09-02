import assert from "node:assert/strict";

const baseUrl = (process.env.SITECOST_RUNTIME_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const combined = response.headers.get("set-cookie");
  return combined ? [combined] : [];
}

function buildCookieHeader(setCookieHeaders) {
  return setCookieHeaders
    .map((value) => value.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
}

async function signIn(email, password, redirectTo = "/") {
  const body = new URLSearchParams({
    email,
    password,
    redirectTo,
  });

  return fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    redirect: "manual",
  });
}

async function fetchAuthenticated(pathname, cookieHeader) {
  return fetch(`${baseUrl}${pathname}`, {
    headers: {
      Cookie: cookieHeader,
    },
    redirect: "manual",
  });
}

console.log(`[runtime-integration] target=${baseUrl}`);

const invalidLogin = await signIn("admin@example.com", "wrong-password");
assert.equal(invalidLogin.status, 303, "invalid login must redirect with 303");
assert.match(
  invalidLogin.headers.get("location") || "",
  /\/sign-in\?error=invalid-credentials$/,
  "invalid login must redirect to the invalid-credentials state",
);
assert.equal(
  getSetCookieHeaders(invalidLogin).some((value) => value.startsWith("pm-user-id=")),
  false,
  "invalid login must not create a user session cookie",
);

const validLogin = await signIn("admin@example.com", "password", "/projects");
assert.equal(validLogin.status, 303, "valid login must redirect with 303");
assert.match(
  validLogin.headers.get("location") || "",
  /\/projects$/,
  "valid admin login must preserve an allowed redirect target",
);

const setCookieHeaders = getSetCookieHeaders(validLogin);
const cookieHeader = buildCookieHeader(setCookieHeaders);
assert.match(cookieHeader, /(?:^|; )pm-user-id=/, "session must include pm-user-id");
assert.match(cookieHeader, /(?:^|; )pm-role=ADMIN(?:;|$)/, "session must include ADMIN role");
assert.match(
  cookieHeader,
  /(?:^|; )pm-email=admin%40example\.com(?:;|$)|(?:^|; )pm-email=admin@example\.com(?:;|$)/,
  "session must include the authenticated email",
);
assert.match(
  cookieHeader,
  /(?:^|; )pm-auth-provider=legacy(?:;|$)/,
  "runtime contract must identify the legacy auth provider",
);

const projectsResponse = await fetchAuthenticated("/projects", cookieHeader);
assert.equal(projectsResponse.status, 200, "authenticated project portfolio must render");
const projectsHtml = await projectsResponse.text();
assert.match(
  projectsHtml,
  /พอร์ตโครงการ|Project Portfolio/,
  "project portfolio response must contain the expected product surface",
);
assert.match(
  projectsHtml,
  /90,000 Pole Rollout/,
  "project portfolio must read the seeded project through Prisma/SQLite",
);

const dashboardResponse = await fetchAuthenticated("/", cookieHeader);
assert.equal(dashboardResponse.status, 200, "authenticated dashboard must render");
const dashboardHtml = await dashboardResponse.text();
assert.match(
  dashboardHtml,
  /ภาพรวมผู้บริหาร|Executive overview/,
  "dashboard must render the executive overview",
);
assert.match(
  dashboardHtml,
  /90,000/,
  "dashboard must consume seeded database state through the real runtime pipeline",
);

console.log("[runtime-integration] PASS auth -> Prisma/SQLite -> cookie -> protected routes -> dashboard");
