import { execa } from "execa";

const databaseUrl = process.env.DATABASE_URL ?? "";
const isPostgres =
  databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
const schemaPath = isPostgres
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

await execa("pnpm", ["exec", "prisma", "generate", "--schema", schemaPath], {
  stdio: "inherit",
  shell: true,
});
