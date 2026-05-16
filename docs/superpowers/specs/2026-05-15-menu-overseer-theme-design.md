# LifeOS — Menu Fix, Overseer Repair, and Light Theme

**Date:** 2026-05-15
**Status:** Draft for review

## Summary

Three independent changes to LifeOS:

1. **Fix the CircleMenu open-animation stutter on mobile** by removing per-item `backdrop-filter` on small screens.
2. **Restore the Overseer AI chat** by updating the deprecated Gemini model identifier and surfacing real API errors.
3. **Add a real theming system** with a second theme — a light theme using white background and vibrant orange (`#F97316`) accent — and a theme switcher in Settings.

Each change can ship independently; the theming change is the largest and touches the most files.

## 1. Menu open-animation stutter

### Problem

On mobile, when the user taps the trigger to open the CircleMenu, the six items stutter as they animate outward. Closing is smooth.

### Root cause

In `src/components/CircleMenu.jsx`, each `MenuItem` button has `backdrop-filter: blur(20px) saturate(180%)`. During open, all six items simultaneously animate `x`, `y`, `opacity`, and `scale` while the page-level dim/blur overlay (`backdrop-filter: blur(4px)` on the dimming layer) is also fading in. Mobile GPUs cannot composite 6 live backdrop-filter regions plus a full-screen backdrop-filter at 60fps. Close is smooth because by then the items are leaving — the items collapse downward without competing with a fresh overlay fade-in.

### Fix

Disable `backdrop-filter` on the per-item buttons when `IS_MOBILE` is true. Keep the dim/blur overlay (single layer, GPU-cheaper). The item background is already mostly opaque (`MUTED` rgba or the solid item color when active), so visual impact is minimal on mobile.

### Files

- `src/components/CircleMenu.jsx` — gate the `backdropFilter` and `WebkitBackdropFilter` inline styles on `MenuItem` behind `!IS_MOBILE`.

### Acceptance

- On a mobile viewport (≤380px), tapping the trigger shows items animating outward without stutter.
- On desktop, the existing glassmorphic blur on items is preserved.
- Closing animation is unchanged on both.

## 2. Overseer AI repair

### Problem

Sending a message in the Overseer chat shows the user-facing error: "Sorry, I'm having trouble connecting. Try again later." This message comes from the `catch` block in `askOverseer` (`src/App.jsx`), meaning the `fetch` is throwing.

### Root cause

The request uses `models/gemini-2.0-flash:generateContent`. This model identifier is no longer the current stable Gemini Flash model — current stable is `gemini-2.5-flash`. The endpoint shape and request body are still correct.

A secondary issue: when the API returns an error response body (non-2xx), the code throws a generic `HTTP error: <status>` instead of surfacing the real message. That's why this has been opaque to the user.

### Fix

In `src/App.jsx` `askOverseer`:

1. Change the model identifier from `gemini-2.0-flash` to `gemini-2.5-flash`.
2. Switch from `?key=` query auth to the preferred `x-goog-api-key` header.
3. On non-OK response, attempt to parse the response body and include the API's error message in the thrown error so it surfaces in the catch.
4. In the catch block, return a more specific message that includes the underlying error type (network vs API). Keep it user-facing — no stack traces.

No other code path changes. Retry-on-429 logic stays. System instruction and message-shape mapping stay.

### Files

- `src/App.jsx` — modify `askOverseer` function only (lines ~25–73).

### Acceptance

- Sending a message in the Overseer chat returns a real reply within a few seconds.
- If the API fails (e.g., bad key, quota), the chat shows a message that includes the actual reason, not just "having trouble connecting."

## 3. Theme system + light theme

### Problem

LifeOS has only one theme (dark). Colors are hardcoded across every component (`#080810`, `#F8FAFF`, `rgba(255,255,255,0.05)`, etc.). The README claims a light/dark toggle exists, but no light theme is implemented and there is no switcher.

### Design

**Token-based theming via CSS custom properties** applied to `:root`. Theme switch sets a new set of CSS variable values; every component reads those variables instead of literals.

#### Color tokens

Defined once in `src/theme/colors.js` for each theme and emitted as CSS variables by a small helper in `App.jsx` (effect hook that writes to `document.documentElement.style`).

