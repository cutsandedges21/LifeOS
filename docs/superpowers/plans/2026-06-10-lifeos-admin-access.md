# LifeOS Admin Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `sportsdude3133@gmail.com` an owner-only Admin page that monitors users (online now, last online, total, plus each user's LifeOS stats), reached via a button in the center free space of the circle nav.

**Architecture:** A `last_seen_at` heartbeat on the existing `profiles` table (every signed-in user updates only their own row every 45s). The admin reads all rows via a new email-scoped `SELECT` RLS policy — the authoritative gate. Client visibility is gated by a pure `isAdmin(user)` helper used in two places (nav center button + page render), with the RLS policy as defense-in-depth.

**Tech Stack:** React 18 + Vite, Supabase JS, framer-motion. Pure-logic modules tested with `node --test` (`node:test` + `node:assert`). DB change applied via the Supabase MCP `apply_migration` tool (project `xomxqoqcyxrilrhvpole`).

**Spec:** `docs/superpowers/specs/2026-06-10-lifeos-admin-access-design.md`

**Branch:** `feat/admin-access` (already created; spec already committed there).

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `src/utils/admin.js` | Admin identity (`ADMIN_EMAIL`, `isAdmin`) | Create |
| `src/utils/admin.test.js` | Unit tests for `isAdmin` | Create |
| `src/utils/presence.js` | Presence math (`isOnline`, `relativeLastSeen`, `ONLINE_WINDOW_MS`) + own-row write (`touchPresence`) | Create |
| `src/utils/presence.test.js` | Unit tests for `isOnline` / `relativeLastSeen` | Create |
| `src/utils/adminUsers.js` | Admin data layer (`fetchAllUsers`, `summarize`) | Create |
| `src/utils/adminUsers.test.js` | Unit tests for `summarize` | Create |
| `profiles` table (Supabase) | `last_seen_at` column + index + admin SELECT policy | Migrate |
| `src/hooks/usePresence.js` | Heartbeat lifecycle for the signed-in user | Create |
| `src/components/AdminPage.jsx` | The monitoring UI | Create |
| `src/components/CircleMenu.jsx` | Add optional `centerItem` rendered in the arc's free center | Modify |
| `src/App.jsx` | Mount `usePresence`, gate admin tab + center button, add `AdminIcon` + accent | Modify |

---

## Task 1: Admin identity helper

**Files:**
- Create: `src/utils/admin.js`
- Test: `src/utils/admin.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/admin.test.js`:

```js
// Unit tests for the pure admin-identity helper. No React, no DOM.
// Run with: node --test src/utils/admin.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { isAdmin, ADMIN_EMAIL } from "./admin.js";

test("exact admin email is admin", () => {
  assert.equal(isAdmin({ email: ADMIN_EMAIL }), true);
});

test("admin email with different case is admin", () => {
  assert.equal(isAdmin({ email: "SportsDude3133@Gmail.com" }), true);
});

test("a different email is not admin", () => {
  assert.equal(isAdmin({ email: "someone@else.com" }), false);
});

test("null user is not admin", () => {
  assert.equal(isAdmin(null), false);
});

test("undefined user is not admin", () => {
  assert.equal(isAdmin(undefined), false);
});

test("user without an email is not admin", () => {
  assert.equal(isAdmin({ id: "u1" }), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/utils/admin.test.js`
Expected: FAIL — cannot resolve `./admin.js` (module not found).

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/admin.js`:

```js
// Admin identity — single source of truth on the client.
//
// The CLIENT uses isAdmin() to decide whether to render the Admin nav button
// and page. That is cosmetic only. The AUTHORITATIVE gate is the
// "read all profiles (admin)" RLS policy on profiles, which keys on this same
// email server-side, so a forged client check still reads zero foreign rows.
export const ADMIN_EMAIL = "sportsdude3133@gmail.com";

