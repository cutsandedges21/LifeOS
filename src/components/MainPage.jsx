import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard, HeroSection } from "./GlassComponents.jsx";
import { SectionLabel } from "./UI.jsx";
import { TrendsCard, WeeklyReviewCard } from "./Insights.jsx";
import { computeNetWorth } from "../utils/snapshots.js";
import { dayStr } from "../utils/formatters.js";

export function MainPage({
  state,
  setState,
  pct,
  overseerLoading,
  sendMsg,
  chatRef,
  greeting,
  overseerCap = 3,
  setTab, // App passes this so the "manage goals" pill can jump to the habits page
}) {
  const completedGoals = state.goals.filter((g) => g.done).length;
  const goalsTotal = state.goals.length;

  const habits = state.habits || [];
  const completions = state.habitCompletions || {};
  const todayISO = new Date().toISOString().slice(0, 10);
  const habitsDone = habits.filter((h) => completions[h.id]?.[todayISO]).length;
  const habitsTotal = habits.length;

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* Hero Section */}
      <HeroSection
        greeting={greeting}
        metrics={{
          date: dayStr().toUpperCase(),
          name: state.user || "User",
          dayProgress: `${pct}%`,
          sleep: `${state.whoop.sleep}%`,
          streak: state.streak,
          goals: `${completedGoals}/${goalsTotal}`,
        }}
      />

      {/* Quick link to the Habits & Goals page. The TODO list and the new
          habit tracker both live there now — this card replaces the inline
          timeline so the home page focuses on the at-a-glance view. */}
      <HabitsGoalsLinkCard
        habitsDone={habitsDone}
        habitsTotal={habitsTotal}
        goalsDone={completedGoals}
        goalsTotal={goalsTotal}
        onOpen={() => setTab?.("habits")}
      />

      {/* Trends + Weekly Review — both read from state.historySnapshots */}
      <TrendsCard
        snapshots={state.historySnapshots}
        streak={state.streak}
        currentSleep={state.whoop?.sleep}
        currentNet={computeNetWorth(state)}
      />
      <WeeklyReviewCard snapshots={state.historySnapshots} />

      {/* 1-line daily journal */}
      <JournalCard state={state} setState={setState} />

      {/* Overseer Chat */}
      <GlassCard style={{ marginTop: "24px", padding: "20px" }}>
        <SectionLabel accent="var(--accent-main)" icon="✦">
          OVERSEER
        </SectionLabel>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              background: "rgba(var(--accent-main-rgb), 0.15)",
              border: "1px solid rgba(var(--accent-main-rgb), 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 15px rgba(var(--accent-main-rgb), 0.2)",
            }}
          >
            ✦
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Overseer
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "8px",
                  fontSize: "11px",
                  color: "var(--text-faint)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {state.overseerMessageCount}/{overseerCap}
              </span>
              <span
                style={{
                  display: "block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background:
                    state.overseerMessageCount >= overseerCap
                      ? "#EF4444"
                      : "#34D399",
                  boxShadow: `0 0 8px ${
                    state.overseerMessageCount >= overseerCap
                      ? "#EF4444"
                      : "#34D399"
                  }`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-faint)",
                fontWeight: 500,
              }}
            >
              AI Accountability Agent
            </div>
          </div>
        </div>

        {/* Chat log */}
        {state.overseerLog.length > 0 && (
          <div
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              paddingRight: "4px",
            }}
          >
            {state.overseerLog.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  style={{
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    background:
                      m.role === "user"
                        ? "rgba(var(--accent-main-rgb), 0.15)"
                        : "var(--card)",
                    border: `1px solid ${
                      m.role === "user"
                        ? "rgba(var(--accent-main-rgb), 0.3)"
                        : "var(--border)"
                    }`,
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: m.role === "ai" ? "var(--text)" : "var(--text)",
                    opacity: m.role === "ai" ? 0.8 : 1,
                  }}
                >
                  {m.text}
                </motion.div>
              </div>
            ))}
            {overseerLoading && (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  padding: "12px 16px",
                  background: "var(--card)",
                  borderRadius: "16px",
                  width: "fit-content",
                  border: "1px solid var(--border)",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--text-faint)",
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={chatRef} />
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--card)",
            borderRadius: "16px",
            padding: "6px 6px 6px 14px",
            border: "1px solid var(--border)",
          }}
        >
          <input
            value={state.overseerInput}
            onChange={(e) =>
              setState((prev) => ({ ...prev, overseerInput: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder={
              state.overseerMessageCount >= overseerCap
                ? "Message limit reached today. Come back tomorrow to speak with Overseer"
                : "Message Overseer"
            }
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color:
                state.overseerMessageCount >= overseerCap
                  ? "var(--text-faint)"
                  : "var(--text)",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <motion.button
            onClick={sendMsg}
            disabled={
              overseerLoading || state.overseerMessageCount >= overseerCap
            }
            whileTap={{ scale: 0.9 }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background:
                state.overseerMessageCount >= overseerCap
                  ? "var(--text-faint)"
                  : "var(--accent-main)",
              border: "none",
              color:
                state.overseerMessageCount >= overseerCap
                  ? "var(--text)"
                  : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity:
                overseerLoading || state.overseerMessageCount >= overseerCap
                  ? 0.5
                  : 1,
              boxShadow: "0 4px 12px rgba(var(--accent-main-rgb), 0.3)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 7-7 7 7M12 19V5" />
            </svg>
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}

// Compact card that replaces the old inline goals list. Shows progress for
// both habits and goals and links to the Habits & Goals page where the
// editing UI lives.
function HabitsGoalsLinkCard({
  habitsDone,
  habitsTotal,
  goalsDone,
  goalsTotal,
  onOpen,
}) {
  const HABIT_ACCENT = "#A855F7";
  const GOAL_ACCENT = "#22D3EE";
  const habitPct = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;
  const goalPct = goalsTotal > 0 ? Math.round((goalsDone / goalsTotal) * 100) : 0;

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.99 }}
      whileHover={{ y: -1 }}
      style={{
        width: "100%",
        textAlign: "left",
        background: "var(--card)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "18px",
        marginBottom: "12px",
        cursor: "pointer",
        fontFamily: "inherit",
        color: "var(--text)",
        display: "block",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <SectionLabel accent={HABIT_ACCENT} style={{ marginBottom: 0 }}>
          HABITS &amp; GOALS
        </SectionLabel>
        <span
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            letterSpacing: "0.08em",
          }}
        >
          OPEN →
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <ProgressRow
          label="HABITS"
          accent={HABIT_ACCENT}
          done={habitsDone}
          total={habitsTotal}
          pct={habitPct}
        />
        <ProgressRow
          label="GOALS"
          accent={GOAL_ACCENT}
          done={goalsDone}
          total={goalsTotal}
          pct={goalPct}
        />
      </div>
    </motion.button>
  );
}

function ProgressRow({ label, accent, done, total, pct }) {
  const empty = total === 0;
  return (
    <div
      style={{
        background: "var(--card-mid)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            letterSpacing: "0.12em",
            fontWeight: 700,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 900,
            color: empty ? "var(--text-faint)" : accent,
            fontFamily: "var(--font-mono)",
          }}
        >
          {done}/{total}
        </span>
      </div>
      <div
        style={{
          height: "5px",
          background: "var(--border)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%",
            background: empty
              ? "transparent"
              : `linear-gradient(90deg, ${accent}, ${accent}aa)`,
            boxShadow: empty ? "none" : `0 0 8px ${accent}66`,
          }}
        />
      </div>
      {empty && (
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-faint)",
            marginTop: "6px",
            fontStyle: "italic",
          }}
        >
          None yet — tap to add
        </div>
      )}
    </div>
  );
}

