export const colorTokens = {
  primary: "#1C5C4B",
  primaryHover: "#164A3C",
  secondary: "#E1C563",
  backgroundDark: "#020202",
  textSecondary: "#6D6D6D",
  white: "#FFFFFF",
  borderLight: "#e5e7eb",
  borderDark: "#1f2937",
  rowHoverLight: "rgba(225, 197, 99, 0.12)",
  rowHoverDark: "rgba(225, 197, 99, 0.18)",
  headerTint: "rgba(28, 92, 75, 0.08)",
  headerTintDark: "rgba(28, 92, 75, 0.2)",
};

export const appTheme = {
  light: {
    colorPrimary: colorTokens.primary,
    colorAccent: colorTokens.secondary,
    colorBg: colorTokens.white,
    colorText: colorTokens.backgroundDark,
    colorMuted: colorTokens.textSecondary,
    colorBorder: colorTokens.borderLight,
    colorSidebarBg: colorTokens.backgroundDark,
  },
  dark: {
    colorPrimary: colorTokens.primary,
    colorAccent: colorTokens.secondary,
    colorBg: colorTokens.backgroundDark,
    colorText: colorTokens.white,
    colorMuted: "#9ca3af",
    colorBorder: colorTokens.borderDark,
    colorSidebarBg: colorTokens.backgroundDark,
  },
};
