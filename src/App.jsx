import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLifeOSState } from "./hooks/useLifeOSState.js";
import { MainPage, OVERSEER_SYSTEM_PROMPT } from "./components/MainPage.jsx";
import { FinancesPage } from "./components/FinancesPage.jsx";
import { BrandPage } from "./components/BrandPage.jsx";
import { HealthPage } from "./components/HealthPage.jsx";
import { GymPage } from "./components/GymPage.jsx";
import { HabitsPage } from "./components/HabitsPage.jsx";
import { AccountPage } from "./components/AccountPage.jsx";
import { PageSkeleton } from "./components/SkeletonLoader.jsx";
import { AnimatedBackground } from "./components/AnimatedBackground.jsx";
import { CircleMenu } from "./components/CircleMenu.jsx";
import { Celebration } from "./components/Celebration.jsx";
import { Clock } from "./components/Clock.jsx";
import { getPageAccent, getPageTint, cssVarsForTheme } from "./theme/index.js";
import { dayStr, getTodayDay, todayISO, isoFromDate } from "./utils/formatters.js";
import {
  buildTodaySnapshot,
  upsertSnapshot,
  snapshotsEqual,
  computeNetWorth,
} from "./utils/snapshots.js";
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
    return d.text ?? "…";
  } catch (error) {
    console.error("Overseer API error:", error);
    return `Overseer offline: ${error.message || "unknown error"}`;
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

// Account / user silhouette — used for the Account page
const AccountIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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
  const [tab, setTab] = useState("main");
  const [time, setTime] = useState(new Date());
  const [overseerLoading, setOverseerLoading] = useState(false);
  const [greeting, setGreeting] = useState(GREETINGS[0]);
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
  const pct = Math.floor((time.getHours() * 60 + time.getMinutes()) / 14.4);

  useEffect(() => {
    if (tab === "main") {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    }
  }, [tab]);

  // Background ticker. Used only for coarse-grained day/hour rollover
  // detection and the day-progress %, neither of which needs sub-minute
  // precision. The live seconds display lives in its own <Clock /> below
  // so it doesn't drag the whole tree into a per-second re-render —
  // that was the cause of mobile scroll stutter.
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
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
        lastStreakCheck: today,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, time.toDateString(), state.gymVisits]);

  // Goals midnight reset — clears state.goals at the start of each new day.
  // First boot just stamps the date (no clearing) so we don't surprise the user.
  useEffect(() => {
    if (!isLoaded) return;
    const today = todayISO();
    if (state.lastGoalsReset === today) return;

    setState((prev) => {
      if (!prev.lastGoalsReset) {
        return { ...prev, lastGoalsReset: today };
      }
      return { ...prev, goals: [], lastGoalsReset: today };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, time.toDateString()]);

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
      overseerMessageCount: prev.overseerMessageCount + 1, // Increment message count
    }));
    setOverseerLoading(true);

    const completedGoals = state.goals.filter((g) => g.done).length;
    const totalRevenue = state.businesses.reduce((s, b) => s + b.revenue, 0);
    const totalProfit = state.businesses.reduce((s, b) => s + (b.revenue - b.expenses), 0);

    // Last 5 journal entries — gives Overseer recent self-reported context
    // ("yesterday you said you were drained — today you still showed up").
    const recentJournal = (state.journalEntries || [])
      .slice(-5)
      .map((j) => `${j.date}: ${j.text}`);

    const ctx = {
      date: dayStr(),
      goals: `${completedGoals}/${state.goals.length} done`,
      streak: state.streak,
      recovery: state.whoop.recovery,
      revenue: totalRevenue,
      profit: totalProfit,
      netWorth: state.finances.netWorth,
      recentJournal,
    };

    const apiMessages = [
      ...state.overseerLog.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
      userMsg,
    ];

    const reply = await askOverseer(apiMessages, ctx, OVERSEER_SYSTEM_PROMPT);
    setState((prev) => ({
      ...prev,
      overseerLog: [...prev.overseerLog, { role: "ai", text: reply }],
    }));
    setOverseerLoading(false);
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
    account: "#60A5FA",
    settings: "#94A3B8",
  };

  if (!isLoaded) {
    return <PageSkeleton />;
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
            {tab === "account" && (
              <AccountPage
                state={state}
                auth={auth}
                syncStatus={syncStatus}
                lastSyncedAt={lastSyncedAt}
                syncError={syncError}
              />
            )}
            {tab === "settings" && (
              <SettingsPage
                state={state}
                setState={setState}
                resetState={resetState}
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
          { id: "account", label: "Account", icon: <AccountIcon />, color: pageAccents.account, labelAbove: true },
          { id: "gym", label: "Gym", icon: <GymIcon />, color: "#FBBF24", labelAbove: true },
          { id: "settings", label: "Settings", icon: <SettingsIcon />, color: "#94A3B8", labelAbove: true },
        ]}
      />
    </div>
  );
}

