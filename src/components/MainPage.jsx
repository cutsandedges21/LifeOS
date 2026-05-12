import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  GlassCard,
  TimelineItem,
  AccountabilityCard,
  HeroSection,
} from "./GlassComponents.jsx";
import { SectionLabel, Input, Button } from "./UI.jsx";
import { dayStr, timeStr } from "../utils/formatters.js";

export function MainPage({
  state,
  setState,
  pct,
  overseerLoading,
  sendMsg,
  chatRef,
  greeting,
}) {
  const [newGoal, setNewGoal] = useState("");
  const [accountabilityExplanation, setAccountabilityExplanation] = useState("");
  const [showAccountability, setShowAccountability] = useState(false);

  // Check if there are missed goals that need accountability
  const missedGoals = state.goals.filter((g) => !g.done && g.accountabilityRequired);
  const hasUnresolvedAccountability = missedGoals.some((g) => !g.accountabilityNote);

  useEffect(() => {
    if (hasUnresolvedAccountability) {
      setShowAccountability(true);
    }
  }, [hasUnresolvedAccountability]);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setState((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          id: Date.now(),
          text: newGoal.trim(),
          done: false,
          time: timeStr(),
        },
      ],
    }));
    setNewGoal("");
  };

  const toggleGoal = (id) => {
    const goal = state.goals.find((g) => g.id === id);
    if (!goal) return;

    if (goal.done) {
      // Unmark as done - remove accountability
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id
            ? { ...g, done: false, accountabilityRequired: true, accountabilityNote: undefined }
            : g
        ),
      }));
    } else {
      // Mark as done
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id ? { ...g, done: true, accountabilityRequired: false } : g
        ),
      }));
    }
  };

  const submitAccountability = () => {
    if (!accountabilityExplanation.trim()) return;

    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.accountabilityRequired && !g.accountabilityNote
          ? { ...g, accountabilityNote: accountabilityExplanation, accountabilityRequired: false }
          : g
      ),
    }));
    setAccountabilityExplanation("");
    setShowAccountability(false);
  };

  const completedGoals = state.goals.filter((g) => g.done).length;
  const currentGoal = state.goals.find((g) => !g.done && !g.accountabilityRequired);
  const upcomingGoals = state.goals.filter(
    (g) => !g.done && g.id !== currentGoal?.id && !g.accountabilityRequired
  );
  const skippedGoals = state.goals.filter((g) => g.accountabilityRequired);

  // Build timeline items
  const timelineItems = [
    ...state.goals
      .filter((g) => g.done)
      .map((g) => ({
        id: g.id,
        status: "completed",
        time: g.time || "Done",
        title: g.text,
        details: "Completed",
      })),
    ...(currentGoal
      ? [
          {
            id: currentGoal.id,
            status: "current",
            time: "NOW",
            title: currentGoal.text,
            details: "In progress",
          },
        ]
      : []),
    ...upcomingGoals.map((g) => ({
      id: g.id,
      status: "upcoming",
      time: g.time || "Upcoming",
      title: g.text,
      details: "Pending",
    })),
    ...skippedGoals.map((g) => ({
      id: g.id,
      status: "missed",
      time: g.time || "Missed",
      title: g.text,
      details: g.accountabilityNote || "Accountability required",
      children: g.accountabilityNote && (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
            padding: "10px",
            marginTop: "8px",
          }}
        >
          <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "10px", marginBottom: "4px" }}>
            ACCOUNTABILITY NOTE
          </div>
          <div style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "12px", fontStyle: "italic" }}>
            "{g.accountabilityNote}"
          </div>
        </div>
      ),
    })),
  ];

  return (
    <div style={{ padding: "0 var(--spacing-lg)" }}>
      {/* Accountability Card */}
      <AnimatePresence>
        {showAccountability && missedGoals.length > 0 && (
          <AccountabilityCard
            missedGoals={missedGoals}
            explanation={accountabilityExplanation}
            setExplanation={setAccountabilityExplanation}
            onSubmit={submitAccountability}
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <HeroSection
        greeting={greeting}
        metrics={{
          date: dayStr(),
          name: state.user || "User",
          dayProgress: `${pct}%`,
          recovery: `${state.whoop.recovery}%`,
          streak: state.streak,
          goals: `${completedGoals}/${state.goals.length}`,
        }}
      />

      {/* Timeline Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "11px", fontWeight: 500, paddingLeft: "4px" }}>
          TODAY'S FLOW
        </div>

        {timelineItems.length === 0 ? (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px" }}>
              No goals yet. Add your first goal below!
            </div>
          </div>
        ) : (
          timelineItems.map((item) => (
            <TimelineItem
              key={item.id}
              status={item.status}
              time={item.time}
              title={item.title}
              details={item.details}
              onClick={() => {
                if (item.status === "current" || item.status === "upcoming") {
                  toggleGoal(item.id);
                }
              }}
            >
              {item.children}
            </TimelineItem>
          ))
        )}
      </div>

      {/* Add Goal Input */}
      <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-md)" }}>
        <Input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Add a goal for today…"
          style={{ marginBottom: 0, flex: 1 }}
        />
        <Button onClick={addGoal}>+ Add</Button>
      </div>

      {/* Overseer Chat */}
      <GlassCard style={{ marginTop: "var(--spacing-lg)" }}>
        <SectionLabel icon="✦">OVERSEER</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-lg)",
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--font-md)" }}>
              Overseer{" "}
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--color-success)",
                  marginLeft: "var(--spacing-xs)",
                  animation: "pulse 2s infinite",
                }}
              />
            </div>
            <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
              Knows your dashboard. Ask anything.
            </div>
          </div>
        </div>

        {/* Chat log */}
        {state.overseerLog.length > 0 && (
          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              marginBottom: "var(--spacing-md)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-sm)",
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
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "9px 13px",
                    borderRadius: "12px",
                    background: m.role === "user"
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    fontSize: "var(--font-base)",
                    lineHeight: 1.55,
                    color: m.role === "ai" ? "var(--color-text-muted)" : "var(--color-text)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {overseerLoading && (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  padding: "9px 13px",
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "12px",
                  width: "fit-content",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--color-text-muted)",
                      display: "inline-block",
                      animation: `blink 1.4s ${i * 0.2}s infinite`,
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
            gap: "var(--spacing-md)",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <span style={{ fontSize: "var(--font-md)", color: "var(--color-text-muted)" }}>🎤</span>
          <input
            value={state.overseerInput}
            onChange={(e) => setState((prev) => ({ ...prev, overseerInput: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder="Message Overseer"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "var(--color-text)",
              fontSize: "var(--font-base)",
              fontFamily: "var(--font-sans)",
            }}
          />
          <Button
            onClick={sendMsg}
            disabled={overseerLoading}
            style={{ width: "32px", height: "32px", borderRadius: "50%", padding: 0 }}
          >
            ↑
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
