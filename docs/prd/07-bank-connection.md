# PRD: Bank Connection (Plaid)

## Status
Planned — V3

## Problem
Gmail parsing catches subscription receipts, but misses tools billed without email confirmations, tools using a work email, and edge cases like trials that became paid. Bank statements are the ground truth for what you're actually paying.

## Goal
Connect a bank account or credit card via Plaid to automatically detect and reconcile all AI subscription charges, with zero manual input.

## Success Metrics
- 40%+ of users who connect a bank account have all their AI subscriptions detected automatically
- <2% false positive rate (non-AI transactions flagged as AI subscriptions)
- Connected users have 30% higher tool count than non-connected users (proxy for completeness)

## User Stories
- As a user, I can connect my bank or credit card to auto-detect all AI subscription charges
- As a user, I see recurring charges automatically matched to known AI tools
- As a user, unrecognized recurring charges are surfaced for me to label
- As a user, I can disconnect my bank at any time and delete all transaction data

## Functional Requirements

### Plaid Integration
- Use Plaid Link for bank/card OAuth connection
- Scope: transaction read-only (no write access, no transfer capability)
- Pull last 90 days of transactions on initial connect; ongoing sync via webhooks

### Transaction Classification
- Match merchant names against known AI tool MCC codes and merchant strings
- Flag recurring charges (same merchant, similar amount, ~monthly interval)
- Confidence tiers: high (exact merchant match), medium (fuzzy match), low (recurring but unknown merchant)

### Review & Labeling
- High-confidence matches auto-add to dashboard (with user notification)
- Medium/low matches queued in review flow: user labels or dismisses
- Unknown recurring charges: user can name them as custom tools

### Data Security
- Plaid access token stored server-side only (never in localStorage or client)
- Transaction data encrypted at rest
- User can delete all bank data; triggers Plaid access token revocation

### Reconciliation
- Compares Plaid-detected prices against manually entered prices; flags mismatches
- "Your actual charge is $X, you entered $Y — update?" prompt

## V1/V2 Limitations
- V1: no bank connection (localStorage only)
- V2: Gmail parsing (no bank)
- V3: Plaid — requires backend, secure token storage, Plaid account/API keys

## Out of Scope
- Non-US bank connections in V3 (international Plaid support is a separate effort)
- Budget alerts or spending limits
- Transaction history / spend trends beyond current month

## Open Questions
- Plaid vs. competitors (Finicity, MX, Teller)?
- Should Plaid replace Gmail detection or complement it?
- How to handle shared accounts / business cards with non-AI charges?
- Liability posture for handling bank credentials (even via Plaid OAuth)?
