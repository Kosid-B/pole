# Project Management SaaS MVP Design

**Date:** 2026-05-20
**Project Root:** `D:\เสาไฟฟ้า`
**Scope:** Single-company SaaS for project operations, field reporting, materials/equipment tracking, and finance visibility.

## Product Goal
Build a web-based SaaS that gives executives, project admins, and field leaders a shared operating system for large-scale installation projects. The MVP starts with an executive dashboard, backed by operational modules that feed progress, cost, billing, and resource data into one system.

## Users and Roles

### 1. Executive
Primary need: see company-wide performance and risk quickly.

Core capabilities:
- View portfolio-level dashboard across all projects
- Track progress against target output
- Monitor cash in, cash out, billing status, and estimated gross profit
- Identify delayed areas, blocked teams, and financial risks

### 2. Project Admin / Project Manager
Primary need: manage project data and operational control.

Core capabilities:
- Create and maintain projects, areas, teams, and targets
- Review field reports and operational activity
- Track materials, equipment usage, billing, and cost entries
- Import source data from existing files and verify it before saving

### 3. Field Team Leader
Primary need: submit reliable work reports from site with minimal friction.

Core capabilities:
- Select project and work area
- Submit detailed field reports from mobile or desktop
- Record labor, materials, equipment, issues, and photos
- Update progress without seeing unrelated financial controls

## MVP Scope
The first release includes four product areas.

### Executive Dashboard
The landing experience for executives. It shows:
- Progress vs target
- Installed/completed/pending work volume
- Billing submitted, pending receipt, and collected cash
- Cost accumulation and estimated gross profit
- Alerts for delayed areas, missing reports, and billing risk

### Project Operations
Used by admins and project managers to:
- Create projects
- Define areas by province, district, zone, or cluster
- Assign teams
- Set targets and track actual progress

### Field Reporting
Used by site leaders to submit detailed work logs containing:
- Work date and project area
- Team and manpower used
- Materials consumed
- Equipment used and hours/status
- Issues, notes, and photo evidence

### Finance and Billing Tracking
Used to capture the business side of execution:
- Cost entries
- Billing records and billing completeness
- Expected payment date vs received payment date
- Financial metrics that feed the dashboard

## Inputs and Data Entry
The system supports two input paths from day one:
- Direct entry in the application
- File-based import from existing Excel/PDF source material

Imported data must go through a review state before it becomes operational data. This avoids polluting the system with unverified documents or incorrect extracted values.

## Non-Goals for MVP
The first version will not include:
- Multi-company tenancy
- Formal approval workflows for expenses, billing, or procurement
- Offline-first field operation
- Deep automation from PDF without human review

## Core Data Model
The MVP is centered on eight core entities.

### Project
Stores project identity, customer, contract value, timeline, targets, and status.

### Project Area
Represents provinces, districts, zones, or clusters within a project for reporting and aggregation.

### Team
Stores team identity, team leader, crew size, and specialization.

### Field Report
Stores site activity by date, area, team, output, issues, notes, and attachments.

### Material Usage
Stores material lines tied to a field report, including quantity, unit, and estimated cost.

### Equipment Usage
Stores machine or equipment usage tied to a field report, including unit, duration, status, and notes.

### Billing Record
Stores work package, billed value, billing date, document completeness, expected payment date, and actual payment date.

### Cash Entry / Cost Entry
Stores financial inflows and outflows such as labor, material, transport, machinery, and other costs.

## Data Flow
1. Admin creates projects, project areas, teams, and baseline data.
2. Field team leader submits daily or periodic field reports.
3. The system updates progress, material consumption, and equipment usage from those reports.
4. Admin records cost entries and billing records.
5. The executive dashboard aggregates operational and financial signals into KPIs and alerts.

This design intentionally avoids duplicated entry. One field report should power multiple downstream views where possible.

## Key Screens
- Executive Dashboard
- Projects
- Project Areas
- Teams
- Field Reports
- Materials & Equipment
- Billing & Finance
- Uploads / Import Center

## UX Direction
- Web-based responsive application
- Desktop-friendly for executives and admins
- Mobile-friendly for field reporting from job sites
- Clear role-based navigation so each user sees only the tools relevant to their job

## Recommended Architecture
A single web application with shared authentication and role-based access.

### Frontend
- Responsive web app optimized for both mobile and desktop
- Strong information hierarchy for dashboard and operational workflows

### Backend
- Central API layer for projects, field reports, resources, billing, and imports

### Database
- Relational database for transactional and reporting data

### File Storage
- Dedicated file storage for photos, invoices, and supporting documents

### Import Layer
- Review-and-confirm pipeline for uploaded spreadsheets and PDFs

### Dashboard Aggregation
- KPI calculation layer for fast executive summaries and risk signals

## Recommended Tech Stack
- `Next.js` for the application shell and API routes/server actions
- `PostgreSQL` for the main relational database
- `Prisma` for schema management and data access
- `NextAuth` or equivalent for authentication and role handling
- Object storage for images and uploaded documents

This stack is well-suited to an MVP that needs rapid delivery now and clean expansion later.

## Module Breakdown
- Auth & Roles
- Projects & Areas
- Teams
- Field Reports
- Materials & Equipment
- Billing & Finance
- Import Center
- Executive Dashboard

## Error Handling and Data Safety
- Required operational fields must be validated before saving a field report
- Uploads must move through explicit states: pending extraction, needs review, imported
- Dashboard financial values must clearly separate estimated values from actual values
- Users should receive plain-language validation and failure feedback

## Testing Strategy
- Role-based access tests for executive, admin, and field leader experiences
- End-to-end happy path: create project -> submit field report -> record cost/billing -> view dashboard
- Import workflow tests for spreadsheet/PDF review and confirmation
- Responsive checks for dashboard and field reporting on mobile and desktop

## Suggested Delivery Approach
Recommended path: start with the Executive Dashboard as the visible product center, then implement the three upstream modules that feed it:
- Projects
- Field Reports
- Finance/Billing

This approach matches the desired MVP outcome: fast executive visibility without waiting for every subsystem to be fully mature.

## Future Expansion After MVP
Likely next steps after the first release:
- Approval workflows
- Multi-company support
- Deeper analytics and forecasting
- Procurement workflows
- Native mobile app if field volume grows enough to justify it
