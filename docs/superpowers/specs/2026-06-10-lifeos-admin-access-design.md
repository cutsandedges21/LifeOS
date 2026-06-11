# LifeOS Admin Access — Design

**Date:** 2026-06-10
**Area:** LifeOS · new Admin monitoring page, presence heartbeat, owner-only nav entry
**Supabase project:** `xomxqoqcyxrilrhvpole`

## Goal

Give the single account `sportsdude3133@gmail.com` admin access. Admin access means a
new **Admin** page that monitors the app's users:

- who is online right now,
- when each user was last online,
- total number of users,
- plus each user's existing LifeOS stats (streak, habits %, gym days/week, avg sleep, net today).

The entry point to this page is a button rendered in the **free space in the middle of the
circle nav** — visible only when the menu is open, and **only for the admin account**.

## Hard requirement: owner-only visibility

The Admin page and its nav button MUST be invisible and inaccessible to every account
except `sportsdude3133@gmail.com`. This is enforced at three independent layers so that
forging the client-side check is not enough to see any other user's data:

1. **Nav button** — the center `centerItem` is passed to `CircleMenu` only when
   `isAdmin(auth.user)` is true. Non-admins never render it; it is never part of the arc.
2. **Page guard** — `tab === "admin"` renders `AdminPage` only under `isAdmin`. Any other
   account (or a stale tab value) falls back to the `main` page.
3. **Server RLS (authoritative)** — a new `SELECT` policy on `profiles` keyed on the admin
   email. Any non-admin JWT reading `profiles` still only matches the existing
   "read own profile" / "read connected profiles" policies, so a forged client gets **zero**
   foreign rows. The only profile write any user makes is to their **own** `last_seen_at`.

## Current state (verified)

- **Stack:** React 18 + Vite, Supabase JS for auth + cloud sync. No TypeScript.
- **Auth:** `useAuth()` exposes `{ user, session, status, ... }`; `user.email` is available.
- **`profiles` table** already exists and is upserted by `upsertMyProfile()` on sign-in and
  on every debounced sync. Columns: `user_id (uuid pk)`, `email`, `display_name`,
  `current_streak`, `longest_streak`, `habit_pct`, `todo_pct`, `gym_days_week`,
  `avg_sleep`, `net_today`, `stats_updated_at`, `created_at (not null)`, `updated_at (not null)`.
  **No presence/last-seen column exists.**
- **RLS on `profiles` today:**
  - `SELECT` "read own profile" → `auth.uid() = user_id`
  - `SELECT` "read connected profiles" → `are_connected(user_id)`
  - `INSERT` "insert own profile" → `auth.uid() = user_id`
  - `UPDATE` "update own profile" → `auth.uid() = user_id`
  No policy grants reading all rows.
- **Nav:** `CircleMenu` renders a fixed bottom-center trigger; on open, items fan out on an
  upward **semicircle arc**. The enclosed area above the trigger is empty — that is the
  "free space in the middle".
- **Tests:** plain `node --test` with `node:test` + `node:assert` on pure-logic modules
  (e.g. `src/utils/auth.test.js`). No vitest. No test script in `package.json`.
- **Users now:** 4 rows in `profiles`.

## Architecture

```
┌─────────────┐   heartbeat (own row)    ┌──────────────────────────┐
│ usePresence │ ───────────────────────▶ │ profiles.last_seen_at     │
│ (every 45s, │   UPDATE own profile      │ (one row per user)        │
│  tab visible)│  via "update own profile"└──────────────────────────┘
└─────────────┘                                       ▲
                                                      │ SELECT * (all rows)
┌─────────────┐   isAdmin(user)?                      │ allowed ONLY by
│  App.jsx     │ ── yes ──▶ CircleMenu centerItem ──┐  │ "read all profiles (admin)"
│              │            + tab "admin" enabled   │  │ RLS policy
└─────────────┘                                     ▼  │
                                          ┌──────────────────────────┐
                                          │ AdminPage                 │
                                          │  fetchAllUsers(supabase)  │
                                          │  summarize(users, now)    │
                                          │  poll every ~30s          │
                                          └──────────────────────────┘
```

## Components

### 1. `src/utils/admin.js` (new, pure)

```js
export const ADMIN_EMAIL = "sportsdude3133@gmail.com";
export const isAdmin = (user) =>
  !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
```

Single source of truth for the admin identity on the client. `isAdmin` is case-insensitive
and null-safe.

### 2. Database migration (Supabase MCP `apply_migration`, project `xomxqoqcyxrilrhvpole`)

Idempotent:

```sql
-- presence column + ordering index
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc);

-- admin can read every profile row (defense-in-depth; the authoritative gate)
drop policy if exists "read all profiles (admin)" on public.profiles;
create policy "read all profiles (admin)"
  on public.profiles for select
  using ( lower(auth.jwt() ->> 'email') = 'sportsdude3133@gmail.com' );
```

Notes:
- Existing self/friend SELECT policies are unchanged; the new policy is additive (Postgres
  RLS is permissive-OR by default), so it only *grants* the admin extra read scope.
- No write policy changes: users still update only their own row, which already covers the
  `last_seen_at` heartbeat.

### 3. `src/utils/presence.js` (new, pure helper + thin write)

```js
export const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 120s

export function isOnline(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return Number.isFinite(t) && now - t < ONLINE_WINDOW_MS;
}

export async function touchPresence(supabase, userId) {
  if (!supabase || !userId) return;
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userId);
}
```

`isOnline` is unit-tested. `touchPresence` updates the caller's own row only.

### 4. `src/hooks/usePresence.js` (new)

- Mounted once in `App.jsx`.
- When `auth.status === "signed-in"` and a user id exists: ping `touchPresence` on mount,
  on every `visibilitychange` that lands on `visible`, and on a **45s** interval while
  `document.visibilityState === "visible"`. No pings while hidden.
