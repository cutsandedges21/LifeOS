import { useState, useEffect, useRef } from "react";
import { storage, STORAGE_KEYS } from "../utils/storage.js";

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
};

export const useLifeOSState = () => {
  const [state, setState] = useState(() => {
    const saved = storage.get(STORAGE_KEYS.STATE);
    return saved ? { ...INITIAL_STATE, ...saved } : INITIAL_STATE;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Latest state mirrored into a ref so the lifecycle flush handlers below
  // can persist current data without re-binding listeners on every change.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Debounced persistence. Rapid back-to-back state updates (snapshot upsert
  // → celebration shown stamp → netWorthHigh, etc.) used to fire a separate
  // synchronous localStorage write per render, which on mobile blocks the
  // main thread for 10–30ms each and visibly stalls touch scrolling.
  // Coalescing into a single write after 400ms of quiet eliminates the jank
  // without risking real data loss — the lifecycle flush below covers the
  // edge case where the user backgrounds the app mid-debounce.
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => {
      storage.set(STORAGE_KEYS.STATE, state);
    }, 400);
    return () => clearTimeout(t);
  }, [state, isLoaded]);

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

  return { state, setState, updateState, resetState, isLoaded };
};
