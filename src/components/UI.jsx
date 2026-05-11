import { useState } from "react";
import { motion } from "framer-motion";

export const Card = ({ children, className = "", style = {}, ...props }) => (
  <motion.div
    className={`card ${className}`}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{
      background: "var(--color-card)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--spacing-lg)",
      marginBottom: "var(--spacing-md)",
      ...style,
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const SectionLabel = ({ children, icon }) => (
  <div
    style={{
      fontFamily: "var(--font-mono)",
      fontSize: "var(--font-xs)",
      letterSpacing: "0.15em",
      color: "var(--color-text-muted)",
      display: "flex",
      alignItems: "center",
      gap: "var(--spacing-sm)",
      marginBottom: "var(--spacing-md)",
    }}
  >
    {icon && <span>{icon}</span>}
    {children}
  </div>
);

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
  ...props
}) => (
  <div style={{ marginBottom: "var(--spacing-md)" }}>
    {label && (
      <div
        style={{
          fontSize: "var(--font-xs)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          marginBottom: "var(--spacing-xs)",
        }}
      >
        {label.toUpperCase()}
      </div>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      style={{
        width: "100%",
        background: "var(--color-input)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--spacing-md)",
        color: "var(--color-text)",
        fontSize: "var(--font-base)",
        fontFamily: "var(--font-sans)",
        minHeight: "44px",
        ...style,
      }}
      {...props}
    />
  </div>
);

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
      background: "var(--color-accent)",
      color: "#000",
      border: "none",
    },
    secondary: {
      background: "var(--color-input)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
    },
    danger: {
      background: "var(--color-danger)",
      color: "#fff",
      border: "none",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-muted)",
      border: "none",
    },
  };

  const sizes = {
    sm: { padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "var(--font-sm)" },
    md: { padding: "var(--spacing-md) var(--spacing-lg)", fontSize: "var(--font-base)" },
    lg: { padding: "var(--spacing-lg) var(--spacing-xl)", fontSize: "var(--font-md)" },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      style={{
        borderRadius: "var(--radius-sm)",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        minHeight: "44px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--spacing-xs)",
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Select = ({ label, value, onChange, options, placeholder = "Select...", style = {}, ...props }) => (
  <div style={{ marginBottom: "var(--spacing-md)" }}>
    {label && (
      <div
        style={{
          fontSize: "var(--font-xs)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          marginBottom: "var(--spacing-xs)",
        }}
      >
        {label.toUpperCase()}
      </div>
    )}
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        background: "var(--color-input)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--spacing-md)",
        color: "var(--color-text)",
        fontSize: "var(--font-base)",
        fontFamily: "var(--font-sans)",
        minHeight: "44px",
        ...style,
      }}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export const Textarea = ({ label, value, onChange, placeholder = "", rows = 4, style = {}, ...props }) => (
  <div style={{ marginBottom: "var(--spacing-md)" }}>
    {label && (
      <div
        style={{
          fontSize: "var(--font-xs)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          marginBottom: "var(--spacing-xs)",
        }}
      >
        {label.toUpperCase()}
      </div>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: "var(--color-input)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--spacing-md)",
        color: "var(--color-text)",
        fontSize: "var(--font-base)",
        fontFamily: "var(--font-sans)",
        resize: "vertical",
        minHeight: "88px",
        ...style,
      }}
      {...props}
    />
  </div>
);

export const Toggle = ({ label, checked, onChange, style = {}, ...props }) => (
  <motion.div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "var(--spacing-md)",
      ...style,
    }}
    {...props}
  >
    <span style={{ fontSize: "var(--font-base)", color: "var(--color-text)" }}>{label}</span>
    <motion.button
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
      style={{
        width: "52px",
        height: "28px",
        borderRadius: "14px",
        background: checked ? "var(--color-success)" : "var(--color-border)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <motion.div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "3px",
          left: checked ? "27px" : "3px",
        }}
        animate={{ left: checked ? "27px" : "3px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  </motion.div>
);

export const Chip = ({ children, color = "var(--color-accent)", style = {}, ...props }) => (
  <motion.span
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "var(--radius-sm)",
      fontSize: "var(--font-xs)",
      fontWeight: 600,
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      ...style,
    }}
    {...props}
  >
    {children}
  </motion.span>
);

export const StatCard = ({ label, value, subtext, color = "var(--color-text)", style = {}, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-xs)",
      ...style,
    }}
    {...props}
  >
    <div
      style={{
        fontSize: "var(--font-xs)",
        color: "var(--color-text-muted)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: "var(--font-3xl)", fontWeight: 800, color }}>{value}</div>
    {subtext && (
      <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>{subtext}</div>
    )}
  </motion.div>
);

export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);
