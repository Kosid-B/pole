import { execa } from "execa";

// E2E runs the production build behind plain HTTP on localhost.
// Keep this flag scoped to the test process so auth cookies are not marked
// Secure during localhost verification. Real Vercel/production deployments do
// not set E2E_HTTP, so production cookies remain Secure.
process.env.E2E_HTTP = "1";

const steps = [
  ["pnpm", ["db:generate"]],
  ["pnpm", ["db:push"]],
  ["pnpm", ["db:seed"]],
  ["pnpm", ["build"]],
  ["pnpm", ["exec", "playwright", "test"]],
];

for (const [command, args] of steps) {
  await execa(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}
