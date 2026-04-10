import { httpBatchLink } from '@trpc/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { queryClient } from '@/lib/query-client';
import { trpc } from '@/lib/trpc';
import { authClient } from '@/lib/auth-client';

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
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <AuthGate />
        </PaperProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
