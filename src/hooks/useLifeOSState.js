import { useState, useEffect, useRef } from "react";
import { storage, STORAGE_KEYS } from "../utils/storage.js";
import { getSupabase } from "../utils/supabase.js";
import { useAuth } from "./useAuth.js";

const INITIAL_STATE = {
  user: "",
  theme: "dark", // "dark" | "light" — see src/theme/colors.js
  workoutDay: "",
  whoop: { recovery: 0, sleep: 0, strain: 0, hrv: 0, rhr: 0, status: "gray", advice: "" },
  goals: [],
  streak: 0,
  finances: {
    netWorth: 0,
    assets: 0,
    liabilities: 0,
    subs: [],
    transactions: [],
    budgets: [],
    savingsGoals: [],
  },
  businesses: [],
  brand: {
    handle: "",
    tagline: "",
    platforms: [],
    postedToday: 0,
    reflection: "",
  },
  overseerLog: [],
  overseerInput: "",
  overseerMessageCount: 0,
  overseerMessageDate: "",
  gymSplit: {
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  },
  gymExercises: {},
  sleepInput: {
    mode: "direct",
    hours: 0,
    bedtime: "",
    wakeTime: "",
  },
  sleepEntries: [],
  settings: {
    wakeTime: "08:00",
    sleepTime: "00:00",
  },
  missedGoalsHistory: [],
  gymSkips: [],
  gymVisits: [],
  lastStreakCheck: "",
  lastGoalsReset: "",
  lastOverseerReset: "",
  // Daily snapshot ring buffer — see src/utils/snapshots.js. Powers all trend
  // charts and the weekly review card.
  historySnapshots: [],
  // Map of celebration-key → ISO date last fired. Prevents the same milestone
  // (e.g. 7-day streak) from re-celebrating once dismissed.
  celebrationsShown: {},
  // Highest net worth ever recorded — drives the "new high" celebration.
  netWorthHigh: 0,
  // ISO date the Overseer proactively nudged the user today (one nudge/day).
  proactiveNudgeShown: "",
  // ── 1-line daily journal ────────────────────────────────────────────
  // Append-only log of one entry per day: { date, text }. Today's entry is
  // editable; past entries are read-only (UI-enforced). Fed into Overseer
  // context so it can reference what the user said yesterday/recently.
  journalEntries: [],
  // ── Progressive overload log ────────────────────────────────────────
  // Snapshot of `gymExercises[day]` written whenever the user logs a gym
  // visit. Schema: { id, date, dayOfWeek, exercises: [{ name, weight, sets, reps }] }.
  // Read by GymPage to render per-exercise trend strings like "225 → 230 → 235".
  gymExerciseLog: [],
  // ── Per-session exercise progress ───────────────────────────────────
  // Live per-DATE checkoff + note state for the day's workout, keyed by
  // ISO date → exercise id → { done, note }. Kept separate from the
  // gymExercises template (the reusable weekly plan) so checks/notes reset
  // automatically each day instead of polluting the plan. Completing every
  // exercise auto-logs the gym visit. Pruned to a 14-day window. See
  // src/utils/gymSession.js.
  gymSessionLog: {},
  // ── Notifications ───────────────────────────────────────────────────
  // User opt-in for the daily Overseer reminder + renewal nudges.
  // Permission state itself lives in Notification.permission; this gate
  // controls whether we *try* to use it.
  notificationsEnabled: false,
  // ISO date we last surfaced a "sub renews soon" notification, deduped by
  // sub id → date to avoid daily re-spam.
  subRenewalNotified: {},
  // ── Habits ──────────────────────────────────────────────────────────
  // Binary daily habits separate from one-shot goals. A habit is something
  // you should do every day (meditate, no alcohol, read) — different mental
  // model than today's TODO list.
  //   habits: [{ id, name, color, icon, createdAt }]
  //   habitCompletions: { [habitId]: { [iso]: true } }
  habits: [],
  habitCompletions: {},
};

// Fields that should NOT be synced to the cloud. These are ephemeral UI state
// or transient input fields where syncing across devices would feel wrong
// (e.g. mid-typing a chat message on phone shouldn't appear on desktop).
const EPHEMERAL_KEYS = new Set(["overseerInput"]);

function stripEphemeral(state) {
  const out = {};
  for (const k of Object.keys(state)) {
    if (!EPHEMERAL_KEYS.has(k)) out[k] = state[k];
  }
  return out;
}

