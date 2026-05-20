import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { GlassCard, SectionHeader } from "./GlassComponents.jsx";
import { Input, Button } from "./UI.jsx";
import { lastNSnapshots } from "../utils/snapshots.js";
import { getTodayDay, todayISO } from "../utils/formatters.js";
import { useUndoToast } from "./UndoToast.jsx";

export function GymPage({ state, setState }) {
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const { show: showUndoToast } = useUndoToast();
  const [newExercise, setNewExercise] = useState({
    name: "",
    weight: "",
    reps: "",
    sets: "",
  });

  // Switch-day mode: when active, tapping two days swaps the entire workout
  // (split name + exercises) between them. Source is selected on first tap,
  // target swap fires on the second tap. Tapping the same day a second time
  // cancels.
  const [switchMode, setSwitchMode] = useState(false);
  const [switchSource, setSwitchSource] = useState(null);

  // Inline-edit state for exercises. editingExerciseId points to the exercise
  // being edited; editDraft holds the working values so the user can cancel
  // without mutating state mid-edit.
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", weight: "", sets: "", reps: "" });

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const updateSplit = (val) => {
    setState((prev) => {
      const newSplit = { ...prev.gymSplit, [selectedDay]: val };
      const isToday = selectedDay === getTodayDay();
      return {
        ...prev,
        gymSplit: newSplit,
        workoutDay: isToday ? val : prev.workoutDay,
      };
    });
  };

  const addExercise = () => {
    if (!newExercise.name.trim()) return;
    setState((prev) => {
      const currentExercises = prev.gymExercises?.[selectedDay] || [];
      return {
        ...prev,
        gymExercises: {
          ...prev.gymExercises,
          [selectedDay]: [...currentExercises, { ...newExercise, id: Date.now() }],
        },
      };
    });
    setNewExercise({ name: "", weight: "", reps: "", sets: "" });
    setShowAddExercise(false);
  };

  // Delete + undo. The exercise is scoped to a specific day, so the undo
  // closure has to remember which day it came from — selectedDay can change
  // before the user hits UNDO.
  const removeExercise = (id) => {
    const day = selectedDay;
    const list = state.gymExercises?.[day] || [];
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return;
    const removed = list[index];
    setState((prev) => ({
      ...prev,
      gymExercises: {
        ...prev.gymExercises,
        [day]: (prev.gymExercises?.[day] || []).filter((e) => e.id !== id),
      },
    }));
    const label = (removed.name || "").trim() || "exercise";
    showUndoToast(`Deleted "${label}"`, () => {
      setState((prev) => {
        const current = prev.gymExercises?.[day] || [];
        if (current.some((e) => e.id === removed.id)) return prev;
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, removed);
        return {
          ...prev,
          gymExercises: { ...prev.gymExercises, [day]: next },
        };
      });
    });
  };

  const startEditExercise = (ex) => {
    setEditingExerciseId(ex.id);
    setEditDraft({
      name: ex.name || "",
      weight: ex.weight || "",
      sets: ex.sets || "",
      reps: ex.reps || "",
    });
  };

  const cancelEditExercise = () => {
    setEditingExerciseId(null);
    setEditDraft({ name: "", weight: "", sets: "", reps: "" });
  };

  const saveEditExercise = () => {
    if (!editDraft.name.trim()) return;
    setState((prev) => ({
      ...prev,
      gymExercises: {
        ...prev.gymExercises,
        [selectedDay]: (prev.gymExercises?.[selectedDay] || []).map((e) =>
          e.id === editingExerciseId
            ? { ...e, ...editDraft, name: editDraft.name.trim() }
            : e
        ),
      },
    }));
    cancelEditExercise();
  };

  // Tap handler for the day pills. In normal mode this just selects the day.
  // In switch mode, the first tap latches a source day and the second tap
  // swaps the split name + exercise list between the two days. Tapping the
  // same day twice cancels the pending swap.
  const handleDayTap = (day) => {
    if (!switchMode) {
      setSelectedDay(day);
      return;
    }
    if (!switchSource) {
      setSwitchSource(day);
      return;
    }
    if (switchSource === day) {
      setSwitchSource(null);
      return;
    }
    const a = switchSource;
    const b = day;
    setState((prev) => {
      const split = { ...(prev.gymSplit || {}) };
      const exercises = { ...(prev.gymExercises || {}) };
      const tmpSplit = split[a];
      split[a] = split[b];
      split[b] = tmpSplit;
      const tmpEx = exercises[a];
      exercises[a] = exercises[b];
      exercises[b] = tmpEx;
      const today = getTodayDay();
      const workoutToday = today === a || today === b ? (split[today] ?? "") : prev.workoutDay;
      return {
        ...prev,
        gymSplit: split,
        gymExercises: exercises,
        workoutDay: workoutToday,
      };
    });
    setSwitchSource(null);
    setSwitchMode(false);
  };

  const logSkip = () => {
    const reason = skipReason.trim() || "No reason given";
    setState((prev) => ({
      ...prev,
      gymSkips: [
        { id: Date.now(), date: todayISO(), reason },
        ...(prev.gymSkips || []),
      ],
    }));
    setSkipReason("");
    setShowSkipModal(false);
  };

  // Undo today's logged status. Removes any gymSkips/gymVisits row whose
  // date matches today's local ISO. Cleans up both old UTC-dated rows that
  // happen to collide with today AND a legitimate mistake.
  const undoToday = () => {
    const t = todayISO();
    setState((prev) => ({
      ...prev,
      gymSkips: (prev.gymSkips || []).filter((s) => s.date !== t),
      gymVisits: (prev.gymVisits || []).filter((v) => v.date !== t),
    }));
  };

  const logVisit = () => {
    const today = todayISO();
    const todayDay = getTodayDay();
    setState((prev) => {
      // Snapshot today's prescribed exercises into the overload log so the
      // weight progression is captured permanently. Without this snapshot,
      // editing tomorrow's prescribed weight would silently rewrite "what I
      // lifted today" — breaking the trend.
      const todayExercises = prev.gymExercises?.[todayDay] || [];
      const snapshot = todayExercises.length > 0
        ? [
            {
              id: Date.now() + 1,
              date: today,
              dayOfWeek: todayDay,
              exercises: todayExercises.map((e) => ({
                name: e.name,
                weight: e.weight,
                sets: e.sets,
                reps: e.reps,
              })),
            },
            ...(prev.gymExerciseLog || []),
          ]
        : (prev.gymExerciseLog || []);

      return {
        ...prev,
        gymVisits: [
          { id: Date.now(), date: today },
          ...(prev.gymVisits || []),
        ],
        gymExerciseLog: snapshot,
      };
    });
  };

  // Build a name → weight-history map from the overload log. Names are
  // normalized so casing/whitespace differences don't fragment the series.
  const overloadHistory = (() => {
    const map = {};
    const log = state.gymExerciseLog || [];
    // Walk oldest → newest so each name's array ends up chronological.
    const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
    for (const entry of sorted) {
      for (const ex of entry.exercises || []) {
        const key = (ex.name || "").trim().toLowerCase();
        if (!key) continue;
        const weight = Number(ex.weight);
        if (!Number.isFinite(weight) || weight <= 0) continue;
        if (!map[key]) map[key] = [];
        map[key].push({ date: entry.date, weight });
      }
    }
    return map;
  })();

  const currentExercises = state.gymExercises?.[selectedDay] || [];
  const currentSplit = state.gymSplit?.[selectedDay] || "";

  const skippedToday = (state.gymSkips || []).some((s) => s.date === todayISO());
  const visitedToday = (state.gymVisits || []).some((v) => v.date === todayISO());

  // 14-day attendance history pulled from snapshots. Each cell is binary
  // (went / didn't), rendered as a row of small bars so patterns are obvious
  // at a glance.
  const attendance14 = lastNSnapshots(state.historySnapshots, 14);
  const hitCount = attendance14.filter((s) => s.gymWent).length;

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* Streak summary + 14-day attendance row */}
      <GlassCard style={{ padding: "18px 20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "4px" }}>
              CURRENT STREAK
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#FBBF24", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {state.streak}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>days</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "4px" }}>
              LAST 14
            </div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {hitCount}<span style={{ color: "var(--text-faint)", fontSize: "14px" }}>/{attendance14.length || 14}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "28px" }}>
          {attendance14.length === 0 ? (
            // Empty-state placeholder: 14 faint slots so the layout doesn't jump.
            Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: "8px", background: "var(--card)", border: "1px dashed var(--border)", borderRadius: "3px" }} />
            ))
          ) : (
            attendance14.map((s, i) => (
              <div
                key={s.date}
                title={`${s.date} — ${s.gymWent ? "Hit" : "Missed"}`}
                style={{
                  flex: 1,
                  height: s.gymWent ? "26px" : "8px",
                  background: s.gymWent
                    ? "linear-gradient(180deg, #FBBF24, #F59E0B)"
                    : "rgba(248, 113, 113, 0.18)",
                  border: s.gymWent ? "1px solid rgba(251, 191, 36, 0.5)" : "1px solid rgba(248, 113, 113, 0.25)",
                  borderRadius: "3px",
                  boxShadow: s.gymWent ? "0 0 6px rgba(251, 191, 36, 0.35)" : "none",
                  alignSelf: "flex-end",
                  opacity: i === attendance14.length - 1 ? 1 : 0.85,
                }}
              />
            ))
          )}
        </div>
      </GlassCard>

      {/* Day Selector */}
      <GlassCard style={{ padding: "16px", marginBottom: "16px" }} glow="#FBBF24">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", fontWeight: 700 }}>
            {switchMode
              ? switchSource
                ? `TAP A DAY TO SWAP WITH ${switchSource.slice(0, 3).toUpperCase()}`
                : "TAP FIRST DAY TO SWAP"
              : "SELECT DAY"}
          </div>
          <motion.button
            onClick={() => {
              if (switchMode) {
                setSwitchMode(false);
                setSwitchSource(null);
              } else {
                setSwitchMode(true);
              }
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "5px 10px",
              borderRadius: "10px",
              background: switchMode ? "rgba(251, 191, 36, 0.2)" : "var(--card)",
              border: `1px solid ${switchMode ? "rgba(251, 191, 36, 0.6)" : "var(--border)"}`,
              color: switchMode ? "#FBBF24" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {switchMode ? "✕ CANCEL" : "↔ SWITCH DAYS"}
          </motion.button>
        </div>
        <div className="gym-days" style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
          {days.map((day) => {
            const isActive = selectedDay === day;
            const isToday = getTodayDay() === day;
            const isSwitchSource = switchMode && switchSource === day;
            return (
              <motion.button
                key={day}
                onClick={() => handleDayTap(day)}
                whileTap={{ scale: 0.9 }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "12px",
                  background: isSwitchSource
                    ? "rgba(251, 191, 36, 0.25)"
                    : isActive && !switchMode
                      ? "#FBBF24"
                      : "var(--card)",
                  border: `1px solid ${
                    isSwitchSource
                      ? "#FBBF24"
                      : isActive && !switchMode
                        ? "#FBBF24"
                        : isToday
                          ? "rgba(251, 191, 36, 0.4)"
                          : "var(--border)"
                  }`,
                  color: isSwitchSource
                    ? "#FBBF24"
                    : isActive && !switchMode
                      ? "#000"
                      : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  boxShadow: isSwitchSource ? "0 0 12px rgba(251,191,36,0.4)" : "none",
                }}
              >
                {day.slice(0, 3)}
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Split Name Input */}
      <GlassCard style={{ padding: "20px" }}>
        <Input
          label={`${selectedDay.toUpperCase()} SPLIT`}
          value={currentSplit}
          onChange={(e) => updateSplit(e.target.value)}
          placeholder="e.g. Push, Pull, Legs, Rest..."
          style={{ marginBottom: 0 }}
        />
      </GlassCard>

      {/* Exercises Section */}
      <div style={{ marginTop: "24px" }}>
        <SectionHeader
          label={`${selectedDay.toUpperCase()} SESSION`}
          accent="#FBBF24"
          right={
            <button
              onClick={() => setShowAddExercise(true)}
              style={{
                background: "rgba(251, 191, 36, 0.15)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                borderRadius: "8px",
                color: "#FBBF24",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + ADD
            </button>
          }
        />

        <AnimatePresence>
          {showAddExercise && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <GlassCard style={{ border: "1px solid rgba(251, 191, 36, 0.3)", marginBottom: "16px" }}>
                <Input
                  label="Exercise Name"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  placeholder="Bench Press"
                />
                <div className="exercise-form-row" style={{ display: "flex", gap: "10px" }}>
                  <Input
                    label="Weight (lbs)"
                    value={newExercise.weight}
                    onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                    placeholder="225 lbs"
                    style={{ flex: 1 }}
                  />
                  <div className="exercise-form-small-row" style={{ display: "flex", gap: "10px", flex: 1.6 }}>
                    <Input
                      label="Sets"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                      placeholder="3"
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <Input
                      label="Reps"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                      placeholder="10"
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <Button onClick={addExercise} variant="primary" style={{ flex: 2, background: "#FBBF24", color: "#000" }}>Add Exercise</Button>
                  <Button onClick={() => setShowAddExercise(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {currentExercises.map((e, idx) => {
            // Pull historical weights for this exercise. Show last 3 progress
            // points + the current prescribed weight, deduped so back-to-back
            // identical sessions render as "225 → 230" not "225 → 225 → 230".
            const key = (e.name || "").trim().toLowerCase();
            const history = overloadHistory[key] || [];
            const histWeights = history.map((h) => h.weight);
            const currentWeight = Number(e.weight);
            const series = Number.isFinite(currentWeight) && currentWeight > 0
              ? [...histWeights, currentWeight]
              : histWeights;
            // Dedupe consecutive equal values.
            const deduped = series.filter((w, i, arr) => i === 0 || w !== arr[i - 1]);
            // Show at most the last 4 points so the trend stays glanceable.
            const trend = deduped.slice(-4);
            const trendDelta = trend.length >= 2 ? trend[trend.length - 1] - trend[0] : 0;
            const trendColor = trendDelta > 0 ? "#34D399" : trendDelta < 0 ? "#F87171" : "var(--text-faint)";

            return (
              <SwipeableExerciseRow
                key={e.id}
                ex={e}
                idx={idx}
                trend={trend}
                trendDelta={trendDelta}
                trendColor={trendColor}
                isEditing={editingExerciseId === e.id}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                onStartEdit={() => startEditExercise(e)}
                onCancelEdit={cancelEditExercise}
                onSaveEdit={saveEditExercise}
                onRemove={() => removeExercise(e.id)}
              />
            );
          })}
          {currentExercises.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-faint)", fontSize: "14px" }}>
              No exercises added for {selectedDay}.
            </div>
          )}
        </div>
      </div>

      {/* ── Today's Gym Status ─────────────────────────────────────── */}
      <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {visitedToday ? (
          <div
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(52, 211, 153, 0.10)",
              border: "1px solid rgba(52, 211, 153, 0.35)",
              color: "#34D399",
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              boxShadow: "0 4px 20px rgba(52,211,153,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <span>✓ GYM HIT TODAY · STREAK ACTIVE</span>
            <button
              onClick={undoToday}
              style={{
                background: "rgba(52, 211, 153, 0.15)",
                border: "1px solid rgba(52, 211, 153, 0.5)",
                color: "#34D399",
                borderRadius: "10px",
                padding: "5px 10px",
                fontSize: "10px",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
              }}
            >
              UNDO
            </button>
          </div>
        ) : skippedToday ? (
          <div
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(248, 113, 113, 0.08)",
              border: "1px dashed rgba(248, 113, 113, 0.3)",
              color: "rgba(248, 113, 113, 0.85)",
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <span>GYM SKIPPED TODAY · STREAK RESET</span>
            <button
              onClick={undoToday}
              style={{
                background: "rgba(248, 113, 113, 0.15)",
                border: "1px solid rgba(248, 113, 113, 0.5)",
                color: "#F87171",
                borderRadius: "10px",
                padding: "5px 10px",
                fontSize: "10px",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
              }}
            >
              UNDO
            </button>
          </div>
        ) : (
          <>
            <motion.button
              onClick={logVisit}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid rgba(52, 211, 153, 0.45)",
                background: "linear-gradient(135deg, rgba(52,211,153,0.20) 0%, rgba(16,185,129,0.25) 100%)",
                color: "#34D399",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.08em",
                fontFamily: "var(--font-mono)",
                boxShadow: "0 4px 20px rgba(52,211,153,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              GYM HIT TODAY · STREAK ACTIVE
            </motion.button>

            <motion.button
              onClick={() => setShowSkipModal(true)}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid rgba(248, 113, 113, 0.45)",
                background: "linear-gradient(135deg, rgba(248,113,113,0.18) 0%, rgba(239,68,68,0.22) 100%)",
                color: "#F87171",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.08em",
                fontFamily: "var(--font-mono)",
                boxShadow: "0 4px 20px rgba(248,113,113,0.18)",
              }}
            >
              GYM SKIPPED TODAY · STREAK RESET
            </motion.button>
          </>
        )}
      </div>

      {/* ── Skip Reason Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSkipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSkipModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "420px",
                background: "rgba(20, 20, 28, 0.95)",
                backdropFilter: "blur(24px) saturate(180%)",
                borderRadius: "22px",
                padding: "22px",
                border: "1px solid rgba(248, 113, 113, 0.35)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(248,113,113,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ fontSize: "22px" }}>⚠️</div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)" }}>Skipping the gym?</div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
                Streak doesn't increment today. Be honest — what got in the way?
              </div>

              <textarea
                autoFocus
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Tight schedule, low recovery, sick, no excuse…"
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${skipReason ? "rgba(248,113,113,0.6)" : "rgba(248,113,113,0.2)"}`,
                  borderRadius: "12px",
                  padding: "12px",
                  color: "var(--text)",
                  fontSize: "13px",
                  minHeight: "90px",
                  resize: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border 0.2s",
                }}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <Button onClick={() => setShowSkipModal(false)} variant="ghost" style={{ flex: 1 }}>
                  Never mind
                </Button>
                <Button
                  onClick={logSkip}
                  variant="danger"
                  style={{ flex: 2 }}
                >
                  Confirm Skip
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Swipe-left on an exercise row to reveal EDIT and DELETE actions. Mirrors
// the SwipeableGoalItem in HabitsPage so the gesture feels identical across
// the app — same drag distance, same color story (accent for edit, red for
// destroy). When isEditing flips true the row morphs into an inline form so
// the user can adjust name/weight/sets/reps without leaving the list.
function SwipeableExerciseRow({
  ex,
  idx,
  trend,
  trendDelta,
  trendColor,
  isEditing,
  editDraft,
  setEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, -40], [0, 1]);

  const handleEditClick = () => {
    animate(x, 0, { duration: 0.3 });
    onStartEdit();
  };

  const handleRemoveClick = () => {
    animate(x, 0, { duration: 0.3 });
    onRemove();
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          background: "var(--card)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          padding: "16px",
          border: "1px solid rgba(251, 191, 36, 0.45)",
          boxShadow: "0 0 20px rgba(251,191,36,0.15)",
        }}
      >
        <Input
          label="Exercise Name"
          value={editDraft.name}
          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
          placeholder="Bench Press"
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <Input
            label="Weight"
            value={editDraft.weight}
            onChange={(e) => setEditDraft({ ...editDraft, weight: e.target.value })}
            placeholder="225 lbs"
            style={{ flex: 1 }}
          />
          <Input
            label="Sets"
            value={editDraft.sets}
            onChange={(e) => setEditDraft({ ...editDraft, sets: e.target.value })}
            placeholder="3"
            style={{ flex: 1 }}
          />
          <Input
            label="Reps"
            value={editDraft.reps}
            onChange={(e) => setEditDraft({ ...editDraft, reps: e.target.value })}
            placeholder="10"
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <Button onClick={onSaveEdit} style={{ flex: 2, background: "#FBBF24", color: "#000" }}>Save</Button>
          <Button onClick={onCancelEdit} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
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
            background: "#FBBF24",
            border: "none",
            color: "#000",
            fontWeight: 800,
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          EDIT
        </button>
        <button
          onClick={handleRemoveClick}
          style={{
            width: "70px",
            background: "#EF4444",
            border: "none",
            color: "#fff",
            fontWeight: 800,
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          DELETE
        </button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        style={{ position: "relative", zIndex: 1, x }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          style={{
            background: "var(--card)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{ex.name}</div>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{ex.sets}</span> sets
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{ex.reps}</span> reps
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#FBBF24" }}>{ex.weight}</div>
                <div style={{ fontSize: "9px", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>LOAD (LBS)</div>
              </div>
            </div>
          </div>

          {/* Progressive overload trend — only shown once a real history
              exists (≥2 deduped points). */}
          {trend.length >= 2 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid var(--border)",
            }}>
              <div style={{
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-faint)",
                letterSpacing: "0.1em",
                fontWeight: 700,
                flexShrink: 0,
              }}>
                OVERLOAD
              </div>
              <div style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                letterSpacing: "0.02em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {trend.join(" → ")}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 800,
                color: trendColor,
                flexShrink: 0,
              }}>
                {trendDelta > 0 ? "▲ +" : trendDelta < 0 ? "▼ −" : "•"}
                {trendDelta !== 0 ? Math.abs(trendDelta) : ""}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
