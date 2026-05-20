import { useState } from "react";
import { motion } from "framer-motion";

const G = {
  bg:         "var(--card)",
  bgMid:      "var(--card-mid)",
  border:     "var(--border)",
  borderFocus:"rgba(var(--accent-main-rgb), 0.60)",
  blur:       "blur(24px) saturate(180%)",
  radius:     "20px",
  radiusSm:   "14px",
  radiusXs:   "10px",
};
const spring = { type: "spring", stiffness: 420, damping: 32 };

// ── SectionLabel (mono uppercase with accent bar) ─────────────────────
export const SectionLabel = ({ children, icon, accent = "var(--accent-main)", style = {} }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
    ...style,
  }}>
    <span
      style={{
        display: "inline-block",
        width: "3px",
        height: "13px",
        borderRadius: "2px",
        background: accent,
        boxShadow: `0 0 8px ${accent}80`,
        flexShrink: 0,
      }}
    />
    {icon && <span style={{ fontSize: "13px" }}>{icon}</span>}
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: "10px",
      letterSpacing: "0.14em",
      color: "var(--text-muted)",
      textTransform: "uppercase",
    }}>
      {children}
    </span>
  </div>
);

// ── Input ─────────────────────────────────────────────────────────────
export const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  max,
  step,
  style = {},
  onKeyDown,
  maxLength,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "12px", ...style }}>
      {label && (
        <div style={{
          fontSize: "10px",
          color: focused ? "rgba(var(--accent-main-rgb),0.85)" : "var(--text-faint)",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.12em",
          marginBottom: "5px",
          transition: "color 0.2s",
        }}>
          {label.toUpperCase()}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: focused ? "rgba(var(--accent-main-rgb),0.08)" : G.bg,
          border: `1px solid ${focused ? G.borderFocus : G.border}`,
          borderRadius: G.radiusXs,
          padding: "11px 14px",
          color: "var(--text)",
          fontSize: "14px",
          fontFamily: "inherit",
          minHeight: "44px",
          transition: "border 0.2s, background 0.2s",
          outline: "none",
          boxShadow: focused ? `0 0 0 3px rgba(var(--accent-main-rgb),0.12)` : "none",
          boxSizing: "border-box",
          backdropFilter: G.blur,
          WebkitBackdropFilter: G.blur,
        }}
        {...props}
      />
    </div>
  );
};

