import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/vercel-production.yml"),
  "utf8",
);

describe("Vercel Production workflow contract", () => {
  it("is manual-only and pinned to the canonical SiteCost project", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("confirm_production:");
    expect(workflow).toContain("DEPLOY_PRODUCTION");
    expect(workflow).toContain("VERCEL_ORG_ID: team_oryw9VGF4TLakA4qBU6pGx43");
    expect(workflow).toContain(
      "VERCEL_PROJECT_ID: prj_LdSJHSRZrV1G3RORdcNMpjvkkBGr",
    );
    expect(workflow).toContain("VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}");
  });

  it("uses a pinned production toolchain and production settings", () => {
    expect(workflow).toContain("VERCEL_CLI_VERSION: 59.11.2");
    expect(workflow).toContain("version: 10.33.2");
    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("--environment=production");
    expect(workflow).toContain("--prebuilt");
    expect(workflow).toContain("--prod");
  });

  it("fails closed when production authorization or credentials are missing", () => {
    expect(workflow).toContain("Validate explicit production authorization");
    expect(workflow).toContain('${{ inputs.confirm_production }}');
    expect(workflow).toContain("DEPLOY_PRODUCTION");
    expect(workflow).toContain(
      "Production authorization phrase does not match; refusing to deploy.",
    );
    expect(workflow).toContain("VERCEL_TOKEN");
    expect(workflow).toContain("VERCEL_TOKEN is not configured; refusing to deploy.");
  });

  it("runs CI-parity database setup, tests, and both health contracts", () => {
    expect(workflow).toContain("pnpm db:generate");
    expect(workflow).toContain("pnpm db:push");
    expect(workflow).toContain("pnpm db:seed");
    expect(workflow).toContain("pnpm test");
    expect(workflow).toContain("/api/health");
    expect(workflow).toContain('\"ok\":true');
    expect(workflow).toContain('\"service\":\"sitecost-project-management-saas\"');
    expect(workflow).toContain('\"runtime\":\"nextjs\"');
    expect(workflow).toContain("https://sitecost-lantak-os.vercel.app");
  });
});
