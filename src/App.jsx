import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLifeOSState } from "./hooks/useLifeOSState.js";
import { useFriends } from "./hooks/useFriends.js";
import { MainPage, OVERSEER_SYSTEM_PROMPT } from "./components/MainPage.jsx";
import { FinancesPage } from "./components/FinancesPage.jsx";
import { BrandPage } from "./components/BrandPage.jsx";
import { HealthPage } from "./components/HealthPage.jsx";
import { GymPage } from "./components/GymPage.jsx";
import { HabitsPage } from "./components/HabitsPage.jsx";
import { FriendsPage } from "./components/FriendsPage.jsx";
import { SettingsPage } from "./components/SettingsPage.jsx";
import { IntroAnimation } from "./components/IntroAnimation.jsx";
import { PageSkeleton } from "./components/SkeletonLoader.jsx";
import { AnimatedBackground } from "./components/AnimatedBackground.jsx";
import { CircleMenu } from "./components/CircleMenu.jsx";
import { Celebration } from "./components/Celebration.jsx";
import { Clock } from "./components/Clock.jsx";
import { LegalPage } from "./components/LegalPage.jsx";
import { Toggle } from "./components/UI.jsx";
import { legalDocs } from "./content/legal.js";
import { useClickSound } from "./hooks/useClickSound.js";
import { playClick } from "./utils/sound.js";
import { getPageAccent, getPageTint, cssVarsForTheme } from "./theme/index.js";
import { dayStr, getTodayDay, todayISO, isoFromDate } from "./utils/formatters.js";
import {
  buildTodaySnapshot,
  upsertSnapshot,
  snapshotsEqual,
  computeNetWorth,
} from "./utils/snapshots.js";
import { applyOverseerAction, ACTION_KINDS } from "./utils/overseerActions.js";
import {
  notificationStatus,
  requestNotificationPermission,
  showNotification,
  scheduleDailyReminder,
  cancelDailyReminder,
  upcomingRenewals,
  isStandalone,
  canInstall,
  promptInstall,
} from "./utils/notifications.js";

const GREETINGS = [
  "Let's lock in,",
  "Welcome back,",
  "Ready for greatness,",
  "Pushing forward,",
  "Time to dominate,",
  "Stay focused,",
  "Consistency is key,",
];

// Overseer chat — calls our own /api/overseer serverless function,
// which holds the Gemini API key server-side. The key never reaches
// the browser bundle. The system prompt is defined in MainPage.jsx
// (OVERSEER_SYSTEM_PROMPT) and sent through with each call so the
// instructions live next to the UI they power.
// Returns { reply, action } — `action` is a structured proposal the user can
// confirm to log into their account (or null). Errors degrade to a reply
// string with no action so the chat never hard-fails.
async function askOverseer(messages, ctx, systemPrompt, retries = 2) {
  try {
    const res = await fetch("/api/overseer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, ctx, systemPrompt }),
    });

    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.warn("Rate limited, retrying in 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        return askOverseer(messages, ctx, systemPrompt, retries - 1);
      }
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error) detail = errBody.error;
      } catch (_) {
        // body not JSON — keep status-only detail
      }
      throw new Error(detail);
    }

    const d = await res.json();
    return { reply: d.reply ?? d.text ?? "…", action: d.action ?? null };
  } catch (error) {
    console.error("Overseer API error:", error);
    return { reply: `Overseer offline: ${error.message || "unknown error"}`, action: null };
  }
}

// Nav Icons
const HomeIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const FinIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const BrandIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const ZzzIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 21" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h6l-6 8h6" />
    <path d="M14 10h6l-6 8h6" />
  </svg>
);

const GymIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 23" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-3M6 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3M6 5v14M18 5v14M6 12h12" />
  </svg>
);

