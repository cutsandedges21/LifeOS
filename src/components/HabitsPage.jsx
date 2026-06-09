import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { GlassCard, TimelineItem } from "./GlassComponents.jsx";
import { SectionLabel, Input, Button } from "./UI.jsx";
import { dayStr, timeStr, todayISO, isoFromDate } from "../utils/formatters.js";

// HabitsPage. Two stacked sections:
//   1. HABITS    — binary daily check-offs with per-habit streaks + 14d grid.
//   2. TODAY'S GOALS — moved from MainPage. One-shot to-dos with the swipe
//      edit/skip UX and the missed-reason modal.
//
// Habits live in state.habits + state.habitCompletions; goals live in state.goals
// (same shape they always had — moving the UI here didn't change persistence).

const ACCENT = "#A855F7"; // violet — distinct from existing page accents

// Recent N days as ISO date strings, oldest → newest. Used for the per-habit
// grid so the rightmost square is always today.
function recentDays(n) {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    days.push(isoFromDate(dd));
  }
  return days;
}

// Walks backwards from today through the per-habit completions map. The first
// gap ends the streak — same model as the gym streak so the UX feels uniform.
function habitStreak(forHabit) {
  let streak = 0;
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  while (true) {
    const iso = isoFromDate(day);
    if (forHabit?.[iso]) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// Preset color swatches so users don't have to think — picking a hex from
// the system color picker is friction nobody wants for "add a habit".
const HABIT_COLORS = [
  "#A855F7", // violet
  "#34D399", // emerald
  "#F87171", // rose
  "#FBBF24", // amber
  "#22D3EE", // cyan
  "#F97316", // orange
  "#EC4899", // pink
  "#60A5FA", // blue
];

const SUGGESTED_HABITS = [
  { name: "Meditate", icon: "🧘" },
  { name: "Read", icon: "📚" },
  { name: "No alcohol", icon: "🚫" },
  { name: "Cold shower", icon: "🚿" },
  { name: "Water (2L)", icon: "💧" },
  { name: "Stretch", icon: "🤸" },
  { name: "Journal", icon: "✍️" },
  { name: "No phone in bed", icon: "📵" },
];

export function HabitsPage({ state, setState }) {
  // Habits UI state
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    color: HABIT_COLORS[0],
    icon: "✨",
  });

  // Goals UI state (parity with what MainPage used to do)
  const [newGoal, setNewGoal] = useState("");
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [missedGoal, setMissedGoal] = useState(null);
  const [reason, setReason] = useState("");

  const habits = state.habits || [];
  const completions = state.habitCompletions || {};
  const goals = state.goals || [];

  // ── Habit actions ───────────────────────────────────────────────────
  const addHabit = (preset) => {
    const source = preset || newHabit;
    const name = (source.name || "").trim();
    if (!name) return;
    const habit = {
      id: Date.now(),
      name,
      color: source.color || HABIT_COLORS[0],
      icon: source.icon || "✨",
      createdAt: todayISO(),
    };
    setState((p) => ({ ...p, habits: [...(p.habits || []), habit] }));
    setNewHabit({ name: "", color: HABIT_COLORS[0], icon: "✨" });
    setShowAddHabit(false);
  };

  const removeHabit = (id) => {
    setState((p) => {
      const nextCompletions = { ...(p.habitCompletions || {}) };
      delete nextCompletions[id];
      return {
        ...p,
        habits: (p.habits || []).filter((h) => h.id !== id),
        habitCompletions: nextCompletions,
      };
    });
  };

  const toggleHabit = (id) => {
    const iso = todayISO();
    setState((p) => {
      const all = { ...(p.habitCompletions || {}) };
      const forHabit = { ...(all[id] || {}) };
      if (forHabit[iso]) delete forHabit[iso];
      else forHabit[iso] = true;
      all[id] = forHabit;
      return { ...p, habitCompletions: all };
    });
  };

  // ── Goal actions (lifted verbatim from MainPage so UX is unchanged) ──
  const addGoal = () => {
    if (!newGoal.trim()) return;
    setState((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        { id: Date.now(), text: newGoal.trim(), done: false, time: timeStr() },
      ],
    }));
    setNewGoal("");
  };

  const toggleGoal = (id) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, done: !g.done, missed: false } : g
      ),
    }));
  };

  const startEdit = (goal) => {
    setEditingGoalId(goal.id);
    setEditingText(goal.text);
  };

  const saveEdit = () => {
    if (!editingText.trim()) return;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === editingGoalId ? { ...g, text: editingText.trim() } : g
      ),
    }));
    setEditingGoalId(null);
  };

  const handleMissed = () => {
    if (!reason.trim() || !missedGoal) return;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === missedGoal.id
          ? { ...g, missed: true, reason: reason.trim(), done: false }
          : g
      ),
      missedGoalsHistory: [
        ...(prev.missedGoalsHistory || []),
        {
          id: Date.now(),
          text: missedGoal.text,
          reason: reason.trim(),
          date: dayStr(),
          time: timeStr(),
        },
      ],
    }));
    setMissedGoal(null);
    setReason("");
  };

  // ── Summary numbers ─────────────────────────────────────────────────
  const completedHabitsToday = habits.filter(
    (h) => completions[h.id]?.[todayISO()]
  ).length;
  const completedGoals = goals.filter((g) => g.done).length;

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* Reason Modal — same as MainPage used to render. Moved here because
          the goals list lives here now. */}
      <AnimatePresence>
        {missedGoal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 20px 50px rgba(239, 68, 68, 0.2)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
              <div
                style={{
                  color: "#FCA5A5",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                }}
              >
                URGENT ACCOUNTABILITY
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#fff",
                  marginBottom: "12px",
                  lineHeight: 1.3,
                }}
              >
                Why did you fail to complete "{missedGoal.text}"?
              </div>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Be honest. What was the blocker?"
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "16px",
                  padding: "16px",
                  color: "#fff",
                  fontSize: "14px",
                  minHeight: "100px",
                  fontFamily: "inherit",
                  outline: "none",
                  marginBottom: "20px",
                  resize: "none",
                }}
              />

              <Button
                onClick={handleMissed}
                disabled={!reason.trim()}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #EF4444, #B91C1C)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 800,
                  opacity: reason.trim() ? 1 : 0.5,
                }}
              >
                SUBMIT REASON
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Page title / summary ───────────────────────────────────── */}
      <GlassCard data-tour="habits" style={{ padding: "20px 20px 18px", marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                lineHeight: 1.05,
                marginBottom: "4px",
              }}
            >
              Habits & To-Do
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.4,
              }}
            >
              Daily habits build identity. Your to-do list closes the gap.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <SummaryTile
            label="HABITS TODAY"
            value={`${completedHabitsToday}/${habits.length || 0}`}
            color={ACCENT}
          />
          <SummaryTile
            label="TO-DO DONE"
            value={`${completedGoals}/${goals.length || 0}`}
            color="#22D3EE"
          />
        </div>
      </GlassCard>

      {/* ── HABITS section ────────────────────────────────────────── */}
      <SectionLabel accent={ACCENT}>DAILY HABITS</SectionLabel>

      {habits.length === 0 && !showAddHabit && (
        <GlassCard
          style={{
            padding: "20px",
            textAlign: "center",
            border: `1px dashed ${ACCENT}55`,
            background: `${ACCENT}0d`,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "14px",
              lineHeight: 1.5,
            }}
          >
            Habits are the things you should do <em>every day</em>. Different
            from one-shot goals — small, repeatable, identity-building.
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            {SUGGESTED_HABITS.slice(0, 6).map((s, idx) => (
              <button
                key={s.name}
                onClick={() =>
                  addHabit({
                    name: s.name,
                    icon: s.icon,
                    color: HABIT_COLORS[idx % HABIT_COLORS.length],
                  })
                }
                style={{
                  padding: "6px 10px",
                  borderRadius: "20px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span style={{ fontSize: "13px" }}>{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowAddHabit(true)}
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
              border: `1px solid ${ACCENT}66`,
              color: "#fff",
              boxShadow: `0 4px 20px ${ACCENT}55`,
              fontWeight: 800,
            }}
          >
            + Custom habit
          </Button>
        </GlassCard>
      )}

      {habits.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              forHabit={completions[h.id] || {}}
              onToggle={() => toggleHabit(h.id)}
              onRemove={() => removeHabit(h.id)}
            />
          ))}
        </div>
      )}

      {/* Add Habit form */}
      <AnimatePresence>
        {showAddHabit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", marginTop: "12px" }}
          >
            <GlassCard style={{ border: `1px solid ${ACCENT}55` }}>
              <Input
                label="Habit name"
                value={newHabit.name}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, name: e.target.value })
                }
                placeholder="e.g. Meditate, Read, No alcohol"
              />

              {/* Icon picker — small emoji input. Keep simple, no library. */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-faint)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.12em",
                    marginBottom: "5px",
                  }}
                >
                  ICON
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {["✨", "🧘", "📚", "💧", "🏃", "🤸", "🧠", "🚫", "📵", "✍️", "🌱", "💪"].map(
                    (em) => (
                      <button
                        key={em}
                        onClick={() => setNewHabit({ ...newHabit, icon: em })}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background:
                            newHabit.icon === em
                              ? `${ACCENT}22`
                              : "var(--card)",
                          border:
                            newHabit.icon === em
                              ? `1px solid ${ACCENT}88`
                              : "1px solid var(--border)",
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                      >
                        {em}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-faint)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.12em",
                    marginBottom: "5px",
                  }}
                >
                  COLOR
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewHabit({ ...newHabit, color: c })}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: c,
                        border:
                          newHabit.color === c
                            ? "3px solid var(--text)"
                            : "2px solid var(--border)",
                        cursor: "pointer",
                        boxShadow: `0 0 12px ${c}66`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  onClick={() => addHabit()}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
                    border: `1px solid ${ACCENT}66`,
                    color: "#fff",
                    boxShadow: `0 4px 20px ${ACCENT}55`,
                  }}
                >
                  Add Habit
                </Button>
                <Button
                  onClick={() => setShowAddHabit(false)}
                  variant="ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {habits.length > 0 && !showAddHabit && (
        <Button
          onClick={() => setShowAddHabit(true)}
          variant="ghost"
          style={{
            width: "100%",
            marginTop: "12px",
            border: `1px dashed ${ACCENT}55`,
            color: ACCENT,
          }}
        >
          + Add Habit
        </Button>
      )}

      {/* ── TO-DO LIST section (persistent — does not reset daily) ──── */}
      <div style={{ marginTop: "32px" }}>
        <SectionLabel accent="#22D3EE">TO-DO LIST</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {goals.length === 0 ? (
            <GlassCard style={{ textAlign: "center", padding: "32px 20px" }}>
              <div
                style={{
                  color: "var(--text-faint)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Nothing on your to-do list yet.
              </div>
            </GlassCard>
          ) : (
            goals.map((goal) => (
              <SwipeableGoalItem
                key={goal.id}
                goal={goal}
                startEdit={startEdit}
                setMissedGoal={setMissedGoal}
                editingGoalId={editingGoalId}
                editingText={editingText}
                setEditingText={setEditingText}
                saveEdit={saveEdit}
                toggleGoal={toggleGoal}
              />
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="Add a to-do…"
            style={{ marginBottom: 0, flex: 1 }}
          />
          <Button onClick={addGoal} style={{ minWidth: "80px" }}>
            + ADD
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── HabitRow ───────────────────────────────────────────────────────────
function HabitRow({ habit, forHabit, onToggle, onRemove }) {
  const iso = todayISO();
  const done = !!forHabit[iso];
  const streak = habitStreak(forHabit);
  const last14 = recentDays(14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: done ? `${habit.color}12` : "var(--card)",
        border: done
          ? `1px solid ${habit.color}55`
          : "1px solid var(--border)",
        borderRadius: "18px",
        padding: "14px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: done ? `0 4px 18px ${habit.color}33` : "none",
        transition: "background 0.25s, border 0.25s, box-shadow 0.25s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {/* Tap target — the big circle */}
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.92 }}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: done
              ? `linear-gradient(135deg, ${habit.color}, ${habit.color}cc)`
              : "transparent",
            border: done
              ? `1px solid ${habit.color}`
              : `2px solid ${habit.color}66`,
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
            boxShadow: done ? `0 0 18px ${habit.color}88` : "none",
            transition: "all 0.2s",
          }}
        >
          {done ? "✓" : habit.icon}
        </motion.button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {habit.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "2px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-faint)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
              }}
            >
              STREAK
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: streak > 0 ? habit.color : "var(--text-faint)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {streak}d{streak >= 7 ? " 🔥" : ""}
            </span>
          </div>
        </div>

        <button
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-faint)",
            fontSize: "20px",
            cursor: "pointer",
            padding: "4px 8px",
            flexShrink: 0,
          }}
          aria-label="Remove habit"
        >
          ×
        </button>
      </div>

      {/* 14-day grid — rightmost cell is today */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          alignItems: "center",
        }}
      >
        {last14.map((d) => {
          const hit = !!forHabit[d];
          const isToday = d === iso;
          return (
            <div
              key={d}
              title={`${d}${hit ? " — done" : ""}`}
              style={{
                flex: 1,
                height: isToday ? "14px" : "10px",
                borderRadius: "3px",
                background: hit
                  ? `linear-gradient(180deg, ${habit.color}, ${habit.color}aa)`
                  : "var(--card-mid)",
                border: hit
                  ? `1px solid ${habit.color}88`
                  : "1px solid var(--border)",
                boxShadow: hit ? `0 0 6px ${habit.color}66` : "none",
                opacity: isToday ? 1 : 0.85,
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

// ── SummaryTile ────────────────────────────────────────────────────────
function SummaryTile({ label, value, color }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
          letterSpacing: "0.12em",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 900,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── SwipeableGoalItem — moved verbatim from MainPage ─────────────────
const SwipeableGoalItem = ({
  goal,
  startEdit,
  setMissedGoal,
  editingGoalId,
  editingText,
  setEditingText,
  saveEdit,
  toggleGoal,
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, -40], [0, 1]);

  const handleEditClick = () => {
    animate(x, 0, { duration: 0.3 });
    startEdit(goal);
  };

  const handleSkipClick = () => {
    animate(x, 0, { duration: 0.3 });
    setMissedGoal(goal);
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 0,
          opacity,
        }}
      >
        <button
          onClick={handleEditClick}
          style={{
            width: "70px",
            background: "var(--accent-main)",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          EDIT
        </button>
        <button
          onClick={handleSkipClick}
          style={{
            width: "70px",
            background: "#EF4444",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          SKIP
        </button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: goal.missed ? 0 : -140, right: 0 }}
        dragElastic={goal.missed ? 0 : 0.1}
        style={{ position: "relative", zIndex: 1, x }}
      >
        <TimelineItem
          status={
            goal.missed ? "missed" : goal.done ? "completed" : "current"
          }
          time={goal.time || "Now"}
          title={
            editingGoalId === goal.id ? (
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <input
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  style={{
                    flex: 1,
                    background: "var(--card)",
                    border: "1px solid var(--accent-main)",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    color: "var(--text)",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
            ) : (
              goal.text
            )
          }
          details={
            goal.missed
              ? goal.reason
              : goal.done
                ? "Completed"
                : "In Progress"
          }
          onClick={() => toggleGoal(goal.id)}
        />
      </motion.div>
    </div>
  );
};
