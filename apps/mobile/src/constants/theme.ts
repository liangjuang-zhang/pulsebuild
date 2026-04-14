/**
 * App Theme Colors - Tech + Construction Design System
 *
 * Primary: Electric Blue (Tech/Professional)
 * Secondary: Safety Orange (Construction High-Vis)
 * Tertiary: Cyber Cyan (Modern/Tech)
 */
import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Palette Definitions
const techBlue = '#2962FF';
const techBlueDark = '#82B1FF';
const safetyOrange = '#FF6D00';
const safetyOrangeDark = '#FF9E40';
const cyberCyan = '#00B8D4';
const cyberCyanDark = '#84FFFF';

const lightBackground = '#F5F7FA';
const darkBackground = '#080D15';

// Extended Paper Themes
export const AppLightTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: techBlue,
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3F2FD',
    onPrimaryContainer: '#0D47A1',

    secondary: safetyOrange,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFE0B2',
    onSecondaryContainer: '#E65100',

    tertiary: cyberCyan,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E0F7FA',
    onTertiaryContainer: '#006064',

    background: lightBackground,
    surface: '#FFFFFF',
    surfaceVariant: '#E1E2EC',
    onSurfaceVariant: '#444746',

    outline: '#79747E',
    outlineVariant: '#C4C7C5',
  },
};

export const AppDarkTheme = {
  ...MD3DarkTheme,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: techBlueDark,
    onPrimary: '#002171',
    primaryContainer: '#004ECB',
    onPrimaryContainer: '#FFFFFF',

    secondary: safetyOrangeDark,
    onSecondary: '#541D00',
    secondaryContainer: '#CC5500',
    onSecondaryContainer: '#FFFFFF',

    tertiary: cyberCyanDark,
    onTertiary: '#006064',
    tertiaryContainer: '#0097A7',
    onTertiaryContainer: '#FFFFFF',

    background: darkBackground,
    surface: '#1E293B',
    surfaceVariant: '#334155',
    onSurfaceVariant: '#CAC4D0',

    outline: '#938F99',
    outlineVariant: '#49454F',
  },
};

// Colors for navigation/tab bar
const tintColorLight = techBlue;
const tintColorDark = '#2563EB';

export const Colors = {
  light: {
    text: '#11181C',
    background: lightBackground,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: darkBackground,
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Font families by platform
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});