import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  cookies: {} as Record<string, string>,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      testState.cookies[name] ? { value: testState.cookies[name] } : undefined,
  }),
}));
vi.mock("@/lib/auth", () => ({
  AUTH_PROVIDER_COOKIE_NAME: "pm-auth-provider",
  SUPABASE_ACCESS_TOKEN_COOKIE_NAME: "pm-supabase-access-token",
}));

import {
  SITECOST_PROJECT_ID_COOKIE_NAME,
  getSiteCostProjectContext,
} from "@/lib/project-context";

type CapturedRequest = {
  method: string | undefined;
  headers: IncomingHttpHeaders;
  body: Record<string, unknown>;
};

const capturedRequests: CapturedRequest[] = [];
let server: Server;
let apiUrl = "";

const projects = [
  {
    id: "project-drying-yard",
    project_code: "DRYING-YARD-446",
    project_name: "งานลานตาก 446 จุด",
    project_type: "DRYING_YARD",
    status: "active",
    enabled_modules: ["commercial", "pm", "procurement"],
  },
  {
    id: "project-solar",
    project_code: "ELECTRIC-POLE-SOLAR",
    project_name: "งานเสาไฟฟ้า + Solar Energy",
    project_type: "ELECTRIC_POLE_SOLAR",
    status: "active",
    enabled_modules: ["commercial", "pm", "procurement"],
  },
];

beforeAll(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");
      const body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
      capturedRequests.push({
        method: request.method,
        headers: request.headers,
        body,
      });

      response.setHeader("Content-Type", "application/json");

      if (body.project_id === "forbidden-project") {
        response.statusCode = 403;
        response.end(JSON.stringify({ error: "PROJECT_FORBIDDEN" }));
        return;
      }

      const authMode = request.headers.authorization ? "supabase" : "legacy";
      response.statusCode = 200;
      response.end(
        JSON.stringify({
          ok: true,
          auth_mode: authMode,
          actor_user_id: authMode === "supabase" ? "user-123" : null,
          selected_project_id:
            typeof body.project_id === "string" ? body.project_id : projects[0].id,
          projects,
        }),
      );
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  apiUrl = `http://127.0.0.1:${address.port}/project-context`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  capturedRequests.length = 0;
  testState.cookies = {};
  process.env.SITECOST_PROJECT_CONTEXT_API_URL = apiUrl;
  process.env.DRYING_YARD_ADMIN_ACCESS_CODE = "legacy-ci-code";
});

describe("Project Context HTTP contract", () => {
  it("sends legacy code and selected project id through the real HTTP boundary", async () => {
    testState.cookies["pm-auth-provider"] = "legacy";
    testState.cookies[SITECOST_PROJECT_ID_COOKIE_NAME] = "project-drying-yard";

    const result = await getSiteCostProjectContext();

    expect(result.configured).toBe(true);
    expect(result.error).toBeNull();
    expect(result.selectedProject?.project_code).toBe("DRYING-YARD-446");
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].method).toBe("POST");
    expect(capturedRequests[0].headers.authorization).toBeUndefined();
    expect(capturedRequests[0].body).toEqual({
      code: "legacy-ci-code",
      project_id: "project-drying-yard",
    });
  });

  it("uses bearer auth in Supabase mode and never leaks the legacy code", async () => {
    testState.cookies["pm-auth-provider"] = "supabase";
    testState.cookies["pm-supabase-access-token"] = "supabase-ci-token";
    testState.cookies[SITECOST_PROJECT_ID_COOKIE_NAME] = "project-solar";

    const result = await getSiteCostProjectContext();

    expect(result.configured).toBe(true);
    expect(result.data?.auth_mode).toBe("supabase");
    expect(result.selectedProject?.project_code).toBe("ELECTRIC-POLE-SOLAR");
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].headers.authorization).toBe(
      "Bearer supabase-ci-token",
    );
    expect(capturedRequests[0].body).toEqual({
      project_id: "project-solar",
    });
    expect(capturedRequests[0].body).not.toHaveProperty("code");
  });

  it("fails closed when the upstream service rejects the selected project", async () => {
    testState.cookies["pm-auth-provider"] = "legacy";

    const result = await getSiteCostProjectContext({
      requestedProjectId: "forbidden-project",
    });

    expect(result.configured).toBe(true);
    expect(result.data).toBeNull();
    expect(result.selectedProject).toBeNull();
    expect(result.error).toBe("PROJECT_FORBIDDEN");
    expect(capturedRequests[0].body).toEqual({
      code: "legacy-ci-code",
      project_id: "forbidden-project",
    });
  });
});
