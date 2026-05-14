# LifeOS Mobile Responsive Polish — Design Spec

**Date:** 2026-05-14
**Status:** Approved (pending user spec review)
**Scope:** Mobile-only polish. Desktop appearance is **explicitly preserved unchanged**.

## Goal

Make LifeOS look intentional and polished on mobile devices in the 360px–480px width range, with iPhone 14 standard (390px) as the primary target. Fix overflow, cramped layouts, and font sizing without altering the desktop appearance at all.

## Non-goals

- Desktop layout changes (current desktop appearance is preserved exactly)
- Tablet-specific layouts (768px+)
- Component redesigns, new components, or visual identity changes
- Font system or color/theme changes
- Animation changes
- Adding a test suite

## Constraint that shapes the design

The codebase uses **inline styles throughout** (no Tailwind, no CSS modules). Inline styles cannot use `@media` queries directly. Any responsive solution must bridge this gap.

## Architecture

### One new file: `src/styles/responsive.css`

A single stylesheet imported once from `src/main.jsx`. All responsive overrides live here, scoped exclusively under `@media (max-width: 480px)` and `@media (max-width: 375px)` so desktop styles (>480px) are physically untouched.

### Breakpoints used

Each fix targets the smallest breakpoint at which the problem manifests, not a fixed tier system.

| Breakpoint | Used by | Rationale |
| --- | --- | --- |
| `≤375px` | Fix #3 (gym day selector) | Tightest layout — iPhone SE |
| `≤380px` | Fixes #7, #10 (top pill truncation, CircleMenu shrink) | Below iPhone 13 mini width |
| `≤400px` | Fixes #1, #4, #5, #6 (hero grid, exercise form, stat row, chart labels) | Where most multi-column rows start to overflow |
| `>480px` | (nothing) | **Zero changes** — desktop preserved |

### Hybrid technique: CSS classes + `clamp()`

- **CSS classes with `!important`** are used for *structural* fixes that change layout (4-col → 2-col grid, form stacking). `!important` is required because they need to override inline styles, and that's the standard pattern for this case.
- **CSS `clamp(min, preferred, max)` inside inline styles** is used for fluid sizing (font sizes, padding) where no breakpoint is needed — just smooth scaling.

### Global safety net (top of `responsive.css`)

```css
html, body { overflow-x: hidden; }
main * { max-width: 100%; }  /* prevent any descendant of <main> from overflowing */
```

Scoped to `main *` (not bare `*`) so it does not interfere with the absolutely-positioned `CircleMenu` items, which need to overflow their container by design.

## The 10 fixes

Each fix lists the JSX file to edit, what changes, and the corresponding CSS rule (if any).

### 1. Hero metric grid: 4-col → 2×2 below 400px

**File:** `src/components/GlassComponents.jsx` (`HeroSection`)
**JSX change:** Add `className="hero-metrics"` to the metric grid `<div>`.
**CSS:**
```css
@media (max-width: 400px) {
  .hero-metrics { grid-template-columns: 1fr 1fr !important; }
}
```

### 2. Hero greeting font scales fluidly

**File:** `src/components/GlassComponents.jsx` (`HeroSection`)
**Inline-style change:** Greeting `fontSize: "24px"` → `fontSize: "clamp(18px, 5.5vw, 24px)"`.
**No CSS rule needed.**

### 3. Gym day selector tightens at ≤375px

**File:** `src/components/GymPage.jsx`
**JSX change:** Add `className="gym-days"` to the day-selector container (currently the `display:flex` row of 7 day buttons).
**CSS:**
```css
@media (max-width: 375px) {
  .gym-days button {
    padding: 8px 0 !important;
    font-size: 10px !important;
  }
}
```

### 4. Add-Exercise form stacks at ≤400px

**File:** `src/components/GymPage.jsx`
**JSX change:** Wrap the Weight/Sets/Reps `<div style={{display:"flex"}}>` with `className="exercise-form-row"`. Wrap the inner Sets+Reps pair inside their own `className="exercise-form-small-row"` div so they can stay paired even when Weight stacks above them.
**CSS:**
```css
@media (max-width: 400px) {
  .exercise-form-row { flex-direction: column !important; }
  .exercise-form-row > * { flex: 1 1 auto !important; }
}
```
(Sets+Reps natural flex pairing remains since they share `.exercise-form-small-row`.)

### 5. Finances Income/Expense/Net stat row compresses

**File:** `src/components/FinancesPage.jsx`
**JSX change:** Add `className="stat-row"` to the 3-stat container; add `className="stat-val"` to each value `<div>` inside.
**CSS:**
```css
@media (max-width: 400px) {
  .stat-row > div { padding: 10px 8px !important; }
  .stat-row .stat-val { font-size: 14px !important; }
}
```

### 6. Finances chart x-axis labels shrink at ≤400px

**File:** `src/components/FinancesPage.jsx`
**JSX change:** Add `className="chart-label"` to each month label `<div>`.
**CSS:**
```css
@media (max-width: 400px) {
  .chart-label { font-size: 9px !important; }
}
```

