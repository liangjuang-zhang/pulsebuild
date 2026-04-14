/**
 * Feature Flags Configuration
 *
 * Single source of truth for all build-time feature flags. Each flag is parsed
 * from an EXPO_PUBLIC_* environment variable at bundle time by Metro.
 * Changing a flag requires restarting Metro (`npx expo start -c`) or a full rebuild.
 */

function isEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

// ---------------------------------------------------------------------------
// Raw build-time constants
// Exported for direct import in non-React code (services, stores, database).
// ---------------------------------------------------------------------------

/** Demo mode with mock users. Gated to dev builds only. */
export const DEMO_MODE_ENABLED = __DEV__ && isEnabled(process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE);

/** Maestro e2e login shortcut screen. Gated to dev builds only. */
export const E2E_MODE_ENABLED = __DEV__ && isEnabled(process.env.EXPO_PUBLIC_ENABLE_E2E);

/** Dev-only frontend controls (sync/debug surfaces). Gated to dev builds only. */
export const DEV_TOOLS_ENABLED = __DEV__ && isEnabled(process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS);

/** My Work tab visibility in bottom navigation. */
export const MY_WORK_TAB_ENABLED = isEnabled(process.env.EXPO_PUBLIC_ENABLE_MY_WORK_TAB);

/**
 * Project overview timesheets section visibility.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_PROJECT_OVERVIEW_TIMESHEETS=true to show.
 */
export const PROJECT_OVERVIEW_TIMESHEETS_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_PROJECT_OVERVIEW_TIMESHEETS,
);

/**
 * Project overview site diaries section visibility.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_PROJECT_OVERVIEW_SITE_DIARIES=true to show.
 */
export const PROJECT_OVERVIEW_SITE_DIARIES_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_PROJECT_OVERVIEW_SITE_DIARIES,
);

/**
 * Project progress bar visibility in project list + project overview screens.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_PROJECT_PROGRESS_BARS=true to show.
 */
export const PROJECT_PROGRESS_BARS_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_PROJECT_PROGRESS_BARS,
);

/**
 * Connection profile screen navigation visibility.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_CONNECTION_PROFILE_SCREEN=true to enable taps.
 */
export const CONNECTION_PROFILE_SCREEN_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_CONNECTION_PROFILE_SCREEN,
);

/**
 * Connection profile availability section visibility.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_CONNECTION_PROFILE_AVAILABILITY=true to show.
 */
export const CONNECTION_PROFILE_AVAILABILITY_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_CONNECTION_PROFILE_AVAILABILITY,
);

/**
 * Connection profile chat section visibility.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_CONNECTION_PROFILE_CHAT=true to show.
 */
export const CONNECTION_PROFILE_CHAT_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_CONNECTION_PROFILE_CHAT,
);

/**
 * Task list Filters & Sort panel visibility.
 * Defaults to disabled; set EXPO_PUBLIC_ENABLE_TASK_FILTERS_SORT_PANEL=true to show.
 */
export const TASK_FILTERS_SORT_PANEL_ENABLED = isEnabled(
  process.env.EXPO_PUBLIC_ENABLE_TASK_FILTERS_SORT_PANEL,
);

// ---------------------------------------------------------------------------
// Registry
// Complete metadata for all flags. getAllFeatureFlags() returns this object.
// ---------------------------------------------------------------------------

export const FeatureFlags = {
  myWorkTab: {
    enabled: MY_WORK_TAB_ENABLED,
    description: 'Expose the My work tab and assigned-work flow in app navigation',
    defaultValue: false,
  },
  devTools: {
    enabled: DEV_TOOLS_ENABLED,
    description:
      'Expose development-only frontend controls (sync/debug surfaces, dev builds only)',
    defaultValue: false,
  },
  projectOverviewTimesheets: {
    enabled: PROJECT_OVERVIEW_TIMESHEETS_ENABLED,
    description: 'Show Timesheets section on the project overview screen',
    defaultValue: false,
  },
  projectOverviewSiteDiaries: {
    enabled: PROJECT_OVERVIEW_SITE_DIARIES_ENABLED,
    description: 'Show Site diaries section on the project overview screen',
    defaultValue: false,
  },
  projectProgressBars: {
    enabled: PROJECT_PROGRESS_BARS_ENABLED,
    description: 'Show project progress bars in project list and project overview screens',
    defaultValue: false,
  },
  connectionProfileScreen: {
    enabled: CONNECTION_PROFILE_SCREEN_ENABLED,
    description: 'Enable opening the connection profile screen when tapping users',
    defaultValue: false,
  },
  connectionProfileAvailability: {
    enabled: CONNECTION_PROFILE_AVAILABILITY_ENABLED,
    description: 'Show Availability section on connection profile screens',
    defaultValue: false,
  },
  connectionProfileChat: {
    enabled: CONNECTION_PROFILE_CHAT_ENABLED,
    description: 'Show Chat section on connection profile screens',
    defaultValue: false,
  },
  taskFiltersSortPanel: {
    enabled: TASK_FILTERS_SORT_PANEL_ENABLED,
    description: 'Show Filters & Sort panel across task list surfaces',
    defaultValue: false,
  },
  demoMode: {
    enabled: DEMO_MODE_ENABLED,
    description: 'Enable demo mode with mock users (dev builds only)',
    defaultValue: false,
  },
  e2eMode: {
    enabled: E2E_MODE_ENABLED,
    description: 'Enable Maestro e2e login shortcut screen (dev builds only)',
    defaultValue: false,
  },
} as const;

/**
 * Check if a feature flag is enabled.
 *
 * @param flag - Feature flag name
 * @returns true if the feature is enabled
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('myWorkTab')) {
 *   // render My Work tab
 * }
 * ```
 */
export function isFeatureEnabled(flag: keyof typeof FeatureFlags): boolean {
  return FeatureFlags[flag].enabled;
}

/**
 * Get feature flag configuration including description and default value.
 *
 * @param flag - Feature flag name
 * @returns Feature flag configuration object
 */
export function getFeatureConfig(flag: keyof typeof FeatureFlags) {
  return FeatureFlags[flag];
}

/**
 * Get all feature flags and their current states.
 * Useful for displaying flag status in dev tools.
 *
 * @returns Object with all feature flags and their states
 */
export function getAllFeatureFlags() {
  return FeatureFlags;
}