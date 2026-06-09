# First-Run Tour + Signed-Out Feature Gating — Design

**Date:** 2026-06-08
**Status:** Approved
**Area:** LifeOS · App shell, MainPage, FinancesPage, Settings, global styles

## Summary

Two complementary additions to the signed-out / first-run experience:

- **Part A — Signed-out gating.** Four features become sign-in-gated, shown to
  signed-out users as a blurred "locked preview" with a *Sign in to unlock* CTA:
  Overseer AI, Week in Review, Savings Goals, and the 6-month Income vs Expense chart.
- **Part B — First-run guided tour.** A clean, mobile-friendly walkthrough that
  navigates a first-time user through every section, glowing each section's hero and
  explaining it in a bottom card.

The two pair up: an anonymous user's tour walks past the locked previews, each one
nudging sign-in.

## Decisions (locked)

- **Gate style:** locked preview + CTA (blurred, non-interactive children + overlay).
- **Tour highlight:** soft glow attached to the element (CSS class, no coordinate
  math) + a fixed bottom explainer card. Deliberately NOT a measured spotlight —
  that is the jank-prone path on mobile and conflicts with the collapsing radial nav.
- **Tour trigger:**
  - Signed-in users: show **once**, gated by a synced `onboardingDone` flag.
  - Anonymous users: show on **every browser refresh** (no persistence); a per-mount
    flag stops it reopening until the next load.
  - Always starts after the existing intro splash (`showIntro`) finishes.
- **Sign-in destination:** Settings (Account & Sync lives there) via `setTab("settings")`.

## Architecture

```
App.jsx
 ├─ signedIn = auth.status === "signed-in"
 ├─ tour trigger (shouldStartTour helper) → tourOpen state
 ├─ <OnboardingTour open setTab signedIn onClose=endTour />
 ├─ <MainPage signedIn setTab … />        ← LockGate: WeeklyReview, Overseer
 ├─ <FinancesPage signedIn setTab … />    ← LockGate: 6-mo chart, Savings Goals
 └─ <SettingsPage onReplayTour=startTour … />
```

### Part A — `<LockGate>` (new: `src/components/LockGate.jsx`)

Reusable presentational wrapper. One purpose: gate a feature behind sign-in.

```
<LockGate signedIn title="Overseer AI" onSignIn={() => setTab("settings")}>
  …feature…
</LockGate>
```

- `signedIn === true` → renders `children` unchanged.
- `signedIn === false` → renders `children` inside a wrapper with
  `filter: blur`, reduced opacity, `inert` (no focus/interaction, `pointer-events:none`),
  `aria-hidden`, plus an absolutely-positioned centered overlay: 🔒 icon, `title`,
  and a *Sign in to unlock* button → `onSignIn`.
- No coordinate math; the overlay is `position:absolute; inset:0` over a
  `position:relative` wrapper.

Wrapped features (each is already a self-contained card):
- `MainPage`: `WeeklyReviewCard` (line ~93) and the Overseer `GlassCard` (line ~95).
- `FinancesPage`: "INCOME VS EXPENSE · LAST 6 MONTHS" card (line ~359) and
  "SAVINGS GOALS" card (line ~560).

Wiring: pass `signedIn` to `MainPage` (already has `setTab`); pass `signedIn` and
`setTab` to `FinancesPage` (currently receives only `state`/`setState`).

### Part B — First-run tour

**Trigger helper (pure, testable): `shouldStartTour({ signedIn, onboardingDone })`**
- signed-in → `!onboardingDone`
- anonymous → `true`

**App.jsx state + effect:**
- `INITIAL_STATE.onboardingDone = false` (synced like any field).
- `tourOpen` state; `tourDismissedThisMount` state (resets on refresh).
- Effect: when `isLoaded && !showIntro && !tourOpen && !tourDismissedThisMount`,
  if `shouldStartTour(...)` → `setTourOpen(true)`.
- `endTour()`: close, set `tourDismissedThisMount = true`; if `signedIn`,
  `setState(p => ({ ...p, onboardingDone: true }))`.
- `startTour()` (replay): `setTourDismissedThisMount(false); setTourOpen(true)`.

**`<OnboardingTour open onClose setTab signedIn>` (new: `src/components/OnboardingTour.jsx`)**
- Owns `stepIndex` (clamped via pure `clampStep`).
- Driven by `tourSteps` config (in the same file or `src/content/tourSteps.js`):
  `{ tab, target, title, body }`. Steps:
  1. Welcome (tab "main", no target, centered)
  2. Home (`[data-tour="home"]`)
  3. Sleep (`[data-tour="sleep"]`)
  4. Finances (`[data-tour="finances"]`)
  5. Habits (`[data-tour="habits"]`)
  6. Gym (`[data-tour="gym"]`)
  7. Friends (`[data-tour="friends"]`)
  8. Settings (`[data-tour="settings"]`)
  9. All set (no target, centered)
- On each step: `setTab(step.tab)`; after a ~200ms render delay, `querySelector`
  the target, remove `.tour-highlight` from the previous element, add it to the new
  one, `scrollIntoView({ block: "center", behavior: "smooth" })` once. Missing
  target → skip the glow, still show the card.
- UI: fixed **bottom-sheet** card (safe-area inset padding, max-width ~440px,
  ≥44px Back/Next tap targets, progress dots, × Skip) over a light `.tour-scrim`.
  Backdrop tap does NOT close (avoids accidental dismiss); only Skip/Finish closes.
- Cleanup on close/unmount removes any lingering `.tour-highlight`.

**Anchors:** add `data-tour="…"` to each page's hero/top card: home (HeroSection
wrapper), sleep, finances (ALL TIME card), habits, gym, friends (PageHeader card),
settings (top card).

**CSS (`src/styles/responsive.css`):**
- `.tour-highlight` — pulsing ring via `box-shadow` + `@keyframes`; rounded to match
  cards; `prefers-reduced-motion` → static ring (no pulse).
- `.tour-scrim` — fixed full-screen subtle dim, below the card, above content.

**Replay:** a "Replay tour" row in `SettingsPage` → `onReplayTour` prop = `startTour`.

## Error handling / edge cases

- Tour never overlaps the intro (gated on `!showIntro`).
- Target element absent for a step → glow skipped, card still shows; no crash.
- Locked preview with no data (brand-new user) still renders its frame; the overlay
  carries the message.
- Anonymous → sign-in mid-session: intro replays (existing behavior); afterward the
  signed-in tour shows once and sets `onboardingDone`.
- `inert` unsupported on an old browser → fall back to `pointer-events:none` +
  `tabIndex=-1` + `aria-hidden` (already applied alongside `inert`).
- Reduced motion respected for both the glow and any card transitions.

## Testing

- **Unit (TDD):**
  - `shouldStartTour` — signed-in+done=false, signed-in+notdone=true, anon=true.
  - `clampStep(i, len)` — clamps below 0 and at/above length-1.
- **Build:** production build compiles with the new components/imports.
- **Browser (dev server):** boot with 0 console errors; run the tour end-to-end
  (Next through all 9 steps, Back, Skip); confirm each section navigates, the glow
  appears and follows the element, the card stays put, and locked previews render
  for a signed-out session.

## Out of scope (YAGNI)

- Per-step custom positioning of the card (always bottom sheet).
- Spotlight cut-outs / arrow tooltips.
- Tour analytics / completion tracking beyond the `onboardingDone` flag.
- Gating any features beyond the four specified.
