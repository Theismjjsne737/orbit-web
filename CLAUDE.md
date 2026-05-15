@AGENTS.md

# Orbit — Project Context

## What Is Orbit

Orbit is a centralized dashboard for people building with AI to see everything they're paying for, what they're actually using, and what to cut.

**The "whoa" moment:** User sees "$287/month across 9 AI tools — you haven't opened 4 of them in 30 days."

## Target User

People learning to build with AI — vibe coders, aspiring developers, non-technical professionals who've accumulated AI subscriptions and have no idea what they're spending.

## V1 Scope

- Manual subscription entry (pre-populated list of top 30 AI tools)
- Dashboard: total monthly spend, tool cards, renewal dates, idle flags
- Simple action recommendations (unused tools flagged for cancellation)
- Shareable "My AI Stack" summary card
- No auth required — store in localStorage

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- localStorage for V1 data persistence (no backend yet)

## Build Sequence

- V1: Manual entry + dashboard (current)
- V2: Gmail/email parsing for auto-detection
- V3: Plaid bank connection

## Design Docs

Full design docs at: ~/.gstack/projects/orbit/ceo-plans/
- 2026-05-07-design-orbit.md — main product design
- 2026-05-07-design-ai-clarity.md — original recommender concept (integrated into Orbit recommendations layer)
