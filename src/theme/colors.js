// LifeOS Design System v3 — Deep Glass Aesthetic
// Dual-theme: dark (default, electric indigo) + light (white + vibrant orange)

// ── Status Colors (shared across themes) ──────────────────────────────
const status = {
  success: "#34D399",   // emerald
  warning: "#FBBF24",   // amber
  danger:  "#F87171",   // rose-red
  info:    "#38BDF8",   // sky
};

// ── Page Accent Colors (shared across themes — per-section identity) ─
// Only the "main"/home accent flips per theme; the rest stay so that
// green=finances, red=sleep, amber=gym, cyan=brand stay recognizable.
const sharedPageAccents = {
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

// ── Per-theme accent definitions ──────────────────────────────────────
// The "main"/brand-primary accent. Provided as both hex and rgb-triplet
// so that rgba() composition can pick up the right channel via CSS var.
const ACCENTS = {
  dark:     { hex: "#7C6DFA", rgb: "124, 109, 250" }, // electric indigo-violet
  light:    { hex: "#F97316", rgb: "249, 115, 22"  }, // vibrant orange
  midnight: { hex: "#10B981", rgb: "16, 185, 129"  }, // deep emerald
};

// ── Page tints (subtle per-page overlay) — only "main" flips ─────────
const pageTints = {
  dark: {
    main:     "rgba(124, 109, 250, 0.06)",
    finances: "rgba(52, 211, 153, 0.06)",
    health:   "rgba(248, 113, 113, 0.06)",
    gym:      "rgba(251, 191, 36, 0.06)",
    brand:    "rgba(34, 211, 238, 0.06)",
    settings: "rgba(107, 114, 128, 0.06)",
  },
  light: {
    main:     "rgba(249, 115, 22, 0.08)",
    finances: "rgba(52, 211, 153, 0.06)",
    health:   "rgba(248, 113, 113, 0.06)",
    gym:      "rgba(251, 191, 36, 0.06)",
    brand:    "rgba(34, 211, 238, 0.06)",
    settings: "rgba(107, 114, 128, 0.06)",
  },
  midnight: {
    main:     "rgba(16, 185, 129, 0.08)",
    finances: "rgba(52, 211, 153, 0.06)",
    health:   "rgba(248, 113, 113, 0.06)",
    gym:      "rgba(251, 191, 36, 0.06)",
    brand:    "rgba(34, 211, 238, 0.06)",
    settings: "rgba(107, 114, 128, 0.06)",
  },
};

// ── Page accent maps (per theme) ──────────────────────────────────────
const pageAccents = {
  dark:     { main: ACCENTS.dark.hex,     ...sharedPageAccents },
  light:    { main: ACCENTS.light.hex,    ...sharedPageAccents },
  midnight: { main: ACCENTS.midnight.hex, ...sharedPageAccents },
};

// ── Full Theme Objects ────────────────────────────────────────────────
// Kept for any consumer reading via JS (color values direct). Components
// should prefer CSS vars (var(--bg) etc.) emitted by cssVarsForTheme().
export const darkColors = {
  ...status,
  background:    "#080810",
  card:          "rgba(255, 255, 255, 0.05)",
  input:         "rgba(255, 255, 255, 0.06)",
  border:        "rgba(255, 255, 255, 0.10)",
  text:          "#F8FAFF",
  textMuted:     "rgba(248, 250, 255, 0.50)",
  accent:        ACCENTS.dark.hex,
  accentRgb:     ACCENTS.dark.rgb,
  pageAccents:   pageAccents.dark,
  pageTints:     pageTints.dark,
};

export const lightColors = {
  ...status,
  background:    "#FAFAF7",
  card:          "rgba(255, 255, 255, 0.70)",
  input:         "rgba(0, 0, 0, 0.04)",
  border:        "rgba(0, 0, 0, 0.08)",
  text:          "#1A1A1F",
  textMuted:     "rgba(26, 26, 31, 0.55)",
  accent:        ACCENTS.light.hex,
  accentRgb:     ACCENTS.light.rgb,
  pageAccents:   pageAccents.light,
  pageTints:     pageTints.light,
};

export const midnightColors = {
  ...status,
  background:    "#03060B",
  card:          "rgba(16, 185, 129, 0.04)",
  input:         "rgba(16, 185, 129, 0.06)",
  border:        "rgba(16, 185, 129, 0.18)",
  text:          "#E8FFF4",
  textMuted:     "rgba(232, 255, 244, 0.55)",
  accent:        ACCENTS.midnight.hex,
  accentRgb:     ACCENTS.midnight.rgb,
  pageAccents:   pageAccents.midnight,
  pageTints:     pageTints.midnight,
};

// ── Theme → CSS variable bag ──────────────────────────────────────────
// Returns a flat { '--bg': '#…', '--text': '#…', ... } map for the chosen
// theme. App.jsx writes these onto document.documentElement.style on mount
// and whenever the theme changes.
//
// Tokens:
//   --bg, --text, --text-muted, --text-faint
//   --card, --card-mid, --card-high, --input
//   --border, --border-high
//   --shadow
//   --accent-main, --accent-main-rgb   (brand-primary, flips per theme)
//   --orb-opacity                       (AnimatedBackground reads this)
//
// rgba() consumers use the *-rgb variant:  rgba(var(--accent-main-rgb), 0.3)
export function cssVarsForTheme(themeName) {
  if (themeName === "light") {
    return {
      "--bg":               "#FAFAF7",
      "--text":             "#1A1A1F",
      "--text-muted":       "rgba(26, 26, 31, 0.55)",
      "--text-faint":       "rgba(26, 26, 31, 0.45)",
      "--card":             "rgba(255, 255, 255, 0.70)",
      "--card-mid":         "rgba(255, 255, 255, 0.85)",
      "--card-high":        "rgba(255, 255, 255, 0.95)",
      "--input":            "rgba(0, 0, 0, 0.04)",
      "--border":           "rgba(0, 0, 0, 0.08)",
      "--border-high":      "rgba(0, 0, 0, 0.14)",
      "--shadow":           "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
      "--accent-main":      ACCENTS.light.hex,
      "--accent-main-rgb":  ACCENTS.light.rgb,
      "--orb-opacity":      "0.15",
    };
  }
  if (themeName === "midnight") {
    return {
      "--bg":               "#03060B",
      "--text":             "#E8FFF4",
      "--text-muted":       "rgba(232, 255, 244, 0.55)",
      "--text-faint":       "rgba(232, 255, 244, 0.40)",
      "--card":             "rgba(16, 185, 129, 0.05)",
      "--card-mid":         "rgba(16, 185, 129, 0.08)",
      "--card-high":        "rgba(16, 185, 129, 0.13)",
      "--input":            "rgba(16, 185, 129, 0.06)",
      "--border":           "rgba(16, 185, 129, 0.18)",
      "--border-high":      "rgba(16, 185, 129, 0.30)",
      "--shadow":           "0 8px 32px rgba(0, 30, 20, 0.55), inset 0 1px 0 rgba(16, 185, 129, 0.10)",
      "--accent-main":      ACCENTS.midnight.hex,
      "--accent-main-rgb":  ACCENTS.midnight.rgb,
      "--orb-opacity":      "0.32",
    };
  }
  // dark (default)
  return {
    "--bg":               "#080810",
    "--text":             "#F8FAFF",
    "--text-muted":       "rgba(248, 250, 255, 0.50)",
    "--text-faint":       "rgba(248, 250, 255, 0.40)",
    "--card":             "rgba(255, 255, 255, 0.05)",
    "--card-mid":         "rgba(255, 255, 255, 0.08)",
    "--card-high":        "rgba(255, 255, 255, 0.12)",
    "--input":            "rgba(255, 255, 255, 0.06)",
    "--border":           "rgba(255, 255, 255, 0.10)",
    "--border-high":      "rgba(255, 255, 255, 0.18)",
    "--shadow":           "0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
    "--accent-main":      ACCENTS.dark.hex,
    "--accent-main-rgb":  ACCENTS.dark.rgb,
    "--orb-opacity":      "0.4",
  };
}

// Page accent + page tint lookup helpers — theme-aware
export const getPageAccentForTheme = (page, themeName) =>
  (pageAccents[themeName] || pageAccents.dark)[page] ||
  (pageAccents[themeName] || pageAccents.dark).main;

export const getPageTintForTheme = (page, themeName) =>
  (pageTints[themeName] || pageTints.dark)[page] ||
  (pageTints[themeName] || pageTints.dark).main;

// ── Glass tokens (legacy export, kept for any external readers) ───────
export const glass = {
  bg:           "rgba(255, 255, 255, 0.05)",
  bgMid:        "rgba(255, 255, 255, 0.08)",
  bgHigh:       "rgba(255, 255, 255, 0.12)",
  bgInput:      "rgba(255, 255, 255, 0.06)",
  border:       "rgba(255, 255, 255, 0.10)",
  borderHigh:   "rgba(255, 255, 255, 0.18)",
  borderAccent: "rgba(124, 109, 250, 0.45)",
  blur:         "blur(24px) saturate(180%)",
  blurHeavy:    "blur(40px) saturate(200%)",
  shadow:       "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
  shadowHover:  "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
  shadowGlow:   "0 0 30px rgba(124, 109, 250, 0.25), 0 8px 32px rgba(0,0,0,0.4)",
};
