import { motion } from "framer-motion";

// Glass Card Component
export const GlassCard = ({ children, className = "", style = {}, variant = "default", ...props }) => {
  const variants = {
    default: {
      background: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    highlighted: {
      background: "rgba(255, 255, 255, 0.2)",
      backdropFilter: "blur(10px)",
      border: "2px solid rgba(255, 255, 255, 0.3)",
    },
    dimmed: {
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
    },
    danger: {
      background: "rgba(239, 68, 68, 0.2)",
      backdropFilter: "blur(10px)",
      border: "2px solid rgba(239, 68, 68, 0.4)",
    },
  };

  return (
    <motion.div
      className={`glass-card ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-lg)",
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Timeline Item Component
export const TimelineItem = ({ status, time, title, details, children, onClick, ...props }) => {
  const statusConfig = {
    completed: {
      color: "#4ade80",
      icon: "✓",
      opacity: 1,
      border: "2px solid rgba(255, 255, 255, 0.3)",
      background: "rgba(255, 255, 255, 0.15)",
    },
    current: {
      color: "#fbbf24",
      icon: "○",
      opacity: 1,
      border: "2px solid rgba(255, 255, 255, 0.3)",
      background: "rgba(255, 255, 255, 0.2)",
      pulse: true,
    },
    upcoming: {
      color: "rgba(255, 255, 255, 0.5)",
      icon: "○",
      opacity: 0.6,
      border: "1px solid rgba(255, 255, 255, 0.15)",
      background: "rgba(255, 255, 255, 0.1)",
    },
    missed: {
      color: "#ef4444",
      icon: "✕",
      opacity: 1,
      border: "1px solid rgba(239, 68, 68, 0.3)",
      background: "rgba(239, 68, 68, 0.15)",
    },
  };

  const config = statusConfig[status] || statusConfig.upcoming;

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "stretch", ...props.style }}>
      {/* Timeline indicator */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: config.color,
            border: config.border,
            ...(config.pulse && {
              animation: "pulse 2s infinite",
            }),
          }}
        />
        <div style={{ flex: 1, width: "2px", background: "rgba(255, 255, 255, 0.2)" }} />
      </div>

      {/* Content card */}
      <motion.div
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        style={{
          flex: 1,
          background: config.background,
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          padding: "14px",
          border: config.border,
          opacity: config.opacity,
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div style={{ color: config.color, fontSize: "11px", fontWeight: 600 }}>
            {time} — {status.toUpperCase()}
          </div>
          <div style={{ color: config.color, fontSize: "18px" }}>{config.icon}</div>
        </div>
        <div style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}>{title}</div>
        {details && (
          <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "12px", marginTop: "4px" }}>
            {details}
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
};

// Accountability Card Component
export const AccountabilityCard = ({ missedGoals, explanation, setExplanation, onSubmit, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(239, 68, 68, 0.2)",
        backdropFilter: "blur(20px)",
        borderRadius: "16px",
        padding: "16px",
        border: "2px solid rgba(239, 68, 68, 0.4)",
        animation: "shake 0.5s ease-in-out",
        marginBottom: "16px",
        ...props.style,
      }}
      {...props}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{ color: "#ef4444", fontSize: "24px" }}>⚠️</div>
        <div>
          <div style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>Accountability Required</div>
          <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "11px" }}>
            You missed {missedGoals.length} goal{missedGoals.length > 1 ? "s" : ""}. Explain why to continue.
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "8px", padding: "10px", marginBottom: "10px" }}>
        {missedGoals.map((goal, i) => (
          <div key={i} style={{ color: "#fff", fontSize: "13px" }}>
            ✕ {goal.text} {goal.time && `(${goal.time})`}
          </div>
        ))}
      </div>

      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Be honest. What got in the way?"
        style={{
          width: "100%",
          background: "rgba(0, 0, 0, 0.3)",
          border: "1px solid " + (explanation ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.2)"),
          borderRadius: "8px",
          padding: "12px",
          color: "#fff",
          fontSize: "13px",
          minHeight: "70px",
          resize: "none",
          fontFamily: "var(--font-sans)",
        }}
      />

      <button
        onClick={onSubmit}
        disabled={!explanation.trim()}
        style={{
          width: "100%",
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px",
          fontWeight: 600,
          marginTop: "10px",
          cursor: explanation.trim() ? "pointer" : "not-allowed",
          opacity: explanation.trim() ? 1 : 0.5,
        }}
      >
        Submit & Continue
      </button>
    </motion.div>
  );
};

// Hero Section Component
export const HeroSection = ({ greeting, metrics, ...props }) => {
  return (
    <GlassCard variant="default" style={{ marginBottom: "16px" }} {...props}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "11px", fontWeight: 500 }}>
            {metrics.date}
          </div>
          <div style={{ color: "#fff", fontSize: "24px", fontWeight: 700 }}>
            {greeting}, {metrics.name}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ☀️
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        {[
          { label: "DAY PROGRESS", value: metrics.dayProgress, color: "#fff" },
          { label: "RECOVERY", value: metrics.recovery, color: "#4ade80" },
          { label: "STREAK", value: metrics.streak, color: "#fbbf24" },
          { label: "GOALS", value: metrics.goals, color: "#fff" },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ color: metric.color, fontSize: "28px", fontWeight: 700 }}>{metric.value}</div>
            <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "10px", fontWeight: 500 }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// Metric Card Component (for bento grids)
export const MetricCard = ({ label, value, subtext, color = "#fff", icon, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "12px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        ...props.style,
      }}
      {...props}
    >
      {icon && <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>}
      <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px" }}>{label}</div>
      <div style={{ color, fontSize: "20px", fontWeight: 700 }}>{value}</div>
      {subtext && <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px" }}>{subtext}</div>}
    </motion.div>
  );
};

// Platform Card Component (for Brand page)
export const PlatformCard = ({ platform, handle, followers, growth, icon, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "14px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        marginBottom: "8px",
        ...props.style,
      }}
      {...props}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "20px" }}>{icon}</div>
          <div>
            <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>{platform}</div>
            <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px" }}>{handle}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}>{followers}</div>
          <div style={{ color: "#4ade80", fontSize: "11px" }}>+{growth}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Business Card Component (for Finances page)
export const BusinessCard = ({ name, revenue, expenses, orders, color, onRemove, ...props }) => {
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        marginBottom: "12px",
        ...props.style,
      }}
      {...props}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>{name}</div>
        <div style={{ color: color, fontSize: "16px", fontWeight: 700 }}>
          {profit >= 0 ? "+" : ""}${profit.toLocaleString()}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        {[
          { label: "REVENUE", value: `$${revenue.toLocaleString()}`, color: "#4ade80" },
          { label: "EXPENSES", value: `$${expenses.toLocaleString()}`, color: "#ef4444" },
          { label: "ORDERS", value: orders, color: "#fff" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "9px" }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: "14px", fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          height: "4px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${profitMargin}%`,
            background: color,
            borderRadius: "2px",
          }}
        />
      </div>
    </motion.div>
  );
};

// Add global animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
}
