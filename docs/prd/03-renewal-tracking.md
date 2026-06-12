# PRD: Renewal Date Tracking

## Status
Shipped — V1

## Problem
Users forget when subscriptions renew and get surprised by charges. A $49 charge on a random Tuesday is jarring when you forgot the trial ended. Without renewal visibility, the dashboard is reactive — it tells you what you're paying but not what's coming.

## Goal
Surface upcoming renewal dates on each tool card and flag tools renewing within 7 days, so users can decide to cancel before being charged.

## Success Metrics
- 50%+ of users set a renewal date on at least one tool during onboarding
- "Renewing Soon" stat pill viewed by 80%+ of sessions where tools are renewing within 7 days
- 10%+ click-through from amber renewal badge to mark-used or remove action

## User Stories
- As a user, I can set a renewal date when I add a subscription
- As a user, I see "Renews Jan 15" on each tool card so I know when I'll be charged
- As a user, I see a "Renewing Soon" count pill when any tool renews in the next 7 days
- As a user, renewal dates within 7 days appear in amber to catch my attention

## Functional Requirements

### Data Model
`renewsOn: string | null` added to `UserSubscription` (ISO 8601 date string, date only — no time component needed).

### Storage Migration
When loading `OrbitData`, any subscriptions missing `renewsOn` receive `null` via the migration function in `storage.ts`. No user data is lost on upgrade.

### Renewal Date Input
- Optional field in Onboarding step 3 (pricing review) — date picker or text input accepting `YYYY-MM-DD`
- Optional field in the Add Tool modal on Dashboard
- Blank = `null`, not an error

### Tool Cards
- Show "Renews [Mon DD]" label when `renewsOn` is set
- Amber text when `renewsOn` is within 7 days of today
- No label if `renewsOn` is null

### Stat Pills
- "Renewing Soon" pill: count of tools where `renewsOn` is within 7 days
- Pill hidden when count = 0
- Amber styling when count > 0

### Threshold
7 days, hardcoded in V1.

## V1 Limitations
- No automatic detection of renewal dates — user must enter manually
- No push notifications or email reminders
- Date input is best-effort; no sync with billing system

## Out of Scope
- Automatic renewal detection (requires Plaid or email parsing)
- Cancellation links
- Renewal calendar view

## Open Questions
- Should expired renewals (past `renewsOn`) show a warning or be silently ignored?
- Should users be able to set recurring renewal date (e.g., "renews monthly on the 15th") vs. one-time?
