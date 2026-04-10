import { Redirect } from 'expo-router';
import { authClient } from '@/lib/auth-client';

export default function Index() {
  const { data: session } = authClient.useSession();

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/phone-entry" />;
}

