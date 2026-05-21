# Identity and Master Data Integration Design

## Goal

Upgrade the MVP from a partially free-form, seed-oriented system into a database-backed operating system with:

- real `User` records for sign-in and session identity
- hashed passwords and active/inactive account control
- normalized master data for teams, costs, units, and equipment
- application-level integration so forms, queries, and summaries use the new data model immediately

This round is intentionally broader than schema-only work. It includes schema, seed, authentication, queries, forms, and regression updates. It does **not** include a full admin settings platform for managing master data, password reset, email verification, or approval workflows.

## Scope

This design covers four workstreams:

1. `Identity`
   Replace the current lightweight sign-in source with a real `User` table and database-backed authentication.

2. `Master Data`
   Add `CostCategory`, `TeamType`, `UnitOfMeasure`, and `EquipmentMaster`.

3. `Domain Integration`
   Connect the new master data to `Team`, `CostEntry`, `FieldReportMaterial`, and `FieldReportEquipment`.

4. `Application Integration`
   Update auth logic, server actions, queries, forms, seeds, and tests so the new model is used in practice.

## Non-Goals

This round does not include:

- self-service user management
- forgot password or email verification
- multi-company tenancy
- dynamic CRUD screens for editing `CostCategory` or `TeamType`
- forcing equipment selection from master data only
- removing all legacy text fields immediately if they are still needed for migration safety

## Product Decisions

The following decisions are fixed for this design:

- use real `User` records in the database
- use password hashing, not plain-text or mock password checks
- keep equipment flexible for now: seed `เครื่องเจาะ` and `เครื่องกำเนิดไฟฟ้า`, but still allow free-text equipment entry
- keep `CostCategory` fixed for now:
  - `วัสดุ`
  - `ค่าแรง`
  - `เครื่องจักร`
  - `ขนส่ง`
  - `อื่น ๆ`
- keep `TeamType` fixed for now:
  - `ติดตั้ง`
  - `ฐานราก`
  - `ตรวจรับ`
  - `ขนส่ง`

## Recommended Approach

Three implementation paths were considered:

1. `Integrated Core` — recommended
   Add identity and master data together, then wire the app to use them immediately.

2. `Auth-first`
   Convert sign-in first and defer master data wiring.

3. `Master-data-first`
   Normalize business data first and defer auth conversion.

`Integrated Core` is the best fit because the target state depends on both sides. Real user identity without normalized business data still leaves the app half-structured, while normalized business data without real identity leaves authentication as temporary infrastructure.

## Data Model

### User

`User` becomes the source of truth for sign-in and session identity.

Fields:

- `id`
- `fullName`
- `email`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Behavior:

- `email` must be unique
- `passwordHash` is always stored as a secure hash
- inactive users cannot sign in
- role comes from the database record, not from a UI role selector

### TeamType

`TeamType` is a fixed master table.

Fields:

- `id`
- `code`
- `nameTh`
- `sortOrder`
- `isActive`

Relationship:

- `Team.teamTypeId -> TeamType.id`

### CostCategory

`CostCategory` is a fixed master table.

Fields:

- `id`
- `code`
- `nameTh`
- `sortOrder`
- `isActive`

Relationship:

- `CostEntry.costCategoryId -> CostCategory.id`

### UnitOfMeasure

`UnitOfMeasure` provides a shared unit catalog.

Fields:

- `id`
- `code`
- `nameTh`
- `symbol`
- `sortOrder`
- `isActive`
- `createdAt`
- `updatedAt`

Relationships:

- `EquipmentMaster.defaultUnitId -> UnitOfMeasure.id`
- `FieldReportMaterial.unitId -> UnitOfMeasure.id`
- `FieldReportEquipment.unitId -> UnitOfMeasure.id`

### EquipmentMaster

`EquipmentMaster` stores the equipment catalog.

Fields:

- `id`
- `code`
- `nameTh`
- `defaultUnitId`
- `isActive`
- `createdAt`
- `updatedAt`

Seeded initial records:

- `DRILL` = `เครื่องเจาะ`
- `GENSET` = `เครื่องกำเนิดไฟฟ้า`

Relationship:

- `FieldReportEquipment.equipmentMasterId -> EquipmentMaster.id` as an optional relation

This relation stays optional because the app must still support free-text equipment names in this round.

## Changes to Existing Models

### Team

Add:

- `teamTypeId`

Keep current business fields such as `name`, `leaderName`, and `crewSize`.

### CostEntry

Add:

- `costCategoryId`

Migration strategy:

- preserve `category` during transition if needed for backfill safety
- update the app to read from the relation, not from free text

### FieldReportMaterial

Add:

- `unitId`

Migration strategy:

- keep the legacy `unit` text column temporarily if needed
- move application reads toward the relation-backed unit immediately

### FieldReportEquipment

Add:

- `equipmentMasterId?`
- `unitId`

Keep:

- `name`
- `unit`

Reason:

- `name` remains necessary for free-text equipment entry
- `equipmentMasterId` allows structured selection when the entry matches a seeded or known equipment item

