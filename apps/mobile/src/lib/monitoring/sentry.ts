import { isRunningInExpoGo } from 'expo';
import * as Sentry from '@sentry/react-native';
import {
  MONITORING_ENVIRONMENT,
  MONITORING_RELEASE,
  SENTRY_DSN,
  SENTRY_TRACES_SAMPLE_RATE,
} from './config';

export const sentryNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

let hasInitializedSentry = false;

export function initializeSentry() {
  if (hasInitializedSentry) {
    return;
  }

  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: MONITORING_ENVIRONMENT,
    release: MONITORING_RELEASE ?? undefined,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    integrations: [sentryNavigationIntegration],
    enableNativeFramesTracking: !isRunningInExpoGo(),
  });

  Sentry.setTag('app.environment', MONITORING_ENVIRONMENT);
  Sentry.setTag('app.platform', 'mobile');
  hasInitializedSentry = true;
}

export function setSentryUser(user: { id: string }) {
  Sentry.setUser({ id: user.id });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}