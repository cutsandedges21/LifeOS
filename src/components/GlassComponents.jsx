import { motion } from "framer-motion";

// ── Design tokens — read theme-aware CSS variables emitted from App.jsx ──
// Shadow values vary heavily between dark and light themes, so they pull
// from --shadow rather than carrying literal values. Blur is theme-neutral.
const G = {
  bg:         "var(--card)",
  bgMid:      "var(--card-mid)",
  bgHigh:     "var(--card-high)",
  border:     "var(--border)",
  borderHigh: "var(--border-high)",
  shadow:     "var(--shadow)",
  shadowHigh: "var(--shadow)",
  blur:       "blur(24px) saturate(180%)",
  radius:     "20px",
  radiusSm:   "14px",
};

// Spring config
const spring = { type: "spring", stiffness: 420, damping: 32 };

// Build a CSS color from (color, alpha 0-1). Handles two input forms:
//   - "var(--accent-main)" → "rgba(var(--accent-main-rgb), 0.5)"
//   - "#7C6DFA"            → "#7C6DFA80"
// Needed because the codebase historically concatenated hex+alpha strings
// (e.g. `${color}80`), which breaks when `color` is a CSS variable.
const alpha = (color, a) => {
  if (typeof color === "string" && color.startsWith("var(--accent-main")) {
    return `rgba(var(--accent-main-rgb), ${a})`;
  }
  const hex = Math.round(a * 255).toString(16).padStart(2, "0").toUpperCase();
  return `${color}${hex}`;
};

// ── GlassCard ─────────────────────────────────────────────────────────
export const GlassCard = ({
  children,
  style = {},
  variant = "default",
  glow,
  delay = 0,
  ...props
}) => {
  const variants = {
    default: { background: G.bg, border: `1px solid ${G.border}`, shadow: G.shadow },
    elevated:{ background: G.bgMid, border: `1px solid ${G.borderHigh}`, shadow: G.shadowHigh },
    danger:  {
      background: "rgba(248, 113, 113, 0.08)",
      border: "1px solid rgba(248, 113, 113, 0.30)",
      shadow: "0 8px 32px rgba(248,113,113,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
    },
    success: {
      background: "rgba(52, 211, 153, 0.07)",
      border: "1px solid rgba(52, 211, 153, 0.25)",
      shadow: G.shadow,
    },
  };

  const v = variants[variant] || variants.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay }}
      style={{
        background: v.background,
        backdropFilter: G.blur,
        WebkitBackdropFilter: G.blur,
        borderRadius: G.radius,
        border: v.border,
        boxShadow: glow ? `0 0 30px ${glow}40, ${v.shadow}` : v.shadow,
        padding: "18px",
        marginBottom: "12px",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ── SectionHeader — label inside a card ───────────────────────────────
export const SectionHeader = ({ label, accent = "var(--accent-main)", right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span
        style={{
          display: "inline-block",
          width: "3px",
          height: "14px",
          borderRadius: "2px",
          background: accent,
          boxShadow: `0 0 8px ${alpha(accent, 0.5)}`,
        }}
      />
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.14em",
          color: "var(--text-faint)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
    {right && <div>{right}</div>}
  </div>
);

// ── TimelineItem ──────────────────────────────────────────────────────
export const TimelineItem = ({ status, time, title, details, children, onClick, index = 0 }) => {
  const cfg = {
    completed: { color: "#34D399",          icon: "✓", bg: "rgba(52,211,153,0.08)",          border: "rgba(52,211,153,0.20)",          opacity: 0.85 },
    current:   { color: "var(--accent-main)", icon: "▶", bg: "rgba(var(--accent-main-rgb),0.10)", border: "rgba(var(--accent-main-rgb),0.35)", opacity: 1, pulse: true },
    upcoming:  { color: "var(--text-faint)",  icon: "○", bg: G.bg,                           border: G.border,                         opacity: 0.6 },
    missed:    { color: "#F87171",          icon: "✕", bg: "rgba(248,113,113,0.08)",          border: "rgba(248,113,113,0.25)",          opacity: 1 },
  };
  const c = cfg[status] || cfg.upcoming;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay: index * 0.05 }}
      style={{ display: "flex", gap: "12px", alignItems: "stretch", marginBottom: "8px" }}
    >
      {/* Timeline track */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: 0, minWidth: "20px" }}>
        <motion.div
          animate={c.pulse ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: c.color,
            boxShadow: c.pulse ? `0 0 12px ${alpha(c.color, 0.56)}` : "none",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, width: "1.5px", background: `linear-gradient(to bottom, ${alpha(c.color, 0.25)}, transparent)`, marginTop: "4px" }} />
      </div>

      {/* Content */}
      <motion.div
        onClick={onClick}
        whileTap={onClick ? { scale: 0.98 } : {}}
        style={{
          flex: 1,
          background: c.bg,
          backdropFilter: G.blur,
          WebkitBackdropFilter: G.blur,
          borderRadius: G.radiusSm,
          padding: "13px 14px",
          border: `1px solid ${c.border}`,
          opacity: c.opacity,
          cursor: onClick ? "pointer" : "default",
          boxShadow: c.pulse ? `0 0 20px ${alpha(c.color, 0.12)}` : "none",
          marginBottom: "2px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ color: c.color, fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>
            {time}
          </span>
          <span style={{ color: c.color, fontSize: "16px", lineHeight: 1 }}>{c.icon}</span>
        </div>
        <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600, marginBottom: details ? "4px" : 0 }}>{title}</div>
        {details && <div style={{ color: "var(--text-faint)", fontSize: "12px" }}>{details}</div>}
        {children}
      </motion.div>
    </motion.div>
  );
};

