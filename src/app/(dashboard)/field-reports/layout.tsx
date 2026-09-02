import type { ReactNode } from "react";
import { LegacyPrismaRouteBoundary } from "@/components/runtime/legacy-prisma-route-boundary";

export default function FieldReportsRuntimeLayout({ children }: { children: ReactNode }) {
  return (
    <LegacyPrismaRouteBoundary
      moduleLabel="Field Reports"
      replacementHref="/field-readiness"
      replacementLabel="ไป Field Readiness"
    >
      {children}
    </LegacyPrismaRouteBoundary>
  );
}
