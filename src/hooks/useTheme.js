import { useState, useEffect } from "react";
import { storage, STORAGE_KEYS } from "../utils/storage.js";
import { getTheme, defaultTheme } from "../theme/index.js";

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = storage.get(STORAGE_KEYS.THEME);
    if (savedTheme) return savedTheme;

    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return defaultTheme;
  });

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    storage.set(STORAGE_KEYS.THEME, newTheme);
  };

  const setThemeMode = (mode) => {
    setTheme(mode);
    storage.set(STORAGE_KEYS.THEME, mode);
  };

  const currentTheme = getTheme(theme);

  return { theme, currentTheme, toggleTheme, setThemeMode };
};
