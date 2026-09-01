# PR #18 Vercel release-gate retry — 2026-09-01

This file intentionally records the release-gate retry for PR #18 after the prior Vercel build-rate-limit hold window elapsed.

No business logic, database schema, security policy, invoice matching rule, payment eligibility rule, GM guardrail, or cash-flow guardrail is changed by this commit.

Release requirements remain:
- GitHub CI: Prisma / Vitest / Playwright / production build must pass.
- Vercel preview/deployment gate must pass.
- Supplier Invoice Payment Eligibility remains a manual control and is not payment execution.
- Forecast GM must remain >= 32.00%.
- Rolling Cash must remain >= Safety Reserve.
