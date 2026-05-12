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

// Page gradient helpers
export const getPageGradient = (page) => {
  const gradients = {
    main: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    finances: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    health: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    gym: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    brand: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    settings: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  };
  return gradients[page] || gradients.main;
};
