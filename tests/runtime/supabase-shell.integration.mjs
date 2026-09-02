import assert from "node:assert/strict";

const baseUrl = process.env.SITECOST_RUNTIME_BASE_URL || "http://127.0.0.1:3001";
const cookie = [
  "pm-user-id=user-ci-supabase",
  "pm-role=ADMIN",
  "pm-email=ci-supabase%40example.com",
  "pm-auth-provider=supabase",
  "pm-supabase-access-token=ci-supabase-token",
  "sitecost-project-id=project-drying-yard",
].join("; ");

async function fetchAuthenticated(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: {
      Cookie: cookie,
    },
    redirect: "manual",
  });

  const text = await response.text();
  assert.equal(
    response.status,
    200,
    `${pathname} expected HTTP 200, got ${response.status}; location=${response.headers.get("location")}; body=${text.slice(0, 500)}`,
  );
  assert.equal(
    response.headers.get("location"),
    null,
    `${pathname} unexpectedly redirected`,
  );
  return text;
}

const dashboard = await fetchAuthenticated("/");
assert.match(dashboard, /Supabase-ready command shell/);
assert.match(dashboard, /DRYING-YARD-446/);
assert.match(dashboard, /Legacy Prisma bypassed/);

const projects = await fetchAuthenticated("/projects");
assert.match(projects, /Supabase Core Registry/);
assert.match(projects, /DRYING-YARD-446/);
assert.match(projects, /ELECTRIC-POLE-SOLAR/);

const guardedRoutes = [
  ["/finance", "Finance"],
  ["/teams", "Teams"],
  ["/field-reports/new", "Field Reports"],
  ["/imports", "Imports"],
];

for (const [pathname, moduleLabel] of guardedRoutes) {
  const html = await fetchAuthenticated(pathname);
  assert.match(html, /Controlled migration gate/);
  assert.ok(html.includes(moduleLabel), `${pathname} missing ${moduleLabel} gate label`);
  assert.match(html, /ยังไม่เปิดใน Supabase runtime/);
  assert.match(html, /ไม่มี fallback ไป local\/demo database/);
}

console.log("Supabase runtime integration passed without relying on legacy route data.");
