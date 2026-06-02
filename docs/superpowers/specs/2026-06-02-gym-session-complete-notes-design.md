# Gym Session — Per-Exercise Complete + Notes

Date: 2026-06-02
Status: Approved (Approach A)

## Goal

On the Gym page, let the user:

1. Tap an exercise to mark it **complete** (today's session only).
2. Attach an optional **note** to each exercise (today's session only).

When **all** of today's exercises are checked off, the gym visit auto-logs
(streak active). The manual "GYM HIT" button remains only as a fallback for
days with no exercises listed.

## Key constraint

`gymExercises[day]` is the **reusable weekly plan** (every Monday shows the
same Monday template). Completion + notes must NOT live on that object, or
next Monday would inherit last Monday's checkmarks and notes. They live in a
new **per-date** field that resets automatically each day — avoiding the
fragile daily-reset bug from commit `505c472`.

## Data model

New field in `INITIAL_STATE` (`src/hooks/useLifeOSState.js`):

```js
// Per-DATE checkoff + note state for the day's workout. Keyed by
// ISO date → exercise id → { done, note }. Separate from the gymExercises
// template so checks/notes reset each day. Pruned to a 14-day window.
gymSessionLog: {},
// e.g. { "2026-06-02": { "1715900000000": { done: true, note: "felt heavy" } } }
```

- Today's session = `gymExercises[getTodayDay()]`.
- Today's progress = `gymSessionLog[todayISO()]` (default `{}`).
- A fresh date key is empty → checks/notes reset for free.
- Pruned to the most recent 14 date-keys on every write.

`gymExerciseLog` (overload-trend snapshot) and `gymVisits` keep their shapes.
Auto-created visits are tagged `auto: true` so a manually logged visit is
never clobbered.

## Pure helpers (`src/utils/gymSession.js`)

Extracted so GymPage stays focused and the logic is unit-testable:

- `getSessionProgress(state, dateISO)` → `{ [exId]: { done, note } }`
- `isSessionComplete(exercises, progress)` → `boolean`
  (true only when `exercises.length > 0` and every exercise is `done`)
- `completedCount(exercises, progress)` → `number`
- `toggleDone(gymSessionLog, dateISO, exId)` → new `gymSessionLog`
- `setNote(gymSessionLog, dateISO, exId, note)` → new `gymSessionLog`
  (empty/whitespace note removes the note; empty entries are dropped)
- `cleanupExercise(gymSessionLog, dateISO, exId)` → new `gymSessionLog`
  (drops a deleted exercise's entry)
- `pruneSessionLog(gymSessionLog, keepDays = 14)` → new `gymSessionLog`
- `syncAutoVisit(state)` → new `state`: keeps `gymVisits` + `gymExerciseLog`
  in sync with today's completion (see below)

## `syncAutoVisit(state)` behavior

Pure `(state) => state`. Reads today's exercises + progress:

- **Exercises exist AND all checked** → ensure a `gymVisits` row for today
  exists (`{ id, date, auto: true }`); append today's snapshot to
  `gymExerciseLog` if none exists for today (deduped by date).
- **Otherwise** → remove today's `gymVisits` row **only if `auto`**; remove
  today's snapshot from `gymExerciseLog` if it was the auto one.

Downstream consumers need no changes — `computeStreak` (App.jsx), the
snapshot's `gymWent`, weekly review, and Overseer all read `gymVisits` and
recompute automatically.

`syncAutoVisit` is applied after every mutation that can change today's
completion: toggle done, add exercise, delete exercise.

## UI / interaction (GymPage)

Applies only when `selectedDay === getTodayDay()`. Other days render the
template exactly as today (no check circle, no note).

Per exercise row (`SwipeableExerciseRow`), swipe-to-edit/delete unchanged:

- **Check circle** on the left of the row content. Tap toggles done. Done =
  green check (`#34D399`), row tinted green + slightly dimmed. Distinct tap
  target, so no conflict with the horizontal drag gesture.
- **Note affordance** at the bottom of the row. Empty → muted `✎ note`
  button; tap expands a compact inline textarea (Save/Cancel, mirroring the
  edit-form expand). Present → shows `📝 {text}`, tap to edit. Saving empty
  removes the note.

SESSION `SectionHeader` shows `{n}/{total} DONE`, flipping to green
`✓ COMPLETE` at 100%.

## Bottom status block

- **Today has exercises:** the manual "GYM HIT TODAY" button is replaced by a
  progress strip — `{n}/{total} EXERCISES DONE · complete all to bank your
  streak` — flipping to the green `✓ GYM HIT TODAY · STREAK ACTIVE` at 100%.
  No separate UNDO: unchecking any exercise reverts the visit (copy hints
  this). The red **SKIP** button stays; checking all later overrides a skip.
- **Today has no exercises:** unchanged — existing manual HIT + SKIP buttons.

## Edge cases

- Delete a checked exercise → its session entry is cleaned; rollup recomputes.
- Add an exercise after completing → drops below 100% → `syncAutoVisit`
  clears the auto visit.
- Midnight rollover with app open → new empty date key → no visit (the
  existing streak/day-change effect handles recompute).
- Orphaned entries from removed exercise ids are ignored on read and dropped
  by the 14-day prune.

## Verification

No test runner is installed. Verify via:

1. `npm run build` — clean build.
2. Playwright walkthrough: add 2 exercises → check one (visit off) → check
   both (green HIT, streak +1, attendance bar fills) → uncheck one (reverts)
   → add a note, reload, confirm persistence → confirm a no-exercise day
   shows the manual button.

Pure helpers are written test-ready; a Vitest harness is out of scope unless
requested.
