# PRD: Gmail Auto-Detection

## Status
Planned — V2

## Problem
Manual entry is the biggest friction point in V1. Users know what they use but not exact prices. They forget tools. The "whoa" moment loses impact when the list is incomplete because the user had to remember everything from scratch.

## Goal
Automatically detect AI subscriptions from Gmail receipts so the dashboard reflects reality, not memory.

## Success Metrics
- 60%+ of users who connect Gmail have at least one subscription auto-detected
- Auto-detected subscriptions have <5% price error rate vs. actual charge
- Gmail connection reduces time-to-full-dashboard from 5 min to <60 seconds

## User Stories
- As a user, I can connect my Gmail account to auto-import subscriptions
- As a user, auto-detected subscriptions show up with correct name, price, and renewal date
- As a user, I can review and confirm auto-detected tools before they're added
- As a user, I can disconnect Gmail at any time

## Functional Requirements

### Gmail OAuth
- Google OAuth scope: `gmail.readonly` (read-only, minimum necessary)
- User explicitly grants permission; shown in Google consent screen
- Access token stored securely; not in localStorage

### Receipt Parsing
- Search Gmail for subscription receipt patterns: "Your receipt", "Invoice", "Payment confirmation", "Subscription renewal"
- Target senders: known AI tool domains (OpenAI, Anthropic, Midjourney, etc.)
- Parse: tool name, amount, billing date, next renewal date
- Confidence score per match; surface low-confidence matches for user review

### Review Flow
- Detected subscriptions shown in a review modal before import
- User can: confirm (add to dashboard), edit price/date, or dismiss per item
- No auto-add without user confirmation

### Privacy
- Email content processed server-side; only parsed metadata (tool name, price, date) stored
- Raw email bodies never persisted
- User can revoke Gmail access and delete all parsed data

## V1 Limitations
- V1 has no Gmail integration — manual entry only
- Accuracy depends on sender domain recognition and receipt format consistency

## Out of Scope
- Non-Gmail providers (Outlook, Apple Mail) in V2
- Non-English receipts in V2
- Bank statement parsing (V3 — see 07-bank-connection.md)

## Open Questions
- Gmail API directly vs. email parsing service (e.g., Nylas)?
- How to handle annual billing receipts vs. monthly?
- On-demand scan vs. continuous background sync?
