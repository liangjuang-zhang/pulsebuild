/**
 * Root Layout - App entry point with complete provider hierarchy
 */
import { httpBatchLink } from '@trpc/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { LogBox, useColorScheme as useNativeColorScheme } from 'react-native';
import { Slot, useNavigationContainerRef, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import { ThemeProvider, DefaultTheme as NavLightTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/lib/query-client';
import { trpc } from '@/lib/trpc';
import { authClient } from '@/lib/auth-client';
import { AppLightTheme, AppDarkTheme } from '@/constants/theme';
import { initializeSentry, sentryNavigationIntegration } from '@/lib/monitoring/sentry';
import { captureScreenView, identifyAnalyticsUser, resetAnalyticsUser } from '@/lib/monitoring/posthog';
import { ErrorBoundary } from '@/components/error-boundary';
import { BottomSheetProvider } from '@/components/bottom-sheet-provider';
import { ToastProvider } from '@/components/toast';
import { LoadingState } from '@/components/common/loading-state';
import { useNetworkStatus } from '@/hooks/use-network-status';

// Initialize i18n for internationalization
import '@/lib/i18n/i18n';

// Suppress harmless native module warnings
LogBox.ignoreLogs([
  /Unable to activate keep awake/,
  /Sending `onAnimatedValueUpdate` with no listeners registered\./,
]);

// Initialize Sentry on app startup
initializeSentry();

// Adapt Paper theme for Navigation
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavLightTheme,
  reactNavigationDark: NavDarkTheme,
  materialLight: AppLightTheme,
  materialDark: AppDarkTheme,
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.EXPO_PUBLIC_API_URL}/trpc`,
      headers() {
        const headers: Record<string, string> = {};
        const cookies = authClient.getCookie();
        if (cookies) {
          headers['Cookie'] = cookies;
        }
        return headers;
      },
    }),
  ],
});

function useColorScheme(): 'light' | 'dark' {
  const scheme = useNativeColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const navigationRef = useNavigationContainerRef();
  const pathname = usePathname();
  const identifiedUserKeyRef = useRef<string | null>(null);

  const { data: session, isPending } = authClient.useSession();

  // Monitor network status
  useNetworkStatus();

  // Register navigation container for Sentry
  useEffect(() => {
    sentryNavigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  // Track screen views with PostHog
  useEffect(() => {
    if (isPending || !pathname || pathname.trim().length === 0) return;
    void captureScreenView(pathname);
  }, [isPending, pathname]);

  // Identify user for analytics
  useEffect(() => {
    if (isPending) return;

    if (session?.user) {
      const nextUserKey = session.user.id;
      if (identifiedUserKeyRef.current !== nextUserKey) {
        identifyAnalyticsUser({
          id: session.user.id,
          name: session.user.name,
        });
        identifiedUserKeyRef.current = nextUserKey;
        // Set user context for Sentry
        Sentry.setUser({ id: session.user.id });
      }
    } else if (identifiedUserKeyRef.current !== null) {
      resetAnalyticsUser();
      identifiedUserKeyRef.current = null;
      Sentry.setUser(null);
    }
  }, [session, isPending]);

  const paperTheme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;
  const navTheme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  // Debug: Log theme state
  console.log('[RootLayout] Theme:', { colorScheme, isDark: colorScheme === 'dark' });

  // Show loading state during session hydration
  if (isPending) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <PaperProvider theme={paperTheme}>
            <LoadingState text={t('common.loading')} />
          </PaperProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <BottomSheetProvider>
            <ToastProvider>
              <ThemeProvider value={navTheme}>
                <Slot />
              </ThemeProvider>
            </ToastProvider>
          </BottomSheetProvider>
        </PaperProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// Wrap with Sentry for performance tracking
const RootLayoutWithSentry = Sentry.wrap(RootLayoutContent);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <RootLayoutWithSentry />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
