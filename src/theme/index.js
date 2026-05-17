import {
  darkColors,
  lightColors,
  spacing,
  borderRadius,
  typography,
  cssVarsForTheme,
  getPageAccentForTheme,
  getPageTintForTheme,
} from "./colors.js";

export const themes = {
  dark:  { colors: darkColors,  spacing, borderRadius, typography },
  light: { colors: lightColors, spacing, borderRadius, typography },
};

export const defaultTheme = "dark";

export const getTheme = (themeMode) => themes[themeMode] || themes.dark;

// Theme-aware page accent + tint lookup.
// The `themeName` argument is optional — when omitted, dark is used (legacy
// callers that haven't been updated still work).
export const getPageAccent = (page, themeName = "dark") =>
  getPageAccentForTheme(page, themeName);

export const getPageTint = (page, themeName = "dark") =>
  getPageTintForTheme(page, themeName);

// Legacy helper (unified bg) — now reads from the theme variable so
// gradients/backgrounds keep working when callers pass it as a literal.
export const getPageGradient = (_page) => "var(--bg)";

// Re-export so App.jsx can apply CSS variables on theme change.
export { cssVarsForTheme };
