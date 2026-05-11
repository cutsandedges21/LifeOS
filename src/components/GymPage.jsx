import { useState, useEffect } from "react";
import { Card, SectionLabel, Input, Button, Select } from "./UI.jsx";
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

    // Simulate API call with progressive overload logic
    setTimeout(() => {
      const exercise = todayExercises[0];
      const newWeight = exercise.lastWeight > 0 ? exercise.lastWeight + 5 : 135;
      const newReps = exercise.lastReps > 0 ? exercise.lastReps : 8;

      const adviceText = `Today's target for ${exercise.name}:\n\n${newWeight} lbs × ${newReps} reps × 3 sets\n\nCue: Control the eccentric, explode on the concentric. Focus on form over weight.\n\nRecovery score: ${state.whoop.recovery}/100 - ${
        state.whoop.recovery >= 67 ? "Go for it!" : state.whoop.recovery >= 34 ? "Moderate intensity." : "Take it easy today."
      }`;

      setAdvice(adviceText);
      setLoading(false);
    }, 1000);
  };

  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      {/* Weekly Split */}
      <Card>
        <SectionLabel>WEEKLY SPLIT</SectionLabel>
        <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-md)" }}>
          Configure your workout schedule. Today is{" "}
          <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{dayLabels[today]}</span>.
        </div>

        {Object.entries(state.gymSplit).map(([day, workout]) => (
          <div
            key={day}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-sm)",
                fontWeight: day === today ? 700 : 400,
                color: day === today ? "var(--color-accent)" : "var(--color-text)",
              }}
            >
              {dayLabels[day]}
            </span>
            <Select
              value={workout}
              onChange={(e) => updateSplit(day, e.target.value)}
              options={WORKOUT_TYPES}
              style={{ width: "180px", marginBottom: 0 }}
            />
          </div>
        ))}
      </Card>

      {/* Today's Workout */}
      {todayWorkout ? (
        <Card>
          <SectionLabel>💪 TODAY: {WORKOUT_TYPES.find((w) => w.value === todayWorkout)?.label || todayWorkout.toUpperCase()}</SectionLabel>

          {todayExercises.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--spacing-lg)", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "var(--font-lg)", marginBottom: "var(--spacing-sm)" }}>No exercises yet</div>
              <div style={{ fontSize: "var(--font-sm)" }}>Add your exercises to start tracking</div>
            </div>
          ) : (
            <>
              {todayExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  style={{
                    background: "var(--color-input)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--spacing-md)",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
                    <span style={{ fontWeight: 600, fontSize: "var(--font-md)" }}>{exercise.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeExercise(exercise.id)}>
                      ✕
                    </Button>
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
                    background: "var(--color-input)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--spacing-md)",
                  }}
                >
                  <div style={{ fontSize: "var(--font-xs)", color: "var(--color-accent)", fontFamily: "var(--font-mono)", marginBottom: "var(--spacing-sm)" }}>
                    COACH
                  </div>
                  <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {advice}
                  </div>
                </div>
              )}
            </>
          )}

          {!showAddExercise ? (
            <Button variant="secondary" onClick={() => setShowAddExercise(true)} style={{ width: "100%", marginTop: "var(--spacing-md)" }}>
              + Add Exercise
            </Button>
          ) : (
            <div style={{ marginTop: "var(--spacing-md)", padding: "var(--spacing-md)", background: "var(--color-input)", borderRadius: "var(--radius-sm)" }}>
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
                <Button variant="ghost" onClick={() => setShowAddExercise(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <SectionLabel>💪 TODAY'S WORKOUT</SectionLabel>
          <div style={{ textAlign: "center", padding: "var(--spacing-lg)", color: "var(--color-text-muted)" }}>
            <div style={{ fontSize: "var(--font-lg)", marginBottom: "var(--spacing-sm)" }}>Rest Day</div>
            <div style={{ fontSize: "var(--font-sm)" }}>Configure your weekly split above to see today's workout</div>
          </div>
        </Card>
      )}
    </div>
  );
}
