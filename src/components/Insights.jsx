import { motion } from "framer-motion";
import { GlassCard } from "./GlassComponents.jsx";
import { SectionLabel } from "./UI.jsx";
import { Sparkline } from "./Sparkline.jsx";
import { lastNSnapshots, weeklyReview } from "../utils/snapshots.js";
import { fmt$ } from "../utils/formatters.js";

// Compact money formatter: $8,432 → $8.4K, $1,250,000 → $1.3M. Keeps narrow
// tiles readable when raw $-amounts would either truncate or wrap awkwardly.
function fmtCompact(n) {
  const abs = Math.abs(n);
  if (abs < 1000) return `$${Math.round(n).toLocaleString()}`;
  if (abs < 1_000_000) return `$${(n / 1000).toFixed(abs < 10_000 ? 1 : 0)}K`;
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

// Compact 4-up trend tiles + a single weekly review card. Both feed off
// state.historySnapshots which App.jsx upserts daily.

function TrendTile({ label, current, data, color, delta, formatDelta }) {
  const deltaText = formatDelta && delta != null ? formatDelta(delta) : Math.abs(delta ?? 0);
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: 0,
      }}
    >
      {/* Top row: label + delta indicator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            letterSpacing: "0.12em",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        {delta != null && (
          <div
            style={{
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : "var(--text-faint)",
              flexShrink: 0,
            }}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {deltaText}
          </div>
        )}
      </div>

      {/* Current value gets the full tile width — no more competing with the
          sparkline for inline space, so $-figures don't get ellipsed. */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: 900,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.1,
        }}
      >
        {current}
      </div>

      {/* Sparkline spans full tile width below the value. */}
      <Sparkline data={data} color={color} width={140} height={26} strokeWidth={1.8} />
    </div>
  );
}

export function TrendsCard({ snapshots, currentSleep, currentNet }) {
  const last7 = lastNSnapshots(snapshots, 7);
  const sleepSeries = last7.map((s) => s.sleep);
  const netSeries = last7.map((s) => s.netWorth);

  // Compare oldest available to newest for delta arrows.
  const delta = (arr) => (arr.length >= 2 ? arr[arr.length - 1] - arr[0] : null);
  const sleepDelta = delta(sleepSeries);
  const netDeltaRaw = delta(netSeries);

  return (
    <GlassCard style={{ padding: "18px 18px 16px", marginBottom: "12px" }}>
      <SectionLabel accent="var(--accent-main)">7-DAY TRENDS</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
        <TrendTile
          label="SLEEP"
          current={`${currentSleep || 0}%`}
          data={sleepSeries}
          color="#34D399"
          delta={sleepDelta}
          formatDelta={(d) => `${Math.abs(d)}%`}
        />
        <TrendTile
          label="NET WORTH"
          current={fmtCompact(currentNet)}
          data={netSeries}
          color="var(--accent-main)"
          delta={netDeltaRaw}
          formatDelta={(d) => fmtCompact(Math.abs(d))}
        />
      </div>
    </GlassCard>
  );
}

export function WeeklyReviewCard({ snapshots }) {
  const review = weeklyReview(snapshots);
  if (!review) return null;

  const isSunday = new Date().getDay() === 0;
  const netColor = review.netDelta >= 0 ? "#34D399" : "#F87171";

  // Verdict copy responds to the week's data — keeps it from feeling generic.
  let verdict;
  if (review.gymDays >= 5 && review.avgSleep >= 70 && review.netDelta >= 0) {
    verdict = "Strong week. Stack another like it.";
  } else if (review.gymDays <= 1 && review.avgGoalPct < 40) {
    verdict = "Quiet week. Pick one thing to win Monday.";
  } else if (review.netDelta < 0) {
    verdict = "Cash leaked. Find the leak before next week.";
  } else if (review.avgSleep < 55) {
    verdict = "Sleep dragged the week down. Earlier bedtime.";
  } else {
    verdict = "Steady. Now push for elite.";
  }

  return (
    <GlassCard
      style={{
        padding: "18px 18px 16px",
        marginBottom: "12px",
        border: isSunday ? "1px solid rgba(var(--accent-main-rgb), 0.35)" : "1px solid var(--border)",
        boxShadow: isSunday ? "0 0 24px rgba(var(--accent-main-rgb), 0.18)" : undefined,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <SectionLabel accent="var(--accent-main)" style={{ marginBottom: 0 }}>
          WEEK IN REVIEW
        </SectionLabel>
        {isSunday && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              color: "var(--accent-main)",
              fontWeight: 800,
              letterSpacing: "0.12em",
              padding: "3px 8px",
              borderRadius: "10px",
              background: "rgba(var(--accent-main-rgb), 0.15)",
              border: "1px solid rgba(var(--accent-main-rgb), 0.35)",
            }}
          >
            FRESH
          </motion.div>
        )}
      </div>

      <div
        className="weekly-review-stats"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}
      >
        <ReviewStat label="AVG SLEEP" value={`${review.avgSleep}%`} color="#34D399" />
        <ReviewStat label="GYM" value={`${review.gymDays}/7`} color="#FBBF24" />
        <ReviewStat label="GOALS" value={`${review.avgGoalPct}%`} color="#22D3EE" />
        <ReviewStat
          label="NET Δ"
          value={`${review.netDelta >= 0 ? "+" : "−"}${fmtCompact(Math.abs(review.netDelta))}`}
          color={netColor}
        />
      </div>

      <div
        style={{
          padding: "10px 12px",
          background: "var(--card)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          fontSize: "12px",
          color: "var(--text-muted)",
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        "{verdict}"
      </div>

      {review.daysTracked < 7 && (
        <div
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            marginTop: "8px",
            textAlign: "center",
            letterSpacing: "0.08em",
          }}
        >
          BUILDING HISTORY · {review.daysTracked}/7 DAYS TRACKED
        </div>
      )}
    </GlassCard>
  );
}

function ReviewStat({ label, value, color }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "8px 4px",
        background: "var(--card)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "8px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
          letterSpacing: "0.1em",
          marginBottom: "4px",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 900,
          color,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}
