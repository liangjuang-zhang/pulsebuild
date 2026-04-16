import { Redirect, Stack } from 'expo-router';
import { useAuthSession } from '@/stores/auth-session-store';

export default function AuthLayout() {
  const { isHydrating, session } = useAuthSession();

  if (!isHydrating && session) {
    // 未完成 onboarding → 跳引导流程，已完成 → 进主页
    if (!session.user.onboardingCompletedAt) {
      return <Redirect href="/(onboarding)/personal-info" />;
    }
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="phone-entry" />
      <Stack.Screen name="code-verification" />
    </Stack>
  );
}