export function isAdmin(user) {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/utils/admin.test.js`
Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/admin.js src/utils/admin.test.js
git commit -m "feat(admin): add owner-only isAdmin identity helper"
```

---

## Task 2: Presence math + own-row heartbeat write

**Files:**
- Create: `src/utils/presence.js`
- Test: `src/utils/presence.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/presence.test.js`:

```js
// Unit tests for the pure presence helpers. No React, no DOM, no network.
// Run with: node --test src/utils/presence.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { isOnline, relativeLastSeen, ONLINE_WINDOW_MS } from "./presence.js";

const NOW = Date.UTC(2026, 5, 10, 12, 0, 0); // fixed reference instant
const ago = (ms) => new Date(NOW - ms).toISOString();

test("a timestamp inside the window is online", () => {
  assert.equal(isOnline(ago(30 * 1000), NOW), true);
});

test("a timestamp older than the window is offline", () => {
  assert.equal(isOnline(ago(ONLINE_WINDOW_MS + 1000), NOW), false);
});

test("null last-seen is offline", () => {
  assert.equal(isOnline(null, NOW), false);
});

test("a malformed timestamp is offline", () => {
  assert.equal(isOnline("not-a-date", NOW), false);
});

test("relativeLastSeen: sub-minute reads 'just now'", () => {
  assert.equal(relativeLastSeen(ago(5 * 1000), NOW), "just now");
});

test("relativeLastSeen: minutes", () => {
  assert.equal(relativeLastSeen(ago(3 * 60 * 1000), NOW), "3m ago");
});

test("relativeLastSeen: hours", () => {
  assert.equal(relativeLastSeen(ago(2 * 60 * 60 * 1000), NOW), "2h ago");
});

test("relativeLastSeen: days", () => {
  assert.equal(relativeLastSeen(ago(3 * 24 * 60 * 60 * 1000), NOW), "3d ago");
});

test("relativeLastSeen: null reads 'Never'", () => {
  assert.equal(relativeLastSeen(null, NOW), "Never");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/utils/presence.test.js`
Expected: FAIL — cannot resolve `./presence.js`.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/presence.js`:

```js
// Presence — heartbeat math + the own-row write.
//
// touchPresence updates ONLY the caller's own profiles row (allowed by the
// existing "update own profile" RLS policy). Reading everyone's presence is a
// separate, admin-only concern (see adminUsers.js + the admin RLS policy).

export const ONLINE_WINDOW_MS = 2 * 60 * 1000; // seen within 2 min == online

export function isOnline(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return Number.isFinite(t) && now - t < ONLINE_WINDOW_MS;
}

// Human-friendly "last online" label for offline users.
export function relativeLastSeen(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return "Never";
  const t = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(t)) return "Never";
  const diff = now - t;
  if (diff < 60 * 1000) return "just now";
  const min = Math.floor(diff / (60 * 1000));
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(t).toLocaleDateString();
}

