# PRD: Idle Detection & Spend Awareness

## Status
Shipped — V1

## Problem
Users pay for AI tools they've stopped using. Without a visual signal, idle subscriptions are invisible until the credit card bill arrives. The "whoa" moment — "I haven't opened 4 of these in 30 days" — only happens if the app surfaces it.

## Goal
Flag tools unused for 30+ days and show wasted monthly cost so users take action (cancel or re-engage).

## Success Metrics
- Users with idle tools see the amber warning banner on first dashboard visit
- 20%+ of users who see idle banner remove at least one tool
- "Mark used" tap rate > 10% per session (proxy for engagement)

## User Stories
- As a user, I see which tools I haven't touched in 30+ days, highlighted in amber
- As a user, I see the total monthly cost of my idle tools so I know what I'm wasting
- As a user, I can tap "✓ Used Today" to reset the idle clock on a tool
- As a user, I see an amber warning banner when 2+ tools are idle

## Functional Requirements

### Idle Definition
A subscription is idle if:
- `lastUsed` is null (never marked), OR
- `lastUsed` is more than 30 days ago

Threshold: 30 days, hardcoded in V1.

### Dashboard Signals
- Idle tool cards: amber left border + amber background tint + "Idle" badge
- Idle stat pill: count turns amber when > 0, shows `$X/mo wasted` subtext
- Warning banner: appears when 2+ tools are idle — "You have X idle tools costing $XX/mo"

### Mark Used
- "✓ Used Today" button on every tool card
- Writes current ISO timestamp to `lastUsed` in localStorage
- Immediately removes idle styling on that card

### V1 Limitations
- Last used is manually updated only — accuracy depends on user engagement
- No automatic usage detection until V2 (Gmail) / V3 (Plaid)
- Users who forget to tap will see false idle signals

## Out of Scope
- Automatic usage detection
- Per-tool usage frequency charts
- Cancellation links or integrations

## Open Questions
- Should idle threshold be user-configurable (14 days vs 30 days)?
- Should there be a "snooze" option on the idle warning banner?
