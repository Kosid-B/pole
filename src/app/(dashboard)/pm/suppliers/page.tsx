import Link from "next/link";
import {
  getSupplierSourcingOverview,
  type SupplierCandidate,
} from "@/lib/supplier-sourcing";

function number(value: number, digits = 0) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: digits,
  }).format(value);
}

function baht(value: number | null) {
  if (value == null) return "ยังไม่ยืนยัน";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function materialLabel(value: string) {
  if (value === "CONCRETE_240KSC") return "Concrete 240 ksc";
  if (value === "AGGREGATE") return "หิน / ทราย / Aggregate";
  if (value === "STEEL_REINFORCEMENT") return "Steel / Reinforcement";
  return value;
}

function materialTone(value: string) {
  if (value === "CONCRETE_240KSC") {
    return "border-sky-300/20 bg-sky-400/10 text-sky-200";
  }
  if (value === "AGGREGATE") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }
  return "border-violet-300/20 bg-violet-400/10 text-violet-100";
}

function evidenceMeta(sourceKind: string) {
  if (sourceKind === "official_website") {
    return {
      label: "OFFICIAL SOURCE",
      tone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
    };
  }
  if (sourceKind === "structured_business") {
    return {
      label: "BUSINESS VERIFIED",
      tone: "border-sky-300/20 bg-sky-400/10 text-sky-200",
    };
  }
  if (sourceKind === "public_registry") {
    return {
      label: "PUBLIC REGISTRY",
      tone: "border-indigo-300/20 bg-indigo-400/10 text-indigo-100",
    };
  }
  if (sourceKind === "public_directory") {
    return {
      label: "PUBLIC DIRECTORY",
      tone: "border-amber-300/20 bg-amber-400/10 text-amber-100",
    };
  }
  return {
    label: "PUBLIC LEAD",
    tone: "border-white/10 bg-white/5 text-slate-300",
  };
}