// ── Button ────────────────────────────────────────────────────────────
export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  style = {},
  ...props
}) => {
  const variants = {
    primary: {
      background: "linear-gradient(135deg, var(--accent-main) 0%, rgba(var(--accent-main-rgb), 0.75) 100%)",
      color: "#fff",
      border: "1px solid rgba(var(--accent-main-rgb),0.5)",
      boxShadow: "0 4px 20px rgba(var(--accent-main-rgb),0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
    },
    secondary: {
      background: G.bg,
      color: "var(--text)",
      border: `1px solid ${G.border}`,
      boxShadow: "none",
    },
    danger: {
      background: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)",
      color: "#fff",
      border: "1px solid rgba(248,113,113,0.4)",
      boxShadow: "0 4px 20px rgba(248,113,113,0.30)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-muted)",
      border: "1px solid var(--border)",
      boxShadow: "none",
    },
    success: {
      background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
      color: "#fff",
      border: "1px solid rgba(52,211,153,0.4)",
      boxShadow: "0 4px 20px rgba(52,211,153,0.25)",
    },
  };

  const sizes = {
    sm: { padding: "7px 14px", fontSize: "12px", borderRadius: "10px", minHeight: "36px" },
    md: { padding: "11px 20px", fontSize: "14px", borderRadius: "14px", minHeight: "44px" },
    lg: { padding: "14px 28px", fontSize: "15px", borderRadius: "16px", minHeight: "52px" },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={spring}
      style={{
        ...v,
        ...s,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontFamily: "inherit",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// ── Select ────────────────────────────────────────────────────────────
export const Select = ({ label, value, onChange, options, placeholder = "Select...", style = {}, ...props }) => (
  <div style={{ marginBottom: "12px" }}>
    {label && (
      <div style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px" }}>
        {label.toUpperCase()}
      </div>
    )}
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        background: G.bg,
        border: `1px solid ${G.border}`,
        borderRadius: G.radiusXs,
        padding: "11px 14px",
        color: "var(--text)",
        fontSize: "14px",
        fontFamily: "inherit",
        minHeight: "44px",
        outline: "none",
        cursor: "pointer",
        backdropFilter: G.blur,
        WebkitBackdropFilter: G.blur,
        boxSizing: "border-box",
        ...style,
      }}
      {...props}
    >
      {/* Native dropdown options need an explicit solid background + light
          text — without them the popup inherits a light background and the
          theme's light text, rendering the labels invisible. */}
      {placeholder && <option value="" style={{ background: "#16171c", color: "#f4f4f6" }}>{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: "#16171c", color: "#f4f4f6" }}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// ── Textarea ──────────────────────────────────────────────────────────
export const Textarea = ({ label, value, onChange, placeholder = "", rows = 4, style = {}, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "12px" }}>
      {label && (
        <div style={{ fontSize: "10px", color: focused ? "rgba(var(--accent-main-rgb),0.85)" : "var(--text-faint)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px", transition: "color 0.2s" }}>
          {label.toUpperCase()}
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: focused ? "rgba(var(--accent-main-rgb),0.06)" : G.bg,
          border: `1px solid ${focused ? G.borderFocus : G.border}`,
          borderRadius: G.radiusSm,
          padding: "12px 14px",
          color: "var(--text)",
          fontSize: "14px",
          fontFamily: "inherit",
          resize: "vertical",
          minHeight: "90px",
          outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(var(--accent-main-rgb),0.10)" : "none",
          boxSizing: "border-box",
          transition: "border 0.2s, background 0.2s",
          backdropFilter: G.blur,
          WebkitBackdropFilter: G.blur,
          ...style,
        }}
        {...props}
      />
    </div>
  );
};

// ── Toggle ────────────────────────────────────────────────────────────
export const Toggle = ({ label, checked, onChange, style = {}, ...props }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", ...style }} {...props}>
    <span style={{ fontSize: "14px", color: "var(--text)" }}>{label}</span>
    <motion.button
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.94 }}
      style={{
        width: "50px",
        height: "28px",
        borderRadius: "14px",
        background: checked ? "linear-gradient(135deg, var(--accent-main), rgba(var(--accent-main-rgb), 0.75))" : "var(--border)",
        border: `1px solid ${checked ? "rgba(var(--accent-main-rgb),0.5)" : G.border}`,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.25s, border 0.25s",
        boxShadow: checked ? "0 0 14px rgba(var(--accent-main-rgb),0.35)" : "none",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ left: checked ? "24px" : "3px" }}
        transition={spring}
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "2px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      />
    </motion.button>
  </div>
);

// ── Chip ──────────────────────────────────────────────────────────────
export const Chip = ({ children, color = "var(--accent-main)", style = {}, onClick, ...props }) => (
  <motion.span
    initial={{ scale: 0.88, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileTap={onClick ? { scale: 0.93 } : {}}
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "5px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      background: `${color}18`,
      color,
      border: `1px solid ${color}35`,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
    {...props}
  >
    {children}
  </motion.span>
);

// ── StatCard ──────────────────────────────────────────────────────────
export const StatCard = ({ label, value, subtext, color = "var(--text)", style = {}, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{ display: "flex", flexDirection: "column", gap: "3px", ...style }}
    {...props}
  >
    <div style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em" }}>{label}</div>
    <div style={{ fontSize: "30px", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
    {subtext && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{subtext}</div>}
  </motion.div>
);

// ── Card (simple wrapper, kept for legacy) ────────────────────────────
export const Card = ({ children, style = {}, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: G.bg,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      borderRadius: G.radius,
      padding: "18px",
      marginBottom: "12px",
      border: `1px solid ${G.border}`,
      ...style,
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// ── PageTransition wrapper ─────────────────────────────────────────────
export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 18, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.98 }}
    transition={{ type: "spring", stiffness: 380, damping: 30 }}
  >
    {children}
  </motion.div>
);
