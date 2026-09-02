import { notFound } from "next/navigation";
import { LegacyPrismaMigrationGate } from "@/components/runtime/legacy-prisma-route-boundary";
import { getLegacyPrismaRouteGateByKey } from "@/lib/runtime-access";

type RuntimeMigrationGatePageProps = {
  searchParams: Promise<{
    gate?: string | string[];
  }>;
};

export default async function RuntimeMigrationGatePage({
  searchParams,
}: RuntimeMigrationGatePageProps) {
  const params = await searchParams;
  const gateKey = Array.isArray(params.gate) ? params.gate[0] : params.gate;
  const gate = getLegacyPrismaRouteGateByKey(gateKey);

  if (!gate) {
    notFound();
  }

  return (
    <LegacyPrismaMigrationGate
      moduleLabel={gate.moduleLabel}
      replacementHref={gate.replacementHref}
      replacementLabel={gate.replacementLabel}
    />
  );
}