// Install + notifications. Two responsibilities, one card because they're
// the "make this feel like a real app" cluster — both PWA features and both
// only matter at first run.
function InstallAndNotificationsCard({ state, setState }) {
  const [notifPerm, setNotifPerm] = useState(notificationStatus());
  const [installAvailable, setInstallAvailable] = useState(canInstall());
  const [installed, setInstalled] = useState(isStandalone());

  // The beforeinstallprompt event fires asynchronously after page load. Listen
  // for our utility's rebroadcast so the button can light up when available.
  useEffect(() => {
    const onAvailable = () => setInstallAvailable(true);
    const onInstalled = () => {
      setInstallAvailable(false);
      setInstalled(true);
    };
    window.addEventListener("lifeos:install-available", onAvailable);
    window.addEventListener("lifeos:installed", onInstalled);
    return () => {
      window.removeEventListener("lifeos:install-available", onAvailable);
      window.removeEventListener("lifeos:installed", onInstalled);
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (state.notificationsEnabled) {
      setState((p) => ({ ...p, notificationsEnabled: false }));
      return;
    }
    const result = await requestNotificationPermission();
    setNotifPerm(notificationStatus());
    if (result === "granted") {
      setState((p) => ({ ...p, notificationsEnabled: true }));
      // Fire a confirmation ping so the user sees it works.
      showNotification("Overseer wired up", "You'll get a 9am check-in daily. Sub renewals get a heads-up too.", { tag: "lifeos-welcome" });
    }
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") setInstallAvailable(false);
  };

  const permLabel =
    notifPerm === "granted" ? "GRANTED" :
    notifPerm === "denied" ? "BLOCKED" :
    notifPerm === "unsupported" ? "UNSUPPORTED" : "NOT SET";
  const permColor =
    notifPerm === "granted" ? "#34D399" :
    notifPerm === "denied" ? "#F87171" :
    "var(--text-faint)";

  // Hide the install row entirely once the user is already running standalone —
  // there's nothing to install at that point and "Already installed" reads
  // cleaner than a disabled button.
  const showInstall = !installed;

  return (
    <div
      style={{
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "20px",
        marginBottom: "16px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
        APP & NOTIFICATIONS
      </div>

      {/* Notifications row */}
      <div style={{ marginBottom: showInstall ? "16px" : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
            Daily Overseer ping
          </div>
          <div style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            color: permColor,
            fontWeight: 700,
          }}>
            {permLabel}
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
          9am check-in with streak, habits, and goals — plus a 3-day heads-up before any subscription renews. Best results when LifeOS is installed to your home screen.
        </div>
        <button
          onClick={handleToggleNotifications}
          disabled={notifPerm === "denied" || notifPerm === "unsupported"}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: state.notificationsEnabled
              ? "1px solid rgba(52,211,153,0.4)"
              : "1px solid var(--border)",
            background: state.notificationsEnabled
              ? "rgba(52,211,153,0.12)"
              : "var(--card-mid)",
            color: state.notificationsEnabled ? "#34D399" : "var(--text)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: (notifPerm === "denied" || notifPerm === "unsupported") ? "not-allowed" : "pointer",
            opacity: (notifPerm === "denied" || notifPerm === "unsupported") ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          {state.notificationsEnabled ? "✓ Notifications ON" :
           notifPerm === "denied" ? "Blocked in browser settings" :
           notifPerm === "unsupported" ? "Not supported here" :
           "Enable notifications"}
        </button>
      </div>

      {/* Install row */}
      {showInstall && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
              Install LifeOS
            </div>
            <div style={{
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              color: installAvailable ? "#34D399" : "var(--text-faint)",
              fontWeight: 700,
            }}>
              {installAvailable ? "READY" : "USE BROWSER MENU"}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
            Add to your home screen — runs like a native app, opens straight to your dashboard. On iPhone: Safari → Share → Add to Home Screen.
          </div>
          <button
            onClick={handleInstall}
            disabled={!installAvailable}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: installAvailable
                ? "1px solid rgba(var(--accent-main-rgb),0.5)"
                : "1px solid var(--border)",
              background: installAvailable
                ? "linear-gradient(135deg, var(--accent-main), rgba(var(--accent-main-rgb),0.75))"
                : "var(--card-mid)",
              color: installAvailable ? "#fff" : "var(--text-faint)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: installAvailable ? "pointer" : "not-allowed",
              opacity: installAvailable ? 1 : 0.7,
              fontFamily: "inherit",
            }}
          >
            {installAvailable ? "Install to Home Screen" : "Open browser's install menu"}
          </button>
        </div>
      )}

      {installed && (
        <div style={{
          marginTop: "12px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.25)",
          fontSize: "12px",
          color: "#34D399",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
          textAlign: "center",
        }}>
          ✓ RUNNING AS INSTALLED APP
        </div>
      )}
    </div>
  );
}

// Three-card theme picker. Each card paints itself with its own theme's
// accent + bg as a live preview swatch so the user sees exactly what they're
// switching to. Stacks on narrow screens via auto-fit grid.
function AppearanceCard({ theme, onChange }) {
  const options = [
    { id: "dark",     label: "Dark",     accent: "#7C6DFA", bg: "#080810", text: "#F8FAFF", tagline: "Deep space + indigo glow" },
    { id: "light",    label: "Light",    accent: "#F97316", bg: "#FAFAF7", text: "#1A1A1F", tagline: "Soft white + vibrant orange" },
    { id: "midnight", label: "Midnight", accent: "#10B981", bg: "#03060B", text: "#E8FFF4", tagline: "Pure black + emerald CRT" },
  ];
  return (
    <div
      style={{
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "20px",
        marginBottom: "16px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
        APPEARANCE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {options.map((opt) => {
          const selected = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                background: opt.bg,
                color: opt.text,
                border: `2px solid ${selected ? opt.accent : "var(--border)"}`,
                borderRadius: "16px",
                padding: "14px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: selected ? `0 0 18px ${opt.accent}55` : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: opt.accent, boxShadow: `0 0 8px ${opt.accent}aa` }} />
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{opt.label}</span>
                {selected && (
                  <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "var(--font-mono)", color: opt.accent, letterSpacing: "0.1em" }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.65 }}>
                {opt.tagline}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SettingsPage({ state, setState, resetState }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div style={{ padding: "clamp(14px, 4.5vw, 20px)" }}>
      <div style={{ fontSize: "32px", fontWeight: 900, marginBottom: "24px", letterSpacing: "-0.02em" }}>
        Settings
      </div>

      {/* Appearance — theme switcher */}
      <AppearanceCard
        theme={state.theme || "dark"}
        onChange={(t) => setState((prev) => ({ ...prev, theme: t }))}
      />

      {/* Install + Notifications */}
      <InstallAndNotificationsCard state={state} setState={setState} />

      {/* User Info */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          PROFILE
        </div>
        <div>
          <label style={{ fontSize: "10px", color: "var(--text-faint)", display: "block", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
            YOUR NAME
          </label>
          <input
            type="text"
            value={state.user}
            onChange={(e) => setState((prev) => ({ ...prev, user: e.target.value }))}
            placeholder="Your name"
            style={{
              width: "100%",
              background: "var(--input)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "14px",
              color: "var(--text)",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Schedule
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          SCHEDULE
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", display: "block", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>WAKE TIME</label>
            <input
              type="time"
              value={state.settings?.wakeTime || "08:00"}
              onChange={(e) => setState(p => ({ ...p, settings: { ...p.settings, wakeTime: e.target.value } }))}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "14px",
                color: "#F8FAFF",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", display: "block", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>SLEEP TIME</label>
            <input
              type="time"
              value={state.settings?.sleepTime || "00:00"}
              onChange={(e) => setState(p => ({ ...p, settings: { ...p.settings, sleepTime: e.target.value } }))}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "14px",
                color: "#F8FAFF",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>
       */}

      {/* Skipped Gym History */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          REASONS WHY I SKIPPED THE GYM
        </div>

        {(!state.gymSkips || state.gymSkips.length === 0) ? (
          <div style={{ fontSize: "13px", color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>
            No gym skips logged. Stay consistent.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {state.gymSkips.map((item) => (
              <div key={item.id} style={{
                background: "rgba(248, 113, 113, 0.05)",
                border: "1px solid rgba(248, 113, 113, 0.15)",
                borderRadius: "16px",
                padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#F87171", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                    GYM SKIPPED
                  </div>
                  <div style={{ fontSize: "9px", color: "#F87171", fontFamily: "var(--font-mono)" }}>{item.date}</div>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{item.reason}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missed Goals History */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          SKIPPED / MISSED GOALS
        </div>
        
        {(!state.missedGoalsHistory || state.missedGoalsHistory.length === 0) ? (
          <div style={{ fontSize: "13px", color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>
            No missed goals yet. Keep it up!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {state.missedGoalsHistory.map((item) => (
              <div key={item.id} style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "16px",
                padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{item.text}</div>
                  <div style={{ fontSize: "9px", color: "#F87171", fontFamily: "var(--font-mono)" }}>{item.date}</div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-faint)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{item.reason}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About & How to Use */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          ABOUT & HOW TO USE
        </div>

        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
          Welcome to LifeOS
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.55, marginBottom: "20px" }}>
          LifeOS is your personal accountability dashboard. Track your goals, sleep, finances, and gym — all in one place. The Overseer keeps you honest, calls out the slips, and rewards the wins.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            {
              accent: "var(--accent-main)",
              label: "HOME",
              title: "Daily flow + Overseer",
              body: "See your day at a glance. Check off tasks, hit your habits, and chat with the Overseer — a brutally honest AI coach that knows your full context.",
            },
            {
              accent: "#F87171",
              label: "SLEEP",
              title: "Wake / Sleep Tracking",
              body: "Log when you went to bed and when you got up. Grow your sleep score. Hit 8+ hours for a full recovery.",
            },
            {
              accent: "#34D399",
              label: "FINANCES",
              title: "Income, Expenses, Net worth",
              body: "Track money in and money out. Set savings goals and watch your monthly expenses shrink. Numbers don't lie.",
            },
            {
              accent: "#FBBF24",
              label: "GYM",
              title: "Workouts + Skip Log",
              body: "Log sessions. If you skip, you have to write down why. Those excuses show up here in Settings so you can see your patterns.",
            },
            {
              accent: "var(--text-muted)",
              label: "SETTINGS",
              title: "Name, History, Reset",
              body: "Edit your name, review every skipped gym session and missed goal, and reset everything from the Danger Zone if you need a fresh start.",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{item.title}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: item.accent, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                  {item.label}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {item.body}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: "rgba(248, 113, 113, 0.05)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid rgba(248, 113, 113, 0.15)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "#F87171", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          DANGER ZONE
        </div>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              background: "transparent",
              color: "#F87171",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset All Data
          </button>
        ) : (
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-faint)", marginBottom: "16px" }}>
              Permanent deletion. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { resetState(); setShowResetConfirm(false); }}
                style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: "#F87171", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", fontSize: "11px", color: "var(--text-faint)", marginTop: "24px", fontFamily: "var(--font-mono)" }}>
        LIFEOS V3.0.0
      </div>
    </div>
  );
}