### 7. Top floating pill workout name truncates

**File:** `src/App.jsx`
**JSX change:** Add `className="pill-workout"` to the workout-name `<span>` in the top sticky pill.
**CSS:**
```css
@media (max-width: 380px) {
  .pill-workout {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: bottom;
  }
}
```

### 8. Health metric strip gets an edge fade hint

**File:** `src/App.jsx`
**JSX change:** Wrap the horizontally-scrolling health metric overlay in a parent `className="health-strip"` div (the inner scroller keeps `overflow-x: auto`).
**CSS:**
```css
.health-strip {
  position: relative;
}
.health-strip::after {
  content: "";
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 24px;
  background: linear-gradient(to left, #080810, transparent);
  pointer-events: none;
}
```

### 9. Outer page padding scales fluidly

**Files:** `src/components/MainPage.jsx`, `FinancesPage.jsx`, `HealthPage.jsx`, `GymPage.jsx`, plus the Settings page inline in `App.jsx`.
**Inline-style change:** Each page's root `<div style={{padding:"0 20px"}}>` → `padding: "0 clamp(14px, 4.5vw, 20px)"`.
**No CSS rule needed.**

### 10. CircleMenu container shrinks below 380px

**File:** `src/components/CircleMenu.jsx`
**Code change:** Replace the hardcoded `containerSize: 220` in `CONSTANTS` with a computed value:
```js
const containerSize = typeof window !== "undefined" && window.matchMedia("(max-width: 380px)").matches ? 200 : 220;
```
Read once at module load (no listener). Acceptable limitation: resizing past 380px during a live session does not update the container size. Refresh applies the new value.

## Files touched

- **New:** `src/styles/responsive.css`
- **Modified:** `src/main.jsx` (one import line)
- **Modified:** `src/App.jsx` (2 className additions: `.pill-workout`, `.health-strip` wrapper, plus 1 inline-style change for Settings padding)
- **Modified:** `src/components/GlassComponents.jsx` (1 className + 1 inline `clamp()`)
- **Modified:** `src/components/MainPage.jsx` (1 inline-style change for padding)
- **Modified:** `src/components/FinancesPage.jsx` (3 className additions + 1 inline-style change for padding)
- **Modified:** `src/components/HealthPage.jsx` (1 inline-style change for padding)
- **Modified:** `src/components/GymPage.jsx` (2 className additions, possible small JSX wrapper, 1 inline-style change for padding)
- **Modified:** `src/components/CircleMenu.jsx` (computed `containerSize`)

Approximate diff size: ~80 lines of new CSS, ~25 lines of JSX/JS edits.

## Verification

### Manual browser test (required before claiming done)

1. Run `npm run dev`, open Chrome DevTools, toggle device toolbar.
2. Test at four widths: **360px**, **375px**, **390px**, **480px**. Visit each of the 6 pages: Main, Finances, Health, Gym, Settings.
3. Slow-resize from 320px → 1440px. Watch for any horizontal scrollbar appearing, any element jumping outside its container, any text getting awkwardly truncated.
4. At ≥768px (desktop), confirm appearance matches the current state exactly — nothing should change.

### Specific pass criteria

- No horizontal page scroll at any width ≥ 320px.
- Hero 4 metrics show as 2×2 below 400px, 4-across above.
- Gym day selector (7 buttons) fits without overflow at 360px.
- Add Exercise form stacks correctly at 360px (Weight on top, Sets+Reps in row below).
- Finances Income/Expense/Net row does not overflow with values up to "$99,999".
- CircleMenu remains functional and visually centered at all widths.
- Modals (skip-gym reason, missed-goal reason) center correctly at 360px.

### Not in scope for verification

- Automated tests. Codebase has no test suite; adding one is out of scope.
- Visual regression diffing.

## Risks & mitigations

1. **`!important` cascade pollution.** Future intent-to-override-on-mobile from JSX would be blocked.
   **Mitigation:** Each rule is tightly scoped (specific class names, not bare tags). Comments in `responsive.css` document the rationale for `!important`.

2. **`main *` max-width could affect children that need to overflow.** The CircleMenu is excluded by scoping the rule to `main *` (CircleMenu is a sibling of `<main>`, not a descendant).
   **Mitigation:** During verification, explicitly check CircleMenu's open/close at 360px. If broken, narrow the rule further.

3. **`CircleMenu containerSize` read once at module load.** Resizing past 380px mid-session does not update it.
   **Mitigation:** Acceptable — users rarely resize during a session. Documented as a known limitation.

## Rollback plan

Revert is purely cosmetic:
1. Delete `src/styles/responsive.css`.
2. Remove the import from `src/main.jsx`.
3. Remove the ~10 `className` attributes.
4. Revert the 5 `clamp()` swaps for padding and 1 for greeting font.
5. Revert the `CircleMenu` `containerSize` computation back to `220`.

No data migration. No state changes. No external dependencies.
