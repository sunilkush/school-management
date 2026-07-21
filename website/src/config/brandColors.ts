/**
 * The logo's full diamond spectrum, left to right — used for decorative
 * gradients/backgrounds where raw vividness matters more than text-level
 * contrast (hero glow, gradient headline text, etc.).
 */
export const LOGO_GRADIENT_COLORS = [
  '#FFC845',
  '#FF9421',
  '#FF6161',
  '#E63E6D',
  '#7B5CE0',
  '#16357A',
  '#2196F3',
] as const

/**
 * The same palette, darkened where needed to clear 3:1 contrast against a
 * near-white tint background (WCAG 1.4.11) — safe to use as icon/accent
 * foreground colors (e.g. cycling through IconBadge instances). Don't use
 * raw LOGO_GRADIENT_COLORS for small icons/text; use this set instead.
 */
export const BRAND_ICON_COLORS = [
  '#947428', // gold (darkened from the yellow diamond)
  '#b86b18', // amber (darkened from the orange diamond)
  '#d15050', // coral (darkened from the red diamond)
  '#E63E6D', // rose — already clears 3:1
  '#7B5CE0', // purple — site primary, 4.72:1
  '#16357A', // navy — 11.51:1
  '#2196F3', // blue — 3.12:1, icon-only use
] as const

export function brandIconColor(index: number) {
  return BRAND_ICON_COLORS[index % BRAND_ICON_COLORS.length]
}

/** Maps a category to a stable color by its position in the given category list. */
export function brandColorForCategory<T extends string>(category: T, categories: readonly T[]) {
  const index = categories.indexOf(category)
  return brandIconColor(index === -1 ? 0 : index)
}
