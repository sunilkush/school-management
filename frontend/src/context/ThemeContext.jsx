import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import memoryStorage from "../utils/memoryStorage";

const THEME_KEY = "theme";
const LEGACY_THEME_KEY = "app-theme";
const THEME_MODE_KEY = "theme-mode";
const ThemeContext = createContext(null);

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getInitialThemeMode = () => {
  const savedThemeMode = memoryStorage.getItem(THEME_MODE_KEY);

  if (savedThemeMode === "light" || savedThemeMode === "dark" || savedThemeMode === "system") {
    return savedThemeMode;
  }

  const savedTheme = memoryStorage.getItem(THEME_KEY);

  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  const legacyTheme = memoryStorage.getItem(LEGACY_THEME_KEY);
  if (legacyTheme === "light" || legacyTheme === "dark") return legacyTheme;

  return "system";
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(getInitialThemeMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme = themeMode === "system" ? systemTheme : themeMode;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handleThemeChange);

    return () => media.removeEventListener("change", handleThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.body.classList.toggle("dark", resolvedTheme === "dark");

    memoryStorage.setItem(THEME_MODE_KEY, themeMode);
    memoryStorage.setItem(THEME_KEY, resolvedTheme);
    memoryStorage.setItem(LEGACY_THEME_KEY, resolvedTheme);
  }, [themeMode, resolvedTheme]);

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const currentTheme = prev === "system" ? systemTheme : prev;
      return currentTheme === "light" ? "dark" : "light";
    });
  };

  const setThemeMode = (mode) => {
    if (mode === "light" || mode === "dark" || mode === "system") {
      setThemeModeState(mode);
    }
  };

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      themeMode,
      isDark: resolvedTheme === "dark",
      toggleTheme,
      setThemeMode,
    }),
    [resolvedTheme, themeMode, systemTheme]
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