// ── AccountabilityCard ────────────────────────────────────────────────
export const AccountabilityCard = ({ missedGoals, explanation, setExplanation, onSubmit }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -12, scale: 0.97 }}
    transition={spring}
    style={{
      background: "rgba(248, 113, 113, 0.10)",
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      borderRadius: G.radius,
      padding: "18px",
      border: "1px solid rgba(248,113,113,0.35)",
      boxShadow: "0 0 40px rgba(248,113,113,0.15), 0 8px 32px rgba(0,0,0,0.4)",
      marginBottom: "14px",
      animation: "shake 0.5s ease-in-out",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
      <div style={{ fontSize: "24px" }}>⚠️</div>
      <div>
        <div style={{ color: "var(--text)", fontSize: "15px", fontWeight: 700 }}>Accountability Required</div>
        <div style={{ color: "var(--text-faint)", fontSize: "12px" }}>
          You missed {missedGoals.length} goal{missedGoals.length > 1 ? "s" : ""}. Explain why to continue.
        </div>
      </div>
    </div>

    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
      {missedGoals.map((g, i) => (
        <div key={i} style={{ color: "#F87171", fontSize: "13px", padding: "2px 0" }}>✕ {g.text}</div>
      ))}
    </div>

    <textarea
      value={explanation}
      onChange={(e) => setExplanation(e.target.value)}
      placeholder="Be honest. What got in the way?"
      style={{
        width: "100%",
        background: "rgba(0,0,0,0.2)",
        border: `1px solid ${explanation ? "#F87171" : "rgba(248,113,113,0.2)"}`,
        borderRadius: "12px",
        padding: "12px",
        color: "var(--text)",
        fontSize: "13px",
        minHeight: "80px",
        resize: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        outline: "none",
      }}
    />

    <button
      onClick={onSubmit}
      disabled={!explanation.trim()}
      style={{
        width: "100%",
        marginTop: "10px",
        padding: "13px",
        borderRadius: "12px",
        border: "none",
        background: explanation.trim()
          ? "linear-gradient(135deg, #F87171, #EF4444)"
          : "rgba(255,255,255,0.1)",
        color: "#fff",
        fontWeight: 700,
        fontSize: "14px",
        cursor: explanation.trim() ? "pointer" : "not-allowed",
        opacity: explanation.trim() ? 1 : 0.5,
        boxShadow: explanation.trim() ? "0 4px 20px rgba(248,113,113,0.4)" : "none",
      }}
    >
      Submit &amp; Continue
    </button>
  </motion.div>
);

// ── HeroSection ───────────────────────────────────────────────────────
export const HeroSection = ({ greeting, metrics }) => {
  const metricList = [
    { label: "DAY", value: metrics.dayProgress, color: "var(--accent-main)" },
    { label: "SLEEP", value: metrics.sleep, color: "#34D399" },
    { label: "STREAK", value: `${metrics.streak}d`, color: "#FBBF24" },
    { label: "GOALS", value: metrics.goals, color: "#22D3EE" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.05 }}
      style={{
        background: G.bgMid,
        backdropFilter: G.blur,
        WebkitBackdropFilter: G.blur,
        borderRadius: G.radius,
        padding: "22px 20px 18px",
        border: `1px solid ${G.borderHigh}`,
        boxShadow: G.shadowHigh,
        marginBottom: "14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle corner glow */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "180px", height: "180px",
        background: "radial-gradient(circle at top right, rgba(var(--accent-main-rgb), 0.15) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ fontSize: "11px", color: "var(--text-faint)", marginBottom: "4px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
        {metrics.date}
      </div>
      <div style={{ fontSize: "clamp(18px, 5.5vw, 24px)", fontWeight: 800, color: "var(--text)", lineHeight: 1.2, marginBottom: "18px" }}>
        {greeting}
        <span style={{ color: "var(--accent-main)" }}> {metrics.name}</span>
      </div>

      {/* 4 metric chips */}
      <div className="hero-metrics" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
        {metricList.map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--card)",
              borderRadius: "12px",
              padding: "10px 6px",
              textAlign: "center",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ color: m.color, fontSize: "17px", fontWeight: 800, lineHeight: 1.1 }}>{m.value}</div>
            <div style={{ color: "var(--text-faint)", fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", marginTop: "3px" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ── MetricCard ────────────────────────────────────────────────────────
export const MetricCard = ({ label, value, subtext, color = "var(--text)", icon, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.93 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ ...spring, delay }}
    style={{
      background: G.bg,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      borderRadius: G.radiusSm,
      padding: "14px 12px",
      border: `1px solid ${G.border}`,
      boxShadow: G.shadow,
      ...props.style,
    }}
  >
    {icon && <div style={{ fontSize: "18px", marginBottom: "6px" }}>{icon}</div>}
    <div style={{ color: "var(--text-faint)", fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "4px" }}>{label}</div>
    <div style={{ color, fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{value}</div>
    {subtext && <div style={{ color: "var(--text-faint)", fontSize: "11px", marginTop: "3px" }}>{subtext}</div>}
  </motion.div>
);

// ── PlatformCard ──────────────────────────────────────────────────────
export const PlatformCard = ({ platform, handle, followers, growth, icon, onRemove, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay }}
    style={{
      background: G.bg,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      borderRadius: G.radiusSm,
      padding: "14px 16px",
      border: `1px solid ${G.border}`,
      marginBottom: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "var(--card-mid)",
          border: `1px solid ${G.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600 }}>{platform}</div>
        <div style={{ color: "var(--text-faint)", fontSize: "11px" }}>{handle}</div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "var(--text)", fontSize: "17px", fontWeight: 700 }}>{followers}</div>
        <div style={{ color: "#34D399", fontSize: "11px", fontWeight: 600 }}>+{growth}</div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px", padding: "4px" }}
        >
          ×
        </button>
      )}
    </div>
  </motion.div>
);

// ── BusinessCard ──────────────────────────────────────────────────────
export const BusinessCard = ({ name, revenue, expenses, clients, color, onRemove, delay = 0 }) => {
  const profit = revenue - expenses;
  const margin = revenue > 0 ? Math.max(0, Math.min(100, Math.round((profit / revenue) * 100))) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      style={{
        background: G.bg,
        backdropFilter: G.blur,
        WebkitBackdropFilter: G.blur,
        borderRadius: G.radiusSm,
        padding: "16px",
        border: `1px solid ${G.border}`,
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color || "var(--accent-main)",
            boxShadow: `0 0 10px ${alpha(color || "var(--accent-main)", 0.56)}`,
          }} />
          <div style={{ color: "var(--text)", fontSize: "17px", fontWeight: 800, letterSpacing: "-0.01em" }}>{name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ color: profit >= 0 ? "#34D399" : "#F87171", fontSize: "16px", fontWeight: 800 }}>
            {profit >= 0 ? "+" : ""}${profit.toLocaleString()}
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px", padding: "2px" }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div style={{ color: "var(--text-faint)", fontSize: "10px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", marginBottom: "12px", marginLeft: "18px" }}>
        BUSINESS · {margin}% MARGIN
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        {[
          { label: "REV", value: `$${revenue.toLocaleString()}`, color: "#34D399" },
          { label: "EXP", value: `$${expenses.toLocaleString()}`, color: "#F87171" },
          { label: "CLIENTS", value: clients ?? 0, color: "#22D3EE" },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, background: "var(--card)", borderRadius: "10px", padding: "8px", textAlign: "center" }}>
            <div style={{ color: "var(--text-faint)", fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: "13px", fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Profit margin bar */}
      <div style={{ height: "3px", background: "var(--card-mid)", borderRadius: "2px", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${margin}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${color || "var(--accent-main)"}, ${alpha(color || "var(--accent-main)", 0.67)})`, borderRadius: "2px" }}
        />
      </div>
      <div style={{ color: "var(--text-faint)", fontSize: "10px", marginTop: "4px", textAlign: "right" }}>{margin}% margin</div>
    </motion.div>
  );
};

// Inject animation styles
if (typeof document !== "undefined") {
  const existing = document.getElementById("lifeos-glass-styles");
  if (!existing) {
    const s = document.createElement("style");
    s.id = "lifeos-glass-styles";
    s.textContent = `
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(s);
  }
}
