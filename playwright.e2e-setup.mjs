import { execa } from "execa";

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
  });
}
