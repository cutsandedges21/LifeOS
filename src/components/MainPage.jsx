import { useState, useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
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
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [missedGoal, setMissedGoal] = useState(null); // The goal object being marked as missed
  const [reason, setReason] = useState("");

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
      goals: prev.goals.map((g) => g.id === missedGoal.id ? { ...g, missed: true, reason: reason.trim(), done: false } : g),
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

  const completedGoals = state.goals.filter((g) => g.done).length;
  
  // Build items (simplified, no legacy accountability here as requested by new feature)
  const timelineItems = state.goals.map(g => ({
    ...g,
    status: g.done ? "completed" : "upcoming", // We'll simplify status for clarity
    title: g.text,
  }));

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* Reason Modal */}
      <AnimatePresence>
        {missedGoal && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
          }}>
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
              <div style={{ color: "#FCA5A5", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginBottom: "8px" }}>
                URGENT ACCOUNTABILITY
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginBottom: "12px", lineHeight: 1.3 }}>
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

      {/* Hero Section */}
      <HeroSection
        greeting={greeting}
        metrics={{
          date: dayStr().toUpperCase(),
          name: state.user || "User",
          dayProgress: `${pct}%`,
          sleep: `${state.whoop.sleep}%`,
          streak: state.streak,
          goals: `${completedGoals}/${state.goals.length}`,
        }}
      />

      {/* Timeline Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SectionLabel accent="var(--accent-main)">TODAY'S FLOW</SectionLabel>

        {state.goals.length === 0 ? (
          <GlassCard style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ color: "var(--text-faint)", fontSize: "14px", fontWeight: 500 }}>
              No goals set for today yet.
            </div>
          </GlassCard>
        ) : (
          state.goals.map((goal) => (
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

      {/* Add Goal Input */}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <Input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Add a goal for today…"
          style={{ marginBottom: 0, flex: 1 }}
        />
        <Button onClick={addGoal} style={{ minWidth: "80px" }}>+ ADD</Button>
      </div>

      {/* Overseer Chat */}
      <GlassCard style={{ marginTop: "24px", padding: "20px" }}>
        <SectionLabel accent="var(--accent-main)" icon="✦">OVERSEER</SectionLabel>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
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
            <div style={{ fontWeight: 800, fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
              Overseer
              <span style={{ display: "inline-block", marginLeft: "8px", fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                {state.overseerMessageCount}/3
              </span>
              <span style={{ display: "block", width: "6px", height: "6px", borderRadius: "50%", background: state.overseerMessageCount >= 3 ? "#EF4444" : "#34D399", boxShadow: `0 0 8px ${state.overseerMessageCount >= 3 ? "#EF4444" : "#34D399"}` }} />
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-faint)", fontWeight: 500 }}>
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
                    background: m.role === "user"
                      ? "rgba(var(--accent-main-rgb), 0.15)"
                      : "var(--card)",
                    border: `1px solid ${m.role === "user" ? "rgba(var(--accent-main-rgb), 0.3)" : "var(--border)"}`,
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
              <div style={{ display: "flex", gap: "4px", padding: "12px 16px", background: "var(--card)", borderRadius: "16px", width: "fit-content", border: "1px solid var(--border)" }}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--text-faint)" }}
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
            onChange={(e) => setState((prev) => ({ ...prev, overseerInput: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder={state.overseerMessageCount >= 3 ? "Message limit reached today. Come back tomorrow to speak with Overseer" : "Message Overseer"}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: state.overseerMessageCount >= 3 ? "var(--text-faint)" : "var(--text)",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <motion.button
            onClick={sendMsg}
            disabled={overseerLoading || state.overseerMessageCount >= 3}
            whileTap={{ scale: 0.9 }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background: state.overseerMessageCount >= 3 ? "var(--text-faint)" : "var(--accent-main)",
              border: "none",
              color: state.overseerMessageCount >= 3 ? "var(--text)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: (overseerLoading || state.overseerMessageCount >= 3) ? 0.5 : 1,
              boxShadow: "0 4px 12px rgba(var(--accent-main-rgb), 0.3)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 7-7 7 7M12 19V5"/>
            </svg>
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}

const SwipeableGoalItem = ({ goal, startEdit, setMissedGoal, editingGoalId, editingText, setEditingText, saveEdit, toggleGoal }) => {
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
    <div style={{ position: "relative", overflow: "hidden", borderRadius: "20px" }}>
      {/* Swipe Actions (Behind) */}
      <motion.div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 0,
        opacity,
      }}>
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

      {/* Goal Card (Swipeable) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: goal.missed ? 0 : -140, right: 0 }}
        dragElastic={goal.missed ? 0 : 0.1}
        style={{ position: "relative", zIndex: 1, x }}
      >
        <TimelineItem
          status={goal.missed ? "missed" : goal.done ? "completed" : "current"}
          time={goal.time || "Now"}
          title={editingGoalId === goal.id ? (
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
          ) : goal.text}
          details={goal.missed ? goal.reason : goal.done ? "Completed" : "In Progress"}
          onClick={() => toggleGoal(goal.id)}
        />
      </motion.div>
    </div>
  );
};
