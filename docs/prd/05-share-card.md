# PRD: Share Card — "My AI Stack"

## Status
Planned — Post-V1

## Problem
AI power users want to show off their stack. "What tools do you use?" is one of the most common questions in build-in-public communities. There's no easy way to share a curated, visual summary — people resort to screenshots or manual lists.

## Goal
Generate a shareable public URL showing a user's AI stack: tools, total monthly spend, and a "powered by Orbit" footer.

## Success Metrics
- 15%+ of users with 3+ tools generate a share card
- 30%+ of share card views result in the viewer starting their own Orbit onboarding
- Share card is the top acquisition channel within 30 days of launch

## User Stories
- As a user, I can generate a public link to my AI stack with one click
- As a user, I can control which tools appear on my share card (show/hide individual tools)
- As a user, I can see how many times my share card has been viewed
- As a viewer, I see a clean visual card of someone's stack and can click "Build mine" to start Orbit

## Functional Requirements

### Share Card Generation
- User clicks "Share My Stack" on Dashboard
- App calls `POST /api/share` with selected subscription data
- Server generates a unique slug (e.g., `orbit.so/stack/abc123`)
- Returns public URL; user copies or shares directly

### Share Card Page (`/stack/[slug]`)
- Shows: user's display name or "An Orbit user", tool list with icons and prices (optional: price hidden toggle), total monthly spend, "Renewing soon" count if relevant
- "Build mine →" CTA links to Orbit onboarding
- No auth required to view

### Privacy Controls
- Per-tool visibility toggle: user can hide specific tools from public card
- Price visibility toggle: show/hide dollar amounts
- Card expiry: optional — auto-expire after 30 days or keep forever

### Backend Requirements
- Requires a minimal backend (Vercel serverless function + database)
- Store: slug, subset of subscription data (no `lastUsed` — private), created_at, view_count
- No PII stored beyond what user explicitly shares

## V1 Limitations
- V1 is localStorage-only — no backend, so share card ships post-V1
- Requires auth to associate card with returning user

## Out of Scope
- OG image generation (nice-to-have, V2)
- Analytics beyond view count
- Embed widget

## Open Questions
- Should price be shown by default or hidden by default?
- Should the share card update live (reflects current stack) or be a snapshot at time of generation?
- What's the right slug format — random short ID vs. username-based vanity URL?
