import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { authClient } from '@/lib/auth-client';

export default function ProfileScreen() {
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
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