export const useLifeOSState = () => {
  const auth = useAuth();
  const [state, setState] = useState(() => {
    const saved = storage.get(STORAGE_KEYS.STATE);
    return saved ? { ...INITIAL_STATE, ...saved } : INITIAL_STATE;
  });

  // isLoaded gates effects + UI: true once the local hydrate is done AND
  // (if signed in) the initial cloud fetch has completed. This avoids the
  // race where state.streak briefly shows 0 from local before cloud value
  // arrives, causing a visible flicker.
  const [isLoaded, setIsLoaded] = useState(false);
  // syncStatus surfaces in the Account page so the user can see what's
  // happening: idle | pulling | syncing | error | offline
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Latest state mirrored into a ref so the lifecycle flush handlers below
  // can persist current data without re-binding listeners on every change.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initial local hydrate completes immediately on first paint.
  useEffect(() => {
    // Wait until auth status is known before flipping isLoaded — if a user
    // is signed in, we want to pull cloud state first to avoid the local→cloud
    // flicker. If they're anon, we're done.
    if (auth.status === "loading") return;
    if (auth.status === "anon") {
      setIsLoaded(true);
    }
    // signed-in branch is handled by the cloud-pull effect below.
  }, [auth.status]);

  // ── Cloud pull on sign-in ────────────────────────────────────────────
  // When a user signs in we fetch their cloud row. If it exists, cloud
  // wins (it's the cross-device source of truth). If not, we'll seed the
  // cloud row with current local state on the first push below.
  useEffect(() => {
    if (auth.status !== "signed-in" || !auth.user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let cancelled = false;
    setSyncStatus("pulling");
    setSyncError(null);

    supabase
      .from("user_state")
      .select("state, updated_at")
      .eq("user_id", auth.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[LifeOS] cloud pull failed:", error);
          setSyncError(error.message);
          setSyncStatus("error");
          setIsLoaded(true);
          return;
        }
        if (data?.state) {
          // Merge: cloud wins, but spread INITIAL_STATE first so any
          // newly-added fields not present in the saved row still resolve.
          setState({ ...INITIAL_STATE, ...data.state });
          setLastSyncedAt(data.updated_at || new Date().toISOString());
        }
        setSyncStatus("idle");
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.status, auth.user?.id]);

  // ── Debounced local persistence ──────────────────────────────────────
  // Rapid back-to-back state updates (snapshot upsert → celebration shown
  // stamp → netWorthHigh, etc.) used to fire a separate synchronous
  // localStorage write per render, which on mobile blocks the main thread
  // for 10–30ms each and visibly stalls touch scrolling. Coalescing into a
  // single write after 400ms of quiet eliminates the jank without risking
  // real data loss — the lifecycle flush below covers the edge case where
  // the user backgrounds the app mid-debounce.
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => {
      storage.set(STORAGE_KEYS.STATE, state);
    }, 400);
    return () => clearTimeout(t);
  }, [state, isLoaded]);

  // ── Debounced cloud sync (when signed in) ────────────────────────────
  // Mirrors the localStorage debounce but writes to Supabase. Skipped when
  // signed out so anon users never hit the network.
  useEffect(() => {
    if (!isLoaded) return;
    if (auth.status !== "signed-in" || !auth.user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const t = setTimeout(async () => {
      setSyncStatus("syncing");
      const { error } = await supabase
        .from("user_state")
        .upsert(
          {
            user_id: auth.user.id,
            state: stripEphemeral(state),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (error) {
        console.warn("[LifeOS] cloud sync failed:", error);
        setSyncError(error.message);
        setSyncStatus("error");
      } else {
        setSyncError(null);
        setLastSyncedAt(new Date().toISOString());
        setSyncStatus("idle");
      }
    }, 1500); // longer than local debounce — fewer network writes

    return () => clearTimeout(t);
  }, [state, isLoaded, auth.status, auth.user?.id]);

  // Lifecycle flush: write immediately if the tab is being hidden, closed,
  // or refreshed. Listeners are bound once and read latest state via the
  // ref above, so this doesn't reattach on every state change.
  useEffect(() => {
    if (!isLoaded) return;
    const flush = () => storage.set(STORAGE_KEYS.STATE, stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLoaded]);

  const resetState = () => {
    setState(INITIAL_STATE);
    storage.remove(STORAGE_KEYS.STATE);
  };

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return {
    state,
    setState,
    updateState,
    resetState,
    isLoaded,
    auth,
    syncStatus,
    lastSyncedAt,
    syncError,
  };
};
