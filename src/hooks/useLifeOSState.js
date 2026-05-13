import { useState, useEffect } from "react";
import { storage, STORAGE_KEYS } from "../utils/storage.js";

const INITIAL_STATE = {
  user: "",
  workoutDay: "",
  whoop: { recovery: 0, sleep: 0, strain: 0, hrv: 0, rhr: 0, status: "gray", advice: "" },
  goals: [],
  streak: 0,
  finances: {
    netWorth: 0,
    assets: 0,
    liabilities: 0,
    subs: [],
    orders: [],
    budget: [],
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
