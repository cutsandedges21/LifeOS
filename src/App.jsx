import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLifeOSState } from "./hooks/useLifeOSState.js";
import { MainPage } from "./components/MainPage.jsx";
import { FinancesPage } from "./components/FinancesPage.jsx";
import { BrandPage } from "./components/BrandPage.jsx";
import { HealthPage } from "./components/HealthPage.jsx";
import { GymPage } from "./components/GymPage.jsx";
import { AnimatedBackground } from "./components/AnimatedBackground.jsx";
import { CircleMenu } from "./components/CircleMenu.jsx";
import { Celebration } from "./components/Celebration.jsx";
import { getPageAccent, getPageTint, cssVarsForTheme } from "./theme/index.js";
import { dayStr, timeStr, getTodayDay } from "./utils/formatters.js";
import {
  buildTodaySnapshot,
  upsertSnapshot,
  snapshotsEqual,
  computeNetWorth,
} from "./utils/snapshots.js";

const GREETINGS = [
  "Let's lock in,",
  "Welcome back,",
  "Ready for greatness,",
  "Pushing forward,",
  "Time to dominate,",
  "Stay focused,",
  "Consistency is key,",
];

// Google Gemini API for Overseer
async function askOverseer(messages, ctx, retries = 2) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  let ctxStr = "";
  try {
    ctxStr = JSON.stringify(ctx);
  } catch (e) {
    ctxStr = "{ error: 'context too complex' }";
  }

  const sys = `You are THE OVERSEER — brutally honest accountability AI. You know this person's full dashboard context: ${ctxStr}. 2-4 sentences max. Direct. No fluff. Call them out when slipping. Brief praise for real wins.`;

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === "ai" || m.role === "assistant" ? "model" : "user",
            parts: [{ text: String(m.content ?? m.text ?? "") }],
          })),
          system_instruction: { parts: [{ text: sys }] },
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
        }),
      }
    );

    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.warn("Rate limited, retrying in 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        return askOverseer(messages, ctx, retries - 1);
      }
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error?.message) detail = errBody.error.message;
      } catch (_) {
        // body not JSON — keep status-only detail
      }
      throw new Error(detail);
    }

    const d = await res.json();
    if (d.error) {
      console.error("Gemini Error:", d.error);
      return `Overseer Error: ${d.error.message}`;
    }
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "…";
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

const SettingsIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 23" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const todayISO = () => new Date().toISOString().slice(0, 10);

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
    const iso = day.toISOString().slice(0, 10);
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
  const { state, setState, resetState, isLoaded } = useLifeOSState();
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

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
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

  // Dynamic Overseer message cap. Default 3/day; relaxes to 10 when the user
  // is clearly slipping (broken streak, poor recovery, or any missed goal
  // today) — those are exactly the moments where talking to the coach more
  // is the helpful thing, not a punishment.
  const isSlipping =
    state.streak === 0 ||
    (state.whoop?.recovery > 0 && state.whoop.recovery < 40) ||
    (state.goals || []).some((g) => g.missed);
  const overseerCap = isSlipping ? 10 : 3;

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

    const ctx = {
      date: dayStr(),
      goals: `${completedGoals}/${state.goals.length} done`,
      streak: state.streak,
      recovery: state.whoop.recovery,
      revenue: totalRevenue,
      profit: totalProfit,
      netWorth: state.finances.netWorth,
    };

    const apiMessages = [
      ...state.overseerLog.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
      userMsg,
    ];

    const reply = await askOverseer(apiMessages, ctx);
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
    settings: "#94A3B8",
  };

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {isMobile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "0.1em" }}
          >
            LIFEOS
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "0.1em" }}
          >
            LIFEOS
          </motion.div>
        )}
      </div>
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
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", opacity: 0.8, fontFamily: "var(--font-mono)" }}>
              {timeStr()}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Mini Health Bar Overlay — mirrors the 4 hero metrics: DAY, RECOVERY, STREAK, GOALS */}
      <div className="health-strip" style={{ paddingTop: "24px", paddingBottom: "16px" }}>
      <div style={{ padding: "0 20px", display: "flex", gap: "12px", alignItems: "center", overflowX: "auto", scrollbarWidth: "none" }}>
        {[
          { label: "DAY", val: `${pct}%`, color: "var(--accent-main)" },
          { label: "SLEEP", val: `${state.whoop.sleep}%`, color: "#34D399" },
          { label: "STREAK", val: `${state.streak}D`, color: "#FBBF24" },
          { label: "GOALS", val: `${state.goals.filter(g => g.done).length}/${state.goals.length}`, color: "#22D3EE" },
        ].map(({ label, val, color }) => (
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
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
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
              />
            )}
            {tab === "finances" && <FinancesPage state={state} setState={setState} />}
            {tab === "brand" && <BrandPage state={state} setState={setState} />}
            {tab === "health" && <HealthPage state={state} setState={setState} />}
            {tab === "gym" && <GymPage state={state} setState={setState} />}
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

      {/* Bottom Nav - CircleMenu */}
      <CircleMenu
        activeId={tab}
        onSelect={setTab}
        items={[
          { id: "health", label: "Sleep", icon: <ZzzIcon />, color: "#F87171", labelAbove: true, labelLeftSide: true },
          { id: "finances", label: "Finances", icon: <FinIcon />, color: "#34D399", labelAbove: true, labelLeftSide: true },
          { id: "brand", label: "Brand", icon: <BrandIcon />, color: "#22D3EE", hidden: true },
          { id: "main", label: "Home", icon: <HomeIcon />, color: pageAccents.main, labelAbove: true },
          { id: "gym", label: "Gym", icon: <GymIcon />, color: "#FBBF24", labelAbove: true },
          { id: "settings", label: "Settings", icon: <SettingsIcon />, color: "#94A3B8", labelAbove: true },
        ]}
      />
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
