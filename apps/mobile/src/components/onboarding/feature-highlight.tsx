/**
 * Feature Highlight Component
 * Displays feature highlights in onboarding welcome screen
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { BORDER_RADIUS } from '@/constants/ui';

interface FeatureHighlightProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureHighlight({ icon, title, description }: FeatureHighlightProps) {
  const theme = useTheme();

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.iconWrapper}>
        <Icon source={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.content}>
        <Text variant="titleSmall" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.description}>
          {description}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.MD,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 32,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '700',
  },
  description: {
    lineHeight: 18,
  },
});