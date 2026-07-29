// Mirrors frontend/tailwind.config.js so the app reads as the same product as the web portal.
export const palette = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryLight: '#DBEAFE',
  primaryLighter: '#EFF6FF',
  secondary: '#0F172A',
  secondaryLight: '#1E293B',
  accent: '#14B8A6',
  accentHover: '#0D9488',
  accentLight: '#CCFBF1',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

export const lightColors = {
  background: '#F8FAFC',
  backgroundSoft: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceSoft: '#F1F5F9',
  border: '#E2E8F0',
  borderMuted: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textOnPrimary: '#FFFFFF',
  primary: palette.primary,
  primaryHover: palette.primaryHover,
  primaryLight: palette.primaryLight,
  accent: palette.accent,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  // Single-series chart color — same brand blue as `primary`, kept as its own token because a
  // chart's color choice is a data-viz decision (validated for contrast/lightness band via the
  // dataviz skill's validator), not just "whatever the primary button color happens to be".
  chartSeries: palette.primary,
};

export const darkColors = {
  background: palette.slate[900],
  backgroundSoft: palette.secondaryLight,
  surface: palette.secondaryLight,
  surfaceSoft: palette.slate[800],
  border: palette.slate[700],
  borderMuted: palette.slate[800],
  text: '#F1F5F9',
  textSecondary: palette.slate[400],
  textMuted: palette.slate[500],
  textDisabled: palette.slate[600],
  textOnPrimary: '#FFFFFF',
  primary: '#60A5FA',
  primaryHover: '#3B82F6',
  primaryLight: '#1E3A5F',
  accent: '#2DD4BF',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
  // #60A5FA (the dark-mode `primary`) fails the dataviz skill's validator at this surface
  // (lightness band, `validate_palette.js "#60A5FA" --mode dark`) — this step passes.
  chartSeries: '#2F6FD6',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

// Matches web's index.css --radius-sm/md/lg/xl exactly (8/12/16/20) — these were previously
// 6/10/14/20, a consistent 2px-per-tier drift from the web design system across every card,
// button, and chip in the app (98 files reference these tokens, so this one change cascades
// everywhere at once).
export const radii = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

// fontFamily here must be one of the 4 weights App.jsx loads via useFonts (Inter_400Regular/
// _500Medium/_600SemiBold/_700Bold) — RN doesn't synthesize bold/medium faces for custom fonts
// the way it does for system fonts, so each weight needs its own distinct loaded family name
// rather than a single family + a `fontWeight` style prop.
// Every size bumped +2px (line-height along with it, to keep each style's original
// leading-to-size gap rather than cramping lines together) per a direct request to make app-wide
// text larger — this scale is the single source every screen's typography.* styles read from, so
// the change cascades everywhere at once.
export const typography = {
  h1: { fontSize: 30, fontWeight: '700', lineHeight: 36, fontFamily: 'Inter_700Bold' },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 30, fontFamily: 'Inter_700Bold' },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 26, fontFamily: 'Inter_600SemiBold' },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24, fontFamily: 'Inter_400Regular' },
  bodyStrong: { fontSize: 17, fontWeight: '600', lineHeight: 24, fontFamily: 'Inter_600SemiBold' },
  caption: { fontSize: 14, fontWeight: '500', lineHeight: 18, fontFamily: 'Inter_500Medium' },
};
