// Friends data layer. Pure Supabase queries + the shared-stats computation.
// All UI lives in FriendsPage; all realtime/notification orchestration lives in
// useFriends. This module is just the typed-ish edges to the database.
//
// Schema (see the friends_system migration):
//   profiles      { user_id, email, display_name, current_streak, longest_streak,
//                   habit_pct, todo_pct, gym_days_week, avg_sleep, stats_updated_at }
//   friendships   { id, requester_id, addressee_id, status, created_at, responded_at }
//   find_user_by_email(email) -> uuid   (security definer, authenticated only)

import { todayISO, isoFromDate } from "./formatters.js";

// ── Shared stats ────────────────────────────────────────────────────────────
// Curated, non-sensitive subset friends are allowed to see. Deliberately NO
// finances. Computed from local state so it works offline; pushed to the
// caller's own profile row on sync.
export function computeSharedStats(state) {
  const habits = state.habits || [];
  const completions = state.habitCompletions || {};
  const iso = todayISO();
  const habitsDoneToday = habits.filter((h) => completions[h.id]?.[iso]).length;
  const habit_pct = habits.length
    ? Math.round((habitsDoneToday / habits.length) * 100)
    : 0;

  const goals = state.goals || [];
  const todoDone = goals.filter((g) => g.done).length;
  const todo_pct = goals.length
    ? Math.round((todoDone / goals.length) * 100)
    : 0;

  return {
    current_streak: state.streak || 0,
    longest_streak: Math.max(state.streakHigh || 0, state.streak || 0),
    habit_pct,
    todo_pct,
    gym_days_week: gymDaysThisWeek(state),
    avg_sleep: avgSleepHours(state),
  };
}

// Gym visits in the trailing 7 days (today inclusive).
function gymDaysThisWeek(state) {
  const visits = state.gymVisits || [];
  const window = new Set();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    window.add(isoFromDate(dd));
  }
  // Count distinct days that have at least one visit inside the window.
  const days = new Set(
    visits.map((v) => v.date).filter((date) => window.has(date))
  );
  return days.size;
}

// Average sleep duration (hours) over the last 7 sleep entries that have both
// a bedtime and a wake time. Entries store "HH:MM" strings; we handle the
// overnight wrap (e.g. bed 23:30 → wake 07:00 = 7.5h).
function avgSleepHours(state) {
  const entries = (state.sleepEntries || []).slice(-7);
  const hours = [];
  for (const e of entries) {
    const h = durationHours(e.bedtime, e.wakeTime);
    if (h != null) hours.push(h);
  }
  if (hours.length === 0) return 0;
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
  return Math.round(avg * 10) / 10; // one decimal
}

function durationHours(bed, wake) {
  const b = parseHHMM(bed);
  const w = parseHHMM(wake);
  if (b == null || w == null) return null;
  let mins = w - b;
  if (mins <= 0) mins += 24 * 60; // crossed midnight
  return mins / 60;
}

function parseHHMM(s) {
  if (typeof s !== "string") return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// ── Profile upsert ──────────────────────────────────────────────────────────
// Seeds/refreshes the caller's own profile row (identity + shared stats) so
// friends can read it. Called on sign-in and on every debounced sync.
export async function upsertMyProfile(supabase, { userId, email, displayName, stats }) {
  if (!supabase || !userId) return { error: new Error("not signed in") };
  const row = {
    user_id: userId,
    email: email || null,
    // Fall back to the email local-part so friends always see *something*.
    display_name:
      (displayName && displayName.trim()) ||
      (email ? email.split("@")[0] : "LifeOS user"),
    ...(stats || {}),
    stats_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "user_id" });
  return { error };
}

// ── Friendship queries ──────────────────────────────────────────────────────

// Pull every friendship the caller is part of (RLS already restricts to rows
// where they are requester or addressee), then hydrate the counterpart's
// profile. Returns { friends, incoming, outgoing } where each item is
// { friendship, profile, isRequester }.
export async function fetchFriendData(supabase, myId) {
  const empty = { friends: [], incoming: [], outgoing: [] };
  if (!supabase || !myId) return empty;

  const { data: rows, error } = await supabase
    .from("friendships")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !rows) return empty;

  const otherIds = [
    ...new Set(
      rows.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id))
    ),
  ];

  let profileMap = {};
  if (otherIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", otherIds);
    for (const p of profs || []) profileMap[p.user_id] = p;
  }

  const friends = [];
  const incoming = [];
  const outgoing = [];
  for (const r of rows) {
    const isRequester = r.requester_id === myId;
    const otherId = isRequester ? r.addressee_id : r.requester_id;
    const item = { friendship: r, profile: profileMap[otherId] || null, isRequester };
    if (r.status === "accepted") {
      friends.push(item);
    } else if (r.status === "pending") {
      if (isRequester) outgoing.push(item);
      else incoming.push(item);
    } else if (r.status === "declined" && isRequester) {
      // Surface declines back to the sender so they can see + dismiss them.
      outgoing.push(item);
    }
    // declined rows where I'm the addressee are hidden (I already declined).
  }
  return { friends, incoming, outgoing };
}

// Resolve an email to a user id and create a pending request. Returns
// { ok, error } with a human-readable error message on failure.
export async function sendFriendRequest(supabase, rawEmail, myId) {
  const email = (rawEmail || "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Enter an email address." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "That doesn't look like an email." };
  }

  const { data: targetId, error: rpcErr } = await supabase.rpc(
    "find_user_by_email",
    { p_email: email }
  );
  if (rpcErr) return { ok: false, error: "Lookup failed. Try again." };
  if (!targetId) return { ok: false, error: "No LifeOS account uses that email." };
  if (targetId === myId) return { ok: false, error: "That's your own email." };

  const { error } = await supabase.from("friendships").insert({
    requester_id: myId,
    addressee_id: targetId,
    status: "pending",
  });
  if (error) {
    // 23505 = unique_violation on the normalized-pair index.
    if (error.code === "23505") {
      return { ok: false, error: "You're already connected or have a pending request." };
    }
    return { ok: false, error: error.message || "Could not send request." };
  }
  return { ok: true };
}

export async function respondToRequest(supabase, friendshipId, accept) {
  const { error } = await supabase
    .from("friendships")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", friendshipId);
  return { error };
}

export async function removeFriendship(supabase, friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);
  return { error };
}
