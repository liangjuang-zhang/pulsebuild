import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { authClient } from '@/lib/auth-client';
import { resetDatabase } from '@/lib/database';
import { useAuthSession, useAuthSessionStore } from '@/stores/auth-session-store';

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const refreshSession = useAuthSessionStore((s) => s.refreshSession);

  const handleSignOut = async () => {
    try {
      // 1. 调用 Better Auth signOut（expo 插件会自动清理 SecureStore session 数据）
      await authClient.signOut();

      // 2. 清除本地 WatermelonDB 数据（离线数据存储，与 auth session 无关）
      await resetDatabase();

      console.log('[Profile] 退出登录完成');
    } catch (error) {
      console.error('[Profile] 退出登录错误:', error);

      // 3. 失败时的防御性清理 SecureStore（fallback）
      try {
        const SecureStore = require('expo-secure-store');
        // expo 插件使用的存储 key 格式: {storagePrefix}_session_data / _session_expiry
        await SecureStore.deleteItemAsync('pulsebuild_session_data');
        await SecureStore.deleteItemAsync('pulsebuild_session_expiry');
      } catch (e) {
        console.warn('[Profile] SecureStore fallback 清理失败:', e);
      }
    } finally {
      // 4. 刷新 auth store 状态（确保 Zustand store 同步）
      await refreshSession();

      // 5. 跳转登录页，禁止返回
      router.replace('/(auth)/phone-entry');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">个人中心</Text>

      {session?.user && (
        <View style={styles.info}>
          <Text variant="bodyLarge">姓名: {session.user.name}</Text>
          <Text variant="bodyMedium">邮箱: {session.user.email}</Text>
        </View>
      )}

      <Button mode="outlined" onPress={handleSignOut} style={styles.signOut}>
        退出登录
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  info: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  signOut: {
    marginTop: 32,
  },
});
