import { Redirect } from 'expo-router';
import { useAuthSession } from '@/stores/auth-session-store';
import { useEffect } from 'react';

export default function Index() {
  const { isHydrating, session } = useAuthSession();

  if (isHydrating) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/phone-entry" />;
  }

  if (!session.user.onboardingCompletedAt) {
    return <Redirect href="/(onboarding)/personal-info" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}

