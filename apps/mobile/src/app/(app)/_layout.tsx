import { useEffect, useRef } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthSession } from '@/stores/auth-session-store';
import { syncManager } from '@/lib/database';

export default function AppLayout() {
  const { isHydrating, session } = useAuthSession();
  const hasSynced = useRef(false);

  // 首次进入主 app 时触发 WatermelonDB sync，从后端拉取用户数据
  useEffect(() => {
    if (!isHydrating && session && !hasSynced.current) {
      hasSynced.current = true;
      syncManager.sync().catch((err) => {
        console.warn('[AppLayout] Initial sync failed, will retry later:', err);
      });
    }
  }, [isHydrating, session]);

  if (!isHydrating && !session) {
    return <Redirect href="/(auth)/phone-entry" />;
  }

  // 已登录但未完成 onboarding → 不允许进入主页
  if (!isHydrating && session && !session.user.onboardingCompletedAt) {
    return <Redirect href="/(onboarding)/personal-info" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
