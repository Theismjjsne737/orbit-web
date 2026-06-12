# PRD: Subscription Tracking (Core V1)

## Status
Shipped — V1

## Problem
AI power users accumulate subscriptions across many tools and have no single place to see total spend. The mental math is never done. $20 here, $49 there — the real number is invisible.

## Goal
Give users a dashboard that shows exactly what they're paying for AI tools, with zero setup friction.

## Target User
Vibe coders, AI power users, non-technical professionals who've accumulated 3–10 AI subscriptions.

## Success Metrics
- User sees total monthly spend within 60 seconds of signing up
- 50%+ of users add ≥ 3 tools during onboarding
- Return visit rate > 30% (users come back to update their stack)

## User Stories
- As a user, I can pick my goal so the app feels relevant to my use case
- As a user, I can select from a pre-populated list of 30+ AI tools so I don't have to type everything manually
- As a user, I can add a custom tool with name, URL, and price for tools not in the list
- As a user, I see my total monthly and yearly spend prominently on the dashboard
- As a user, I can edit the price of any subscription inline without leaving the dashboard

## Functional Requirements

### Onboarding
- 3-step flow: goal selection → tool picker → pricing review
- Pre-populated tool list with default prices (editable)
- Custom tool form: name (required), URL (https:// required), price ≥ 0
- Goal options: learn-to-code, build-a-product, get-promoted, automate-work, creative-projects, just-exploring

### Dashboard
- Hero: total monthly spend with animated count-up, gradient display
- Stat pills: Active tools, Idle tools, Yearly committed, Renewing Soon (if any)
- Tool cards: icon, name, price (click to edit inline), last-used label, renewal badge
- Empty state when 0 subscriptions tracked

### Data Model
```ts
interface UserSubscription {
  toolId: string;
  monthlyPrice: number;
  addedAt: string;      // ISO 8601
  lastUsed: string | null;
  renewsOn: string | null;
}
```

### Persistence
localStorage only in V1. No backend. Data survives page reload, not browser data clear.

## Free vs Pro
- Free: track up to 4 tools
- Pro ($9–10/mo): unlimited tools

## Out of Scope
- Auto-detection of subscriptions (V2/V3)
- Historical spend tracking
- Budget alerts

## Open Questions
- What is the right FREE_LIMIT? Currently 4 (arbitrary — needs validation with real user data)
