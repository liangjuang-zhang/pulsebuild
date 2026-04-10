import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function MyWorkScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">我的工作</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        待开发：显示分配给我的任务
      </Text>
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
  placeholder: {
    marginTop: 12,
    opacity: 0.6,
  },
});
