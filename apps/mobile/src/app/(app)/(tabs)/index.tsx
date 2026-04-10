import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { trpc } from '@/lib/trpc';

export default function ProjectsScreen() {
  const { data, isLoading } = trpc.health.check.useQuery();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">项目列表</Text>
      {isLoading ? (
        <Text>加载中...</Text>
      ) : data ? (
        <Text variant="bodyMedium">
          服务器状态: {data.status} | {new Date(data.timestamp).toLocaleString()}
        </Text>
      ) : null}
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
});
