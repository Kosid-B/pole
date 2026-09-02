import {
  createServer,
  type IncomingHttpHeaders,
  type Server,
  type ServerResponse,
} from "node:http";
import { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  cookies: {} as Record<string, string>,
}));

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

type CapturedRequest = {
  path: string;
  method: string | undefined;
  headers: IncomingHttpHeaders;
  body: Record<string, unknown>;
};

type ModuleApi = typeof import("@/lib/drying-yard-modules");

const capturedRequests: CapturedRequest[] = [];
let server: Server;
let baseUrl = "";
let modules: ModuleApi;
let enabledModules = ["commercial", "pm", "procurement"];
let rejectedModuleAction: string | null = null;

const project = {
  id: "project-drying-yard",
  organization_id: "org-sitecost",
  project_code: "DRYING-YARD-446",
  project_name: "งานลานตาก 446 จุด",
  project_type: "DRYING_YARD",
  status: "active",
};

function writeJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

beforeAll(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");
      const body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
      const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

      capturedRequests.push({
        path,
        method: request.method,
        headers: request.headers,
        body,
      });

      const authMode = request.headers.authorization ? "supabase" : "legacy";

      if (path === "/project-context") {
        writeJson(response, 200, {
          ok: true,
          auth_mode: authMode,
          actor_user_id: authMode === "supabase" ? "user-123" : null,
          selected_project_id: project.id,
          projects: [
            {
              ...project,
              enabled_modules: enabledModules,
            },
          ],
        });
        return;
      }

      if (typeof body.action === "string" && body.action === rejectedModuleAction) {
        writeJson(response, 403, {
          error: "PROJECT_ACCESS_DENIED",
          detail: "Selected project is not authorized for this module request.",
        });
        return;
      }

      if (path === "/commercial") {
        writeJson(response, 200, {
          ok: true,
          project_id: body.project_id,
          auth_mode: authMode,
          label: "Commercial integration fixture",
          summary: {
            site_count: 446,
            quote_count: 0,
            published_quotes: 0,
            total_quote_vat: 0,
            gross_margin: 0.32,
            vat_rate: 0.07,
          },
          g_summary: [],
          tier_summary: [],
          province_summary: [],
          size_catalog: [],
          package_catalog: [],
          reference_catalog: {
            catalog_version: null,
            approved_for_quote: false,
            rows: [],
          },
          source_note: "integration-test",
        });
        return;
      }

      if (path === "/pm" && body.action === "overview") {
        writeJson(response, 200, {
          ok: true,
          project_id: body.project_id,
          auth_mode: authMode,
          totals: {
            cost: 100,
            sale: 147.0588235,
            gp: 47.0588235,
            vat: 10.2941176,
            final: 157.3529411,
            concrete: 0,
            gm: 0.32,
          },
          quote_summary: {
            count: 0,
            published_count: 0,
            value_vat: 0,
          },
          settings: null,
          packages: [],
        });
        return;
      }

      if (path === "/pm" && body.action === "procurement_overview") {
        writeJson(response, 200, {
          ok: true,
          project_id: body.project_id,
          auth_mode: authMode,
          summary: {
            clusters: 0,
            sites: 0,
            volume: 0,
            target_saving: 0,
            awarded_clusters: 0,
            awarded_volume: 0,
            awarded_saving: 0,
            coverage_pct: 0,
            weighted_awarded_saving_per_m3: 0,
          },
          clusters: [],
        });
        return;
      }

      writeJson(response, 404, { error: "NOT_FOUND" });
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;

  process.env.SITECOST_PROJECT_CONTEXT_API_URL = `${baseUrl}/project-context`;
  process.env.DRYING_YARD_COMMERCIAL_API_URL = `${baseUrl}/commercial`;
  process.env.DRYING_YARD_PM_API_URL = `${baseUrl}/pm`;
  process.env.DRYING_YARD_ADMIN_ACCESS_CODE = "legacy-module-ci-code";

  modules = await import("@/lib/drying-yard-modules");
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  capturedRequests.length = 0;
  testState.cookies = {
    "sitecost-project-id": project.id,
  };
  enabledModules = ["commercial", "pm", "procurement"];
  rejectedModuleAction = null;
  process.env.DRYING_YARD_ADMIN_ACCESS_CODE = "legacy-module-ci-code";
});

function moduleRequests() {
  return capturedRequests.filter((request) => request.path !== "/project-context");
}

describe("Commercial / PM / Procurement HTTP integration contract", () => {
  it("propagates one selected project through all legacy module calls", async () => {
    testState.cookies["pm-auth-provider"] = "legacy";

    const [commercial, pm, procurement] = await Promise.all([
      modules.getCommercialOverview(),
      modules.getPmOverview(),
      modules.getProcurementOverview(),
    ]);

    expect(commercial.error).toBeNull();
    expect(pm.error).toBeNull();
    expect(procurement.error).toBeNull();

    const requests = moduleRequests();
    expect(requests).toHaveLength(3);
    expect(requests.map((request) => [request.path, request.body.action])).toEqual(
      expect.arrayContaining([
        ["/commercial", "overview"],
        ["/pm", "overview"],
        ["/pm", "procurement_overview"],
      ]),
    );

    for (const request of requests) {
      expect(request.method).toBe("POST");
      expect(request.headers.authorization).toBeUndefined();
      expect(request.body.project_id).toBe(project.id);
      expect(request.body.code).toBe("legacy-module-ci-code");
    }
  });

  it("uses the same Supabase bearer identity for context and every module request", async () => {
    testState.cookies["pm-auth-provider"] = "supabase";
    testState.cookies["pm-supabase-access-token"] = "module-supabase-token";

    const [commercial, pm, procurement] = await Promise.all([
      modules.getCommercialOverview(),
      modules.getPmOverview(),
      modules.getProcurementOverview(),
    ]);

    expect(commercial.data?.auth_mode).toBe("supabase");
    expect(pm.data?.auth_mode).toBe("supabase");
    expect(procurement.data?.auth_mode).toBe("supabase");

    expect(capturedRequests).toHaveLength(6);
    for (const request of capturedRequests) {
      expect(request.headers.authorization).toBe("Bearer module-supabase-token");
      expect(request.body).not.toHaveProperty("code");
      expect(request.body.project_id).toBe(project.id);
    }
  });

  it("stops before the PM API when procurement entitlement is missing", async () => {
    testState.cookies["pm-auth-provider"] = "legacy";
    enabledModules = ["commercial", "pm"];

    const result = await modules.getProcurementOverview();

    expect(result.configured).toBe(true);
    expect(result.data).toBeNull();
    expect(result.error).toBe("MODULE_ACCESS_DENIED");
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].path).toBe("/project-context");
  });

  it("fails closed when the module API rejects the authorized project request", async () => {
    testState.cookies["pm-auth-provider"] = "legacy";
    rejectedModuleAction = "overview";

    const result = await modules.getCommercialOverview();

    expect(result.configured).toBe(true);
    expect(result.data).toBeNull();
    expect(result.error).toBe(
      "Selected project is not authorized for this module request.",
    );

    const requests = moduleRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({
      action: "overview",
      project_id: project.id,
      code: "legacy-module-ci-code",
    });
  });
});
