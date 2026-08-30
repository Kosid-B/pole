import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  applyPmFinancialStructure,
  getPmFinancialGuardrail,
  type FinancialGuardrail,
  type FinancialSettings,
} from "@/lib/pm-financial-guardrail";

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function million(value: number) {
  return `${new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(value / 1_000_000)} ลบ.`;
}

function pct(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
  fallback: number,
) {
  const raw = first(params[key]);
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function scenarioFromParams(
  params: Record<string, string | string[] | undefined>,
  base: FinancialSettings,
): Partial<FinancialSettings> {
  return {
    contract_mode:
      (first(params.contract_mode) as FinancialSettings["contract_mode"]) ||
      base.contract_mode,
    advance_target_pct: numberParam(
      params,
      "advance_target_pct",
      base.advance_target_pct,
    ),
    client_payment_lag_days: numberParam(
      params,
      "client_payment_lag_days",
      base.client_payment_lag_days,
    ),
    claim_cycle_days: numberParam(
      params,
      "claim_cycle_days",
      base.claim_cycle_days,
    ),
    retention_pct: numberParam(params, "retention_pct", base.retention_pct),
    supplier_credit_days_default: numberParam(
      params,
      "supplier_credit_days_default",
      base.supplier_credit_days_default,
    ),
    safety_buffer_pct: numberParam(
      params,
      "safety_buffer_pct",
      base.safety_buffer_pct,
    ),
    batch_size_sites: numberParam(
      params,
      "batch_size_sites",
      base.batch_size_sites,
    ),
    batch_start_interval_days: numberParam(
      params,
      "batch_start_interval_days",
      base.batch_start_interval_days,
    ),
  };
}

async function applyFinancialStructure(formData: FormData) {
  "use server";

  const getNumber = (key: string) => Number(formData.get(key) || 0);
  const payload: Partial<FinancialSettings> = {
    contract_mode: String(
      formData.get("contract_mode") || "unknown",
    ) as FinancialSettings["contract_mode"],
    advance_target_pct: getNumber("advance_target_pct"),
    client_payment_lag_days: getNumber("client_payment_lag_days"),
    claim_cycle_days: getNumber("claim_cycle_days"),
    retention_pct: getNumber("retention_pct"),
    supplier_credit_days_default: getNumber("supplier_credit_days_default"),
    safety_buffer_pct: getNumber("safety_buffer_pct"),
    batch_size_sites: getNumber("batch_size_sites"),
    batch_start_interval_days: getNumber("batch_start_interval_days"),
  };

  const result = await applyPmFinancialStructure(payload);
  if (!result.data) {
    redirect("/pm/financial?apply=blocked");
  }

  revalidatePath("/pm");
  revalidatePath("/pm/financial");
  redirect("/pm/financial?apply=success");
}

function Kpi({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-white/5",
    green: "border-emerald-300/25 bg-emerald-400/10",
    amber: "border-amber-300/25 bg-amber-400/10",
    red: "border-rose-300/25 bg-rose-400/10",
  }[tone];
  return (
    <article className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}

function TriggerRow({
  label,
  current,
  trigger,
  rule,
  pass,
}: {
  label: string;
  current: string;
  trigger: string;
  rule: string;
  pass: boolean;
}) {
  return (
    <tr className="border-b border-white/5 text-sm">
      <td className="px-4 py-4 font-medium text-white">{label}</td>
      <td className="px-4 py-4 text-right text-slate-300">{current}</td>
      <td className="px-4 py-4 text-right font-semibold text-sky-200">
        {trigger}
      </td>
      <td className="px-4 py-4 text-slate-400">{rule}</td>
      <td className="px-4 py-4 text-right">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            pass
              ? "bg-emerald-400/15 text-emerald-200"
              : "bg-rose-400/15 text-rose-200"
          }`}
        >
          {pass ? "PASS" : "BLOCK"}
        </span>
      </td>
    </tr>
  );
}

function inputClass() {
  return "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none transition focus:border-sky-300/50 focus:ring-4 focus:ring-sky-400/10";
}

function ScenarioForm({ settings }: { settings: FinancialSettings }) {
  return (
    <form
      action="/pm/financial"
      method="get"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <input type="hidden" name="simulate" value="1" />
      <label className="text-sm text-slate-300">
        Contract mode
        <select
          name="contract_mode"
          defaultValue={settings.contract_mode}
          className={inputClass()}
        >
          <option value="unknown">Unknown</option>
          <option value="private">Private</option>
          <option value="public_procurement">Public procurement</option>
        </select>
      </label>
      <label className="text-sm text-slate-300">
        Advance target (%)
        <input
          className={inputClass()}
          name="advance_target_pct"
          type="number"
          min="0"
          max="100"
          step="0.1"
          defaultValue={settings.advance_target_pct}
        />
      </label>
      <label className="text-sm text-slate-300">
        Customer payment lag (days)
        <input
          className={inputClass()}
          name="client_payment_lag_days"
          type="number"
          min="0"
          max="180"
          defaultValue={settings.client_payment_lag_days}
        />
      </label>
      <label className="text-sm text-slate-300">
        Claim cycle (days)
        <input
          className={inputClass()}
          name="claim_cycle_days"
          type="number"
          min="1"
          max="90"
          defaultValue={settings.claim_cycle_days}
        />
      </label>
      <label className="text-sm text-slate-300">
        Retention (%)
        <input
          className={inputClass()}
          name="retention_pct"
          type="number"
          min="0"
          max="20"
          step="0.1"
          defaultValue={settings.retention_pct}
        />
      </label>
      <label className="text-sm text-slate-300">
        Supplier credit default (days)
        <input
          className={inputClass()}
          name="supplier_credit_days_default"
          type="number"
          min="0"
          max="180"
          defaultValue={settings.supplier_credit_days_default}
        />
      </label>
      <label className="text-sm text-slate-300">
        Safety reserve (% BAC)
        <input
          className={inputClass()}
          name="safety_buffer_pct"
          type="number"
          min="0"
          max="50"
          step="0.1"
          defaultValue={settings.safety_buffer_pct}
        />
      </label>
      <label className="text-sm text-slate-300">
        Batch size (sites)
        <input
          className={inputClass()}
          name="batch_size_sites"
          type="number"
          min="1"
          max="446"
          defaultValue={settings.batch_size_sites}
        />
      </label>
      <label className="text-sm text-slate-300">
        Batch start interval (days)
        <input
          className={inputClass()}
          name="batch_start_interval_days"
          type="number"
          min="1"
          max="60"
          defaultValue={settings.batch_start_interval_days}
        />
      </label>
      <div className="flex items-end sm:col-span-2 xl:col-span-3">
        <button className="min-h-12 w-full rounded-xl bg-sky-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
          จำลอง Trigger ก่อนบันทึก
        </button>
      </div>
    </form>
  );
}

function ApplyForm({ guardrail }: { guardrail: FinancialGuardrail }) {
  const s = guardrail.settings;
  return (
    <form action={applyFinancialStructure} className="mt-4">
      <input type="hidden" name="contract_mode" value={s.contract_mode} />
      <input
        type="hidden"
        name="advance_target_pct"
        value={s.advance_target_pct}
      />
      <input
        type="hidden"
        name="client_payment_lag_days"
        value={s.client_payment_lag_days}
      />
      <input type="hidden" name="claim_cycle_days" value={s.claim_cycle_days} />
      <input type="hidden" name="retention_pct" value={s.retention_pct} />
      <input
        type="hidden"
        name="supplier_credit_days_default"
        value={s.supplier_credit_days_default}
      />
      <input
        type="hidden"
        name="safety_buffer_pct"
        value={s.safety_buffer_pct}
      />
      <input type="hidden" name="batch_size_sites" value={s.batch_size_sites} />
      <input
        type="hidden"
        name="batch_start_interval_days"
        value={s.batch_start_interval_days}
      />
      <button
        disabled={!guardrail.pass}
        className={`min-h-12 w-full rounded-xl px-5 text-sm font-semibold transition ${
          guardrail.pass
            ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            : "cursor-not-allowed bg-rose-400/15 text-rose-200"
        }`}
      >
        {guardrail.pass
          ? "บันทึกโครงสร้างทางการเงินนี้"
          : "BLOCK — แก้ Trigger ที่ไม่ผ่านก่อนบันทึก"}
      </button>
    </form>
  );
}

export default async function PmFinancialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const overviewResult = await getPmFinancialGuardrail();

  if (!overviewResult.data) {
    return (
      <section className="space-y-6">
        <Link href="/pm" className="text-sm text-sky-300 hover:text-sky-200">
          ← กลับ PM Control
        </Link>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
          <h1 className="text-2xl font-semibold">Financial Guardrail ยังเชื่อมไม่ได้</h1>
          <p className="mt-2 text-sm text-amber-50/80">{overviewResult.error}</p>
        </div>
      </section>
    );
  }

  const isSimulation = first(params.simulate) === "1";
  let guardrail = overviewResult.data;
  if (isSimulation) {
    const scenario = scenarioFromParams(params, overviewResult.data.settings);
    const simulationResult = await getPmFinancialGuardrail(scenario);
    if (simulationResult.data) guardrail = simulationResult.data;
  }

  const s = guardrail.settings;
  const gm = guardrail.gm_gate;
  const cash = guardrail.cash_gate;
  const t = guardrail.triggers;
  const advancePass = s.advance_target_pct + 0.01 >= t.minimum_safe_advance_pct;
  const lagPass = s.client_payment_lag_days <= t.max_safe_client_payment_lag_days;
  const claimPass = s.claim_cycle_days <= t.max_safe_claim_cycle_days;
  const batchPass = s.batch_size_sites <= t.max_safe_batch_size_sites;
  const applyState = first(params.apply);

  return (
    <section className="space-y-7 pb-10">
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/pm"
          className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-slate-200 hover:bg-white/10"
        >
          ← PM Control
        </Link>
        <Link
          href="/commercial"
          className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-slate-200 hover:bg-white/10"
        >
          Commercial / Pricing
        </Link>
      </nav>

      <header className="rounded-[2rem] border border-sky-300/15 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">
            HARD FLOOR GM ≥ 32%
          </span>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            CASH ≥ SAFETY RESERVE ทุกช่วงเวลา
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          PM Financial Structure Guardrails
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
          PM ปรับ Advance, Days-to-Cash, Claim Cycle, Supplier Credit, Retention,
          Safety Reserve และ Batch Size ได้ แต่ระบบจะบันทึกได้เฉพาะเมื่อ
          <strong className="text-white"> Forecast GM ไม่ต่ำกว่า 32%</strong> และ
          <strong className="text-white"> Rolling Cash ไม่ต่ำกว่า Safety Reserve</strong>
          ตลอดโครงการ
        </p>
      </header>

      {applyState === "success" ? (
        <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          บันทึกโครงสร้างทางการเงินแล้ว และผ่าน GM + Cash Flow Guardrails
        </div>
      ) : null}
      {applyState === "blocked" ? (
        <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">
          ระบบ Block การบันทึก เพราะข้อมูลล่าสุดไม่ผ่าน Financial Guardrail อย่างน้อยหนึ่งข้อ
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Forecast GM"
          value={pct(gm.forecast_gm)}
          detail={`Hard floor ${pct(gm.target_gm)} • EAC ${million(gm.forecast_eac)}`}
          tone={gm.pass ? "green" : "red"}
        />
        <Kpi
          label="Minimum Safe Advance"
          value={`${t.minimum_safe_advance_pct.toFixed(2)}%`}
          detail={`Scenario ปัจจุบัน ${s.advance_target_pct.toFixed(1)}%`}
          tone={advancePass ? "green" : "red"}
        />
        <Kpi
          label="Minimum Rolling Cash"
          value={million(cash.min_cash)}
          detail={`Reserve ${million(cash.safety_reserve)} • Day ${cash.min_cash_day}`}
          tone={cash.pass ? "green" : "red"}
        />
        <Kpi
          label="Cash Buffer Above Reserve"
          value={million(cash.cash_buffer_above_reserve)}
          detail={cash.funding_gap > 0 ? `Funding gap ${million(cash.funding_gap)}` : "ไม่มี funding gap"}
          tone={cash.pass ? "green" : "red"}
        />
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-300">SIMULATOR</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              ปรับโครงสร้าง → ดู Trigger → ค่อยบันทึก
            </h2>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300">
            Simulation ไม่แก้ฐานข้อมูล
          </span>
        </div>
        <div className="mt-5">
          <ScenarioForm settings={s} />
        </div>
        {isSimulation ? <ApplyForm guardrail={guardrail} /> : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div>
          <p className="text-sm font-medium text-emerald-300">REDUCTION TRIGGERS</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            เส้นห้ามข้ามก่อนลด Advance หรือผ่อนเงื่อนไข
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Trigger คำนวณใหม่ทุกครั้งจาก BAC, Supplier/PO Commitment, Procurement Award,
            Payment Terms และ Rolling Batch Schedule ไม่ใช่ค่าเปอร์เซ็นต์ตายตัว
          </p>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[920px] border-collapse">
            <thead className="bg-slate-950/50 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Lever</th>
                <th className="px-4 py-3 text-right">Scenario</th>
                <th className="px-4 py-3 text-right">Trigger</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <TriggerRow
                label="Gross Margin"
                current={pct(gm.forecast_gm)}
                trigger="≥ 32.00%"
                rule="Forecast EAC ต้องไม่ทำให้ GM ต่ำกว่า 32%"
                pass={gm.pass}
              />
              <TriggerRow
                label="Advance"
                current={`${s.advance_target_pct.toFixed(2)}%`}
                trigger={`≥ ${t.minimum_safe_advance_pct.toFixed(2)}%`}
                rule="ลดได้จนถึงจุดที่ Minimum Cash ยัง ≥ Safety Reserve"
                pass={advancePass}
              />
              <TriggerRow
                label="Customer payment lag"
                current={`${s.client_payment_lag_days} วัน`}
                trigger={`≤ ${t.max_safe_client_payment_lag_days} วัน`}
                rule="เกิน Trigger จะเพิ่ม Working Capital Gap"
                pass={lagPass}
              />
              <TriggerRow
                label="Claim cycle"
                current={`${s.claim_cycle_days} วัน`}
                trigger={`≤ ${t.max_safe_claim_cycle_days} วัน`}
                rule="รอบ Claim ช้ากว่านี้จะกด Cash ต่ำกว่า Reserve"
                pass={claimPass}
              />
              <TriggerRow
                label="Batch size"
                current={`${s.batch_size_sites} จุด`}
                trigger={`≤ ${t.max_safe_batch_size_sites} จุด`}
                rule="ห้ามเปิดงานพร้อมกันเกิน Cash Capacity ของ Scenario"
                pass={batchPass}
              />
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm font-medium text-amber-300">GM HEADROOM</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            ต้นทุนเพิ่มที่ยังรับได้ก่อน GM ต่ำกว่า 32%
          </h2>
          <p className="mt-4 text-3xl font-semibold text-white">
            {baht(gm.max_incremental_cost_before_breach)}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Awarded Procurement Saving ที่ยืนยันแล้ว {baht(gm.awarded_procurement_saving)} •
            Commitment overrun {baht(gm.commitment_overrun)}
          </p>
          {gm.max_incremental_cost_before_breach <= 1 ? (
            <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
              GM ปัจจุบันอยู่ที่ 32% พอดี จึงไม่มีพื้นที่สำหรับ Finance Cost,
              Cost Overrun หรือส่วนลดลูกค้าเพิ่มเติม จนกว่าจะมี Procurement Saving
              ที่ยืนยันแล้วหรือปรับราคาขาย
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm font-medium text-sky-300">CASH POLICY</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Safety Reserve = {s.safety_buffer_pct}% BAC
          </h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-slate-400">Safety Reserve</span>
              <b className="text-white">{baht(cash.safety_reserve)}</b>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-slate-400">Minimum Cash</span>
              <b className="text-white">{baht(cash.min_cash)}</b>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-slate-400">Worst point</span>
              <b className="text-white">Day {cash.min_cash_day}</b>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Confirmed customer direct funding</span>
              <b className="text-white">
                {t.confirmed_customer_direct_funding_pct.toFixed(1)}%
              </b>
            </div>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            Customer Direct Pay ที่ยังเป็น proposed จะไม่ถูกนำมาลด Advance Floor
            จนกว่าสถานะเป็น approved / active / confirmed
          </p>
        </section>
      </div>

      <details open className="group rounded-3xl border border-white/10 bg-white/5">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-sky-300">ROLLING CASH FLOW</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Cash Flow รายสัปดาห์
            </h2>
          </div>
          <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-white/10 px-5 pb-6 pt-4 sm:px-6">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-slate-950/50 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Week</th>
                  <th className="px-4 py-3 text-right">Cash In</th>
                  <th className="px-4 py-3 text-right">Cash Out</th>
                  <th className="px-4 py-3 text-right">Closing Cash</th>
                  <th className="px-4 py-3 text-right">Reserve Gate</th>
                </tr>
              </thead>
              <tbody>
                {guardrail.cashflow.weekly.map((week) => {
                  const pass = week.closing_cash + 0.01 >= cash.safety_reserve;
                  return (
                    <tr key={week.week} className="border-b border-white/5 text-slate-300">
                      <td className="px-4 py-3 font-medium text-white">W{week.week + 1}</td>
                      <td className="px-4 py-3 text-right text-emerald-200">
                        {baht(week.inflow)}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-200">
                        {baht(week.outflow)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {baht(week.closing_cash)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={pass ? "text-emerald-200" : "text-rose-200"}>
                          {pass ? "PASS" : "BELOW RESERVE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <div
        className={`rounded-3xl border p-5 ${
          guardrail.pass
            ? "border-emerald-300/25 bg-emerald-400/10"
            : "border-rose-300/25 bg-rose-400/10"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
          Final decision
        </p>
        <p className="mt-2 text-xl font-semibold text-white">
          {guardrail.pass
            ? "GREEN — Scenario นี้อนุญาตให้ PM ใช้ได้"
            : "RED — ระบบไม่อนุญาตให้บันทึก Scenario นี้"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {guardrail.pass
            ? "Forecast GM ≥ 32% และ Rolling Cash ≥ Safety Reserve ตลอดโครงการ"
            : `${gm.pass ? "GM ผ่าน" : "GM ไม่ผ่าน"} • ${cash.pass ? "Cash Flow ผ่าน" : "Cash Flow ไม่ผ่าน"}`}
        </p>
      </div>
    </section>
  );
}
