import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, MetricCard } from "./GlassComponents.jsx";
import { Input, SectionLabel, Button } from "./UI.jsx";
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
      : restPercent >= 34
      ? "var(--accent-main)"
      : "#F87171";

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
        <GlassCard style={{ padding: "20px" }}>
          {/* sleep-time-grid: stacks to a single column on narrow phones via
              responsive.css. iOS forces 16px font on inputs and a 12-hour
              "11:30 PM" with the picker indicator overflows the 1fr cell at
              360px viewport. */}
          <div className="sleep-time-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <Input
              label="Went to Bed"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <Input
              label="Woke Up"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              style={{ marginBottom: 0 }}
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
          <Sparkline data={sleepHistory} color="#34D399" width={320} height={60} strokeWidth={2} />
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
                            // p > 80 → green, > 50 → accent (themed), else → red.
                            // Gradient builds from a low-alpha base to a high-alpha cap.
                            const isAccent = p > 50 && p <= 80;
                            const lo = isAccent ? "rgba(var(--accent-main-rgb),0.25)" : `${p > 80 ? "#34D399" : "#F87171"}40`;
                            const hi = isAccent ? "rgba(var(--accent-main-rgb),0.67)" : `${p > 80 ? "#34D399" : "#F87171"}aa`;
                            return `linear-gradient(to top, ${lo}, ${hi})`;
                          })(),
                      borderRadius: "6px 6px 2px 2px",
                      border: p === 0
                        ? "1px dashed var(--border)"
                        : `1px solid ${p > 80 ? "#34D39980" : p > 50 ? "rgba(var(--accent-main-rgb),0.5)" : "#F8717180"}`,
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
