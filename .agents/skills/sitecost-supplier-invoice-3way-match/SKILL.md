---
name: sitecost-supplier-invoice-3way-match
description: Control SiteCost Drying Yard 446 supplier invoices, invoice quantity reservation, 3-Way Match, payment eligibility, and supplier AP review. Use whenever work touches supplier invoice entry, tax invoice evidence, invoice matching, verified delivery quantities, payment eligibility, AP review, or supplier payment readiness.
---

# SiteCost Supplier Invoice + 3-Way Match Control

## Scope

Use this skill for Supplier Invoice and downstream supplier-payment readiness in SiteCost Drying Yard 446. This workflow begins only after Supplier Call-off and PM Delivery Verification are complete. Keep invoice/AP information inside ADMIN/EXECUTIVE surfaces; FIELD_LEADER must not see supplier price, TDC, invoice amount, payment terms, margin, funding or payment eligibility.

## Source of truth

Use live Supabase project data. Do not duplicate Call-off, Delivery Receipt, Supplier Bid, Framework, Batch or Site data.

Required upstream sources:

- `drying_yard_supplier_calloffs`
- `drying_yard_delivery_receipt_submissions`
- `drying_yard_delivery_receipt_reviews`
- `drying_yard_procurement_bids`
- `drying_yard_batch_releases`
- `core_installation_sites`

Invoice control sources:

- `drying_yard_supplier_invoices`
- `drying_yard_supplier_invoice_lines`
- `drying_yard_supplier_invoice_reviews`

## Hard control chain

`Completed Call-off → PM-Verified Accepted Actual → Supplier Invoice Submission → Server 3-Way Match → ADMIN/EXECUTIVE Manual Payment Eligibility`

Payment Eligibility is not Payment Execution.

Never auto-create or auto-approve:

- bank instruction or payment transaction;
- supplier settlement;
- withholding-tax posting;
- accounting journal;
- customer claim;
- payment evidence;
- paid status.

## Invoice submission gate

Only `ADMIN` or `EXECUTIVE` may submit a Supplier Invoice.

For every invoice line, backend must reload current data and require:

1. Call-off belongs to the current project and supplier bid.
2. Call-off status is `completed`.
3. The Call-off has PM-reviewed Delivery Receipts with decision `accepted`.
4. PM-Verified Accepted Actual quantity is greater than zero.
5. Invoice quantity does not exceed the current unbilled PM-Verified Accepted Actual.
6. The invoice uses the immutable `tdc_per_m3_snapshot` captured at Call-off creation.
7. A real Supplier Invoice reference and evidence reference are present.
8. Invoice date is not in the future.

Never create invoice eligibility from a `confirmed` or `cancelled` Call-off.

## Quantity reservation and double-billing prevention

Treat invoice quantity as a controlled allocation against PM-Verified Accepted Actual.

- `pending_review` invoice lines reserve their `invoiced_m3`.
- `payment_eligible` invoice lines continue to reserve their `invoiced_m3`.
- `rejected` invoice lines release their reserved quantity so a corrected invoice can be submitted.
- Sum of `pending_review + payment_eligible` quantities for a Call-off must never exceed its live PM-Verified Accepted Actual.
- Partial invoices are allowed.
- Do not rewrite historical invoice submissions to correct quantities; reject and create a new submission with a new real invoice reference/evidence as appropriate.

## 3-Way Match rule

For concrete invoices, match these three independent facts:

1. **Call-off** — completed Supplier Call-off and its immutable TDC snapshot.
2. **Receipt** — PM-Verified Accepted Actual quantity from accepted Delivery Receipt reviews.
3. **Invoice** — supplier invoice quantity and Net amount.

Expected Net per invoice line:

`Expected Net = Invoiced m3 × Call-off TDC/m3 snapshot`

A line is a match only when:

- Call-off remains `completed`;
- invoice supplier matches Call-off supplier;
- invoice quantity stays within current unbilled verified actual;
- stored TDC snapshot matches the Call-off snapshot within THB 0.01;
- `Invoice Line Net = Expected Net` within THB 0.01.

Header checks:

- sum of Invoice Line Net = Invoice Net within THB 0.01;
- sum of Expected Net = Invoice Net within THB 0.01;
- Gross = Net + VAT within THB 0.01.

## VAT and tax treatment

Do not hardcode VAT 7% into the invoice control engine. Store Net, VAT and Gross exactly as supported by the supplier document and validate arithmetic consistency only. Tax treatment, withholding tax and accounting posting are separate finance/accounting controls and must not be inferred from this module.

## Manual review + immutable audit

Only `ADMIN` or `EXECUTIVE` may review a pending Supplier Invoice.

Allowed decisions:

- `payment_eligible`
- `rejected`

Before `payment_eligible`, backend must re-run the 3-Way Match against live Call-off and Delivery data. Never trust browser preview state.

A successful review must record:

- invoice id/reference;
- supplier id/name snapshot;
- invoice Net/VAT/Gross;
- every Call-off line and quantity;
- live PM-Verified Accepted Actual;
- reserved/payment-eligible quantity;
- TDC snapshot;
- expected Net and claimed Net;
- match PASS/FAIL;
- reviewer identity and role;
- review reason;
- review timestamp.

Review records are append-only. Use idempotent `request_id` for write actions.

## Security architecture

- Browser never receives `DRYING_YARD_ADMIN_ACCESS_CODE` or service-role credentials.
- Next.js page → Server Action → server-only client → `drying-yard-invoice-api` → service-role RPC.
- Invoice tables are RLS-enabled.
- `anon` and `authenticated` have no direct table access for this module.
- Write RPCs are `SECURITY DEFINER` with fixed empty `search_path`, revoked from `public`, `anon` and `authenticated`, and executable only by `service_role`.
- `FIELD_LEADER` cannot access `/pm/invoices` or invoice navigation.

## UX rules

- Thai-first, mobile-first, Law of UX.
- Progressive disclosure: eligibility summary → eligible completed Call-offs → invoice form → match preview → manual review → audit history.
- Make `NO AUTO PAY` visible.
- Preview is advisory only; the backend review result is authoritative.
- Show Expected Net, Claimed Net and Delta clearly.
- Never hide mismatches by rounding more aggressively than the THB 0.01 control tolerance.

## Completion checks

Before releasing invoice-control changes confirm:

- [ ] Invoice references only Completed Call-offs.
- [ ] PM-Verified Accepted Actual is reloaded from accepted Delivery Receipt reviews.
- [ ] Pending + Payment Eligible quantities cannot exceed verified accepted quantity.
- [ ] Rejected invoices release quantity reservation.
- [ ] TDC uses the immutable Call-off snapshot, not a newly negotiated RFQ price.
- [ ] Invoice Line Net and Invoice Net match Expected Net within THB 0.01 before Payment Eligibility.
- [ ] Gross = Net + VAT within THB 0.01; VAT percentage is not hardcoded.
- [ ] Payment Eligibility requires explicit ADMIN/EXECUTIVE review reason and confirmation.
- [ ] Payment Eligibility does not create any payment/bank/accounting/settlement transaction.
- [ ] Invoice/review records preserve immutable evidence and actor identity.
- [ ] FIELD_LEADER has no invoice/TDC/payment-economics access.
- [ ] RLS, RPC execute privileges, security advisors and performance advisors were rechecked after DDL.
- [ ] Live baseline was rechecked and no fake operational invoice was inserted during development.
