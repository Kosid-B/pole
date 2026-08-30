# Project agent instructions

## SiteCost Drying Yard 446

For work involving SiteCost procurement, supplier sourcing, RFQ, concrete/aggregate/reinforcement purchasing, Advance, cash-flow, EAC, GM, framework agreements, PO release, customer material funding, PM batch release, supplier call-offs, delivery receipts, or verified actual quantities, use the project skill:

- `sitecost-procurement-pm` — `.agents/skills/sitecost-procurement-pm/SKILL.md`

For work involving Supplier Invoice entry, invoice quantity reservation, 3-Way Match, Payment Eligibility, supplier AP review, or downstream supplier-payment readiness, also use the dedicated project skill:

- `sitecost-supplier-invoice-3way-match` — `.agents/skills/sitecost-supplier-invoice-3way-match/SKILL.md`

Core invariant: PM/Admin may restructure financing and procurement, but no decision may forecast Gross Margin below 32% or rolling cash below the configured PM Safety Reserve. Web-found suppliers remain unconfirmed candidates until RFQ/quotation evidence establishes price, payment terms, capacity, lead time, and delivery feasibility.

Supplier invoice invariant: Payment Eligibility is a manual ADMIN/EXECUTIVE control after Completed Call-off + PM-Verified Accepted Actual + server-side 3-Way Match. It must never auto-create payment, bank instruction, settlement, withholding-tax posting, accounting journal, or customer claim.
