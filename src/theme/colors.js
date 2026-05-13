// LifeOS Design System v3 — Deep Glass Aesthetic

// ── Core Accent Palette ──────────────────────────────────────────────
const accent = {
  primary:   "#7C6DFA",   // electric indigo-violet
  secondary: "#22D3EE",   // cyan
  glow:      "rgba(124, 109, 250, 0.35)",
  glowCyan:  "rgba(34, 211, 238, 0.25)",
};

// ── Status Colors ─────────────────────────────────────────────────────
const status = {
  success: "#34D399",   // emerald
  warning: "#FBBF24",   // amber
  danger:  "#F87171",   // rose-red
  info:    "#38BDF8",   // sky
};

// ── Glass Tokens ──────────────────────────────────────────────────────
export const glass = {
  // base glass
  bg:           "rgba(255, 255, 255, 0.05)",
  bgMid:        "rgba(255, 255, 255, 0.08)",
  bgHigh:       "rgba(255, 255, 255, 0.12)",
  bgInput:      "rgba(255, 255, 255, 0.06)",
  // borders
  border:       "rgba(255, 255, 255, 0.10)",
  borderHigh:   "rgba(255, 255, 255, 0.18)",
  borderAccent: "rgba(124, 109, 250, 0.45)",
  // backdrop
  blur:         "blur(24px) saturate(180%)",
  blurHeavy:    "blur(40px) saturate(200%)",
  // shadows
  shadow:       "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
  shadowHover:  "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
  shadowGlow:   `0 0 30px rgba(124, 109, 250, 0.25), 0 8px 32px rgba(0,0,0,0.4)`,
};

// ── Page Tints (for subtle per-page accent overlays) ──────────────────
export const pageTints = {
  main:     "rgba(124, 109, 250, 0.06)",
  finances: "rgba(52, 211, 153, 0.06)",
  health:   "rgba(248, 113, 113, 0.06)",
  gym:      "rgba(251, 191, 36, 0.06)",
  brand:    "rgba(34, 211, 238, 0.06)",
  settings: "rgba(107, 114, 128, 0.06)",
};

// ── Page Accent Colors ────────────────────────────────────────────────
export const pageAccents = {
  main:     "#7C6DFA",
  finances: "#34D399",
  health:   "#F87171",
  gym:      "#FBBF24",
  brand:    "#22D3EE",
  settings: "#94A3B8",
};

// ── Spacing ───────────────────────────────────────────────────────────
export const spacing = {
  xs:    4,
  sm:    8,
  md:    14,
  lg:    20,
  xl:    28,
  "2xl": 36,
  "3xl": 48,
};

// ── Border Radius ─────────────────────────────────────────────────────
export const borderRadius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   24,
  "2xl": 32,
  full: 9999,
};

// ── Typography ────────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'DM Mono', 'Courier New', monospace",
  },
  fontSize: {
    xs:    "10px",
    sm:    "12px",
    base:  "13px",
    md:    "14px",
    lg:    "16px",
    xl:    "18px",
    "2xl": "22px",
    "3xl": "28px",
    "4xl": "36px",
    "5xl": "48px",
  },
  fontWeight: {
    light:    300,
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold:800,
    black:    900,
  },
};

// ── Full Theme Objects ────────────────────────────────────────────────
export const darkColors = {
  ...status,
  background:   "#080810",
  card:         glass.bg,
  input:        glass.bgInput,
  border:       glass.border,
  text:         "#F8FAFF",
  textMuted:    "rgba(248, 250, 255, 0.50)",
  accent:       accent.primary,
  accentSecondary: accent.secondary,
  glass,
  gradients:    pageTints,
  pageAccents,
};

