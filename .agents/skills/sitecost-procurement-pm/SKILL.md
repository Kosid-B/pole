---
name: sitecost-procurement-pm
description: Run SiteCost Drying Yard 446 procurement sourcing, supplier RFQ, advance/cash-flow decisions, GM guardrails, cluster awards, and PM batch-release checks. Use whenever work touches supplier sourcing, procurement clusters, concrete/aggregate/rebar purchasing, advance payment, cash flow, EAC, GM, PO release, framework agreements, or customer-funded rolling batches.
---

# SiteCost Procurement + PM Financial Control

## Scope

Use this skill for the SiteCost Drying Yard 446 project. Treat Admin as PM for internal financial and procurement control. Keep customer-facing Commercial information separate from internal cost, supplier bids, margins, and savings.

## Source of truth

1. Read live project data before making a financial or procurement decision.
2. Use Supabase project data as the internal source of truth for BAC, pricing, PM cash-flow settings, work packages, procurement clusters, supplier directory, bids, framework agreements, customer funding, site readiness, and batch releases.
3. Use current public web search only for supplier discovery/contact verification and public reference information. A web-found supplier is a candidate, never an awarded supplier.
4. Store source URL and contact date when a public contact is found. Mark commercial terms `unconfirmed` until RFQ/quotation/PO evidence exists.

## Financial invariants

- Target Gross Margin and hard PM floor: **32% of selling price**, not markup on cost.
- Selling price before VAT at 32% GM = `cost / (1 - 0.32)`.
- PM may restructure Advance, claim frequency, batch size, supplier payment terms, customer material funding, or PO sequencing, but must not approve a structure that forecasts GM below 32%.
- VAT cash is not operating margin and must not be treated as free working capital.
- Required Advance is dynamic: the minimum advance that keeps rolling cash balance at or above the PM Safety Reserve throughout the modeled project cycle.
- Do not use a fixed 50% advance rule. Treat 50% as a stress scenario when suppliers are cash/COD and customer cash conversion is slow.

## Current planning baseline

Use live settings when available. The currently agreed planning baseline is:

- Supplier credit default: 0 days unless confirmed otherwise.
- Customer payment lag after claim: 14 days.
- Claim cycle: 7-14 days; current DB default 14 days.
- Retention: maximum planning assumption 5% unless contract says otherwise.
- Rolling batch: about 20-25 sites; current DB default 25.
- New batch interval: 7 days.
- Cash safety reserve: 10% of BAC.
- Working advance target: 25%.
- Negotiation floor: 20% only when customer payment is no slower than 14 days and retention remains no more than 5%, unless another funding mechanism offsets the gap.
- 15% or lower advance requires compensating terms such as weekly progress payment, material-on-site payment, customer direct pay to critical suppliers, or confirmed supplier credit.

These are planning defaults, not immutable contract terms. Recalculate whenever supplier or customer terms change.

## Work-package cash model

Do not treat `fixed_cost` as a day-one cash requirement. Use the live work-package schedule:

- Site survey / preparation
- Earthworks / sub-base
- Reinforcement / formwork
- Concrete and placement
- Finishing / joints / asphalt
- Solar / signage
- Logistics

Forecast cash by planned week, committed amount, supplier deposit, credit days, lead time, actual paid amount, customer claim cycle, payment lag, retention, and batch-release dates.

## PM decision gates

Before releasing a new Batch, PO, subcontract, or material commitment, calculate and show all of these:

1. **GM Gate** — forecast GM after the decision must be >= 32.00%.
2. **Cash Gate** — projected closing cash must never fall below the configured Safety Reserve in the rolling forecast horizon.
3. **Commitment Gate** — customer cash available plus expected collectible cash must cover confirmed commitments over the next four weeks plus Safety Reserve.
4. **Procurement Gate** — critical suppliers must have a usable RFQ/quotation and operational capacity for the released batch.
5. **Schedule Gate** — supplier lead time and capacity must support the planned pour/work sequence.

