import PostHog from 'posthog-react-native';
import { MONITORING_ENVIRONMENT, POSTHOG_API_KEY, POSTHOG_ENABLED, POSTHOG_HOST } from './config';

let hasRegisteredDefaults = false;

export const posthogClient = POSTHOG_ENABLED
  ? new PostHog(POSTHOG_API_KEY!, {
      host: POSTHOG_HOST,
      persistence: 'file',
      captureAppLifecycleEvents: true,
      preloadFeatureFlags: false,
      sendFeatureFlagEvent: false,
      requestTimeout: 10000,
      fetchRetryCount: 3,
      errorTracking: {
        autocapture: false,
      },
    })
  : null;

async function ensureDefaultSuperProperties(): Promise<void> {
  if (!posthogClient || hasRegisteredDefaults) {
    return;
  }

  hasRegisteredDefaults = true;
  try {
    await posthogClient.register({
      app_environment: MONITORING_ENVIRONMENT,
      app_platform: 'mobile',
    });
  } catch {
    hasRegisteredDefaults = false;
  }
}

export function captureAnalyticsEvent(event: string, properties?: Record<string, string | number | boolean>): void {
  if (!posthogClient) {
    return;
  }

  void ensureDefaultSuperProperties();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthogClient.capture(event, properties as any);
  } catch {
    return;
  }
}

export async function captureScreenView(pathname: string): Promise<void> {
  if (!posthogClient || pathname.trim().length === 0) {
    return;
  }

  void ensureDefaultSuperProperties();
  try {
    await posthogClient.screen(pathname, { path: pathname });
  } catch {
    return;
  }
}

export function identifyAnalyticsUser(user: { id: string; name?: string }) {
  if (!posthogClient) {
    return;
  }

  void ensureDefaultSuperProperties();
  try {
    posthogClient.identify(user.id, user.name ? { name: user.name } : undefined);
  } catch {
    return;
  }
}

export function resetAnalyticsUser() {
  if (!posthogClient) {
    return;
  }

  try {
    posthogClient.reset();
  } catch {
    return;
  }
}