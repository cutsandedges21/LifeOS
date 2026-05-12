// Glassmorphism theme colors for LifeOS v2

// Base colors
const baseColors = {
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#ef4444",
  info: "#38bdf8",
};

// Page-specific gradients
const pageGradients = {
  main: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  finances: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  health: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  gym: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  brand: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
};

// Glassmorphism card styles
const glassCard = {
  background: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

// Light mode colors
export const lightColors = {
  ...baseColors,
  background: "#f5f5f7",
  card: "#ffffff",
  input: "#f0f0f0",
  border: "#e0e0e0",
  text: "#1a1a1a",
  textMuted: "#666666",
  accent: "#667eea",
  glass: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
  },
  gradients: pageGradients,
};

// Dark mode colors (primary for glassmorphism)
export const darkColors = {
  ...baseColors,
  background: "#0a0a0a",
  card: "#0d0d0d",
  input: "#111111",
  border: "#222222",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.6)",
  accent: "#667eea",
  glass: {
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  glassHighlighted: {
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255, 255, 255, 0.3)",
  },
  glassDimmed: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  gradients: pageGradients,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
};

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  "2xl": 16,
  full: 9999,
};

export const typography = {
  fontFamily: {
    sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'DM Mono', 'Courier New', monospace",
  },
  fontSize: {
    xs: "10px",
    sm: "11px",
    base: "13px",
    md: "14px",
    lg: "16px",
    xl: "18px",
    "2xl": "20px",
    "3xl": "24px",
    "4xl": "32px",
    "5xl": "40px",
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};
