import type { ReactNode } from "react";
import { LegacyPrismaRouteBoundary } from "@/components/runtime/legacy-prisma-route-boundary";

export default function TeamsRuntimeLayout({ children }: { children: ReactNode }) {
  return (
    <LegacyPrismaRouteBoundary
      moduleLabel="Teams"
      replacementHref="/field-readiness"
      replacementLabel="ไป Field Readiness"
    >
      {children}
    </LegacyPrismaRouteBoundary>
  );
}
