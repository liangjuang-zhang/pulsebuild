/**
 * Online Required Notice Component
 * Displays a notice when network connectivity is required
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { BORDER_RADIUS } from '@/constants/ui';

export interface OnlineRequiredNoticeProps {
  title: string;
  message: string;
  variant?: 'blocking' | 'passive';
  testID?: string;
}

export function OnlineRequiredNotice({
  title,
  message,
  variant = 'blocking',
  testID = 'online-required-notice',
}: OnlineRequiredNoticeProps) {
  const theme = useTheme();
  const isBlocking = variant === 'blocking';
  const borderColor = isBlocking
    ? theme.colors.primary
    : (theme.colors.outlineVariant ?? theme.colors.outline);
  const iconColor = isBlocking
    ? theme.colors.primary
    : (theme.colors.onSurfaceVariant ?? theme.colors.outline);

  return (
    <Surface
      elevation={0}
      style={[styles.container, { backgroundColor: theme.colors.surface, borderColor }]}
      testID={testID}
      accessibilityRole="alert"
    >
      <View style={styles.row}>
        <Icon source={isBlocking ? 'wifi-alert' : 'wifi-off'} size={20} color={iconColor} />
        <View style={styles.copy}>
          <Text variant={isBlocking ? 'titleSmall' : 'labelLarge'} style={styles.title}>
            {title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {message}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    padding: 12,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '600',
  },
});