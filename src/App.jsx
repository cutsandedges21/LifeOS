import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./hooks/useTheme.js";
import { useLifeOSState } from "./hooks/useLifeOSState.js";
import { MainPage } from "./components/MainPage.jsx";
import { FinancesPage } from "./components/FinancesPage.jsx";
import { BrandPage } from "./components/BrandPage.jsx";
import { HealthPage } from "./components/HealthPage.jsx";
import { GymPage } from "./components/GymPage.jsx";
import { wakeHrs, partOfDay, dayStr, timeStr } from "./utils/formatters.js";

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
async function askOverseer(messages, ctx) {
  const apiKey = "AIzaSyCHvyjkg7scj4AaCE5bupm-d4y73-Sc7lc";

  // Safe stringify for context
  let ctxStr = "";
  try {
    ctxStr = JSON.stringify(ctx);
  } catch (e) {
    // Fallback if circular
    ctxStr = "{ error: 'context too complex' }";
  }

  const sys = `You are THE OVERSEER — brutally honest accountability AI. You know this person's full dashboard context: ${ctxStr}. 2-4 sentences max. Direct. No fluff. Call them out when slipping. Brief praise for real wins.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === "ai" || m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content || m.text || "") }]
        })),
        system_instruction: {
          parts: [{ text: sys }]
        },
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        }
      }),
    });
    const d = await res.json();
    if (d.error) {
      console.error("Gemini Error:", d.error);
      return `[Overseer Error: ${d.error.message}]`;
    }
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "…";
  } catch (error) {
    console.error("Overseer API error:", error);
    return "Sorry, I'm having trouble connecting. Try again later.";
  }
}

// Nav Icons
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const FinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const BrandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const GymIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export default function LifeOS() {
  const { theme, currentTheme, toggleTheme, setThemeMode } = useTheme();
  const { state, setState, resetState, isLoaded } = useLifeOSState();
  const [tab, setTab] = useState("main");
  const [time, setTime] = useState(new Date());
  const [overseerLoading, setOverseerLoading] = useState(false);
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const chatRef = useRef(null);

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

  // Apply theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    const spacing = currentTheme.spacing;
    const borderRadius = currentTheme.borderRadius;
    const typography = currentTheme.typography;

    // Set CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, `${value}px`);
    });
    Object.entries(borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, `${value}px`);
    });
    Object.entries(typography.fontFamily).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });
    Object.entries(typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });
    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value);
    });
  }, [currentTheme]);

  // Overseer send
  const sendMsg = async (msgOverride) => {
    const msg = (typeof msgOverride === "string" ? msgOverride : state.overseerInput).trim();
    if (!msg || overseerLoading) return;
    const userMsg = { role: "user", content: msg };
    const newLog = [...state.overseerLog, { role: "user", text: msg }];
    setState((prev) => ({ ...prev, overseerLog: newLog, overseerInput: msgOverride ? prev.overseerInput : "" }));
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
    setState((prev) => ({ ...prev, overseerLog: [...prev.overseerLog, { role: "ai", text: reply }] }));
    setOverseerLoading(false);
  };

  // Derived values
  const { pct, leftStr } = wakeHrs(state.settings);
  const pod = partOfDay(pct);

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        fontFamily: "var(--font-sans)",
        color: "var(--color-text)",
        paddingBottom: "70px",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          padding: "14px 18px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
            {dayStr()}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-xs)",
              color: "var(--color-accent)",
              fontWeight: 600,
            }}
          >
            {state.workoutDay || "REST"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>{timeStr()}</span>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            whileHover={{ rotate: 15 }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              padding: 0,
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </motion.button>
        </div>
      </div>

      {/* Health Bar (top strip) */}
      <div style={{ margin: "10px 18px 0", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <svg width="28" height="28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-border)" strokeWidth="3" />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke={state.whoop.recovery >= 67 ? "var(--color-success)" : state.whoop.recovery >= 34 ? "var(--color-accent)" : "var(--color-danger)"}
              strokeWidth="3"
              strokeDasharray="69.1"
              strokeDashoffset={69.1 * (1 - state.whoop.recovery / 100)}
              strokeLinecap="round"
              transform="rotate(-90 14 14)"
            />
            <text x="14" y="18" textAnchor="middle" fill="var(--color-text)" fontSize="9" fontWeight="700">
              {state.whoop.recovery}
            </text>
          </svg>
        </div>
        {[
          { label: "SLEEP", val: `${state.whoop.sleep}%`, color: state.whoop.sleep >= 70 ? "var(--color-success)" : "var(--color-accent)" },
          { label: "STRAIN", val: state.whoop.strain, color: "var(--color-text)" },
          { label: "RHR", val: state.whoop.rhr, color: "var(--color-text)" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-text-muted)" }}>{label}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Goals ticker */}
      <div style={{ margin: "8px 18px 0", fontSize: "11px", color: "var(--color-text-muted)", display: "flex", gap: "6px" }}>
        <span style={{ color: "var(--color-success)" }}>● GOALS</span>
        <span style={{ color: "var(--color-text-muted)" }}>{state.goals.filter((g) => !g.done)[0]?.text ?? "All done!"}</span>
      </div>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        {tab === "main" && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <MainPage state={state} setState={setState} pct={pct} pod={pod} leftStr={leftStr} overseerLoading={overseerLoading} sendMsg={sendMsg} chatRef={chatRef} greeting={greeting} />
          </motion.div>
        )}
        {tab === "finances" && (
          <motion.div
            key="finances"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <FinancesPage state={state} setState={setState} />
          </motion.div>
        )}
        {tab === "brand" && (
          <motion.div
            key="brand"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <BrandPage state={state} setState={setState} />
          </motion.div>
        )}
        {tab === "health" && (
          <motion.div
            key="health"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <HealthPage state={state} setState={setState} />
          </motion.div>
        )}
        {tab === "gym" && (
          <motion.div
            key="gym"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GymPage state={state} setState={setState} />
          </motion.div>
        )}
        {tab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsPage state={state} setState={setState} resetState={resetState} theme={theme} setThemeMode={setThemeMode} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--color-card)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0",
          zIndex: 50,
        }}
      >
        {[
          { id: "main", label: "Main", icon: <HomeIcon /> },
          { id: "finances", label: "Finances", icon: <FinIcon /> },
          { id: "brand", label: "Brand", icon: <BrandIcon /> },
          { id: "health", label: "Health", icon: <HeartIcon /> },
          { id: "gym", label: "Gym", icon: <GymIcon /> },
          { id: "settings", label: "Settings", icon: <SettingsIcon /> },
        ].map(({ id, label, icon }) => (
          <motion.button
            key={id}
            onClick={() => setTab(id)}
            whileTap={{ scale: 0.9 }}
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "6px 12px",
              background: "none",
              border: "none",
              color: tab === id ? "var(--color-text)" : "var(--color-text-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              transition: "color 0.2s",
            }}
          >
            {icon}
            <span>{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ state, setState, resetState, theme, setThemeMode }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      <div style={{ fontSize: "var(--font-2xl)", fontWeight: 800, marginBottom: "var(--spacing-lg)" }}>Settings</div>

      {/* Theme */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-lg)",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <div style={{ fontSize: "var(--font-sm)", fontWeight: 600, marginBottom: "var(--spacing-md)" }}>Appearance</div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <button
            onClick={() => setThemeMode("light")}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: `2px solid ${theme === "light" ? "var(--color-accent)" : "var(--color-border)"}`,
              background: theme === "light" ? "var(--color-accent)22" : "var(--color-input)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            ☀️ Light
          </button>
          <button
            onClick={() => setThemeMode("dark")}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: `2px solid ${theme === "dark" ? "var(--color-accent)" : "var(--color-border)"}`,
              background: theme === "dark" ? "var(--color-accent)22" : "var(--color-input)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      {/* User Info */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-lg)",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <div style={{ fontSize: "var(--font-sm)", fontWeight: 600, marginBottom: "var(--spacing-md)" }}>Profile</div>
        <div style={{ marginBottom: "var(--spacing-sm)" }}>
          <label style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
            YOUR NAME
          </label>
          <input
            type="text"
            value={state.user}
            onChange={(e) => setState((prev) => ({ ...prev, user: e.target.value }))}
            placeholder="Your name"
            style={{
              width: "100%",
              background: "var(--color-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px",
              color: "var(--color-text)",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>
      </div>

      {/* Wake/Sleep Time */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-lg)",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <div style={{ fontSize: "var(--font-sm)", fontWeight: 600, marginBottom: "var(--spacing-md)" }}>Schedule</div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
              WAKE TIME
            </label>
            <input
              type="time"
              value={state.settings?.wakeTime || "08:00"}
              onChange={(e) => setState((prev) => ({
                ...prev,
                settings: { ...prev.settings, wakeTime: e.target.value }
              }))}
              style={{
                width: "100%",
                background: "var(--color-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                color: "var(--color-text)",
                fontSize: "14px",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
              SLEEP TIME
            </label>
            <input
              type="time"
              value={state.settings?.sleepTime || "00:00"}
              onChange={(e) => setState((prev) => ({
                ...prev,
                settings: { ...prev.settings, sleepTime: e.target.value }
              }))}
              style={{
                width: "100%",
                background: "var(--color-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                color: "var(--color-text)",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-lg)",
          marginBottom: "var(--spacing-md)",
          border: "1px solid " + (showResetConfirm ? "var(--color-danger)" : "var(--color-border)"),
        }}
      >
        <div style={{ fontSize: "var(--font-sm)", fontWeight: 600, marginBottom: "var(--spacing-md)", color: "var(--color-danger)" }}>
          Danger Zone
        </div>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-danger)",
              background: "transparent",
              color: "var(--color-danger)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reset All Data
          </button>
        ) : (
          <div>
            <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-md)" }}>
              This will permanently delete all your data. This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <button
                onClick={() => {
                  resetState();
                  setShowResetConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--color-danger)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text)",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Version */}
      <div style={{ textAlign: "center", fontSize: "var(--font-xs)", color: "var(--color-text-muted)", marginTop: "var(--spacing-lg)" }}>
        LifeOS v2.0.0
      </div>
    </div>
  );
}
