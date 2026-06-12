# PRD: Data Export (JSON / CSV)

## Status
Shipped — V1

## Problem
localStorage is invisible and fragile. Users can't back up their subscription data, move it to another browser, or open it in a spreadsheet. If they clear browser data, everything is gone.

## Goal
Let users export their full subscription list as JSON (for backup/import) or CSV (for spreadsheet analysis), with one click.

## Success Metrics
- 20%+ of users with 3+ tools export at least once
- Zero data loss reports attributable to missing export

## User Stories
- As a user, I can export my subscription data as JSON to back it up
- As a user, I can export my subscription data as CSV to open in Excel or Sheets

## Functional Requirements

### Export Formats

**JSON**: Full `OrbitData` object, pretty-printed. Filename: `orbit-export-YYYY-MM-DD.json`.

**CSV**: Tabular view of subscriptions only. Columns: Tool, Monthly Price, Yearly Price, Added At, Last Used, Renews On. Filename: `orbit-export-YYYY-MM-DD.csv`. Tool name resolved from `AI_TOOLS` catalog + `customTools`; falls back to `toolId` if not found.

### Trigger
"Export ↓" dropdown button in Dashboard header. Clicking outside the dropdown closes it (via `fixed inset-0` overlay).

### Delivery
Browser file download via `Blob` + `URL.createObjectURL` + synthetic `<a>` click. No server required.

### CSV Escaping
All fields double-quoted; internal quotes escaped as `""`. Handles tool names with commas.

## V1 Limitations
- Export only — no import in V1
- No scheduled/automatic backup
- Custom tools exported by name; re-import requires matching `toolId`

## Out of Scope
- Import / restore from file
- Cloud backup (Google Drive, Dropbox)
- Selective export by date range or category

## Open Questions
- Should JSON export be importable in V2 (requires import flow + conflict resolution)?
- Should CSV include `goal` and `onboardingComplete` fields?
