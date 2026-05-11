import { useState, useEffect } from "react";
import { Card, SectionLabel, Input, Button, Toggle } from "./UI.jsx";
import { calculateSleepHours } from "../utils/formatters.js";

export function HealthPage({ state, setState }) {
  const [loading, setLoading] = useState(false);

  const updateSleepHours = (hours) => {
    setState((prev) => ({
      ...prev,
      sleepInput: { ...prev.sleepInput, hours },
      whoop: { ...prev.whoop, sleep: Math.round((hours / 8) * 100) },
    }));
  };

  const updateBedtime = (bedtime) => {
    const hours = calculateSleepHours(bedtime, state.sleepInput.wakeTime);
    setState((prev) => ({
      ...prev,
      sleepInput: { ...prev.sleepInput, bedtime, hours },
      whoop: { ...prev.whoop, sleep: Math.round((hours / 8) * 100) },
    }));
  };

  const updateWakeTime = (wakeTime) => {
    const hours = calculateSleepHours(state.sleepInput.bedtime, wakeTime);
    setState((prev) => ({
      ...prev,
      sleepInput: { ...prev.sleepInput, wakeTime, hours },
      whoop: { ...prev.whoop, sleep: Math.round((hours / 8) * 100) },
    }));
  };

  const toggleSleepMode = (mode) => {
    setState((prev) => ({
      ...prev,
      sleepInput: { ...prev.sleepInput, mode },
    }));
  };

  const getRecoveryColor = (recovery) => {
    if (recovery >= 67) return "var(--color-success)";
    if (recovery >= 34) return "var(--color-accent)";
    return "var(--color-danger)";
  };

  const getAdvice = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const advice =
        state.whoop.recovery >= 67
          ? "Push hard today. Body's primed — go for the PR, do the harder workout, take on the heavy task."
          : state.whoop.recovery >= 34
          ? "Moderate intensity today. Focus on technique and consistency. Save the heavy lifting for a better recovery day."
          : "Take it easy today. Focus on recovery, light movement, and rest. Your body needs time to rebuild.";
      setState((prev) => ({ ...prev, whoop: { ...prev.whoop, advice } }));
      setLoading(false);
    }, 1000);
  };

  const recColor = getRecoveryColor(state.whoop.recovery);

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      {/* Sleep Input */}
      <Card>
        <SectionLabel>💤 SLEEP TRACKING</SectionLabel>
        <Toggle
          label="Use time-based input"
          checked={state.sleepInput.mode === "time"}
          onChange={(checked) => toggleSleepMode(checked ? "time" : "direct")}
        />

        {state.sleepInput.mode === "direct" ? (
          <Input
            label="Hours Slept"
            type="number"
            step="0.1"
            min="0"
            max="24"
            value={state.sleepInput.hours || ""}
            onChange={(e) => updateSleepHours(Number(e.target.value) || 0)}
            placeholder="e.g., 7.5"
          />
        ) : (
          <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
            <Input
              label="Bedtime"
              type="time"
              value={state.sleepInput.bedtime}
              onChange={(e) => updateBedtime(e.target.value)}
            />
            <Input
              label="Wake Time"
              type="time"
              value={state.sleepInput.wakeTime}
              onChange={(e) => updateWakeTime(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: "var(--spacing-md)", padding: "var(--spacing-md)", background: "var(--color-input)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            SLEEP QUALITY
          </div>
          <div style={{ fontSize: "var(--font-3xl)", fontWeight: 800, marginTop: "var(--spacing-xs)" }}>
            {state.whoop.sleep}%
          </div>
          <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
            {state.sleepInput.hours > 0 ? `${state.sleepInput.hours} hours tracked` : "No sleep data yet"}
          </div>
        </div>
      </Card>

      {/* WHOOP */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
          <div style={{ fontSize: "var(--font-sm)", fontWeight: 700, color: recColor }}>W WHOOP</div>
          <span style={{ fontSize: "var(--font-xs)", color: "var(--color-success)" }}>● LIVE</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--spacing-lg)" }}>
          <WhoopRing score={state.whoop.recovery} color={recColor} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
          <Input
            label="Recovery"
            type="number"
            min="0"
            max="100"
            value={state.whoop.recovery || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                whoop: { ...prev.whoop, recovery: Number(e.target.value) || 0 },
              }))
            }
            style={{ marginBottom: 0 }}
          />
          <Input
            label="Sleep %"
            type="number"
            min="0"
            max="100"
            value={state.whoop.sleep || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                whoop: { ...prev.whoop, sleep: Number(e.target.value) || 0 },
              }))
            }
            style={{ marginBottom: 0 }}
          />
          <Input
            label="Strain"
            type="number"
            min="0"
            max="21"
            step="0.1"
            value={state.whoop.strain || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                whoop: { ...prev.whoop, strain: Number(e.target.value) || 0 },
              }))
            }
            style={{ marginBottom: 0 }}
          />
          <Input
            label="HRV"
            type="number"
            min="0"
            value={state.whoop.hrv || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                whoop: { ...prev.whoop, hrv: Number(e.target.value) || 0 },
              }))
            }
            style={{ marginBottom: 0 }}
          />
          <Input
            label="RHR"
            type="number"
            min="0"
            value={state.whoop.rhr || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                whoop: { ...prev.whoop, rhr: Number(e.target.value) || 0 },
              }))
            }
            style={{ marginBottom: 0 }}
          />
        </div>

        <div
          style={{
            background: "var(--color-input)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-sm)" }}>
            <span style={{ fontSize: "var(--font-xs)", fontFamily: "var(--font-mono)" }}>TODAY'S CALL</span>
            <span
              style={{
                fontSize: "var(--font-xs)",
                background: "var(--color-success)22",
                color: "var(--color-success)",
                borderRadius: "4px",
                padding: "1px 8px",
              }}
            >
              {state.whoop.recovery >= 67 ? "GREEN" : state.whoop.recovery >= 34 ? "YELLOW" : "RED"}
            </span>
          </div>
          <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {state.whoop.advice || "Enter your WHOOP data to get personalized advice."}
          </div>
          <Button onClick={getAdvice} disabled={loading} style={{ marginTop: "var(--spacing-sm)", width: "100%" }}>
            {loading ? "Calculating…" : "⚡ Get Today's Advice"}
          </Button>
        </div>
      </Card>

      {/* Peak Window */}
      <Card>
        <SectionLabel>PEAK WINDOW</SectionLabel>
        <div style={{ marginBottom: "var(--spacing-sm)", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "var(--font-sm)", color: "var(--color-accent)", fontWeight: 600 }}>
              {state.whoop.sleep >= 7 ? "💤 Good window — optimal performance" : "💤 Low window — admin tasks only"}
            </div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
              Sleep {state.sleepInput.hours > 0 ? `${state.sleepInput.hours}h` : "not tracked"} · Recovery {state.whoop.recovery}%
            </div>
          </div>
          <div style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>3 PM–6 PM</div>
        </div>
        <PeakCurve />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--spacing-sm)", fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
          <span style={{ color: "var(--color-accent)" }}>● Peak</span>
          <span style={{ color: "var(--color-text-muted)" }}>● Steady</span>
          <span style={{ color: "var(--color-border)" }}>● Foggy</span>
        </div>
      </Card>
    </div>
  );
}

