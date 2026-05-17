import { useState, useEffect } from "react";
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

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      storage.set(STORAGE_KEYS.STATE, state);
    }
  }, [state, isLoaded]);

  const resetState = () => {
    setState(INITIAL_STATE);
    storage.remove(STORAGE_KEYS.STATE);
  };

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return { state, setState, updateState, resetState, isLoaded };
};
