/**
 * Notifications Screen - Step 3 of Onboarding
 * Requests notification permission from user
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Surface, Text, useTheme } from 'react-native-paper';
import { OnboardingLayout } from '@/components/onboarding';
import { BORDER_RADIUS } from '@/constants/ui';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { useOnlineAccess } from '@/hooks/use-online-access';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const setNotifications = useOnboardingStore((state) => state.setNotifications);
  const markStepSkipped = useOnboardingStore((state) => state.markStepSkipped);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const { currentStep, totalSteps } = useOnboardingProgress(3);
  const onboardingAccess = useOnlineAccess('onboarding');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benefits = useMemo(() => {
    return t('onboarding.notifications.benefits', { returnObjects: true }) as string[];
  }, [t]);

  useEffect(() => {
    setCurrentStep(currentStep);
  }, [currentStep, setCurrentStep]);

  useEffect(() => {
    if (error) {
      void announceForScreenReader(error);
    }
  }, [error]);

  const goToNextStep = useCallback(() => {
    router.push('/welcome' as any);
  }, [router]);

  const handleEnableNotifications = useCallback(async () => {
    setError(null);
    setIsRequestingPermission(true);

    try {
      // Note: Push notification service will be implemented later
      // For now, just proceed with notifications enabled
      setNotifications(true);
      goToNextStep();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : t('onboarding.notifications.permission_request_error');
      setError(message);
      setNotifications(false);
      goToNextStep();
    } finally {
      setIsRequestingPermission(false);
    }
  }, [goToNextStep, setNotifications, t]);

  const handleSkip = useCallback(() => {
    setNotifications(false);
    markStepSkipped(currentStep);
    goToNextStep();
  }, [currentStep, goToNextStep, markStepSkipped, setNotifications]);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      onlineNoticeTitle={onboardingAccess.isOffline ? onboardingAccess.title : null}
      onlineNoticeMessage={onboardingAccess.isOffline ? onboardingAccess.message : null}
      onBack={() => router.back()}
      onNext={handleSkip}
      nextButtonLabel={t('onboarding.layout.skip_for_now')}
      showSkip={false}
      nextButtonDisabled={isRequestingPermission}
    >
      <View style={styles.content}>
        <Surface
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
          ]}
          elevation={0}
        >
          <View style={styles.benefits}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Icon source="check-circle" size={18} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.benefitText}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={() => void handleEnableNotifications()}
          loading={isRequestingPermission}
          disabled={isRequestingPermission}
          icon="bell-ring"
          accessibilityLabel={t('onboarding.notifications.enable_button')}
        >
          {isRequestingPermission
            ? t('onboarding.notifications.enabling')
            : t('onboarding.notifications.enable_button')}
        </Button>

        {error ? (
          <Text style={{ color: theme.colors.error }} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  card: {
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    padding: 14,
  },
  benefits: {
    gap: 10,
  },
  benefitRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    lineHeight: 20,
  },
});