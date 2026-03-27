import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import memoryStorage from "../utils/memoryStorage";

const THEME_KEY = "theme";
const LEGACY_THEME_KEY = "app-theme";
const ThemeContext = createContext(null);

const getInitialTheme = () => {
  const savedTheme = memoryStorage.getItem(THEME_KEY);

  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  const legacyTheme = memoryStorage.getItem(LEGACY_THEME_KEY);
  if (legacyTheme === "light" || legacyTheme === "dark") return legacyTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    memoryStorage.setItem(THEME_KEY, theme);
     memoryStorage.setItem(LEGACY_THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
