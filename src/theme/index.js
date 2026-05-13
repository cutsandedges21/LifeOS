import { darkColors, spacing, borderRadius, typography, pageTints, pageAccents } from "./colors.js";

export const themes = {
  dark: {
    colors: darkColors,
    spacing,
    borderRadius,
    typography,
  },
};

export const defaultTheme = "dark";

export const getTheme = (themeMode) => themes[themeMode] || themes.dark;

// Returns a very subtle per-page tint color overlay (not a full background)
export const getPageTint = (page) => pageTints[page] || pageTints.main;

// Returns the accent color for a given page
export const getPageAccent = (page) => pageAccents[page] || pageAccents.main;

// Legacy helper kept for backward compat (returns unified dark bg)
export const getPageGradient = (_page) => "#080810";
