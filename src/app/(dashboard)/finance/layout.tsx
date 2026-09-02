import type { ReactNode } from "react";
import { LegacyPrismaRouteBoundary } from "@/components/runtime/legacy-prisma-route-boundary";

export default function FinanceRuntimeLayout({ children }: { children: ReactNode }) {
  return (
    <LegacyPrismaRouteBoundary
      moduleLabel="Finance"
      replacementHref="/pm/financial"
      replacementLabel="ไป PM Financial"
    >
      {children}
    </LegacyPrismaRouteBoundary>
  );
}
