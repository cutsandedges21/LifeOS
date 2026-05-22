import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, MetricCard } from "./GlassComponents.jsx";
import { SectionLabel, Button } from "./UI.jsx";
import { Sparkline } from "./Sparkline.jsx";
import { lastNSnapshots } from "../utils/snapshots.js";
import {
  calculateSleepScore,
  calculateSleepHours,
  getWeeklyRestPercent,
  getCurrentWeekSleep
} from "../utils/formatters.js";

export function HealthPage({ state, setState }) {
  const [bedtime, setBedtime] = useState(state.settings?.sleepTime || "23:00");
  const [wakeTime, setWakeTime] = useState(state.settings?.wakeTime || "07:00");

  const entries = state.sleepEntries || [];
  const restPercent = getWeeklyRestPercent(entries);
  
  // Today's entry (if exists)
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayEntry = entries.find(e => e.date === todayStr);
  const currentSleepScore = todayEntry ? todayEntry.score : 0;

  const logSleep = () => {
    const score = calculateSleepScore(bedtime, wakeTime);
    
    setState((prev) => {
      const updatedEntries = [
        ...(prev.sleepEntries || []).filter((e) => e.date !== todayStr),
        { date: todayStr, bedtime, wakeTime, score },
      ];
      
      const newRestPercent = getWeeklyRestPercent(updatedEntries);
      
      return {
        ...prev,
        sleepEntries: updatedEntries,
        whoop: {
          ...prev.whoop,
          recovery: newRestPercent,
          sleep: score,
        },
      };
    });
  };

  const recoveryColor =
    restPercent >= 80
      ? "#34D399"
      : restPercent >= 55
      ? "#FBBF24"
      : "#F87171";

  const getSleepScoreColor = (score) => {
    if (score >= 80) return "#34D399";
    if (score >= 55) return "#FBBF24";
    return "#F87171";
  };

  // Data for the Peak Curve visualization (Current Week Mon-Sun)
  const curvePoints = getCurrentWeekSleep(entries);

  // 30-day sleep trend pulled from snapshot history.
  const sleepHistory = lastNSnapshots(state.historySnapshots, 30).map((s) => s.sleep);
  const sleepAvg30 = sleepHistory.filter((v) => v > 0).length
    ? Math.round(
        sleepHistory.filter((v) => v > 0).reduce((a, b) => a + b, 0) /
          sleepHistory.filter((v) => v > 0).length
      )
    : 0;

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* Rest & Recovery Hero */}
      <GlassCard style={{ padding: "30px 24px", textAlign: "center" }}>
        <SectionLabel accent={recoveryColor}>REST & RECOVERY</SectionLabel>
        
        <div style={{ position: "relative", width: "160px", height: "160px", margin: "20px auto" }}>
          <svg width="160" height="160" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--card)" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={recoveryColor}
              strokeWidth="8"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 * (1 - restPercent / 100) }}
              transition={{ duration: 2, ease: "easeOut" }}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ filter: `` }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "42px", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{restPercent}%</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: recoveryColor, marginTop: "4px", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>
              REST SCORE
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginTop: "10px" }}>
          <MetricCard
            label="TODAY'S SLEEP SCORE"
            value={`${currentSleepScore}%`}
            color="#34D399"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          />
        </div>
      </GlassCard>

      {/* Sleep Entry Section */}
      <div style={{ marginTop: "24px" }}>
        <SectionLabel accent="var(--accent-main)">LOG PREVIOUS NIGHT'S SLEEP</SectionLabel>
        <GlassCard
          style={{
            // Tighter side padding so the card can pull in slightly from
            // the right while still feeling intentional, and explicit
            // width caps so the iOS native time-picker's intrinsic
            // min-width can't push the card past the page's right edge.
            padding: "20px 16px",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Bare-input time fields, stacked. The shared Input component has
              a backdrop-filter + an outset focus box-shadow ring; both
              interact badly with iOS's native time picker UI and visually
              push the field beyond the GlassCard's right edge. Inlining
              the inputs with plain styling and a single-column layout
              gives each field the full GlassCard inner width so the
              native picker has room and nothing escapes the card. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "16px",
              minWidth: 0,
            }}
          >
            <TimeField
              label="WENT TO BED"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
            />
            <TimeField
              label="WOKE UP"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>
          
          <div style={{ textAlign: "center", marginBottom: "16px", fontSize: "12px", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
            DURATION: <span style={{ color: "#34D399", fontWeight: 800 }}>{calculateSleepHours(bedtime, wakeTime)} HOURS</span>
          </div>

          <Button onClick={logSleep} style={{ width: "100%" }}>
            {todayEntry ? "UPDATE LOG" : "SUBMIT SLEEP LOG"}
          </Button>
        </GlassCard>
      </div>

      {/* 30-day sleep trend */}
      <GlassCard style={{ marginTop: "24px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <SectionLabel accent="#34D399" style={{ marginBottom: 0 }}>30-DAY SLEEP TREND</SectionLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.1em" }}>AVG</span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#34D399" }}>{sleepAvg30}%</span>
          </div>
        </div>
        <div style={{ width: "100%" }}>
          <Sparkline data={sleepHistory} color={getSleepScoreColor(sleepAvg30)} width={320} height={60} strokeWidth={2} />
        </div>
        {sleepHistory.length < 7 && (
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", marginTop: "8px", textAlign: "center", letterSpacing: "0.08em" }}>
            BUILDING HISTORY · {sleepHistory.length} DAY{sleepHistory.length === 1 ? "" : "S"} LOGGED
          </div>
        )}
      </GlassCard>

      {/* Peak Curve Visualization */}
      <GlassCard style={{ marginTop: "24px", padding: "20px", marginBottom: "40px" }}>
        <SectionLabel accent="var(--accent-main)">WEEKLY PEAK CURVE</SectionLabel>
        <div style={{ height: "120px", width: "100%", marginTop: "20px", display: "flex", alignItems: "flex-end", gap: "8px" }}>
          {curvePoints.map((p, i) => {
            const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
            const today = new Date();
            const todayDay = today.getDay(); // 0-6
            const adjustedTodayIndex = todayDay === 0 ? 6 : todayDay - 1; // Mon=0, Sun=6
            
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "100%", position: "relative", height: "100px", display: "flex", alignItems: "flex-end" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${p}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    style={{
                      width: "100%",
                      background: p === 0
                        ? "var(--card)"
                        : (() => {
                            // 80+ green, 55+ yellow, else red. Gradient builds from a
                            // low-alpha base to a high-alpha cap.
                            if (p >= 80) return "linear-gradient(to top, #34D39940, #34D399aa)";
                            if (p >= 55) return "linear-gradient(to top, #FBBF2440, #FBBF24aa)";
                            return "linear-gradient(to top, #F8717140, #F87171aa)";
                          })(),
                      borderRadius: "6px 6px 2px 2px",
                      border: p === 0
                        ? "1px dashed var(--border)"
                        : `1px solid ${
                            p >= 80 ? "#34D39980"
                            : p >= 55 ? "#FBBF2480"
                            : "#F8717180"
                          }`,
                    }}
                  />
                </div>
                <div style={{ fontSize: "9px", color: i === adjustedTodayIndex ? "var(--accent-main)" : "var(--text-faint)", fontFamily: "var(--font-mono)", fontWeight: i === adjustedTodayIndex ? 800 : 400 }}>
                  {dayLabels[i]}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// Bare time field — deliberately plain styling, no backdrop-filter and no
// outset focus ring, so iOS's native time picker has room and the field
// never visually escapes the GlassCard that wraps it.
function TimeField({ label, value, onChange }) {
  return (
    <div style={{ minWidth: 0, width: "100%" }}>
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-faint)",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.12em",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <input
        type="time"
        value={value}
        onChange={onChange}
        style={{
          // Match the SUBMIT SLEEP LOG button's width logic: width:100%
          // with box-sizing:border-box, so the field fills the GlassCard's
          // content area exactly the same way the button below does.
          // minWidth:0 prevents iOS's native time picker from forcing the
          // input back to its intrinsic min-content width.
          display: "block",
          boxSizing: "border-box",
          width: "89%",
          maxWidth: "100%",
          minWidth: 0,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "12px 14px",
          color: "var(--text)",
          fontSize: "14px",
          fontFamily: "inherit",
          minHeight: "44px",
          outline: "none",
        }}
      />
    </div>
  );
}