If a gate fails, do not silently approve. Show the trigger, financial impact, and corrective choices.

## Required trigger reporting

Whenever PM changes Advance, supplier selection, payment terms, batch size, or price structure, display:

- Trigger / cause of change.
- Old value -> new value.
- EAC impact.
- Forecast GM before/after.
- Lowest projected cash balance before/after.
- Required Advance before/after.
- Four-week commitment coverage before/after.
- Decision: PASS / CONDITIONAL / HOLD.

Common triggers: supplier price increase, freight/minimum-load change, concrete reject/waste, customer payment lag, retention change, supplier deposit requirement, lost credit term, batch acceleration, weather delay, standby, or scope variation.

## Supplier sourcing workflow

Prioritize material groups in this order because of cash and margin exposure:

1. Concrete 240 ksc.
2. Aggregate / stone / sand / sub-base.
3. Steel / reinforcement.

For each Procurement Zone:

1. Use the province/district site distribution and volume forecast.
2. Search for at least two concrete candidates plus aggregate and steel candidates. Prefer local plants/yards and credible regional suppliers.
3. Capture supplier name, plant/yard location, service provinces, phone, email, Line, website/source, and date found.
4. Never infer Credit Days, Deposit %, Capacity, Lead Time, delivery radius, or price from reputation. Leave those fields null/unconfirmed until supplier response.
5. Create an RFQ checklist asking for base rate, freight, pump, waiting, short-load/minimum-order, cash discount, volume rebate, schedule discount, capacity/day, lead time, payment terms, quote validity, QA certificates, and named dispatch plant.
6. For ready-mix concrete, the plant-to-site dispatch path is a hard operational constraint. A commercial framework zone may span provinces, but each call-off must use a feasible local/nearby plant.
7. Promote a candidate into Supplier A/B/C only after a valid RFQ/quotation is received.

## Total Delivered Cost

For ready-mix concrete use:

`TDC/m3 = base_rate + freight + pump + waiting + short_load - cash_discount - volume_rebate - schedule_discount + other_adjustment`

Do not award on base rate alone. For aggregate and reinforcement use the equivalent fully delivered project cost including transport, minimum load/order effects, handling, cutting/bending if applicable, and any unavoidable service fees.

## Supplier award rule

A supplier may be recommended for award only when:

- commercial terms are confirmed by quotation/RFQ/PO evidence;
- delivered cost can be calculated;
- quote is valid for the planned call-off period;
- product/specification and QA documentation meet project requirements;
- capacity and lead time cover the planned batch;
- award does not break the 32% GM Gate;
- award does not break the Cash Gate.

Maintain a Primary and Backup supplier where operationally justified. Do not auto-award a web-sourced candidate.

## Manual award + Framework Agreement control

Supplier Award is a human-controlled write action, not an automatic consequence of ranking.

1. Run approval **per Cluster** so customer-funded rolling batches can proceed without waiting for all 446 sites.
2. Before `award_approved`, backend must reload current data and require simultaneously:
   - two distinct Award-ready confirmed bids for Primary + Backup;
   - valid quotations and positive server-calculated TDC;
   - capacity, lead time and payment terms complete;
   - Forecast GM >= 32.00%;
   - Minimum Rolling Cash >= Safety Reserve;
   - Customer Direct Pay / Material Advance for that Cluster is `approved`, `active` or `confirmed` and > 0%.
3. Award approval must record the signed-in approver identity, role, decision rationale, Primary/Backup bid IDs and a snapshot of TDC, GM, cash and funding.
4. Use idempotency `request_id` so a double submit cannot create duplicate approval records.
5. Award audit records are append-only. Do not update or delete historical approval events.
6. Award approval may populate the Framework draft with Primary/Backup and set status `award_approved`, but must **not** activate the Framework automatically.
7. Framework Activation is a second manual action. Require a real Agreement No., effective-from date, current valid Primary/Backup quotations, Cluster funding, GM and Cash gates before status becomes `active`.
8. Never invent Agreement No. or contract effective dates.
9. Framework defaults currently use Primary 70% / Backup 30%, call-off notice 72 hours and rolling forecast 14 days unless live contract terms say otherwise.

