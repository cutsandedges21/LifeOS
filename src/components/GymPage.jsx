import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, MetricCard } from "./GlassComponents.jsx";
import { Input, Button, Select, SectionLabel } from "./UI.jsx";
import { getTodayDay } from "../utils/formatters.js";

const WORKOUT_TYPES = [
  { value: "", label: "Rest Day" },
  { value: "push", label: "Push (Chest/Shoulders/Triceps)" },
  { value: "pull", label: "Pull (Back/Biceps)" },
  { value: "legs", label: "Legs" },
  { value: "upper", label: "Upper Body" },
  { value: "full", label: "Full Body" },
  { value: "cardio", label: "Cardio" },
  { value: "core", label: "Core/Abs" },
  { value: "custom", label: "Custom" },
];

const SPLIT_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DAY_LABELS = {
  monday: "MON",
  tuesday: "TUE",
  wednesday: "WED",
  thursday: "THU",
  friday: "FRI",
  saturday: "SAT",
  sunday: "SUN",
};

const DAY_FULL_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function GymPage({ state, setState }) {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    lastWeight: 0,
    lastReps: 0,
  });

  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const today = getTodayDay();
  const todayWorkout = state.gymSplit[today] || "";
  const todayExercises = state.gymExercises[todayWorkout] || [];

  // Calculate workout day number
  const workoutDayNumber = SPLIT_DAYS.findIndex((day) => day === today) + 1;

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    const todayIndex = SPLIT_DAYS.indexOf(today);
    for (let i = 0; i < 7; i++) {
      const checkDay = SPLIT_DAYS[(todayIndex - i + 7) % 7];
      if (state.gymSplit[checkDay]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const updateSplit = (day, value) => {
    setState((prev) => ({
      ...prev,
      gymSplit: { ...prev.gymSplit, [day]: value },
      workoutDay: day === today ? value : prev.workoutDay,
    }));
  };

  const addExercise = () => {
    if (!newExercise.name.trim() || !todayWorkout) return;

    const exercise = {
      id: Date.now(),
      name: newExercise.name.trim(),
      lastWeight: Number(newExercise.lastWeight) || 0,
      lastReps: Number(newExercise.lastReps) || 0,
    };

    setState((prev) => ({
      ...prev,
      gymExercises: {
        ...prev.gymExercises,
        [todayWorkout]: [...(prev.gymExercises[todayWorkout] || []), exercise],
      },
    }));

    setNewExercise({ name: "", lastWeight: 0, lastReps: 0 });
    setShowAddExercise(false);
  };

  const removeExercise = (exerciseId) => {
    if (!todayWorkout) return;

    setState((prev) => ({
      ...prev,
      gymExercises: {
        ...prev.gymExercises,
        [todayWorkout]: prev.gymExercises[todayWorkout].filter((e) => e.id !== exerciseId),
      },
    }));
  };

  const updateExercise = (exerciseId, field, value) => {
    if (!todayWorkout) return;

    setState((prev) => ({
      ...prev,
      gymExercises: {
        ...prev.gymExercises,
        [todayWorkout]: prev.gymExercises[todayWorkout].map((e) =>
          e.id === exerciseId ? { ...e, [field]: value } : e
        ),
      },
    }));
  };

  const getAdvice = async () => {
    if (!todayWorkout || todayExercises.length === 0) {
      setAdvice("Set up your workout split and add exercises first.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const exercise = todayExercises[0];
      const newWeight = exercise.lastWeight > 0 ? exercise.lastWeight + 5 : 135;
      const newReps = exercise.lastReps > 0 ? exercise.lastReps : 8;

      const adviceText = `Today's target for ${exercise.name}:\n\n${newWeight} lbs × ${newReps} reps × 3 sets\n\nCue: Control the eccentric, explode on the concentric. Focus on form over weight.\n\nRecovery score: ${state.whoop.recovery}/100 - ${state.whoop.recovery >= 67 ? "Go for it!" : state.whoop.recovery >= 34 ? "Moderate intensity." : "Take it easy today."
        }`;

      setAdvice(adviceText);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      {/* Split Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
        {SPLIT_DAYS.map((day) => {
          const workout = state.gymSplit[day];
          const isToday = day === today;
          const workoutLabel = WORKOUT_TYPES.find((w) => w.value === workout)?.label || "REST";

          return (
            <motion.div
              key={day}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Could open a modal to edit this day's workout
              }}
              style={{
                background: isToday
                  ? "rgba(255, 255, 255, 0.2)"
                  : workout
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                padding: "12px",
                border: isToday
                  ? "2px solid rgba(255, 255, 255, 0.3)"
                  : "1px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", marginBottom: "4px" }}>
                {DAY_LABELS[day]}
              </div>
              <div style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>
                {workoutLabel.split(" ")[0]}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Today's Workout Details */}
      {todayWorkout ? (
        <GlassCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionLabel>💪 TODAY: {WORKOUT_TYPES.find((w) => w.value === todayWorkout)?.label || todayWorkout.toUpperCase()}</SectionLabel>
            <div style={{ display: "flex", gap: "16px" }}>
              <div>
                <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px" }}>WORKOUT DAY</div>
                <div style={{ color: "#fff", fontSize: "20px", fontWeight: 700 }}>Day {workoutDayNumber}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px" }}>STREAK</div>
                <div style={{ color: "#4ade80", fontSize: "20px", fontWeight: 700 }}>{streak}</div>
              </div>
            </div>
          </div>

          {todayExercises.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "var(--spacing-lg)",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              <div style={{ fontSize: "var(--font-lg)", marginBottom: "var(--spacing-sm)" }}>No exercises yet</div>
              <div style={{ fontSize: "var(--font-sm)" }}>Add your exercises to start tracking</div>
            </div>
          ) : (
            <>
              {todayExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px",
                    padding: "var(--spacing-md)",
                    marginBottom: "var(--spacing-sm)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
                    <span style={{ fontWeight: 600, fontSize: "var(--font-md)", color: "#fff" }}>
                      {exercise.name}
                    </span>
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.5)",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                    <Input
                      label="Last Weight (lbs)"
                      type="number"
                      value={exercise.lastWeight || ""}
                      onChange={(e) => updateExercise(exercise.id, "lastWeight", Number(e.target.value) || 0)}
                      style={{ marginBottom: 0 }}
                    />
                    <Input
                      label="Last Reps"
                      type="number"
                      value={exercise.lastReps || ""}
                      onChange={(e) => updateExercise(exercise.id, "lastReps", Number(e.target.value) || 0)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={getAdvice} disabled={loading} style={{ width: "100%", marginTop: "var(--spacing-md)" }}>
                {loading ? "Calculating…" : "⚡ Get Today's Target"}
              </Button>

              {advice && (
                <div
                  style={{
                    marginTop: "var(--spacing-md)",
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px",
                    padding: "var(--spacing-md)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <div style={{ fontSize: "var(--font-xs)", color: "#fbbf24", fontFamily: "var(--font-mono)", marginBottom: "var(--spacing-sm)" }}>
                    COACH
                  </div>
                  <div style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {advice}
                  </div>
                </div>
              )}
            </>
          )}

          {!showAddExercise ? (
            <motion.button
              onClick={() => setShowAddExercise(true)}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px dashed rgba(255, 255, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.7)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                marginTop: "var(--spacing-md)",
              }}
            >
              + Add Exercise
            </motion.button>
          ) : (
            <div
              style={{
                marginTop: "var(--spacing-md)",
                padding: "var(--spacing-md)",
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <Input
                label="Exercise Name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                placeholder="e.g., Squat"
              />
              <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                <Input
                  label="Last Weight (lbs)"
                  type="number"
                  value={newExercise.lastWeight || ""}
                  onChange={(e) => setNewExercise({ ...newExercise, lastWeight: Number(e.target.value) || 0 })}
                />
                <Input
                  label="Last Reps"
                  type="number"
                  value={newExercise.lastReps || ""}
                  onChange={(e) => setNewExercise({ ...newExercise, lastReps: Number(e.target.value) || 0 })}
                />
              </div>
              <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-sm)" }}>
                <Button onClick={addExercise} style={{ flex: 1 }}>
                  Add Exercise
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddExercise(false)}
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard>
          <SectionLabel>💪 TODAY'S WORKOUT</SectionLabel>
          <div
            style={{
              textAlign: "center",
              padding: "var(--spacing-lg)",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            <div style={{ fontSize: "var(--font-lg)", marginBottom: "var(--spacing-sm)" }}>Rest Day</div>
            <div style={{ fontSize: "var(--font-sm)" }}>
              Configure your weekly split above to see today's workout
            </div>
          </div>
        </GlassCard>
      )}

      {/* Weekly Split Configuration */}
      <GlassCard>
        <SectionLabel>WEEKLY SPLIT</SectionLabel>
        <div style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.6)", marginBottom: "var(--spacing-md)" }}>
          Configure your workout schedule. Today is{" "}
          <span style={{ color: "#fbbf24", fontWeight: 600 }}>{DAY_FULL_LABELS[today]}</span>.
        </div>

        {SPLIT_DAYS.map((day) => (
          <div
            key={day}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-sm)",
                fontWeight: day === today ? 700 : 400,
                color: day === today ? "#fbbf24" : "rgba(255, 255, 255, 0.8)",
              }}
            >
              {DAY_FULL_LABELS[day]}
            </span>
            <Select
              value={state.gymSplit[day] || ""}
              onChange={(e) => updateSplit(day, e.target.value)}
              options={WORKOUT_TYPES}
              style={{ width: "180px", marginBottom: 0 }}
            />
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
