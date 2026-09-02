import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Vercel deployment contract", () => {
  it("pins the SiteCost source deployment to the tested Next.js build path", () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
    ) as Record<string, unknown>;

    expect(config.framework).toBe("nextjs");
    expect(config.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(config.buildCommand).toBe("pnpm build");
  });

  it("keeps Node 22 pinned in package.json so Vercel project settings cannot drift runtime major", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { engines?: { node?: string }; packageManager?: string };

    expect(packageJson.engines?.node).toBe("22.x");
    expect(packageJson.packageManager).toBe("pnpm@10.33.2");
  });
});