| Token | Dark (current) | Light (new) |
|---|---|---|
| `--bg` | `#080810` | `#FAFAF7` |
| `--text` | `#F8FAFF` | `#1A1A1F` |
| `--text-muted` | `rgba(248,250,255,0.50)` | `rgba(26,26,31,0.55)` |
| `--text-faint` | `rgba(248,250,255,0.40)` | `rgba(26,26,31,0.45)` |
| `--card` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.70)` |
| `--card-mid` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.85)` |
| `--card-high` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.95)` |
| `--input` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.04)` |
| `--border` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.08)` |
| `--border-high` | `rgba(255,255,255,0.18)` | `rgba(0,0,0,0.14)` |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.4)` | `0 8px 32px rgba(0,0,0,0.08)` |
| `--accent-main` | `#7C6DFA` (purple) | `#F97316` (vibrant orange) |
| `--page-tint-main` | `rgba(124,109,250,0.06)` | `rgba(249,115,22,0.08)` |

**Page accent colors (per-section identity colors) remain identical across themes** so users still recognize: green = finances, red = sleep, amber = gym, cyan = brand, slate = settings. Only the "main"/home accent flips from purple → orange, since that is the brand-primary.

#### State + persistence

Add `theme: "dark" | "light"` to the root state in `src/hooks/useLifeOSState.js`, defaulting to `"dark"`. The existing `INITIAL_STATE`-merging pattern preserves backward compatibility for users with existing localStorage. Theme persists with the rest of state.

#### Switcher UI

New section in the Settings page, inserted **above the PROFILE card**:

```
APPEARANCE
[ Dark  ●]  [ Light ○]
   purple      orange
```

Two side-by-side cards. Selected card has the accent border + glow. Tapping switches theme instantly.

#### Files refactored (hardcoded → `var(--…)`)

- `src/App.jsx` — root container background, top bar styles, mini health strip, loading screen, SettingsPage (add Appearance section).
- `src/components/CircleMenu.jsx` — item muted background, item text color, item border, trigger shadow color references that depend on bg.
- `src/components/AnimatedBackground.jsx` — orb opacity multiplier per theme (lower in light theme).
- `src/components/MainPage.jsx`
- `src/components/FinancesPage.jsx`
- `src/components/BrandPage.jsx`
- `src/components/HealthPage.jsx`
- `src/components/GymPage.jsx`
- `src/components/GlassComponents.jsx`
- `src/components/UI.jsx`
- `src/theme/colors.js` — export `lightColors`; export `cssVarsForTheme(themeName)` returning a flat token→value object.
- `src/theme/index.js` — register `light` theme, export theme-aware helpers.
- `src/hooks/useLifeOSState.js` — add `theme` field.

#### AnimatedBackground in light mode

The colored orbs are currently rendered at moderate opacity over a near-black background. On white, the same orbs wash out and look muddy. The fix: emit `--orb-opacity` as part of the per-theme CSS variable set (`0.4` in dark, `0.15` in light) and have `AnimatedBackground.jsx` multiply each orb's opacity by `var(--orb-opacity)`. No prop drilling.

#### Hardcoded color sweep

Some hardcoded values appear hundreds of times across components (status colors `#F87171`, `#34D399`, etc.). **Scope decision:** status colors are intentionally shared across themes and stay hardcoded. Only **structural** colors (backgrounds, text, borders, glass surfaces, the main accent) become tokens. This keeps the diff focused.

### Acceptance

- Settings → Appearance shows two theme cards; tapping switches instantly across all pages.
- Light theme: white-ish background, dark text, orange used for the home/main accent (top bar workout label, trigger button when on Home, etc.).
- Status colors (red for danger, green for finance, etc.) look correct in both themes.
- AnimatedBackground orbs are visible but subtle in light mode, not washed-out or overwhelming.
- Theme choice survives a page reload.
- Existing user data unaffected by the new state field.

## Out of scope

- System preference detection (`prefers-color-scheme`) — could be a follow-up; not requested.
- Additional themes beyond dark and light orange.
- Refactoring status color literals into tokens.
- Animations on theme switch (instant swap is fine).
- Light-mode polish for content that wasn't asked about (e.g., chart colors inside FinancesPage if any need extra tuning) — handle case-by-case during implementation only if visibly broken.

## Implementation order

1. Menu fix (smallest, independent, low risk)
2. Overseer fix (small, independent, immediately testable)
3. Theme system (largest, touches many files) — best done after 1 and 2 are merged so the diff is isolated
