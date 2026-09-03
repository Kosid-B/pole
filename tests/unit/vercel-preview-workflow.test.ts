import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/vercel-preview.yml"),
  "utf8",
);

describe("Vercel Preview workflow contract", () => {
  it("is manual-only and pinned to the canonical SiteCost project", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("VERCEL_ORG_ID: team_oryw9VGF4TLakA4qBU6pGx43");
    expect(workflow).toContain(
      "VERCEL_PROJECT_ID: prj_LdSJHSRZrV1G3RORdcNMpjvkkBGr",
    );
    expect(workflow).toContain("VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}");
  });

  it("pins the deployment toolchain and pulls Preview settings", () => {
    expect(workflow).toContain("VERCEL_CLI_VERSION: 59.11.2");
    expect(workflow).toContain("version: 10.33.2");
    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("--environment=preview");
    expect(workflow).toContain("deploy \\");
    expect(workflow).toContain("--prebuilt");
  });

  it("cannot promote or target production", () => {
    expect(workflow).not.toContain("--prod");
    expect(workflow).not.toMatch(/\bpromote\b/);
    expect(workflow).not.toContain("--environment=production");
    expect(workflow).not.toMatch(/target\s*[:=]\s*production/i);
  });

  it("fails closed when the deployment credential is missing", () => {
    expect(workflow).toContain('if [ -z "${VERCEL_TOKEN:-}" ]; then');
    expect(workflow).toContain("VERCEL_TOKEN is not configured; refusing to deploy.");
  });
});
