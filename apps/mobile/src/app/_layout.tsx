import { httpBatchLink } from '@trpc/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import { ThemeProvider, DefaultTheme as NavLightTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { queryClient } from '@/lib/query-client';
import { trpc } from '@/lib/trpc';
import { authClient } from '@/lib/auth-client';
import { AppLightTheme, AppDarkTheme } from '@/constants/theme';
import { initializeSentry } from '@/lib/monitoring/sentry';
import { ToastProvider } from '@/components/toast';
// Initialize i18n for internationalization
import '@/lib/i18n/i18n';

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

function AuthGate() {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === '(auth)' as string;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/phone-entry' as const);
    } else if (session && inAuthGroup) {
      router.replace('/(app)/(tabs)' as const);
    }
  }, [session, isPending, segments, router]);

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;
  const navTheme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <ThemeProvider value={navTheme}>
            <ToastProvider>
              <AuthGate />
            </ToastProvider>
          </ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
