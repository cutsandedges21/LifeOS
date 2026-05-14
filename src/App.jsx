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
import { getPageAccent, getPageTint } from "./theme/index.js";
import { dayStr, timeStr, getTodayDay } from "./utils/formatters.js";

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      throw new Error(`HTTP error: ${res.status}`);
    }

    const d = await res.json();
    if (d.error) {
      console.error("Gemini Error:", d.error);
      return `Overseer Error: ${d.error.message}`;
    }
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "…";
  } catch (error) {
    console.error("Overseer API error:", error);
    return "Sorry, I'm having trouble connecting. Try again later.";
  }
}

// Nav Icons
const HomeIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const FinIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="22" height="30" viewBox="0 0 24 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h6l-6 8h6" />
    <path d="M14 10h6l-6 8h6" />
  </svg>
);

const GymIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-3M6 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3M6 5v14M18 5v14M6 12h12" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="30" viewBox="0 0 24 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  const chatRef = useRef(null);
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


  // Overseer send
  const sendMsg = async (msgOverride) => {
    const msg = (typeof msgOverride === "string" ? msgOverride : state.overseerInput).trim();
    if (!msg || overseerLoading) return;
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

  const pageAccent = getPageAccent(tab);
  const pageTint = getPageTint(tab);

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080810",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F8FAFF",
          fontFamily: "var(--font-sans)",
        }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          LIFEOS
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        fontFamily: "var(--font-sans)",
        color: "#F8FAFF",
        paddingBottom: "100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatedBackground pageAccent={pageAccent} />

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
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "8px 16px",
            border: `1px solid rgba(255, 255, 255, 0.1)`,
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
              color: "rgba(248, 250, 255, 0.4)",
              letterSpacing: "0.05em"
            }}>
              {dayStr().toUpperCase()}
            </span>
            <div style={{ width: "1px", height: "12px", background: "rgba(255, 255, 255, 0.15)" }} />
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
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#F8FAFF", opacity: 0.8, fontFamily: "var(--font-mono)" }}>
              {timeStr()}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Mini Health Bar Overlay — mirrors the 4 hero metrics: DAY, RECOVERY, STREAK, GOALS */}
      <div className="health-strip" style={{ paddingTop: "16px" }}>
      <div style={{ padding: "0 20px", display: "flex", gap: "12px", alignItems: "center", overflowX: "auto", scrollbarWidth: "none" }}>
        {[
          { label: "DAY", val: `${pct}%`, color: "#7C6DFA" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display: "flex", gap: "4px", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(248, 250, 255, 0.4)", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color }}>{val}</span>
          </div>
        ))}

        {/* Sleep — keeps the animated ring for visual interest */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.05)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <svg width="18" height="18" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
            <motion.circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke={state.whoop.sleep >= 80   ? "#34D399" : state.whoop.sleep >= 55 ? "#FBBF24" : state.whoop.sleep >= 34 ? "#7C6DFA" : "#F87171"}
              strokeWidth="3"
              strokeDasharray="88"
              initial={{ strokeDashoffset: 88 }}
              animate={{ strokeDashoffset: 88 * (1 - state.whoop.sleep / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(248, 250, 255, 0.4)", letterSpacing: "0.05em" }}>SLEEP</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#34D399" }}>{state.whoop.sleep}%</span>
        </div>

        {[
          { label: "STREAK", val: `${state.streak}D`, color: "#FBBF24" },
          { label: "GOALS", val: `${state.goals.filter(g => g.done).length}/${state.goals.length}`, color: "#22D3EE" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display: "flex", gap: "4px", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(248, 250, 255, 0.4)", letterSpacing: "0.05em" }}>{label}</span>
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

      {/* Bottom Nav - CircleMenu */}
      <CircleMenu
        activeId={tab}
        onSelect={setTab}
        items={[
          { id: "health", label: "Sleep", icon: <ZzzIcon />, color: "#F87171", labelAbove: true, labelLeftSide: true },
          { id: "finances", label: "Finances", icon: <FinIcon />, color: "#34D399", labelAbove: true, labelLeftSide: true },
          { id: "brand", label: "Brand", icon: <BrandIcon />, color: "#22D3EE", hidden: true },
          { id: "main", label: "Home", icon: <HomeIcon />, color: "#7C6DFA", labelAbove: true },
          { id: "gym", label: "Gym", icon: <GymIcon />, color: "#FBBF24", labelAbove: true },
          { id: "settings", label: "Settings", icon: <SettingsIcon />, color: "#94A3B8", labelAbove: true },
        ]}
      />
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


      {/* User Info */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          PROFILE
        </div>
        <div>
          <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", display: "block", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
            YOUR NAME
          </label>
          <input
            type="text"
            value={state.user}
            onChange={(e) => setState((prev) => ({ ...prev, user: e.target.value }))}
            placeholder="Your name"
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "14px",
              padding: "14px",
              color: "#F8FAFF",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Schedule */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
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

      {/* Skipped Gym History */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          REASONS WHY I SKIPPED THE GYM
        </div>

        {(!state.gymSkips || state.gymSkips.length === 0) ? (
          <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.4)", textAlign: "center", padding: "20px 0" }}>
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
                <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.65)", fontStyle: "italic", lineHeight: 1.4 }}>
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
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          SKIPPED / MISSED GOALS
        </div>
        
        {(!state.missedGoalsHistory || state.missedGoalsHistory.length === 0) ? (
          <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.4)", textAlign: "center", padding: "20px 0" }}>
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
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFF" }}>{item.text}</div>
                  <div style={{ fontSize: "9px", color: "#F87171", fontFamily: "var(--font-mono)" }}>{item.date}</div>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(248, 250, 255, 0.4)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{item.reason}"
                </div>
              </div>
            ))}
          </div>
        )}
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
            <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.4)", marginBottom: "16px" }}>
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
                style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "transparent", color: "#F8FAFF", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", fontSize: "11px", color: "rgba(248, 250, 255, 0.4)", marginTop: "24px", fontFamily: "var(--font-mono)" }}>
        LIFEOS V3.0.0
      </div>
    </div>
  );
}
