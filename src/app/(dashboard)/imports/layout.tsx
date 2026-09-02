import type { ReactNode } from "react";
import { LegacyPrismaRouteBoundary } from "@/components/runtime/legacy-prisma-route-boundary";

export default function ImportsRuntimeLayout({ children }: { children: ReactNode }) {
  return (
    <LegacyPrismaRouteBoundary
      moduleLabel="Imports"
      replacementHref="/projects"
      replacementLabel="ไป Project Portfolio"
    >
      {children}
    </LegacyPrismaRouteBoundary>
  );
}