// Best-effort heartbeat. Never throws — presence must not break the app.
export async function touchPresence(supabase, userId) {
  if (!supabase || !userId) return;
  try {
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", userId);
  } catch {
    // swallow — presence is non-critical
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/utils/presence.test.js`
Expected: PASS — 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/presence.js src/utils/presence.test.js
git commit -m "feat(presence): add online-window math + own-row heartbeat write"
```

---

## Task 3: Admin data layer (fetch + summarize)

**Files:**
- Create: `src/utils/adminUsers.js`
- Test: `src/utils/adminUsers.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/utils/adminUsers.test.js`:

```js
// Unit tests for the pure admin summary. No React, no DOM, no network.
// Run with: node --test src/utils/adminUsers.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./adminUsers.js";

const NOW = Date.UTC(2026, 5, 10, 12, 0, 0);
const ago = (ms) => new Date(NOW - ms).toISOString();

test("summarize counts total rows", () => {
  const users = [{ last_seen_at: ago(0) }, { last_seen_at: null }];
  assert.equal(summarize(users, NOW).total, 2);
});

test("summarize counts only users online within 2 minutes", () => {
  const users = [
    { last_seen_at: ago(30 * 1000) },     // online
    { last_seen_at: ago(5 * 60 * 1000) }, // offline
    { last_seen_at: null },               // offline
  ];
  assert.equal(summarize(users, NOW).onlineNow, 1);
});

test("summarize counts users active within the last 24h", () => {
  const users = [
    { last_seen_at: ago(60 * 1000) },             // today
    { last_seen_at: ago(23 * 60 * 60 * 1000) },   // today
    { last_seen_at: ago(25 * 60 * 60 * 1000) },   // not today
    { last_seen_at: null },                       // not today
  ];
  assert.equal(summarize(users, NOW).activeToday, 2);
});

test("summarize handles an empty list", () => {
  assert.deepEqual(summarize([], NOW), { total: 0, onlineNow: 0, activeToday: 0 });
});

test("summarize handles a null list", () => {
  assert.deepEqual(summarize(null, NOW), { total: 0, onlineNow: 0, activeToday: 0 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/utils/adminUsers.test.js`
Expected: FAIL — cannot resolve `./adminUsers.js`.

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/adminUsers.js`:

```js
// Admin data layer — reads every profile row (RLS grants this to the admin
// only) and derives the dashboard summary.
import { isOnline } from "./presence.js";

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
  const list = users || [];
  let onlineNow = 0;
  let activeToday = 0;
  for (const u of list) {
    if (isOnline(u.last_seen_at, now)) onlineNow++;
    if (u.last_seen_at) {
      const t = new Date(u.last_seen_at).getTime();
      if (Number.isFinite(t) && now - t < DAY) activeToday++;
    }
  }
  return { total: list.length, onlineNow, activeToday };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/utils/adminUsers.test.js`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/adminUsers.js src/utils/adminUsers.test.js
git commit -m "feat(admin): add all-users fetch + dashboard summary"
```

---

## Task 4: Database migration (presence column + admin RLS)

**Files:** Supabase project `xomxqoqcyxrilrhvpole` (no repo file).

- [ ] **Step 1: Apply the migration via the Supabase MCP tool**

Call `mcp__claude_ai_Supabase__apply_migration` with:
- `project_id`: `xomxqoqcyxrilrhvpole`
- `name`: `admin_presence_and_rls`
- `query`:

```sql
-- Presence heartbeat column + ordering index
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc);

-- Authoritative owner-only gate: the admin can SELECT every profile row.
-- Additive/permissive — existing self + friend SELECT policies are unchanged,
-- so non-admins still only read their own row (and connected friends').
drop policy if exists "read all profiles (admin)" on public.profiles;
create policy "read all profiles (admin)"
  on public.profiles for select
  using ( lower(auth.jwt() ->> 'email') = 'sportsdude3133@gmail.com' );
```

> **Fallback if MCP is unavailable:** paste the same SQL into the Supabase SQL editor for project `xomxqoqcyxrilrhvpole` and run it.

- [ ] **Step 2: Verify the column and policy exist**

Call `mcp__claude_ai_Supabase__execute_sql` with `project_id` `xomxqoqcyxrilrhvpole` and:

```sql
select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='profiles' and column_name='last_seen_at') as has_column,
  (select count(*) from pg_policies
     where schemaname='public' and tablename='profiles'
       and policyname='read all profiles (admin)') as has_policy;
```

Expected: `has_column = 1` and `has_policy = 1`.

- [ ] **Step 3: No commit** (schema change is server-side; nothing to commit).

---

## Task 5: Presence heartbeat hook

**Files:**
- Create: `src/hooks/usePresence.js`

> No unit test: this hook is pure wiring around `touchPresence` (already tested) and browser timers/visibility. It is exercised in the Task 9 manual verification.

- [ ] **Step 1: Write the implementation**

Create `src/hooks/usePresence.js`:

```js
import { useEffect } from "react";
import { getSupabase } from "../utils/supabase.js";
import { touchPresence } from "../utils/presence.js";

// usePresence — keeps the signed-in user's profiles.last_seen_at fresh.
//
// Mounted once at the app level. Pings on mount, whenever the tab becomes
// visible, and every 45s while visible. No pings while the tab is hidden so we
// don't mark a backgrounded tab as "online". Each user writes only their own
// row; the admin reads everyone's via RLS.
const PING_INTERVAL_MS = 45 * 1000;

export function usePresence(auth) {
  const userId = auth?.user?.id || null;
  const signedIn = auth?.status === "signed-in" && !!userId;

  useEffect(() => {
    if (!signedIn) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let cancelled = false;
    const ping = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      touchPresence(supabase, userId);
    };

    ping(); // immediate on mount / sign-in
    const interval = setInterval(ping, PING_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [signedIn, userId]);
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: build succeeds with no errors (the hook isn't mounted yet — this just type/parse-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePresence.js
git commit -m "feat(presence): add usePresence heartbeat hook"
```

---

## Task 6: Admin page UI

**Files:**
- Create: `src/components/AdminPage.jsx`

> No unit test: all logic is rendering. The data math it depends on (`isOnline`, `relativeLastSeen`, `summarize`) is already unit-tested. Verified live in Task 9.

- [ ] **Step 1: Write the implementation**

Create `src/components/AdminPage.jsx`:

```jsx
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { getSupabase } from "../utils/supabase.js";
import { fetchAllUsers, summarize } from "../utils/adminUsers.js";
import { isOnline, relativeLastSeen } from "../utils/presence.js";
import { localPart } from "../utils/friends.js";

const GOLD = "#F5C451";
const REFRESH_MS = 30 * 1000;

function StatCard({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "14px 16px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", background: "var(--card-mid)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", fontSize: 11 }}>
      <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 700 }}>{value}</span>
    </span>
  );
}

const dash = (v) => (v === null || v === undefined ? "—" : v);
const pct = (v) => (v === null || v === undefined ? "—" : `${v}%`);
const hrs = (v) => (v === null || v === undefined ? "—" : `${v}h`);

function joined(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AdminPage({ auth }) {
  const myId = auth?.user?.id || null;
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, onlineNow: 0, activeToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("Cloud sync not configured.");
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchAllUsers(supabase);
      const now = Date.now();
      rows.sort((a, b) => {
        const ao = isOnline(a.last_seen_at, now) ? 1 : 0;
        const bo = isOnline(b.last_seen_at, now) ? 1 : 0;
        if (ao !== bo) return bo - ao;
        const at = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bt - at;
      });
      setUsers(rows);
      setSummary(summarize(rows, now));
      setError(null);
    } catch (e) {
      setError(e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const now = Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "0 18px", maxWidth: 720, margin: "0 auto" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Admin <span style={{ color: GOLD }}>·</span> Users
        </h1>
        <button
          onClick={load}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 12, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <StatCard label="Total Users" value={summary.total} />
        <StatCard label="Online Now" value={summary.onlineNow} accent={GOLD} />
        <StatCard label="Active Today" value={summary.activeToday} />
      </div>

      {loading && <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Loading users…</div>}

      {error && !loading && (
        <div style={{ background: "var(--card)", border: "1px solid #F8717155", borderRadius: 14, padding: 14, color: "#F87171", fontSize: 13 }}>
          {error}
          <button onClick={load} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: "none", color: "#F87171", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No users yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map((u) => {
          const online = isOnline(u.last_seen_at, now);
          const name = localPart(u.email) || u.display_name || "LifeOS user";
          const isMe = u.user_id === myId;
          return (
            <div key={u.user_id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: online ? "#34D399" : "var(--border-high)", boxShadow: online ? "0 0 8px #34D399" : "none", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email || name}
                    {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: GOLD, fontFamily: "var(--font-mono)" }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                    {online ? "Online" : relativeLastSeen(u.last_seen_at, now)} · joined {joined(u.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                <StatChip label="🔥" value={dash(u.current_streak)} />
                <StatChip label="Habits" value={pct(u.habit_pct)} />
                <StatChip label="Gym/wk" value={dash(u.gym_days_week)} />
                <StatChip label="Sleep" value={hrs(u.avg_sleep)} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: build succeeds (component is not yet routed — this parse/type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminPage.jsx
git commit -m "feat(admin): add user-monitoring AdminPage"
```

---

## Task 7: Circle nav center button

**Files:**
- Modify: `src/components/CircleMenu.jsx`

> Geometry note: arc items use radius `r = containerSize/2 - itemSize/2` measured from an origin at `top:80%, left:51%` of the rotating layer; the apex item sits at `y = -r`. The center button is placed at `y = -r*0.45` (≈ middle of the free space between the trigger and the arc) with `x = 0`.

- [ ] **Step 1: Add the `CenterMenuItem` component**

In `src/components/CircleMenu.jsx`, immediately **after** the `MenuItem` function (it ends at the line `}` before `function MenuTrigger(`), insert:

```jsx
// Center button — rendered in the empty middle of the open semicircle.
// Driven separately from arc items (fixed x=0, fixed center y) and styled
// distinctly. Used for the owner-only Admin entry.
const CENTER_ITEM_SIZE = 50;
function CenterMenuItem({ item, isOpen, isActive, onSelect }) {
  const r = CONSTANTS.containerSize / 2 - CONSTANTS.itemSize / 2;
  const CENTER_Y = -(r * 0.45);
  const [hovering, setHovering] = useState(false);

  return (
    <div style={{ position: "absolute", top: "80%", left: "51%", width: 0, height: 0, pointerEvents: "none" }}>
      <motion.button
        onClick={() => onSelect(item.id)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        animate={{
          x: 0,
          y: isOpen ? CENTER_Y : FALL_Y,
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? 1 : 0.35,
        }}
        whileHover={{ scale: 1.12, transition: { duration: 0.12 } }}
        whileTap={{ scale: 0.92 }}
        transition={
          isOpen
            ? { delay: 0.06, type: "spring", stiffness: 320, damping: 28 }
            : { duration: 0.4, ease: FALL_EASE }
        }
        style={{
          position: "absolute",
          left: -(CENTER_ITEM_SIZE / 2),
          top: -(CENTER_ITEM_SIZE / 2),
          width: CENTER_ITEM_SIZE,
          height: CENTER_ITEM_SIZE,
          borderRadius: "50%",
          background: isActive ? item.color : "var(--card-mid)",
          ...(IS_MOBILE
            ? {}
            : { backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }),
          color: isActive ? "#1A1206" : item.color,
          border: `1.5px solid ${item.color}`,
          boxShadow: `0 0 24px ${item.color}80, 0 6px 18px rgba(0,0,0,0.45)`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: isOpen ? "auto" : "none",
          outline: "none",
        }}
      >
        {item.icon}
        <AnimatePresence>
          {hovering && isOpen && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "100%",
                marginTop: 8,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                color: "#F8FAFF",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                background: "rgba(0,0,0,0.75)",
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                zIndex: 100,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
```

- [ ] **Step 2: Accept the `centerItem` prop**

In `src/components/CircleMenu.jsx`, change the export signature from:

```jsx
export function CircleMenu({ items, activeId, onSelect }) {
```

to:

```jsx
export function CircleMenu({ items, activeId, onSelect, centerItem }) {
```

- [ ] **Step 3: Render the center button inside the rotating layer**

In the same file, inside the rotating `<motion.div>` that maps `visibleItems`, add the center button **after** the `{visibleItems.map(...)}` block. Change:

```jsx
            {visibleItems.map((item, index) => (
              <MenuItem
                key={item.id}
                item={item}
                index={index}
                totalItems={visibleItems.length}
                isOpen={isOpen}
                isActive={item.id === activeId}
                onSelect={handleSelect}
              />
            ))}
          </motion.div>
```

to:

```jsx
            {visibleItems.map((item, index) => (
              <MenuItem
                key={item.id}
                item={item}
                index={index}
                totalItems={visibleItems.length}
                isOpen={isOpen}
                isActive={item.id === activeId}
                onSelect={handleSelect}
              />
            ))}
            {centerItem && (
              <CenterMenuItem
                item={centerItem}
                isOpen={isOpen}
                isActive={centerItem.id === activeId}
                onSelect={handleSelect}
              />
            )}
          </motion.div>
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: build succeeds. No visual change yet (no caller passes `centerItem`).

- [ ] **Step 5: Commit**

```bash
git add src/components/CircleMenu.jsx
git commit -m "feat(nav): support an optional center button in the circle menu"
```

---

## Task 8: Wire Admin into the app

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add imports**

In `src/App.jsx`, after the existing component imports (the block of `import { ... } from "./components/...";` and `import { ... } from "./hooks/...";`), add:

```jsx
import { AdminPage } from "./components/AdminPage.jsx";
import { usePresence } from "./hooks/usePresence.js";
import { isAdmin } from "./utils/admin.js";
```

- [ ] **Step 2: Add the `AdminIcon`**

In `src/App.jsx`, immediately **after** the `SettingsIcon` definition (`const SettingsIcon = () => ( ... );`), add a shield icon:

```jsx
// Admin / shield icon — owner-only entry in the center of the nav.
const AdminIcon = () => (
  <svg width="22" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
```

- [ ] **Step 3: Mount the heartbeat and compute `admin`**

In `src/App.jsx`, immediately **after** the line `const friendsHub = useFriends(auth);`, add:

```jsx
  // Heartbeat: keep this user's last_seen_at fresh while the tab is visible.
  usePresence(auth);
  // Owner-only admin gate (cosmetic on the client; enforced by RLS server-side).
  const admin = isAdmin(auth?.user);
```

- [ ] **Step 4: Guard the admin tab against non-admins**

In `src/App.jsx`, immediately **after** the `isMobile` effect (the `useEffect` block that ends with `return () => window.removeEventListener("resize", checkMobile);` and `}, []);`), add:

```jsx
  // Belt-and-suspenders: if a non-admin ever lands on the admin tab, bounce
  // them home. RLS already returns them zero foreign data regardless.
  useEffect(() => {
    if (tab === "admin" && !admin) setTab("main");
  }, [tab, admin]);
```

- [ ] **Step 5: Add the admin accent color**

In `src/App.jsx`, in the `pageAccents` object, add an `admin` entry. Change:

```jsx
    friends: "#60A5FA",
    settings: "#94A3B8",
  };
