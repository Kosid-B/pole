# Project Management SaaS Law of UX Design

## Goal

Define the UX/UI direction for the project management SaaS so the product feels
like a trustworthy control center for field operations while remaining clear
enough for executives and fast enough for field leaders.

## Product posture

The product should feel like an operations hub with executive summary, not a
generic admin panel and not a purely executive-only dashboard. It must balance
three user groups:

- Executives who need fast portfolio visibility and risk signals
- Admins / project managers who need dense operational access
- Field leaders who need fast daily reporting on mobile

The experience should be role-aware, but the system should still share one
cohesive design language across all roles.

## Chosen UX direction

The agreed product direction is:

- Balanced across roles, with dashboard as the hero
- Visual tone: Industrial Control + Modern Utility
- Primary color family: Navy + Cyan
- Primary homepage model: Operations hub with executive summary

This means the dashboard is still the product centerpiece, but the first screen
must lead users from summary into action instead of stopping at high-level
numbers.

## Law of UX principles

The following Laws of UX are first-class design constraints for the system.

### Hick's Law

Users make slower decisions when shown too many options. The product should:

- Show shorter role-based navigation
- Keep primary actions obvious
- Avoid showing irrelevant modules to a role
- Keep mobile reporting screens especially narrow in choice

### Jakob's Law

Users expect familiar interaction patterns. The product should:

- Use recognizable side navigation, dashboard cards, tables, filters, forms,
  and status badges
- Avoid surprising layouts that increase learning time
- Keep command surfaces predictable across modules

### Fitts's Law

Important targets must be easy to hit. The product should:

- Use large primary buttons for field workflows
- Place critical mobile actions in thumb-friendly positions
- Avoid tiny status toggles or cramped action clusters

### Miller's Law

People can only comfortably process a limited amount of grouped information.
The product should:

- Group dashboard information into a few stable sections
- Keep cards and panels focused on one job
- Prevent the homepage from becoming a wall of unstructured metrics

### Aesthetic-Usability Effect

Users trust beautiful products more readily. The product should:

- Look deliberate and premium enough for executives
- Maintain visual order under dense operational data
- Use hierarchy and spacing to make complexity feel manageable

### Tesler's Law

Complexity cannot be removed, only shifted. The system should carry complexity
for the user by:

- Pre-filling likely values
- Favoring master-data selection over free text where possible
- Standardizing statuses, units, and equipment options

### Peak-End Rule

Users remember the strongest moment and the ending. The product should:

- End important flows with clear success states
- Show obvious outcomes after save, import, or submission
- Make completion feel certain and trustworthy

## Information architecture

### Shared module map

The first release should keep the product centered around these modules:

- Dashboard
- Projects
- Field Reports
- Finance
- Imports
- Teams

Each module should answer a single dominant question:

- Dashboard: what is happening now
- Projects: what is the status of each project
- Field Reports: what happened in the field today
- Finance: where are cost, billing, and cash status
- Imports: which uploaded files need review
- Teams: which teams are responsible for what

### Role-based emphasis

#### Executive

Executives should land on a command-center summary emphasizing:

- Progress
- Financial position
- Risk and delay signals
- Billing and collection status

Executives should be able to drill in, but not be forced into detail-first
interfaces.

#### Admin / project manager

Admins should see summary on top, then task-heavy operational surfaces:

- Active projects
- Recent field reports
- Incomplete document work
- Import review queue
- Cost and billing items needing action

#### Field leader

Field leaders should see the lightest possible work surface:

- Create today's field report
- View latest reports
- See their team context
- Select common equipment quickly
- Resolve incomplete submission tasks

## Homepage structure

### Dashboard pattern

The homepage should follow this sequence:

1. High-value KPI strip
2. Progress and finance summary block
3. Risk and delay signals
4. Operational follow-through sections

This keeps the page aligned with executive needs while still helping admins and
operators move directly into work.

### KPI strip

The top KPI row should prioritize:

- Project progress
- Financial position
- Billing / collections
- Risk signal count

Each KPI card should include:

- Label
- Primary value
- Supporting detail

### Secondary blocks

Below the KPI row, the dashboard should organize into:

- Portfolio progress
- Financial position
- Risk and delay signals
- Project health table

These sections should remain stable over time so users learn the page quickly.

## Visual system

### Color direction

The product should use a Navy + Cyan base with industrial depth and restrained
alert colors.

- Background: deep navy, not pure black
- Surface: layered blue-slate tones
- Accent: cyan for active controls and key numbers
- Warning: amber or yellow
- Critical: red
- Healthy: green

Accent color should guide attention, not dominate entire screens.

### Typography

Typography should support a control-room feeling:

- Headings: firm, high-confidence, compact
- Body: readable and neutral
- KPI values: strongest text on the page
- Metadata: quieter, but still legible

### Surfaces and cards

The interface should use clear layered surfaces:

- Cards separated from background through contrast, not loud decoration
- Rounded corners that feel modern but not playful
- Table regions flatter than KPI cards to reduce noise

### Status language

Status should never rely on color alone. Every state should use:

- Text label
- Color cue
- Consistent badge format

### Motion

Motion should be minimal and meaningful:

- Soft loading transitions
- Clear success feedback
- No decorative animations that slow task completion

## Mobile behavior

Mobile is mandatory for field workflows. The mobile design should:

- Collapse dashboard blocks into readable vertical stacks
- Keep primary actions large and easy to tap
- Break long forms into clear sections
- Avoid wide tables as the default mobile pattern

Field reporting should feel fast, not fragile.

## Equipment UX for current scope

The current production bootstrap scope for equipment should intentionally stay
narrow. Only two equipment master items are needed initially:

- DRILL — machine drill
- GENSET — generator

The product should support selecting these from structured master data rather
than relying on repeated free-text entry when the supporting schema and UI are
implemented.

## Design implications for future implementation

The design direction implies the following next-step product work:

- Role-aware navigation refinement
- Dashboard layout tuned around summary-to-action flow
- Mobile-first field reporting form polish
- Master-data driven input for equipment and units
- Strong confirmation and status feedback for save/import flows

## Success criteria

The UX/UI direction is successful if:

- Executives can understand project health within seconds
- Admins can identify blocked work without scanning the whole product
- Field leaders can submit a report quickly on mobile
- The system feels operationally serious without becoming visually harsh
- Shared patterns reduce training time across roles
