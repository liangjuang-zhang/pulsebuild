/**
 * UI Constants - Border radius, spacing, touch targets, shadows
 */
import type { TextStyle, ViewStyle } from 'react-native';

// ─── Screen Layout Constants ────────────────────────────────────────────────────
export const INPUT_BORDER_RADIUS = 12;
export const APP_SCREEN_PADDING = 16;
export const APP_SCREEN_BOTTOM_PADDING = 24;
export const APP_SECTION_GAP = 16;
export const APP_CARD_RADIUS = 16;
export const APP_CARD_MARGIN_BOTTOM = 24;

// ─── Border Radius Scale ──────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  ROUND: 999,
  SHEET: 24,
  LG: 16,
  MD: 12,
  SM: 8,
  XS: 6,
  XXS: 4,
} as const;

// ─── Spacing / Gap Scale ──────────────────────────────────────────────────────────
export const SPACING = {
  NONE: 0,
  XXS: 2,
  XS: 4,
  SM: 6,
  MD: 8,
  LG: 10,
  XL: 12,
  '2XL': 14,
  XXL: 16,
  '3XL': 18,
  XXXL: 20,
  SECTION: 24,
  XL2: 32,
  XL3: 40,
  XL4: 48,
  XL5: 56,
  XL6: 64,
  SCREEN_BOTTOM: 80,
} as const;

// ─── Touch Targets / Heights ──────────────────────────────────────────────────────
export const TOUCH_TARGET = {
  MIN: 44,
  MD: 48,
  LG: 52,
  XL: 56,
} as const;

export const INPUT_HEIGHT = TOUCH_TARGET.MD;
export const BUTTON_HEIGHT = TOUCH_TARGET.MD;

// ─── Font Weights ──────────────────────────────────────────────────────────────────
export const FONT_WEIGHT = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
} as const;

// ─── Shadow Presets ────────────────────────────────────────────────────────────────
export const SHADOW_NONE: Partial<ViewStyle> = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

export const SHADOW_SM: Partial<ViewStyle> = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 1,
};

export const SHADOW_MD: Partial<ViewStyle> = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
};

export const SHADOW_MD_DARK: Partial<ViewStyle> = {
  ...SHADOW_MD,
  shadowOpacity: 0.25,
};

export const SHADOW_LG: Partial<ViewStyle> = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 4,
};

export const SHADOW_LG_DARK: Partial<ViewStyle> = {
  ...SHADOW_LG,
  shadowOpacity: 0.24,
};

export const SHADOW_XL: Partial<ViewStyle> = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.14,
  shadowRadius: 18,
  elevation: 8,
};

export const SHADOW_XL_DARK: Partial<ViewStyle> = {
  ...SHADOW_XL,
  shadowOpacity: 0.34,
};

export const SHADOW_OVERLAY: Partial<ViewStyle> = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 12,
};

// Legacy aliases (deprecated)
/** @deprecated Use SHADOW_MD */
export const CARD_SHADOW = SHADOW_MD;
/** @deprecated Use SHADOW_MD_DARK */
export const CARD_SHADOW_DARK = SHADOW_MD_DARK;
/** @deprecated Use SHADOW_SM */
export const ELEMENT_SHADOW = SHADOW_SM;