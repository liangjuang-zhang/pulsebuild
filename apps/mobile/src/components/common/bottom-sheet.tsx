/**
 * Bottom Sheet - Simple modal bottom sheet
 */
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BORDER_RADIUS, SPACING } from '@/constants/ui';

export interface BottomSheetProps {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, title, onDismiss, children }: BottomSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.header}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {title}
            </Text>
            <Pressable onPress={onDismiss} style={styles.closeButton}>
              <Text style={{ color: theme.colors.primary }}>关闭</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderRadius: BORDER_RADIUS.SHEET,
    paddingTop: SPACING.XXL,
    paddingBottom: SPACING.XXL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.XXL,
    paddingBottom: SPACING.MD,
  },
  closeButton: {
    padding: SPACING.SM,
  },
});