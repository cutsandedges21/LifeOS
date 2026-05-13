import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, SectionHeader } from "./GlassComponents.jsx";
import { Input, Button, SectionLabel, Select } from "./UI.jsx";
import { getTodayDay } from "../utils/formatters.js";

export function GymPage({ state, setState }) {
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    weight: "",
    reps: "",
    sets: "",
    category: "Strength",
  });

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const categories = [
    { label: "Strength", value: "Strength" },
    { label: "Hypertrophy", value: "Hypertrophy" },
    { label: "Endurance", value: "Endurance" },
    { label: "Mobility", value: "Mobility" },
  ];

  const updateSplit = (val) => {
    setState((prev) => {
      const newSplit = { ...prev.gymSplit, [selectedDay]: val };
      // Also update the global workoutDay if the edited day is today
      const isToday = selectedDay === getTodayDay();
      return { 
        ...prev, 
        gymSplit: newSplit,
        workoutDay: isToday ? val : prev.workoutDay 
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
    setNewExercise({ name: "", weight: "", reps: "", sets: "", category: "Strength" });
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

  const currentExercises = state.gymExercises?.[selectedDay] || [];
  const currentSplit = state.gymSplit?.[selectedDay] || "";

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
                <Select
                  label="Category"
                  value={newExercise.category}
                  onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                  options={categories}
                />
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
                <div style={{ fontSize: "11px", color: "#FBBF24", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {e.category.toUpperCase()}
                </div>
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

      {/* Progress Stats */}
    </div>
  );
}
