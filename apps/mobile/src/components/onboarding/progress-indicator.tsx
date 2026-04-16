/**
 * Progress Indicator Component
 * Shows step progress for onboarding flow
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { BORDER_RADIUS } from '@/constants/ui';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const stepLabel = t('onboarding.progress.step_label', {
    current: currentStep,
    total: totalSteps,
  });

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={stepLabel}>
      <Text variant="labelLarge" style={styles.label}>
        {stepLabel}
      </Text>
      <View style={styles.track}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber <= currentStep;

          return (
            <View
              key={stepNumber}
              style={[
                styles.segment,
                {
                  backgroundColor: isComplete ? theme.colors.primary : theme.colors.surfaceVariant,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
  },
  track: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    borderRadius: BORDER_RADIUS.ROUND,
    flex: 1,
    height: 8,
  },
});