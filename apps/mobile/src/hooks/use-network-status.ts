/**
 * Network Status Hook - Monitors network connectivity
 */
import { useEffect, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { captureAnalyticsEvent } from '@/lib/monitoring/posthog';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const netInfo = useNetInfo();
  const [previousConnected, setPreviousConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const isConnected = netInfo.isConnected ?? false;

    if (previousConnected !== null && previousConnected !== isConnected) {
      captureAnalyticsEvent('network_status_changed', {
        connected: isConnected,
        type: netInfo.type ?? 'unknown',
      });
    }

    setPreviousConnected(isConnected);
  }, [netInfo.isConnected, netInfo.type]);

  return {
    isConnected: netInfo.isConnected ?? false,
    isInternetReachable: netInfo.isInternetReachable,
    type: netInfo.type,
  };
}