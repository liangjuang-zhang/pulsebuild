/**
 * Welcome Screen - Step 4 (Final) of Onboarding
 * Shows next steps and feature highlights, completes onboarding
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { FeatureHighlight, OnboardingLayout } from '@/components/onboarding';
import { useToast } from '@/components/toast';
import { BORDER_RADIUS } from '@/constants/ui';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { useOnlineAccess } from '@/hooks/use-online-access';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthSession, useAuthSessionStore } from '@/stores/auth-session-store';

// Default path after onboarding completion
const DEFAULT_PATH = '/(app)/(tabs)';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation();

  // Get session from auth store
  const { session } = useAuthSession();
  const authUser = session?.user;
  const refreshSession = useAuthSessionStore((s) => s.refreshSession);

  const personalInfo = useOnboardingStore((state) => state.personalInfo);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const isCompleting = useOnboardingStore((state) => state.isCompleting);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const { currentStep, totalSteps } = useOnboardingProgress(4);
  const onboardingAccess = useOnlineAccess('onboarding');
  const [completionError, setCompletionError] = useState<string | null>(null);

  const displayName =
    personalInfo.name.trim() || authUser?.name || t('onboarding.welcome.fallback_name');

  const nextSteps = useMemo(
    () => t('onboarding.welcome.generic_next_steps', { returnObjects: true }) as string[],
    [t],
  );

  const featureHighlights = useMemo(
    () =>
      t('onboarding.welcome.feature_highlights', { returnObjects: true }) as {
        icon: string;
        title: string;
        description: string;
      }[],
    [t],
  );

  useEffect(() => {
    setCurrentStep(currentStep);
  }, [currentStep, setCurrentStep]);

  useEffect(() => {
    if (completionError) {
      void announceForScreenReader(completionError);
    }
  }, [completionError]);

  const handleGetStarted = useCallback(async () => {
    if (!authUser?.id || isCompleting) {
      return;
    }

    setCompletionError(null);

    if (!onboardingAccess.requireOnline((message) => setCompletionError(message))) {
      return;
    }

    try {
      await completeOnboarding();
      // 刷新 session，确保 onboardingCompletedAt 已更新
      await refreshSession();
      router.replace(DEFAULT_PATH);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('onboarding.welcome.completion_error');
      setCompletionError(message);
      toast.error(message);
    }
  }, [authUser?.id, completeOnboarding, isCompleting, onboardingAccess, refreshSession, router, t, toast]);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('onboarding.welcome.title', { name: displayName })}
      subtitle={t('onboarding.welcome.subtitle')}
      onlineNoticeTitle={onboardingAccess.isOffline ? onboardingAccess.title : null}
      onlineNoticeMessage={onboardingAccess.isOffline ? onboardingAccess.message : null}
      onNext={handleGetStarted}
      nextButtonLabel={t('onboarding.layout.get_started_button')}
      nextButtonDisabled={!authUser?.id || isCompleting || onboardingAccess.isOffline}
      nextButtonLoading={isCompleting}
      showBack={false}
      showSkip={false}
    >
      <View style={styles.content}>
        <Surface
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
          ]}
          elevation={0}
        >
          <Text variant="titleMedium" style={styles.cardTitle}>
            {t('onboarding.welcome.next_up')}
          </Text>
          <View style={styles.steps}>
            {nextSteps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <Icon source="arrow-right-circle" size={18} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.stepText}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        <View style={styles.highlightSection}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {t('onboarding.welcome.feature_highlights_title')}
          </Text>
          {featureHighlights.map((highlight) => (
            <FeatureHighlight
              key={highlight.title}
              icon={highlight.icon}
              title={highlight.title}
              description={highlight.description}
            />
          ))}
        </View>

        {completionError ? (
          <Text style={{ color: theme.colors.error }} accessibilityLiveRegion="polite">
            {completionError}
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
  cardTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  steps: {
    gap: 10,
  },
  highlightSection: {
    gap: 12,
  },
  stepRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
});