// One-line daily journal. Idea: a single sentence per day is low-friction
// enough that the user will actually do it, and the Overseer gets meaningful
// context ("yesterday you said you were drained — today you still showed up").
//
// Storage: state.journalEntries is an append-only array sorted oldest→newest.
// Today's entry is mutable in place; past entries are display-only.
function JournalCard({ state, setState }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const entries = state.journalEntries || [];
  const todayEntry = entries.find((e) => e.date === todayISO);
  const [draft, setDraft] = useState(todayEntry?.text || "");
  const [saved, setSaved] = useState(Boolean(todayEntry));

  // If state hydrates async (initial load), sync the draft once on mount.
  useEffect(() => {
    if (todayEntry && draft === "" && !saved) {
      setDraft(todayEntry.text);
      setSaved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntry?.text]);

  const handleSave = () => {
    const text = draft.trim();
    if (!text) return;
    setState((p) => {
      const list = p.journalEntries || [];
      const others = list.filter((e) => e.date !== todayISO);
      return {
        ...p,
        journalEntries: [...others, { date: todayISO, text }].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    });
    setSaved(true);
  };

  // Past 3 entries (excluding today) for context preview. Keeps the card
  // visually anchored without ballooning the page.
  const recent = entries
    .filter((e) => e.date !== todayISO)
    .slice(-3)
    .reverse();

  return (
    <GlassCard style={{ padding: "18px 18px 16px", marginBottom: "12px" }}>
      <SectionLabel accent="var(--accent-main)">
        DAILY JOURNAL · ONE LINE
      </SectionLabel>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: recent.length ? "14px" : 0,
        }}
      >
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (saved) setSaved(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="One sentence on today…"
          maxLength={140}
          style={{
            flex: 1,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "10px 12px",
            color: "var(--text)",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            minHeight: "42px",
          }}
        />
        <button
          onClick={handleSave}
          disabled={!draft.trim() || (saved && draft === todayEntry?.text)}
          style={{
            padding: "0 16px",
            borderRadius: "12px",
            border: "1px solid rgba(var(--accent-main-rgb),0.4)",
            background:
              saved && draft === todayEntry?.text
                ? "var(--card-mid)"
                : "rgba(var(--accent-main-rgb),0.15)",
            color:
              saved && draft === todayEntry?.text
                ? "var(--text-faint)"
                : "var(--accent-main)",
            fontWeight: 700,
            fontSize: "12px",
            cursor: !draft.trim() ? "not-allowed" : "pointer",
            opacity: !draft.trim() ? 0.5 : 1,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {saved && draft === todayEntry?.text ? "✓ SAVED" : "SAVE"}
        </button>
      </div>

      {recent.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-faint)",
              letterSpacing: "0.12em",
              marginBottom: "2px",
              fontWeight: 700,
            }}
          >
            RECENT
          </div>
          {recent.map((e) => (
            <div
              key={e.date}
              style={{
                display: "flex",
                gap: "10px",
                padding: "8px 10px",
                background: "var(--card)",
                borderRadius: "10px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-faint)",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                  paddingTop: "1px",
                  minWidth: "62px",
                }}
              >
                {e.date.slice(5).replace("-", "/")}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                  fontStyle: "italic",
                }}
              >
                "{e.text}"
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
