import { lightColors, darkColors, spacing, borderRadius, typography } from "./colors.js";

export const themes = {
  light: {
    colors: lightColors,
    spacing,
    borderRadius,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing,
    borderRadius,
    typography,
  },
};

export const defaultTheme = "dark";

export const getTheme = (themeMode) => themes[themeMode] || themes.dark;
