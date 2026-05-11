import { useState, useEffect } from "react";
import { Card, SectionLabel, Input, Button, Textarea } from "./UI.jsx";

export function MainPage({ state, setState, pct, pod, leftStr, overseerLoading, sendMsg, chatRef, greeting }) {
  const [newGoal, setNewGoal] = useState("");

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { id: Date.now(), text: newGoal.trim(), done: false }],
    }));
    setNewGoal("");
  };

  const toggleGoal = (id) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }));
  };

  const completedGoals = state.goals.filter((g) => g.done).length;

  return (
    <div style={{ padding: "0 var(--spacing-lg)" }}>
      {/* Day Ring */}
      <Card style={{ marginTop: "var(--spacing-lg)", display: "flex", alignItems: "center", gap: "var(--spacing-xl)" }}>
        <DayRing pct={pct} />
        <div>
          <div style={{ fontSize: "var(--font-xl)", fontWeight: 700 }}>
            {greeting} {state.user || "User"}
          </div>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 600, color: "var(--color-text-muted)", marginTop: "4px" }}>
            {pod.emoji} {pod.label} — {pod.cta}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-sm)",
              color: "var(--color-text-muted)",
              marginTop: "var(--spacing-xs)",
            }}
          >
            {leftStr}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-xs)",
              color: "var(--color-text-muted)",
              marginTop: "2px",
            }}
          >
            {state.settings?.wakeTime || "08:00"} – {state.settings?.sleepTime || "00:00"}
          </div>
        </div>
      </Card>

      {/* Overseer */}
      <Card>
        <SectionLabel icon="✦">OVERSEER</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-input)",
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
                    background: m.role === "user" ? "var(--color-input)" : "var(--color-border)",
                    fontSize: "var(--font-base)",
                    lineHeight: 1.55,
                    color: m.role === "ai" ? "var(--color-text-muted)" : "var(--color-text)",
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
                  background: "var(--color-border)",
                  borderRadius: "12px",
                  width: "fit-content",
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
            background: "var(--color-input)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
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
      </Card>

      {/* Goals */}
      <Card>
        <SectionLabel>GOALMAXXING</SectionLabel>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--font-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              TODAY — {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--spacing-sm)", marginTop: "var(--spacing-xs)" }}>
              <span style={{ fontSize: "var(--font-5xl)", fontWeight: 800, lineHeight: 1 }}>{completedGoals}</span>
              <span style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
                / {state.goals.length} COMPLETE
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              background: "var(--color-input)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
            }}
          >
            <span style={{ fontSize: "var(--font-sm)", color: "var(--color-accent)" }}>⚡</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--font-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              {state.streak} DAY STREAK
            </span>
          </div>
        </div>

        {state.goals.map((g) => (
          <div
            key={g.id}
            onClick={() => toggleGoal(g.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
              padding: "14px 0",
              borderBottom: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: `1.5px solid ${g.done ? "var(--color-success)" : "var(--color-border)"}`,
                background: g.done ? "var(--color-success)22" : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--font-xs)",
                color: "var(--color-success)",
              }}
            >
              {g.done ? "✓" : ""}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: "var(--font-md)",
                color: g.done ? "var(--color-text-muted)" : "var(--color-text)",
                textDecoration: g.done ? "line-through" : "none",
              }}
            >
              {g.text}
            </span>
            <span style={{ fontSize: "var(--font-sm)", color: g.done ? "var(--color-success)" : "var(--color-border)" }}>
              ⚡
            </span>
          </div>
        ))}

        <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-md)" }}>
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="Add a goal for today…"
            style={{ marginBottom: 0 }}
          />
          <Button onClick={addGoal}>+ Add</Button>
        </div>
      </Card>
    </div>
  );
}

function DayRing({ pct }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <svg width="110" height="110" style={{ flexShrink: 0 }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text
        x="55"
        y="50"
        textAnchor="middle"
        fill="var(--color-text)"
        fontSize="22"
        fontWeight="800"
        fontFamily="DM Sans,sans-serif"
      >
        {pct}%
      </text>
      <text
        x="55"
        y="66"
        textAnchor="middle"
        fill="var(--color-text-muted)"
        fontSize="9"
        fontFamily="DM Mono,monospace"
        letterSpacing="1"
      >
        {pct < 25 ? "MORNING" : pct < 50 ? "MIDDAY" : pct < 75 ? "AFTERNOON" : "EVENING"}
      </text>
      <text
        x="55"
        y="78"
        textAnchor="middle"
        fill="var(--color-border)"
        fontSize="8"
        fontFamily="DM Mono,monospace"
      >
        {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
      </text>
    </svg>
  );
}