## Authentication Design

### Sign-in Flow

The sign-in page keeps the same high-level experience: `email + password`.

Changes:

- remove the current role selector from normal sign-in flow
- look up the user by `email`
- validate the submitted password against `passwordHash`
- reject sign-in when the user does not exist, the password is wrong, or `isActive` is false
- create a session from the database record

### Session Contents

The application session should include only the identity data needed by the shell and permission layer:

- `userId`
- `email`
- `fullName`
- `role`

### Role Switching

The current role-switch experience should not remain a production behavior once auth becomes real.

Recommended treatment:

- production flow uses the role stored on the signed-in user
- test and development flows use different seeded users per role
- any remaining switch-role shortcut should be removed or isolated to development-only tooling

## Application Integration

### Teams Module

Changes:

- team creation form must require a `TeamType`
- team listings and summaries should show team type from the relation

### Finance Module

Changes:

- cost entry form must select a `CostCategory`
- finance summaries and tables should display the normalized category label

### Field Reports Module

Changes:

- materials use `UnitOfMeasure`
- equipment uses `UnitOfMeasure`
- equipment input should support:
  - selecting a known equipment item when appropriate
  - entering free text when the equipment is not in the seeded catalog

The UX for equipment should feel structured but not restrictive.

### Queries and Server Actions

Update the query and action layer to join and persist the new relations:

- auth queries for `User`
- team queries for `TeamType`
- finance queries for `CostCategory`
- field-report queries for `UnitOfMeasure` and optional `EquipmentMaster`

## Seed Strategy

### Development Seed

Development seed should include:

- multiple users across all supported roles
- fixed `CostCategory`
- fixed `TeamType`
- shared `UnitOfMeasure`
- `EquipmentMaster` with:
  - `เครื่องเจาะ`
  - `เครื่องกำเนิดไฟฟ้า`
- existing sample projects and activity data adjusted to the new relations

### Production-Safe Seed

Production-safe seed should include only bootstrap essentials:

- initial users
- fixed `CostCategory`
- fixed `TeamType`
- shared `UnitOfMeasure`
- `EquipmentMaster` initial records

It must avoid demo or noisy sample operational records.

## Migration Strategy

Use a progressive normalization approach rather than a hard cutover.

Steps:

1. add the new master tables
2. add new foreign keys to existing domain tables
3. backfill relation data from existing free-text columns where possible
4. switch application reads and writes toward the normalized fields
5. keep fallback text columns where necessary during transition
6. consider removing obsolete text columns only in a later cleanup round

This is especially important for:

- `CostEntry.category`
- `FieldReportMaterial.unit`
- `FieldReportEquipment.name`
- `FieldReportEquipment.unit`

## Rollout Plan

The safest rollout order is:

1. schema changes and migration
2. seed updates
3. auth conversion to `User`
4. form and query updates for master data
5. unit and integration regression
6. sign-in validation with real users
7. deployment to the next environment

## Risks and Mitigations

### Auth Refactor Risk

Risk:

- sign-in and session regressions can break every protected route

Mitigation:

- keep auth tests focused and explicit
- seed real users for every role used by the app and e2e suite

### Partial Backfill Risk

Risk:

- old text values may not map perfectly into normalized relations

Mitigation:

- keep selected legacy fields during transition
- backfill conservatively and prefer explicit fallback behavior over destructive cleanup

### Test Fixture Risk

Risk:

- existing tests may assume role-switching or mock session behavior

Mitigation:

- move tests toward role-specific seeded accounts
- update e2e flows to authenticate as real users

### Production Seed Risk

Risk:

- production bootstrap could accidentally inject sample operational data

Mitigation:

- keep production seed intentionally narrow and role/bootstrap focused

## Testing Strategy

Automated verification must cover:

- user sign-in success and failure cases
- inactive user rejection
- session role propagation
- team creation with `TeamType`
- cost entry creation with `CostCategory`
- field report creation with normalized unit usage
- field report equipment free-text fallback
- dashboard and module queries still working after relation changes
- end-to-end sign-in flows for executive, admin, and field leader users

Core verification commands after implementation:

1. `pnpm test`
2. `pnpm test:e2e`
3. `pnpm build`

## Delivery Shape

This implementation should be executed in two internal phases within one plan:

### Phase A

- schema
- migrations
- seeds
- auth

### Phase B

- forms
- queries
- regression

This preserves a single coherent project while reducing integration risk during execution.

## Success Criteria

This round is successful when:

- users sign in from the database with hashed passwords
- role comes from the stored user record
- teams use `TeamType`
- cost entries use `CostCategory`
- field-report materials and equipment use normalized units
- field-report equipment supports both seeded equipment and free text
- all core tests and build checks pass
- the app no longer depends on mock-style role selection for real usage

## Spec Self-Review

- No placeholders such as `TODO`, `TBD`, or undefined scope markers remain.
- The scope stays focused on identity and master-data integration, not generic admin settings.
- The auth design, schema changes, and rollout order are internally consistent.
- The transition strategy explicitly protects current data and avoids premature column removal.
