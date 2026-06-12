# Orbit — V1 Polish Sprint Progress

## Status: Complete ✓

All 5 task groups from the polish plan executed and verified (`npm run build` passes clean).

---

## Task 1 — Sign-in Page Polish ✓

**File:** `app/components/SignIn.tsx`

- Hero tagline with `text-gradient-hero`: "Track every AI subscription. Cancel what you don't use."
- 3 emoji feature bullets above OAuth buttons (⚡ spend, 🎯 idle, 🔒 private)
- Both Google and Apple buttons use `btn-glow` styling
- Trust line: "No credit card required · Free forever for up to 4 tools"

---

## Task 2 — Onboarding Flow Polish ✓

**File:** `app/components/Onboarding.tsx`

- Goal cards: per-goal description lines, violet checkmark indicator on selected card
- Step 2 bottom bar: running dollar total (`$XX/mo selected`) alongside tool count
- Step 3: Pro upsell card with violet glow border for free users
- Step 3 CTA: "Start Tracking Free →" (free) / "Start Tracking →" (pro)
- B3 fix: custom tool form validates price ≥ 0, URL must start with `https://`, inline errors

---

## Task 3 — Dashboard Visual Polish ✓

**File:** `app/components/Dashboard.tsx`

- Spend hero `$XX/mo` uses `text-gradient-hero`, responsive size (`text-[60px] sm:text-[92px]`)
- Tool cards: letter-circle icon (8 consistent colors per tool name hash)
- "Last used" label: human-readable ("Used today", "Used 3 days ago", "Never used" in red)
- Stat pills: hover scale transform, Idle pill in amber when count > 0
- Empty state (0 subscriptions): 🛸 emoji + headline + "Add First Subscription" CTA
- "+ Add Subscription" button uses `btn-glow`

---

## Task 4 — Missing V1 Features ✓

**Files:** `app/lib/types.ts`, `app/lib/storage.ts`, `app/components/Dashboard.tsx`, `app/components/Onboarding.tsx`

### Feature A — Inline Price Editing
- Click price in tool card → `<input type="number">` with current value
- Blur or Enter → saves to localStorage, shows "Saved ✓" flash

### Feature B — Add Tool from Dashboard
- "+ Add Subscription" opens `AddToolModal` overlay
- Search, category filter pills, scrollable tool grid
- Free users at `FREE_LIMIT` see upgrade prompt instead of tool grid

### Feature C — Renewal Date Tracking
- `renewsOn: string | null` added to `UserSubscription` type
- `RenewalBadge` shows "Renews Jan 15" or "Renews in 3 days" (amber within 7 days)
- "Renewing Soon" stat pill appears when any tool renews within 7 days
- Storage migration: adds `renewsOn: null` to existing subscriptions on load
- Onboarding step 3 + add modal include optional renewal date input

### Bank / Manual Onboarding Split
- Onboarding step 1.5: choice between "Connect Bank" or "Add Manually"
- Manual path proceeds to tool picker; bank path shows coming-soon placeholder

---

## Task 5 — Bug Fixes ✓

**B1 — Sign-out data leak:** Verified `signOut()` only clears `USER_KEY`, not `orbit-data` — subscription data persists. No change needed.

**B2 — Empty state:** Added when `subscriptions.length === 0` — emoji, headline, CTA.

**B3 — Custom tool validation:** Price ≥ 0. URL must start with `https://`. Inline errors on submit.

**B4 — Upgrade flow return:** `r.ok` check before `r.json()` in `app/page.tsx`. Non-200 calls `refresh()` instead of crashing. Handles missing session_id, bad API response, missing user.

**B5 — Mobile layout (375px):**
- Hero spend: `text-[60px] sm:text-[92px]` (was fixed `text-[92px]`)
- Stat pills: `grid-cols-2 sm:grid-cols-3` / `grid-cols-2 sm:grid-cols-4`
- Header email: `hidden sm:block` — no overflow
- Tool cards: `flex-1 min-w-0` + `flex-wrap` on sublabel row — no overflow

---

## Build

```
✓ Compiled successfully
✓ TypeScript clean
✓ 6/6 static pages generated
```
