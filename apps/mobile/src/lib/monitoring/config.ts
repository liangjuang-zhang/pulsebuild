import Constants from 'expo-constants';

function getTrimmedEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseSampleRate(value: string | undefined, fallback: number): number {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, parsed));
}

export const MONITORING_ENVIRONMENT =
  getTrimmedEnv(process.env.EXPO_PUBLIC_MONITORING_ENVIRONMENT) ?? (__DEV__ ? 'development' : 'production');

export const MONITORING_RELEASE = (() => {
  const slug = getTrimmedEnv(Constants.expoConfig?.slug);
  const version = getTrimmedEnv(Constants.expoConfig?.version);

  if (slug && version) {
    return `${slug}@${version}`;
  }

  return version ?? slug ?? null;
})();

export const POSTHOG_API_KEY = getTrimmedEnv(process.env.EXPO_PUBLIC_POSTHOG_KEY);
export const POSTHOG_HOST = getTrimmedEnv(process.env.EXPO_PUBLIC_POSTHOG_HOST) ?? 'https://us.i.posthog.com';
export const POSTHOG_ENABLED = POSTHOG_API_KEY !== null;

export const SENTRY_DSN = getTrimmedEnv(process.env.EXPO_PUBLIC_SENTRY_DSN);
export const SENTRY_ENABLED = SENTRY_DSN !== null;
export const SENTRY_TRACES_SAMPLE_RATE = parseSampleRate(
  process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  0.2,
);