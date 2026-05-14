import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, SectionHeader } from "./GlassComponents.jsx";
import { Input, Button } from "./UI.jsx";
import { getTodayDay } from "../utils/formatters.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function GymPage({ state, setState }) {
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [newExercise, setNewExercise] = useState({
    name: "",
    weight: "",
    reps: "",
    sets: "",
  });

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

  const removeExercise = (id) => {
    setState((prev) => ({
      ...prev,
      gymExercises: {
        ...prev.gymExercises,
        [selectedDay]: (prev.gymExercises?.[selectedDay] || []).filter((e) => e.id !== id),
      },
    }));
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

  const currentExercises = state.gymExercises?.[selectedDay] || [];
  const currentSplit = state.gymSplit?.[selectedDay] || "";

  const skippedToday = (state.gymSkips || []).some((s) => s.date === todayISO());

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Day Selector */}
      <GlassCard style={{ padding: "16px", marginBottom: "16px" }} glow="#FBBF24">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
          {days.map((day) => {
            const isActive = selectedDay === day;
            const isToday = getTodayDay() === day;
            return (
              <motion.button
                key={day}
                onClick={() => setSelectedDay(day)}
                whileTap={{ scale: 0.9 }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "12px",
                  background: isActive ? "#FBBF24" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isActive ? "#FBBF24" : isToday ? "rgba(251, 191, 36, 0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: isActive ? "#000" : "rgba(248, 250, 255, 0.6)",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
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
                <div style={{ display: "flex", gap: "10px" }}>
                  <Input
                    label="Weight (lbs)"
                    value={newExercise.weight}
                    onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                    placeholder="225 lbs"
                    style={{ flex: 1 }}
                  />
                  <Input
                    label="Sets"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                    placeholder="3"
                    style={{ flex: 0.8 }}
                  />
                  <Input
                    label="Reps"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                    placeholder="10"
                    style={{ flex: 0.8 }}
                  />
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
          {currentExercises.map((e, idx) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFF" }}>{e.name}</div>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(248, 250, 255, 0.45)" }}>
                    <span style={{ color: "rgba(248, 250, 255, 0.8)", fontWeight: 600 }}>{e.sets}</span> sets
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(248, 250, 255, 0.45)" }}>
                    <span style={{ color: "rgba(248, 250, 255, 0.8)", fontWeight: 600 }}>{e.reps}</span> reps
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#FBBF24" }}>{e.weight}</div>
                  <div style={{ fontSize: "9px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)" }}>LOAD (LBS)</div>
                </div>
                <button
                  onClick={() => removeExercise(e.id)}
                  style={{ background: "none", border: "none", color: "rgba(248, 250, 255, 0.2)", cursor: "pointer", fontSize: "20px" }}
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
          {currentExercises.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(248, 250, 255, 0.3)", fontSize: "14px" }}>
              No exercises added for {selectedDay}.
            </div>
          )}
        </div>
      </div>

      {/* ── Skip Today Button ──────────────────────────────────────── */}
      <div style={{ marginTop: "32px" }}>
        {skippedToday ? (
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
            }}
          >
            GYM SKIPPED TODAY · STREAK PAUSED
          </div>
        ) : (
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
            ✕ SKIPPED GYM TODAY
          </motion.button>
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
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#F8FAFF" }}>Skipping the gym?</div>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(248,250,255,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>
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
                  color: "#F8FAFF",
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