```

to:

```jsx
    friends: "#60A5FA",
    settings: "#94A3B8",
    admin: "#F5C451",
  };
```

- [ ] **Step 6: Render the admin page**

In `src/App.jsx`, inside the page-content `<AnimatePresence mode="wait">` block, immediately **after** the `{tab === "settings" && ( ... )}` block, add:

```jsx
            {tab === "admin" && admin && <AdminPage auth={auth} />}
```

- [ ] **Step 7: Pass `centerItem` to the CircleMenu**

In `src/App.jsx`, update the `<CircleMenu ... />` usage. Change:

```jsx
      <CircleMenu
        activeId={tab}
        onSelect={setTab}
        items={[
```

to:

```jsx
      <CircleMenu
        activeId={tab}
        onSelect={setTab}
        centerItem={admin ? { id: "admin", label: "Admin", icon: <AdminIcon />, color: pageAccents.admin } : undefined}
        items={[
```

- [ ] **Step 8: Verify it builds**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 9: Run the full unit suite**

Run: `node --test src/utils/admin.test.js src/utils/presence.test.js src/utils/adminUsers.test.js`
Expected: PASS — all tests across the three files pass.

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx
git commit -m "feat(admin): wire owner-only Admin tab, center nav button, and heartbeat"
```

---

## Task 9: End-to-end verification

**Files:** none (manual + automated checks).

- [ ] **Step 1: Confirm the migration is live**

Call `mcp__claude_ai_Supabase__execute_sql` (project `xomxqoqcyxrilrhvpole`):

```sql
select count(*) as has_policy from pg_policies
 where schemaname='public' and tablename='profiles'
   and policyname='read all profiles (admin)';
```

Expected: `has_policy = 1`.

- [ ] **Step 2: Run the dev server and sign in as the admin**

Run: `npm run dev`
In a browser, sign in as `sportsdude3133@gmail.com`. Open the circle nav (tap the trigger).
Expected: a **gold shield button** appears in the center free space of the open arc.

- [ ] **Step 3: Open the Admin page**

Tap the gold center button.
Expected: the Admin page shows three stat cards (Total Users / Online Now / Active Today) and a list of all users with online dots, last-seen labels, join dates, and stat chips. The admin's own row is tagged `YOU` and shows `Online`.

- [ ] **Step 4: Verify presence updates**

In a second browser/profile, sign in as a different existing account. Within ~45s, the Admin page (which polls every 30s, or tap Refresh) shows that user flip to a green dot / `Online`; closing that second tab and waiting >2 min flips them back to a relative `Nm ago`.

- [ ] **Step 5: Verify owner-only visibility**

Sign out of the admin and sign in as a **non-admin** account.
Expected: opening the nav shows **no** center button. Manually navigating (e.g. via React devtools setting `tab` to `"admin"`) bounces back to `main`.

- [ ] **Step 6: Verify RLS denies non-admins at the data layer**

While signed in as the non-admin in the browser, open the devtools console and run:

```js
const { data, error } = await window.__lifeosSupabase?.from?.("profiles").select("*");
console.log(data?.length, error);
```

If `window.__lifeosSupabase` is not exposed, instead confirm via the MCP using a non-admin context is not possible — rely on the policy check in Step 1 plus the Step 5 UI result. (RLS guarantees a non-admin `select *` returns only their own row + connected friends, never the full set.)

- [ ] **Step 7: Final commit (if any tuning was needed)**

If the center-button vertical position needed adjustment, tweak `CENTER_Y` in `CircleMenu.jsx`, rebuild, then:

```bash
git add -A
git commit -m "fix(nav): tune admin center-button position"
```

---

## Self-Review

**Spec coverage:**
- Owner-only at 3 layers → Task 1 (isAdmin), Task 4 (RLS policy), Task 8 (nav gate + page guard + bounce effect). ✓
- Presence heartbeat → Task 2 (`touchPresence`/`isOnline`), Task 5 (`usePresence`), Task 4 (column). ✓
- Online now / last online / total → Task 3 (`summarize`), Task 6 (page), Task 2 (`relativeLastSeen`). ✓
- Per-user LifeOS stats → Task 6 (stat chips read existing profile columns). ✓
- Center-of-circle nav button → Task 7 (`CenterMenuItem` + `centerItem` prop), Task 8 (passes it only for admin). ✓
- Total = registered profiles → Task 3 (`summarize.total = rows.length`). ✓
- Tests via `node --test` → Tasks 1–3 + Task 8 Step 9. ✓

**Placeholder scan:** none — every code step has complete code; every command has expected output.

**Type/name consistency:** `isAdmin`, `ADMIN_EMAIL`, `isOnline`, `relativeLastSeen`, `ONLINE_WINDOW_MS`, `touchPresence`, `fetchAllUsers`, `summarize`, `usePresence`, `AdminPage`, `CenterMenuItem`, `centerItem`, `AdminIcon`, `pageAccents.admin`, tab id `"admin"` — all defined where first used and referenced consistently across tasks.
