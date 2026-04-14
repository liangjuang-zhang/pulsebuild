/**
 * UI Helper Functions - Theme-aware style generators
 */
import type { TextStyle, ViewStyle } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { BORDER_RADIUS, SPACING, SHADOW_XL, SHADOW_XL_DARK, CARD_SHADOW, CARD_SHADOW_DARK, APP_CARD_RADIUS } from './ui-constants';

// ─── Header Styles ──────────────────────────────────────────────────────────────────
export const APP_HEADER_TITLE_STYLE: TextStyle = {
  fontWeight: 'bold',
};

// ─── Card Style Helper ───────────────────────────────────────────────────────────────
export function getAppCardStyle(theme: MD3Theme, borderRadius = APP_CARD_RADIUS): ViewStyle {
  return {
    borderRadius,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outlineVariant,
    borderWidth: theme.dark ? 1 : 0,
    ...(theme.dark ? CARD_SHADOW_DARK : CARD_SHADOW),
  };
}

// ─── Input Colors Helper ─────────────────────────────────────────────────────────────
export function getInputColors(theme: MD3Theme) {
  return {
    backgroundColor: theme.dark ? theme.colors.elevation.level1 : '#FFFFFF',
    idleBorderColor: theme.dark ? '#3A3A3A' : '#E6E6E6',
    placeholderColor: theme.dark ? '#888888' : '#BDBDBD',
  };
}

// ─── Header Style Helper ─────────────────────────────────────────────────────────────
export function getAppHeaderStyle(theme: MD3Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.background,
  };
}

// ─── Section Background Helper ───────────────────────────────────────────────────────
export function getSectionBackgroundColor(theme: MD3Theme): string {
  return theme.colors.surface;
}

// ─── Floating Tab Bar Style ──────────────────────────────────────────────────────────
export function getFloatingTabBarStyle(theme: MD3Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outlineVariant,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.LG + 2,
    marginHorizontal: SPACING.XXL,
    marginBottom: SPACING.XL,
    ...(theme.dark ? SHADOW_XL_DARK : SHADOW_XL),
  };
}