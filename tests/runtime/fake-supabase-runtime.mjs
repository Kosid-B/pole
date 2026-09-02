import http from "node:http";

const port = Number(process.env.SITECOST_FAKE_SUPABASE_PORT || 4010);
const expectedToken = "ci-supabase-token";
const projectId = "project-drying-yard";

const projects = [
  {
    id: projectId,
    organization_id: "org-sitecost",
    project_code: "DRYING-YARD-446",
    project_name: "งานลานตาก 446 จุด",
    project_type: "DRYING_YARD",
    status: "active",
    enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
  },
  {
    id: "project-solar",
    organization_id: "org-sitecost",
    project_code: "ELECTRIC-POLE-SOLAR",
    project_name: "งานเสาไฟฟ้า + Solar Energy",
    project_type: "ELECTRIC_POLE_SOLAR",
    status: "active",
    enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
  },
];

function writeJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function hasExpectedAuth(request) {
  return request.headers.authorization === `Bearer ${expectedToken}`;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (!hasExpectedAuth(request)) {
    writeJson(response, 401, { error: "INVALID_CI_TOKEN" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/v1/user") {
    writeJson(response, 200, {
      id: "user-ci-supabase",
      email: "ci-supabase@example.com",
    });
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/rest/v1/core_profiles"
  ) {
    writeJson(response, 200, [
      {
        full_name: "CI Supabase User",
        role: "customer",
      },
    ]);
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/rest/v1/core_organization_members"
  ) {
    writeJson(response, 200, [{ member_role: "admin" }]);
    return;
  }

  if (request.method === "POST" && url.pathname === "/project-context") {
    const body = await readJson(request);
    const requestedProjectId =
      typeof body.project_id === "string" && body.project_id.trim()
        ? body.project_id.trim()
        : projectId;
    const selectedProject = projects.find((project) => project.id === requestedProjectId);

    if (!selectedProject) {
      writeJson(response, 403, { error: "PROJECT_ACCESS_DENIED" });
      return;
    }

    writeJson(response, 200, {
      ok: true,
      auth_mode: "supabase",
      actor_user_id: "user-ci-supabase",
      selected_project_id: selectedProject.id,
      projects,
    });
    return;
  }

  writeJson(response, 404, { error: "CI_ROUTE_NOT_FOUND", path: url.pathname });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`fake Supabase runtime listening on ${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