function verifiedDate(value: string | null) {
  if (!value) return "ยังไม่บันทึกวันตรวจ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "วันที่ตรวจไม่ถูกต้อง";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function telHref(phone: string | null) {
  if (!phone) return null;
  const first = phone.split("/")[0]?.trim() || "";
  const safe = first.replace(/[^+\d]/g, "");
  return safe ? `tel:${safe}` : null;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierCandidate }) {
  const sourceUrl = safeHttpUrl(supplier.source_url || supplier.website);
  const phoneUrl = telHref(supplier.phone);
  const missing = supplier.rfq_missing || [];
  const evidence = evidenceMeta(supplier.source_kind);

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${materialTone(
                supplier.material_group,
              )}`}
            >
              {materialLabel(supplier.material_group)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
              Rank {supplier.priority_rank}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${evidence.tone}`}
            >
              {evidence.label}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                supplier.award_ready
                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-300/20 bg-amber-400/10 text-amber-100"
              }`}
            >
              {supplier.award_ready ? "AWARD READY" : "COMMERCIAL UNCONFIRMED"}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">
            {supplier.supplier_name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {supplier.plant_location || "ยังไม่ยืนยัน Plant / Yard"}
          </p>
          {supplier.service_provinces?.length ? (
            <p className="mt-1 text-xs text-slate-500">
              พื้นที่ที่ต้องสอบถาม: {supplier.service_provinces.join(" • ")}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-slate-500">
            Contact evidence: {evidence.label} • ตรวจล่าสุด {verifiedDate(supplier.contact_verified_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:max-w-[360px] sm:justify-end">
          {phoneUrl ? (
            <a
              href={phoneUrl}
              className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-400 px-3 text-xs font-semibold text-slate-950"
            >
              โทร {supplier.phone}
            </a>
          ) : null}
          {supplier.email ? (
            <a
              href={`mailto:${supplier.email}`}
              className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-white"
            >
              Email
            </a>
          ) : null}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 text-xs font-medium text-sky-100"
            >
              ดูหลักฐาน ↗
            </a>
          ) : null}
        </div>
      </div>

      {supplier.line_id ? (
        <p className="mt-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-300">
          LINE: <strong className="text-white">{supplier.line_id}</strong>
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <Metric
          label="Credit"
          value={supplier.credit_days == null ? "?" : `${supplier.credit_days} วัน`}
        />
        <Metric
          label="Deposit"
          value={supplier.deposit_pct == null ? "?" : `${supplier.deposit_pct}%`}
        />
        <Metric
          label="Capacity"
          value={
            supplier.capacity_per_day == null
              ? "?"
              : number(supplier.capacity_per_day, 1)
          }
        />
        <Metric
          label="Lead Time"
          value={
            supplier.lead_time_days == null
              ? "?"
              : `${supplier.lead_time_days} วัน`
          }
        />
        <Metric
          label="Distance"
          value={
            supplier.distance_km == null
              ? "?"
              : `${number(supplier.distance_km, 1)} km`
          }
        />
        <Metric label="Base / Unit" value={baht(supplier.quoted_base_rate)} />
        <div className="rounded-xl border border-emerald-300/10 bg-emerald-400/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-300/70">
            Delivered Cost
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-200">
            {baht(supplier.total_delivered_cost)}
          </p>
        </div>
      </div>

      {missing.length ? (
        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3">
          <p className="text-xs font-semibold text-amber-100">RFQ ยังขาด</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missing.map((item) => (
              <span
                key={item}
                className="rounded-lg border border-amber-200/10 bg-slate-950/20 px-2 py-1 text-[11px] text-amber-50/90"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {supplier.note ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">{supplier.note}</p>
      ) : null}
    </article>
  );
}

export default async function SupplierSourcingPage() {
  const result = await getSupplierSourcingOverview();

  if (!result.data) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium text-emerald-300">
            PM / Supplier Sourcing
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Supplier Sourcing ยังเชื่อมข้อมูลไม่ได้
          </h1>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          {result.error}
        </div>
      </section>
    );
  }

  const data = result.data;
  const s = data.summary;
  const candidates = data.zones.flatMap((zone) => zone.candidates);
  const officialSources = candidates.filter(
    (supplier) => supplier.source_kind === "official_website",
  ).length;

  return (
    <section className="space-y-7 pb-10">
      <nav aria-label="PM supplier navigation" className="flex flex-wrap gap-2">
        <Link
          href="/pm"
          className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white"
        >
          ← PM Control Center
        </Link>
        <Link
          href="/pm/suppliers/rfq"
          className="flex min-h-11 items-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950"
        >
          เปิด RFQ / TDC Console
        </Link>
        <Link
          href="/procurement"
          className="flex min-h-11 items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100"
        >
          Procurement Control
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            PM INTERNAL
          </span>
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
            CONTACT EVIDENCE
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
            GM FLOOR 32%
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Supplier Sourcing / Procurement Zones
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
          Public sourcing → Contact Evidence → RFQ → Confirm Terms → Total Delivered
          Cost → GM & Cash Gate → Primary / Backup Award โดย Web lead ไม่ถูกยกระดับเป็น
          Approved Supplier อัตโนมัติ
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {[
          ["Zones", s.zones],
          ["Candidates", s.candidates],
          ["Official sources", officialSources],
          ["Commercial confirmed", s.confirmed],
          ["Award ready", s.award_ready],
          ["Concrete", s.concrete_candidates],
          ["Aggregate", s.aggregate_candidates],
          ["Steel", s.steel_candidates],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{String(value)}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-xs font-semibold text-emerald-200">GM GATE</p>
          <p className="mt-2 text-xl font-semibold text-white">≥ 32.00%</p>
          <p className="mt-1 text-xs leading-5 text-emerald-50/70">
            หลัง Supplier / freight / waste / PO decision
          </p>
        </div>
        <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4">
          <p className="text-xs font-semibold text-sky-200">CASH GATE</p>
          <p className="mt-2 text-xl font-semibold text-white">≥ Safety Reserve</p>
          <p className="mt-1 text-xs leading-5 text-sky-50/70">
            ตลอด Rolling Cash-flow forecast
          </p>
        </div>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
          <p className="text-xs font-semibold text-amber-100">CURRENT TERMS</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {s.confirmed} Confirmed
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-50/70">
            Credit / Deposit / Capacity ใช้ได้เมื่อ RFQ ยืนยันแล้วเท่านั้น
          </p>
        </div>
        <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
          <p className="text-xs font-semibold text-violet-100">AWARD BASIS</p>
          <p className="mt-2 text-xl font-semibold text-white">
            Total Delivered Cost
          </p>
          <p className="mt-1 text-xs leading-5 text-violet-50/70">
            ไม่ใช้ Base Rate หรือชื่อแบรนด์อย่างเดียว
          </p>
        </div>
      </section>

      <div className="space-y-4">
        {data.zones.map((zone, index) => (
          <details
            key={zone.zone_code}
            open={index < 3}
            className="group rounded-[1.7rem] border border-white/10 bg-white/5"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">
                    {zone.zone_code}
                  </span>
                  <span className="text-xs text-slate-400">
                    Priority {zone.sourcing_priority}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white sm:text-xl">
                  {zone.zone_name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {zone.forecast_sites} จุด • Hub {zone.hub_province} •{" "}
                  {zone.provinces.join(" / ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-white">
                    {zone.candidate_count} candidates
                  </p>
                  <p className="text-xs text-slate-500">
                    {zone.confirmed_count} confirmed • {zone.award_ready_count} award-ready
                  </p>
                </div>
                <span className="text-xl text-slate-400 transition group-open:rotate-45">
                  +
                </span>
              </div>
            </summary>

            <div className="border-t border-white/10 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
              <div className="grid gap-3">
                {zone.candidates.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-5 text-sm leading-7 text-rose-50/90">
        <strong className="text-rose-100">Award Lock:</strong> Official Source หรือ
        Public Directory เป็นเพียง Contact Evidence ไม่ใช่ Commercial Approval. Candidate
        ยังห้าม Award จนกว่า RFQ จะยืนยันราคา, Terms, Capacity, Lead Time และ TDC และการเลือก
        Supplier ต้องไม่ทำให้ Forecast GM ต่ำกว่า 32% หรือ Rolling Cash ต่ำกว่า Safety Reserve
      </div>
    </section>
  );
}