- Cleans up interval + listener on unmount / sign-out.
- This applies to **all** signed-in users (each writes only their own row) so the admin has
  fresh presence data to read.

### 5. `src/utils/adminUsers.js` (new, pure + thin query)

```js
export async function fetchAllUsers(supabase) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("last_seen_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export function summarize(users, now = Date.now()) {
  const DAY = 24 * 60 * 60 * 1000;
  let onlineNow = 0;
  let activeToday = 0;
  for (const u of users) {
    if (isOnline(u.last_seen_at, now)) onlineNow++;
    if (u.last_seen_at && now - new Date(u.last_seen_at).getTime() < DAY) activeToday++;
  }
  return { total: users.length, onlineNow, activeToday };
}
```

`summarize` is unit-tested. `fetchAllUsers` returns all rows for the admin (and only the
admin's own row for anyone else, by RLS — but the page never renders for non-admins).

### 6. `src/components/AdminPage.jsx` (new)

Props: `{ auth }` (needs the supabase client + current user).

Behavior:
- On mount and every **~30s**, call `fetchAllUsers` then `summarize`. Also a manual refresh
  control. Clean up the interval on unmount.
- States: loading skeleton (first load), error (with retry), empty ("no users yet").
- **Three stat cards:** Total Users · Online Now · Active Today.
- **User list**, sorted online-first then most-recent `last_seen_at`. Each row:
  - email (fallback `display_name`), with a subtle "you" tag on the admin's own row,
  - online dot (green) + `Online`, or grey dot + relative last-seen (`3m ago`, `2h ago`,
    `Never`),
  - signup date from `created_at`,
  - stat chips: streak 🔥 `current_streak`, habits `habit_pct`%, gym `gym_days_week`/wk,
    sleep `avg_sleep`h. Null stats render as `—`.
- Styling mirrors existing pages: glass cards, theme CSS vars (`var(--card)`, `var(--border)`,
  `var(--text)`, mono font), framer-motion entrance. Accent **gold** `#F5C451`.
- Relative-time formatting lives in a tiny local pure helper (or reuse an existing formatter
  if one fits) so it can be reasoned about without the component.

### 7. `src/components/CircleMenu.jsx` (modify)

- New optional prop `centerItem` (same shape as an arc item: `{ id, label, icon, color }`,
  plus it is treated specially).
- When `isOpen && centerItem`, render a button positioned in the **centroid of the free
  space** inside the open semicircle (horizontally centered on the trigger, vertically in the
  middle of the arc — roughly the existing items-anchor center, tuned so it sits clearly
  inside the empty area and clear of the arc items and the trigger).
- Visual: a glass disc, slightly distinct from arc items (gold border/glow), with a hover
  label like the arc items. Animates in/out with the open state (fade + slight scale).
- Click → `onSelect(centerItem.id)` and close the menu (same path as `handleSelect`).
- When `centerItem` is absent (every non-admin), nothing extra renders — zero behavioral or
  visual change for existing users.

### 8. `src/App.jsx` (modify)

- Import `isAdmin` and `AdminPage`; mount `usePresence(auth)`.
- Compute `const admin = isAdmin(auth.user)`.
- Add `admin: "#F5C451"` to `pageAccents`.
- Render `tab === "admin" && admin && <AdminPage auth={auth} />`. If `tab === "admin"` and
  `!admin`, coerce back to `main` (guard effect or render fallback).
- Pass `centerItem={admin ? { id: "admin", label: "Admin", icon: <AdminIcon/>, color: "#F5C451" } : undefined}`
  to `CircleMenu`. Add an `AdminIcon` (e.g. shield) next to the other nav icons.

## Data flow

1. Every signed-in user's `usePresence` writes their own `profiles.last_seen_at` every 45s
   while their tab is visible.
2. The admin opens the nav → sees the gold center button (others never do) → taps it → `admin` tab.
3. `AdminPage` selects all `profiles` (RLS grants this to the admin only), derives online /
   active-today / totals, and renders the monitoring view, polling every 30s.

## Error handling

- `touchPresence` failures are swallowed (presence is best-effort; never block the UI or throw).
- `fetchAllUsers` errors surface an error state with a retry button on the Admin page.
- Missing `last_seen_at` (users who haven't pinged since the migration) → treated as offline,
  shown as `Never`.
- Non-admin reaching `tab === "admin"` → falls back to `main` (belt) while RLS returns no
  foreign data (suspenders).

## Testing

`node --test` on the pure modules:
- `src/utils/admin.test.js` — `isAdmin`: exact match true; different case true; different
  email false; null/undefined user false; user without email false.
- `src/utils/presence.test.js` — `isOnline`: within window true; outside window false; null
  false; malformed timestamp false; boundary at `ONLINE_WINDOW_MS`.
- `src/utils/adminUsers.test.js` — `summarize`: counts total, onlineNow, activeToday across a
  mix of fresh / stale / null `last_seen_at`.

Manual verification (browser, two accounts):
- As `sportsdude3133@gmail.com`: open nav → gold Admin button appears in the center → page
  lists all 4+ users with presence + stats; a second logged-in browser flips that user to
  Online within ~45s.
- As any other account: no center button; forcing `tab=admin` shows `main`; a direct
  `select * from profiles` from that session returns only their own row.

## Out of scope (YAGNI)

- Multiple admins / a roles table (single hard-coded owner email is sufficient).
- True `auth.users` count via a service-role serverless endpoint (registered-profiles count
  is the agreed measure).
- Realtime presence channel (heartbeat + 30s poll is sufficient for monitoring).
- Admin actions on users (ban / impersonate / edit) — this is read-only monitoring.