function WhoopRing({ score, color }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <svg width="150" height="150">
      <circle cx="75" cy="75" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10" />
      <circle
        cx="75"
        cy="75"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 75 75)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="75" y="70" textAnchor="middle" fill="var(--color-text)" fontSize="36" fontWeight="800" fontFamily="DM Sans,sans-serif">
        {score}
      </text>
      <text x="75" y="88" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10" fontFamily="DM Mono,monospace" letterSpacing="1">
        RECOVERY
      </text>
      <text x="75" y="102" textAnchor="middle" fill={color} fontSize="10" fontFamily="DM Sans,sans-serif">
        {score >= 67 ? "Go hard today" : score >= 34 ? "Moderate effort" : "Take it easy"}
      </text>
    </svg>
  );
}

function PeakCurve() {
  const pts = [
    [0, 60],
    [30, 55],
    [60, 52],
    [100, 62],
    [130, 80],
    [160, 95],
    [200, 90],
    [240, 70],
    [280, 55],
    [320, 40],
    [360, 38],
    [400, 50],
    [440, 45],
    [480, 35],
    [500, 60],
  ];
  const w = 340,
    h = 80;
  const xScale = w / 500,
    yScale = h / 100;
  const path = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x * xScale},${h - y * yScale}`)
    .join(" ");
  const area = path + ` L${500 * xScale},${h} L0,${h} Z`;
  const nowX = 240 * xScale;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "80px" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity=".4" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#peakGrad)" />
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
      <line x1={nowX} y1={0} x2={nowX} y2={h} stroke="var(--color-text)" strokeWidth="1" strokeDasharray="3,3" opacity=".4" />
    </svg>
  );
}