## Field Site Readiness + PM verification

Treat field evidence, PM verification, and Batch Release as three separate control events.

1. `FIELD_LEADER`, `ADMIN`, or `EXECUTIVE` may create a new Site Readiness **submission** for a site that belongs to an unlocked Rolling Batch.
2. A field submission is append-only evidence. It must never directly change the Batch site to `ready`.
3. Candidate Ready requires all of the following in the latest submission:
   - quantity confirmed;
   - drawing confirmed;
   - site condition confirmed;
   - access ready;
   - confirmed concrete volume > 0 m3;
   - evidence reference present.
4. Only `ADMIN` or `EXECUTIVE` may review a submission. Acceptance of the **latest** Candidate Ready submission copies its verified values to Batch Site Readiness and changes that site to `ready`.
5. Rejecting a submission leaves the existing Batch Site Readiness unchanged.
6. Never accept a stale submission when a newer field submission exists for the same site.
7. Submission and review records are append-only, idempotent, RLS-protected, and writable only through server-side service-role RPCs.
8. `FIELD_LEADER` must not gain access to Supplier RFQ, internal TDC, GM, PM Cash Flow, Award Approval, Framework Activation, or Batch Release controls.
9. Site `ready` still does **not** mean the Batch may release. Batch Release must separately pass Procurement, Framework, Supplier Capacity/Lead Time, Customer Funding, GM, Rolling Cash, four-week commitment coverage, and schedule/call-off gates.

## Customer-funded rolling batch

When local suppliers are COD/no-credit, prefer customer-funded rolling batches rather than financing all 446 sites from company cash. Release the next batch only when:

`cash available + collectible customer cash >= next 4-week confirmed commitments + safety reserve`

Use customer Material Advance, Material-on-Site Payment, or Direct Pay to Critical Supplier when contractually allowed. Any customer direct payment must be reconciled against contract/progress value, not added to contract value twice.

## Public procurement caution

Do not assume a universal statutory 15% advance cap. Many Thai public construction bidding/contract documents use an advance of no more than 15% with an advance-payment guarantee and recovery through progress payments, but the actual TOR/contract governs. Always inspect the applicable procurement documents before setting the contract condition.

## UX / reporting rules

- Thai-first, mobile-first, Law of UX.
- Progressive disclosure: PM decision gates first, detailed supplier/RFQ tables second.
- Red = HOLD, Amber = CONDITIONAL, Green = PASS.
- Never hide a GM or cash-flow breach behind an average or total-project profit number.
- Keep customer-facing pages free of internal supplier bids, cost base, GP, margin, saving target, or internal financing assumptions.

## Completion checks

Before finalizing any sourcing or financial recommendation confirm:

- [ ] Live project data was read.
- [ ] Forecast GM remains >= 32%.
- [ ] Rolling cash remains >= Safety Reserve.
- [ ] Supplier commercial terms are confirmed or explicitly labelled unconfirmed.
- [ ] Total Delivered Cost includes all known logistics/service costs.
- [ ] Concrete dispatch plant and capacity are confirmed for the relevant site cluster.
- [ ] Quote validity and QA/spec requirements are checked.
- [ ] Customer payment timing and retention are reflected in cash flow.
- [ ] Batch release does not exceed four-week cash capacity.
- [ ] Manual Award and Framework Activation are separate approval events with immutable audit snapshots.
- [ ] Field submission, PM verification, and Batch Release are separate events; FIELD_LEADER cannot self-verify or release.
- [ ] Customer-facing data is separated from PM-internal data.
