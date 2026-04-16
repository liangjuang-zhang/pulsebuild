/**
 * Use Online Access Hook
 * Network connectivity status and offline handling
 */
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/hooks/use-network-status';

/**
 * Online access feature types for error messages
 */
export type OnlineAccessFeature = 'onboarding' | 'report' | 'translation' | 'connectionRequests';

/**
 * Error thrown when offline access is required
 */
export class OnlineRequiredError extends Error {
  readonly feature: OnlineAccessFeature;

  constructor(feature: OnlineAccessFeature, message?: string) {
    super(message ?? `Online access required for ${feature}`);
    this.name = 'OnlineRequiredError';
    this.feature = feature;
  }
}

/**
 * Check if error is an OnlineRequiredError
 */
export function isOnlineRequiredError(error: unknown): error is OnlineRequiredError {
  return error instanceof OnlineRequiredError;
}

/**
 * Hook for network connectivity and offline handling
 */
export function useOnlineAccess(feature: OnlineAccessFeature) {
  const { t } = useTranslation();
  const { isConnected, type: connectionType } = useNetworkStatus();

  // Get localized title/message
  const title = useMemo(() => t(`online_access.${feature}_title`), [feature, t]);
  const message = useMemo(() => t(`online_access.${feature}_message`), [feature, t]);

  /**
   * Require online access before proceeding
   * Returns true if online, calls onOffline callback if offline
   */
  const requireOnline = useCallback(
    (onOffline?: (message: string) => void): boolean => {
      if (isConnected) {
        return true;
      }

      onOffline?.(message);
      return false;
    },
    [isConnected, message],
  );

  /**
   * Throw error if offline (for async operations)
   */
  const throwIfOffline = useCallback(() => {
    if (!isConnected) {
      throw new OnlineRequiredError(feature, message);
    }
  }, [isConnected, feature, message]);

  return {
    connectionType,
    isConnected,
    isOffline: !isConnected,
    message,
    requireOnline,
    throwIfOffline,
    title,
  };
}