// Habits icon — circular check, distinct from goals and gym icons
const HabitsIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// Friends / two-person icon — used for the Friends page
const FriendsIcon = () => (
  <svg width="24" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 23" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Streak = number of consecutive days ending today that have a gym visit.
// Walking backward from today, count each day with a matching entry in
// gymVisits[{date}]. The first gap (no visit) ends the streak. A skip counts
// as a gap because the user didn't go to the gym that day.
function computeStreak(visits) {
  const visitDates = new Set((visits || []).map((v) => v.date));
  let streak = 0;
  const day = new Date();
  day.setHours(0, 0, 0, 0);

  while (true) {
    const iso = isoFromDate(day);
    if (visitDates.has(iso)) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function LifeOS() {
  const {
    state,
    setState,
    resetState,
    isLoaded,
    auth,
    syncStatus,
    lastSyncedAt,
    syncError,
  } = useLifeOSState();
  // Friends hub — mounted here (not in FriendsPage) so realtime notifications
  // fire on any tab and the nav badge can read the pending-request count.
  const friendsHub = useFriends(auth);
  const [tab, setTab] = useState("main");
  const [time, setTime] = useState(new Date());
  const [overseerLoading, setOverseerLoading] = useState(false);
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  // Intro overlay. Shown once per browser session on first load, and again
  // after a successful sign-in / sign-up. Gated by sessionStorage so a tab
  // refresh inside the same session doesn't replay it.
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("lifeos.introShown") !== "1";
    } catch {
      return true;
    }
  });
  const prevAuthStatusRef = useRef(auth?.status);
  // Active celebration event (one at a time). Set by the detection effect
  // below; cleared by Celebration's auto-dismiss or user tap.
  const [celebration, setCelebration] = useState(null);
  const chatRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Global click sounds — one document-level listener ticks on any control
  // press while enabled (default on; muted from Settings → Sound).
  useClickSound(state.soundEnabled !== false);

  const pct = Math.floor((time.getHours() * 60 + time.getMinutes()) / 14.4);

  useEffect(() => {
    if (tab === "main") {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    }
  }, [tab]);

  // Replay the intro when auth status transitions into "signed-in" — covers
  // both fresh sign-ins and sign-ups, since signup also flips status once the
  // session is created.
  useEffect(() => {
    const prev = prevAuthStatusRef.current;
    if (prev !== "signed-in" && auth?.status === "signed-in") {
      setShowIntro(true);
    }
    prevAuthStatusRef.current = auth?.status;
  }, [auth?.status]);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem("lifeos.introShown", "1");
    } catch {
      // sessionStorage blocked (e.g. private mode) — fine, just won't gate.
    }
    setShowIntro(false);
  };

  // Background ticker. Used only for coarse-grained day/hour rollover
  // detection and the day-progress %, neither of which needs sub-minute
  // precision. The live seconds display lives in its own <Clock /> below
  // so it doesn't drag the whole tree into a per-second re-render —
  // that was the cause of mobile scroll stutter.
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll the Overseer chat to the newest message — but ONLY when a
  // message is actually added. The first run (initial local hydrate) and the
  // cloud-pull state replacement on sign-in must NOT scroll, otherwise opening
  // the app dumps the user at the bottom (the AI chat) instead of the top.
  const prevOverseerLen = useRef(null);
  useEffect(() => {
    const len = state.overseerLog?.length || 0;
    if (prevOverseerLen.current === null) {
      // First observation (hydrate) — record length, don't scroll.
      prevOverseerLen.current = len;
      return;
    }
    if (len > prevOverseerLen.current) {
      chatRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevOverseerLen.current = len;
  }, [state.overseerLog]);

  // Theme — write CSS variables onto :root whenever theme changes.
  // Components read these via var(--token), so the swap is instant and
  // requires no rerender of consumers.
  useEffect(() => {
    const vars = cssVarsForTheme(state.theme || "dark");
    Object.entries(vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  }, [state.theme]);

  // One-time migration. Earlier builds stored "today" as a UTC date
  // (`new Date().toISOString().slice(0, 10)`), which silently broke every
  // daily reset for anyone whose UTC date already rolled before their local
  // midnight — overseer count stays at the cap, gym buttons keep saying
  // "skipped today", habit grid doesn't open a fresh column. Clearing the
  // three "last reset" stamps once forces the reset effects below to fire
  // with the correct local date and unblocks the day. Stamped via
  // `dateFormatVersion` so this only runs once per user.
  useEffect(() => {
    if (!isLoaded) return;
    if (state.dateFormatVersion === "local-v1") return;
    setState((prev) => ({
      ...prev,
      lastGoalsReset: "",
      lastOverseerReset: "",
      lastStreakCheck: "",
      overseerMessageCount: 0,
      dateFormatVersion: "local-v1",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Streak — recomputed from gymVisits whenever visits change or a new day starts.
  // Counts consecutive days ending today that have a visit. Missing a day
  // (no visit, whether skipped explicitly or just unanswered) resets to 0.
  useEffect(() => {
    if (!isLoaded) return;
    const today = todayISO();
    const newStreak = computeStreak(state.gymVisits);

    if (newStreak !== state.streak || state.lastStreakCheck !== today) {
      setState((prev) => ({
        ...prev,
        streak: newStreak,
        // Longest streak ever — used by the Friends comparison. Mirrors the
        // netWorthHigh "personal best" pattern; only ever increases.
        streakHigh: Math.max(prev.streakHigh || 0, newStreak),
        lastStreakCheck: today,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, time.toDateString(), state.gymVisits]);

  // Goals (the To-Do list) intentionally do NOT reset daily. The list is a
  // persistent to-do list now: items stay until the user completes or removes
  // them. (Previously this cleared state.goals at midnight — removed by request.)

  // Overseer message limit reset — resets message count at the start of each new day.
  useEffect(() => {
    if (!isLoaded) return;
    const today = todayISO();
    if (state.lastOverseerReset === today) return;

    setState((prev) => ({
      ...prev,
      overseerMessageCount: 0,
      lastOverseerReset: today,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, time.toDateString()]);

  // Overseer message cap. Hard limit, no flexibility — 3 messages per
  // user per day, full stop. Resets at midnight via the effect above.
  const overseerCap = 3;

  // ─── Daily snapshot upsert ─────────────────────────────────────────────
  // Today's row is rewritten on every relevant state change so trend charts
  // stay live; past days are frozen (we never touch them after the date
  // rolls over). Short-circuits via snapshotsEqual to avoid render loops.
  useEffect(() => {
    if (!isLoaded) return;
    const snap = buildTodaySnapshot(state);
    const existing = (state.historySnapshots || []).find((s) => s.date === snap.date);
    if (snapshotsEqual(existing, snap)) return;
    setState((prev) => ({
      ...prev,
      historySnapshots: upsertSnapshot(prev.historySnapshots, snap),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    state.streak,
    state.sleepEntries,
    state.gymVisits,
    state.goals,
    state.finances?.transactions,
    time.toDateString(),
  ]);

  // ─── Celebration detection ─────────────────────────────────────────────
  // Fires once per qualifying event; dedupes by writing celebrationsShown[key]
  // so the same milestone doesn't re-trigger on every render. Streak milestone
  // dedupe is keyed by ISO date so streaks that drop and re-hit can re-fire.
  useEffect(() => {
    if (!isLoaded || celebration) return;
    const today = todayISO();
    const shown = state.celebrationsShown || {};

    // Streak milestones — biggest one first so we don't celebrate 7 right
    // before celebrating 30.
    const MILESTONES = [365, 200, 100, 60, 30, 14, 7];
    for (const m of MILESTONES) {
      const key = `streak${m}`;
      if (state.streak >= m && shown[key] !== today) {
        setCelebration({
          emoji: "🔥",
          label: `${m}-DAY STREAK`,
          title: `${m} days in a row!`,
          message: `You've shown up ${m} days straight. That's not luck — that's identity.`,
          color: m >= 100 ? "#A855F7" : m >= 30 ? "#FBBF24" : "#10B981",
        });
        setState((p) => ({
          ...p,
          celebrationsShown: { ...(p.celebrationsShown || {}), [key]: today },
        }));
        return;
      }
    }

    // Perfect day — all goals done (require at least 3 to feel earned).
    const allGoalsKey = `allGoals_${today}`;
    const goals = state.goals || [];
    if (goals.length >= 3 && goals.every((g) => g.done) && !shown[allGoalsKey]) {
      setCelebration({
        emoji: "✅",
        label: "PERFECT DAY",
        title: "All goals crushed",
        message: `You went ${goals.length}-for-${goals.length} today. Now rest — you earned it.`,
        color: "#22D3EE",
      });
      setState((p) => ({
        ...p,
        celebrationsShown: { ...(p.celebrationsShown || {}), [allGoalsKey]: today },
      }));
      return;
    }

    // New net worth high — only celebrate after a baseline exists, so the
    // user's first transaction doesn't fire a "new record" popup.
    const nw = computeNetWorth(state);
    const prevHigh = state.netWorthHigh || 0;
    if (nw > prevHigh && prevHigh > 0 && nw >= 100) {
      setCelebration({
        emoji: "📈",
        label: "NEW NET WORTH HIGH",
        title: `$${nw.toLocaleString()}`,
        message: `Highest net worth on record. Keep stacking.`,
        color: "#34D399",
      });
      setState((p) => ({ ...p, netWorthHigh: nw }));
      return;
    }

    // Silently update the high-water mark when it grows but doesn't qualify
    // for a celebration (first-ever positive value, sub-$100 amounts).
    if (nw > prevHigh) {
      setState((p) => ({ ...p, netWorthHigh: nw }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    state.streak,
    state.goals,
    state.finances?.transactions,
    celebration,
  ]);

  // ─── Proactive Overseer nudge ──────────────────────────────────────────
  // After 6pm on workout days, if the user hasn't logged a gym visit or skip,
  // the Overseer drops a single message into the log. Once per day max.
  useEffect(() => {
    if (!isLoaded) return;
    const today = todayISO();
    if (state.proactiveNudgeShown === today) return;
    if (time.getHours() < 18) return;

    const todayDay = getTodayDay();
    const workoutToday = state.gymSplit?.[todayDay];
    if (!workoutToday || /^\s*rest\s*$/i.test(workoutToday)) return;

    const visited = (state.gymVisits || []).some((v) => v.date === today);
    const skipped = (state.gymSkips || []).some((s) => s.date === today);
    if (visited || skipped) return;

    setState((p) => ({
      ...p,
      overseerLog: [
        ...(p.overseerLog || []),
        {
          role: "ai",
          text: `It's past 6pm and you haven't logged today's ${workoutToday} session. What's the move — go now, or own the skip?`,
        },
      ],
      proactiveNudgeShown: today,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, time.getHours(), state.proactiveNudgeShown]);

  // ─── Daily Overseer notification (9am) ─────────────────────────────────
  // Only armed when the user has opted in AND browser permission is granted.
  // The setTimeout chain inside scheduleDailyReminder re-arms after each fire,
  // so this effect just owns the lifecycle (arm on toggle-on, cancel otherwise).
  useEffect(() => {
    if (!isLoaded) return;
    if (!state.notificationsEnabled) {
      cancelDailyReminder();
      return;
    }
    if (notificationStatus() !== "granted") {
      cancelDailyReminder();
      return;
    }

    scheduleDailyReminder({
      hour: 9,
      minute: 0,
      onFire: () => {
        const goalsCt = (state.goals || []).length;
        // Habits-today summary — pulled at fire time so it reflects the
        // latest state, not whatever was captured when the timer was armed.
        const habitsTotal = (state.habits || []).length;
        const todayIso = todayISO();
        const habitsDone = (state.habits || []).filter(
          (h) => state.habitCompletions?.[h.id]?.[todayIso]
        ).length;

        const dueSoon = upcomingRenewals(state.finances?.subs, 3);

        const lines = [];
        lines.push(`Streak: ${state.streak}d`);
        if (habitsTotal > 0) lines.push(`Habits: ${habitsDone}/${habitsTotal}`);
        if (goalsCt > 0) lines.push(`Goals: ${goalsCt} on board`);
        else lines.push("Set today's goals");

        // Add a renewal preview to the daily ping so the user sees the heads-up
        // even if they miss the dedicated per-sub notification later in the day.
        if (dueSoon.length > 0) {
          const first = dueSoon[0];
          const when =
            first.daysUntil === 0
              ? "today"
              : first.daysUntil === 1
                ? "tomorrow"
                : `in ${first.daysUntil}d`;
          if (dueSoon.length === 1) {
            lines.push(`${first.name} renews ${when}`);
          } else {
            lines.push(`${dueSoon.length} subs renewing soon (${first.name} ${when})`);
          }
        }

        showNotification("The Overseer", lines.join(" · "), {
          tag: "lifeos-daily",
        });
      },
    });
    return () => cancelDailyReminder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    state.notificationsEnabled,
    state.streak,
    state.goals?.length,
    state.habits?.length,
    state.finances?.subs,
  ]);

  // ─── Sub renewal notifier ──────────────────────────────────────────────
  // Once per day per sub, fire a notification when renewal is within the next
  // 3 days — gives the user time to actually cancel/swap before the charge
  // hits, not just a "good luck" heads-up on the day of. Dedupe via
  // subRenewalNotified[subId] = ISO date.
  useEffect(() => {
    if (!isLoaded) return;
    if (!state.notificationsEnabled) return;
    if (notificationStatus() !== "granted") return;

    const today = todayISO();
    const dueSoon = upcomingRenewals(state.finances?.subs, 3);
    if (dueSoon.length === 0) return;

    const alreadySent = state.subRenewalNotified || {};
    const newlySent = {};

    dueSoon.forEach((sub) => {
      if (alreadySent[sub.id] === today) return;
      const when =
        sub.daysUntil === 0
          ? "today"
          : sub.daysUntil === 1
            ? "tomorrow"
            : `in ${sub.daysUntil} days`;
      showNotification(
        `${sub.name} renews ${when}`,
        `$${Number(sub.cost || 0).toFixed(2)} hitting your card on ${sub.renews}.`,
        { tag: `lifeos-sub-${sub.id}` }
      );
      newlySent[sub.id] = today;
    });

    if (Object.keys(newlySent).length > 0) {
      setState((p) => ({
        ...p,
        subRenewalNotified: { ...(p.subRenewalNotified || {}), ...newlySent },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, state.notificationsEnabled, state.finances?.subs, time.toDateString()]);


  // Overseer send
  const sendMsg = async (msgOverride) => {
    const msg = (typeof msgOverride === "string" ? msgOverride : state.overseerInput).trim();
    if (!msg || overseerLoading) return;

    // Daily cap — relaxes when the user is slipping (see overseerCap above).
    if (state.overseerMessageCount >= overseerCap) {
      return;
    }

    const userMsg = { role: "user", content: msg };
    const newLog = [...state.overseerLog, { role: "user", text: msg }];
    setState((prev) => ({
      ...prev,
      overseerLog: newLog,
      overseerInput: msgOverride ? prev.overseerInput : "",
    }));
    setOverseerLoading(true);

    const completedGoals = state.goals.filter((g) => g.done).length;
    const totalRevenue = state.businesses.reduce((s, b) => s + b.revenue, 0);
    const totalProfit = state.businesses.reduce((s, b) => s + (b.revenue - b.expenses), 0);

    // Live habit + gym status for today, plus the *derived* net worth. The
    // raw state.finances.netWorth field is a vestigial 0 that nothing updates —
    // every other surface computes net worth from transactions, so the Overseer
    // must too or it reads $0 while the dashboard shows the real figure.
    const todayIso = todayISO();
    const habits = state.habits || [];
    const habitCompletions = state.habitCompletions || {};
    const habitsDone = habits.filter((h) => habitCompletions[h.id]?.[todayIso]).length;
    const wentGymToday = (state.gymVisits || []).some((v) => v.date === todayIso);
    const netWorth = computeNetWorth(state);

    // Last 5 journal entries — gives Overseer recent self-reported context
    // ("yesterday you said you were drained — today you still showed up").
    const recentJournal = (state.journalEntries || [])
      .slice(-5)
      .map((j) => `${j.date}: ${j.text}`);

    const ctx = {
      date: dayStr(),
      goals: `${completedGoals}/${state.goals.length} done`,
      habits: `${habitsDone}/${habits.length} done today`,
      streak: state.streak,
      sleep: `${state.whoop?.sleep ?? 0}%`,
      recovery: state.whoop?.recovery ?? 0,
      gymToday: wentGymToday ? "yes" : "no",
      revenue: totalRevenue,
      profit: totalProfit,
      netWorth,
      recentJournal,
    };

    const apiMessages = [
      ...state.overseerLog.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
      userMsg,
    ];

    const { reply, action } = await askOverseer(apiMessages, ctx, OVERSEER_SYSTEM_PROMPT);
    const hasAction = !!(action && ACTION_KINDS.includes(action.kind));
    setState((prev) => ({
      ...prev,
      overseerLog: [
        ...prev.overseerLog,
        hasAction
          ? { role: "ai", text: reply, action, actionStatus: "pending" }
          : { role: "ai", text: reply },
      ],
      // Logging is free: only a pure-chat reply costs one of the daily messages.
      overseerMessageCount: hasAction
        ? prev.overseerMessageCount
        : prev.overseerMessageCount + 1,
    }));
    setOverseerLoading(false);
  };

  // Confirm a proposed Overseer action: apply it to state and mark the chat
  // message done. Keyed by the message's index in overseerLog.
  const confirmOverseerAction = (logIndex) => {
    setState((prev) => {
      const entry = prev.overseerLog[logIndex];
      if (!entry?.action || entry.actionStatus !== "pending") return prev;
      const { ok, state: applied } = applyOverseerAction(entry.action, prev);
      const overseerLog = prev.overseerLog.map((m, i) =>
        i === logIndex ? { ...m, actionStatus: ok ? "done" : "error" } : m
      );
      return { ...applied, overseerLog };
    });
  };

  const dismissOverseerAction = (logIndex) => {
    setState((prev) => ({
      ...prev,
      overseerLog: prev.overseerLog.map((m, i) =>
        i === logIndex ? { ...m, actionStatus: "dismissed" } : m
      ),
    }));
  };

  const pageAccent = getPageAccent(tab, state.theme || "dark");
  const pageTint = getPageTint(tab, state.theme || "dark");

  // Brand-primary hex literal for the current theme — used in places where
  // a CSS var won't work (e.g. CircleMenu interpolates color into a hex+alpha
  // box-shadow string like `${color}80`).
  const ACCENT_HEX_BY_THEME = {
    dark:     "#7C6DFA",
    light:    "#F97316",
    midnight: "#10B981",
  };
  const accentMainHex = ACCENT_HEX_BY_THEME[state.theme || "dark"] || ACCENT_HEX_BY_THEME.dark;
  const pageAccents = {
    main: accentMainHex,
    finances: "#34D399",
    health: "#F87171",
    gym: "#FBBF24",
    brand: "#22D3EE",
    habits: "#A855F7",
    friends: "#60A5FA",
    settings: "#94A3B8",
  };

  if (!isLoaded) {
    return (
      <>
        <PageSkeleton />
        <AnimatePresence mode="wait">
          {showIntro && (
            <IntroAnimation
              key="intro"
              theme={state?.theme || "dark"}
              onComplete={handleIntroComplete}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "var(--font-sans)",
        color: "var(--text)",
        paddingBottom: "100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroAnimation
            key="intro"
            theme={state?.theme || "dark"}
            onComplete={handleIntroComplete}
          />
        )}
      </AnimatePresence>
      <AnimatedBackground pageAccent={pageAccent} isMobile={isMobile} />

      {/* Top Bar - Floating Glass Pill */}
      <div
        style={{
          position: "sticky",
          top: "12px",
          left: 0,
          right: 0,
          padding: "0 18px",
          zIndex: 100,
        }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            background: "var(--card-mid)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "8px 16px",
            border: `1px solid var(--border)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-faint)",
              letterSpacing: "0.05em"
            }}>
              {dayStr().toUpperCase()}
            </span>
            <div style={{ width: "1px", height: "12px", background: "var(--border-high)" }} />
            <span className="pill-workout" style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: pageAccent,
              fontWeight: 700,
              letterSpacing: "0.05em"
            }}>
              {state.gymSplit?.[getTodayDay()] || "REST"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Clock
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text)",
                opacity: 0.8,
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Mini Health Bar Overlay — mirrors the 4 hero metrics: DAY, RECOVERY, STREAK, GOALS */}
      <div className="health-strip" style={{ paddingTop: "24px", paddingBottom: "16px" }}>
      <div style={{ padding: "0 20px", display: "flex", gap: "12px", alignItems: "center", overflowX: "auto", scrollbarWidth: "none" }}>
        {(() => {
          const todayIso = todayISO();
          const habits = state.habits || [];
          const habitsDone = habits.filter(
            (h) => state.habitCompletions?.[h.id]?.[todayIso]
          ).length;
          return [
            { label: "DAY", val: `${pct}%`, color: "var(--accent-main)" },
            { label: "SLEEP", val: `${state.whoop.sleep}%`, color: "#34D399" },
            { label: "STREAK", val: `${state.streak}D`, color: "#FBBF24" },
            { label: "HABITS", val: `${habitsDone}/${habits.length}`, color: "#A855F7" },
            { label: "GOALS", val: `${state.goals.filter(g => g.done).length}/${state.goals.length}`, color: "#22D3EE" },
          ];
        })().map(({ label, val, color }) => (
          <div key={label} style={{ display: "flex", gap: "5px", alignItems: "center", background: "var(--card)", padding: "4px 10px", borderRadius: "20px", border: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-faint)", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>
      </div>

      {/* Page Content */}
      <main style={{ position: "relative", zIndex: 1, marginTop: "8px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "main" && (
              <MainPage
                state={state}
                setState={setState}
                pct={pct}
                overseerLoading={overseerLoading}
                sendMsg={sendMsg}
                onConfirmAction={confirmOverseerAction}
                onDismissAction={dismissOverseerAction}
                chatRef={chatRef}
                greeting={greeting}
                overseerCap={overseerCap}
                setTab={setTab}
              />
            )}
            {tab === "finances" && <FinancesPage state={state} setState={setState} />}
            {tab === "brand" && <BrandPage state={state} setState={setState} />}
            {tab === "health" && <HealthPage state={state} setState={setState} />}
            {tab === "gym" && <GymPage state={state} setState={setState} />}
            {tab === "habits" && <HabitsPage state={state} setState={setState} />}
            {tab === "friends" && (
              <FriendsPage hub={friendsHub} state={state} auth={auth} />
            )}
            {tab === "settings" && (
              <SettingsPage
                state={state}
                setState={setState}
                resetState={resetState}
                auth={auth}
                syncStatus={syncStatus}
                lastSyncedAt={lastSyncedAt}
                syncError={syncError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Celebration overlay — fires for streak milestones, perfect days,
          and new net worth highs. See celebration detection effect above. */}
      <Celebration event={celebration} onDismiss={() => setCelebration(null)} />

      {/* Bottom Nav - CircleMenu — 7 visible items keep Home at the apex
          (middle index of an odd-length half-circle arc). */}
      <CircleMenu
        activeId={tab}
        onSelect={setTab}
        items={[
          { id: "health", label: "Sleep", icon: <ZzzIcon />, color: "#F87171", labelAbove: true, labelLeftSide: true },
          { id: "finances", label: "Finances", icon: <FinIcon />, color: "#34D399", labelAbove: true, labelLeftSide: true },
          { id: "brand", label: "Brand", icon: <BrandIcon />, color: "#22D3EE", hidden: true },
          { id: "habits", label: "Habits", icon: <HabitsIcon />, color: pageAccents.habits, labelAbove: true, labelLeftSide: true },
          { id: "main", label: "Home", icon: <HomeIcon />, color: pageAccents.main, labelAbove: true },
          { id: "friends", label: "Friends", icon: <FriendsIcon />, color: pageAccents.friends, labelAbove: true, badge: friendsHub.pendingCount },
          { id: "gym", label: "Gym", icon: <GymIcon />, color: "#FBBF24", labelAbove: true },
          { id: "settings", label: "Settings", icon: <SettingsIcon />, color: "#94A3B8", labelAbove: true },
        ]}
      />
    </div>
  );
}
