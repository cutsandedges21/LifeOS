# Friends: Finance Comparison + Sharing Controls — Design

**Date:** 2026-06-08
**Status:** Approved (pending spec review)
**Area:** LifeOS · Friends page, shared-stats pipeline, `profiles` table

## Summary

Two additions to the Friends feature:

1. **Finance comparison** — add a "Net today" stat to the friend compare dropdown so
   friends can compare how much money they made on a given day.
2. **Sharing controls** — a new section on the Friends page where the user toggles,
   per stat, what they share with friends. A toggled-off stat is genuinely withheld
   (never written to the database), not merely hidden in the UI.

This reverses the original explicit decision in `friends.js` ("Deliberately NO
finances") — intentionally, and mitigated by the per-stat sharing toggles. Finances
ship **on by default**; users can switch them off.

## Decisions (locked)

- **Finance metric:** `net_today` = (sum of today's income transactions) − (sum of
  today's expense transactions). One-off transactions only; recurring subscriptions
  are monthly commitments, not a daily event, so they are excluded. Value may be
  negative. Formatted with `fmt$` (e.g. `+$420`, `−$35`).
- **Finance default:** ON. New `sharePrefs.net_today` defaults to `true`.
- **Privacy model:** push-time withholding. A toggled-off stat is written as `NULL`
  to the user's `profiles` row, so friends cannot read it.
- **Hidden display:** a friend's toggled-off stat renders as `🔒 Hidden` in the
  compare row (row kept, excluded from win-highlighting), distinguishing "hidden"
  from a real value of `0`.

## Architecture

### Data flow (unchanged shape, extended)

```
local state ──computeSharedStats()──▶ full stats object (incl. net_today)
                                         │
                              applySharePrefs(stats, sharePrefs)   ← nulls off toggled keys
                                         │
                              upsertMyProfile() ──▶ profiles row (NULL where withheld)
                                         │
                     friend's app: fetchFriendData() ──▶ FriendCard compare dropdown
```

Your own compare column always shows your real local numbers (the toggle only
governs what *leaves* your device). The friend's column shows their `profiles`
values, with `NULL` → `🔒 Hidden`.

### Single source of truth: `SHAREABLE_STATS`

A new exported list in `src/utils/friends.js` is the one definition consumed by both
the compare rows and the toggle section, so they cannot drift:

```js
export const SHAREABLE_STATS = [
  { key: "current_streak", label: "Current streak", suffix: "d" },
  { key: "longest_streak", label: "Longest streak", suffix: "d" },
  { key: "habit_pct",      label: "Habits today",   suffix: "%" },
  { key: "todo_pct",       label: "To-do done",     suffix: "%" },
  { key: "gym_days_week",  label: "Gym (7d)",       suffix: "d" },
  { key: "avg_sleep",      label: "Avg sleep",      suffix: "h" },
  { key: "net_today",      label: "Net today",      money: true },
];
```

`money: true` stats format with `fmt$` instead of `value + suffix`.

## Components / changes

### 1. Database migration (`profiles`, project `xomxqoqcyxrilrhvpole`)

Applied via the Supabase MCP (`apply_migration`). The project is reachable via MCP.

```sql
alter table public.profiles
  add column if not exists net_today numeric;

alter table public.profiles alter column current_streak  drop not null;
alter table public.profiles alter column longest_streak  drop not null;
alter table public.profiles alter column habit_pct        drop not null;
alter table public.profiles alter column todo_pct         drop not null;
alter table public.profiles alter column gym_days_week    drop not null;
alter table public.profiles alter column avg_sleep        drop not null;
```

Columns keep their `default 0`; an explicit `NULL` on upsert overrides the default,
which is what withholding relies on. No RLS change — own-row upsert already works.

### 2. `src/utils/friends.js`

- Export `SHAREABLE_STATS` (above).
- `computeSharedStats(state)` gains `net_today` via a `netToday(state)` helper
  (income − expense over transactions where `date === todayISO()`).
- New `applySharePrefs(stats, prefs)` → returns a shallow copy where, for each
  `SHAREABLE_STATS` key, `prefs[key] === false` sets the value to `null`. Missing
  prefs default to shared (`true`) so older state shares everything as before.
- Update the module header comment (remove "Deliberately NO finances"; document the
  toggle-gated finance sharing and the NULL-means-withheld contract).

### 3. `src/hooks/useLifeOSState.js`

- Add `sharePrefs` to `INITIAL_STATE` with every `SHAREABLE_STATS` key `true`.
- On load, back-fill `sharePrefs` for existing users (merge defaults so a new key
  like `net_today` is present even if their stored state predates it).
- In the profile-sync effect, change the pushed stats to
  `applySharePrefs(computeSharedStats(state), state.sharePrefs)`.

### 4. `src/components/FriendsPage.jsx`

- Add `setState` to the component props.
- Compare dropdown: render rows by mapping `SHAREABLE_STATS` (replaces the six
  hand-written `CompareRow`s and adds `net_today`). `CompareRow` learns to:
  - format `money` stats with `fmt$`;
  - accept a `theirs === null` "hidden" state → render `🔒 Hidden` on their side and
    skip win-highlighting for that row.
- New `<ShareSettings>` section (a `GlassCard` titled "WHAT YOU SHARE") under the
  friends list: one `Toggle` per `SHAREABLE_STATS` entry bound to
  `state.sharePrefs[key]`, writing back via `setState`. Includes a one-line
  explanation that "Off" withholds the stat from all friends, plus a subtle
  "sensitive" hint on the finances row. Only rendered for signed-in users (it sits
  inside the signed-in return, after the friends list).

### 5. `src/App.jsx`

- Pass `setState={setState}` to `<FriendsPage>` (line ~883). It is currently the only
  page mounted without the setter.

## Error handling / edge cases

- **No transactions today:** `net_today` = `0` (a real shared value, not hidden).
- **All finances are expenses today:** `net_today` negative; `CompareRow` higher-is-
  better logic still applies (less negative / positive wins).
- **Friend on old client (no `net_today` column data):** their `net_today` is `NULL`
  → renders `🔒 Hidden`, same as an explicitly-withheld stat. Acceptable.
- **Stat genuinely 0 vs hidden:** `0` shows as `0`; only `NULL` shows `🔒 Hidden`.
  This is why columns must be nullable and why withholding writes `NULL`, not `0`.
- **Pref missing for a key:** treated as shared (`true`).

## Testing

- Unit: `netToday()` / `computeSharedStats().net_today` — income−expense, today-only
  filtering, negative result.
- Unit: `applySharePrefs()` — nulls keys whose pref is `false`, preserves keys whose
  pref is `true` or missing, does not mutate input.
- Manual (browser): toggle a stat off → confirm the pushed `profiles` row stores
  `NULL`; on a second account, confirm that stat shows `🔒 Hidden`. Toggle finances
  and confirm `net_today` appears/disappears in the compare dropdown.

## Out of scope (YAGNI)

- Per-friend (rather than global) sharing controls.
- Historical / multi-day finance charts in the friend view.
- Sharing absolute income or net worth (only daily net is shared).
