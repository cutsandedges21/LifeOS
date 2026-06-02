// Per-session gym progress: per-DATE checkoff + note state for the day's
// workout, plus the logic that keeps gymVisits in sync when a session is
// fully completed.
//
// Why per-date and not on the exercise: `gymExercises[day]` is the reusable
// weekly plan (every Monday shows the same template). Storing `done`/`note`
// there would carry last Monday's checkmarks into next Monday. Keying by ISO
// date means a fresh day starts empty — checks/notes reset for free, with no
// fragile daily-reset job (the bug behind commit 505c472).

import { todayISO, getTodayDay } from "./formatters.js";

// Today's exercises = the template for today's day-of-week.
export function todaysExercises(state) {
  return state.gymExercises?.[getTodayDay()] || [];
}

// Map of exerciseId → { done, note } for a given date. Always a fresh object
// the caller can read but must not mutate.
export function getSessionProgress(gymSessionLog, dateISO) {
  return gymSessionLog?.[dateISO] || {};
}

export function isExerciseDone(progress, exId) {
  return !!progress?.[exId]?.done;
}

export function exerciseNote(progress, exId) {
  return progress?.[exId]?.note || "";
}

// How many of `exercises` are checked off in `progress`.
export function completedCount(exercises, progress) {
  return (exercises || []).reduce(
    (n, e) => (progress?.[e.id]?.done ? n + 1 : n),
    0
  );
}

// A session counts as complete only when it has at least one exercise and
// every one of them is checked. An empty list is NOT "complete" — there's
// nothing to complete, so the manual button handles those days instead.
export function isSessionComplete(exercises, progress) {
  if (!exercises || exercises.length === 0) return false;
  return exercises.every((e) => progress?.[e.id]?.done);
}

// Flip an exercise's done flag for `dateISO`. Returns a new gymSessionLog.
export function toggleDone(gymSessionLog, dateISO, exId) {
  const log = gymSessionLog || {};
  const day = log[dateISO] || {};
  const entry = day[exId] || { done: false, note: "" };
  return {
    ...log,
    [dateISO]: { ...day, [exId]: { ...entry, done: !entry.done } },
  };
}

// Set (or clear) an exercise's note for `dateISO`. An empty/whitespace note
// clears the note; if the resulting entry carries no done flag and no note,
// the entry is dropped to keep the log tidy. Returns a new gymSessionLog.
export function setNote(gymSessionLog, dateISO, exId, note) {
  const log = gymSessionLog || {};
  const day = { ...(log[dateISO] || {}) };
  const trimmed = (note || "").trim();
  const entry = day[exId] || { done: false, note: "" };
  const next = { ...entry, note: trimmed };
  if (!next.done && !next.note) {
    delete day[exId];
  } else {
    day[exId] = next;
  }
  return { ...log, [dateISO]: day };
}

// Drop a deleted exercise's entry for `dateISO`. Returns a new gymSessionLog.
export function cleanupExercise(gymSessionLog, dateISO, exId) {
  const log = gymSessionLog || {};
  if (!log[dateISO] || !(exId in log[dateISO])) return log;
  const day = { ...log[dateISO] };
  delete day[exId];
  return { ...log, [dateISO]: day };
}

// Keep only the most recent `keepDays` date-keys so the log can't grow
// unbounded. Returns a new gymSessionLog.
export function pruneSessionLog(gymSessionLog, keepDays = 14) {
  const log = gymSessionLog || {};
  const dates = Object.keys(log).sort(); // ISO sorts chronologically
  if (dates.length <= keepDays) return log;
  const keep = new Set(dates.slice(-keepDays));
  const out = {};
  for (const d of dates) if (keep.has(d)) out[d] = log[d];
  return out;
}

// Snapshot of today's prescribed exercises for the progressive-overload log.
// Mirrors the shape GymPage's overloadHistory reader expects.
function buildOverloadSnapshot(exercises, dateISO, dayOfWeek) {
  return {
    id: Date.now() + 1,
    date: dateISO,
    dayOfWeek,
    exercises: exercises.map((e) => ({
      name: e.name,
      weight: e.weight,
      sets: e.sets,
      reps: e.reps,
    })),
  };
}

// Reconcile gymVisits + gymExerciseLog with today's completion state.
//
// - Today complete (exercises exist & all checked) → ensure an auto visit row
//   for today and an overload snapshot (both deduped by date).
// - Otherwise → remove today's visit only if it was auto-created, and drop
//   today's snapshot.
//
// Manually logged visits (auto !== true) are never touched, so the no-exercise
// fallback button keeps working. Pure: returns a new state object.
export function syncAutoVisit(state) {
  const today = todayISO();
  const todayDay = getTodayDay();
  const exercises = state.gymExercises?.[todayDay] || [];
  const progress = getSessionProgress(state.gymSessionLog, today);
  const complete = isSessionComplete(exercises, progress);

  const visits = state.gymVisits || [];
  const log = state.gymExerciseLog || [];
  const skips = state.gymSkips || [];
  const hasVisitToday = visits.some((v) => v.date === today);
  const hasSnapshotToday = log.some((s) => s.date === today);
  const hasSkipToday = skips.some((s) => s.date === today);

  if (complete) {
    // Already fully in sync — nothing to add and no stale skip to clear.
    if (hasVisitToday && hasSnapshotToday && !hasSkipToday) return state;
    return {
      ...state,
      gymVisits: hasVisitToday
        ? visits
        : [{ id: Date.now(), date: today, auto: true }, ...visits],
      gymExerciseLog: hasSnapshotToday
        ? log
        : [buildOverloadSnapshot(exercises, today, todayDay), ...log],
      // Completing the session means you went — clear any skip logged today
      // so the streak and the skip list don't contradict each other.
      gymSkips: hasSkipToday ? skips.filter((s) => s.date !== today) : skips,
    };
  }

  // Not complete — clear only what we auto-created.
  const autoVisitToday = visits.some((v) => v.date === today && v.auto);
  if (!autoVisitToday) return state; // nothing of ours to remove
  return {
    ...state,
    gymVisits: visits.filter((v) => !(v.date === today && v.auto)),
    gymExerciseLog: log.filter((s) => s.date !== today),
  };
}
