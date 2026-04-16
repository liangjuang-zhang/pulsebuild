/**
 * Onboarding Layout Component
 * Provides consistent layout for onboarding screens with progress, navigation buttons
 */
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnlineRequiredNotice } from '@/components/common/online-required-notice';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { TOUCH_TARGET } from '@/constants/ui';
import { announceForScreenReader } from '@/lib/utils/accessibility';

const FOOTER_SCROLL_PADDING = 24;

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onNext?: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  nextButtonLabel?: string;
  nextButtonDisabled?: boolean;
  nextButtonLoading?: boolean;
  showSkip?: boolean;
  showBack?: boolean;
  showProgress?: boolean;
  onlineNoticeTitle?: string | null;
  onlineNoticeMessage?: string | null;
  onlineNoticeVariant?: 'blocking' | 'passive';
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  onNext,
  onSkip,
  onBack,
  nextButtonLabel,
  nextButtonDisabled = false,
  nextButtonLoading = false,
  showSkip = true,
  showBack = true,
  showProgress = true,
  onlineNoticeTitle,
  onlineNoticeMessage,
  onlineNoticeVariant = 'blocking',
  contentContainerStyle,
}: OnboardingLayoutProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [footerHeight, setFooterHeight] = useState(0);
  const isLandscape = width > height;
  const horizontalPadding = isLandscape ? 28 : 20;
  const maxContentWidth = isLandscape ? 760 : 560;
  const resolvedNextButtonLabel = nextButtonLabel ?? t('onboarding.layout.next_button');

  useEffect(() => {
    if (!showProgress) {
      return;
    }

    void announceForScreenReader(
      t('onboarding.layout.step_announcement', {
        current: currentStep,
        total: totalSteps,
        title,
      }),
    );
  }, [currentStep, showProgress, t, title, totalSteps]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: FOOTER_SCROLL_PADDING + footerHeight,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={footerHeight > 0 ? { bottom: footerHeight } : undefined}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
            {showProgress ? (
              <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
            ) : null}

            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            {onlineNoticeTitle && onlineNoticeMessage ? (
              <OnlineRequiredNotice
                title={onlineNoticeTitle}
                message={onlineNoticeMessage}
                variant={onlineNoticeVariant}
              />
            ) : null}

            <View style={[styles.content, contentContainerStyle]}>{children}</View>
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}
          onLayout={(event) => {
            setFooterHeight(event.nativeEvent.layout.height);
          }}
        >
          <View
            style={[
              styles.contentWrapper,
              styles.footerInner,
              { maxWidth: maxContentWidth, paddingHorizontal: horizontalPadding },
            ]}
          >
            <View style={styles.secondaryButtons}>
              {showBack && onBack ? (
                <Button
                  mode="text"
                  onPress={onBack}
                  accessibilityLabel={t('onboarding.layout.back_accessibility_label')}
                  accessibilityHint={t('onboarding.layout.back_accessibility_hint')}
                >
                  {t('common.back')}
                </Button>
              ) : (
                <View />
              )}
              {showSkip && onSkip ? (
                <Button
                  mode="text"
                  onPress={onSkip}
                  accessibilityLabel={t('onboarding.layout.skip_accessibility_label')}
                  accessibilityHint={t('onboarding.layout.skip_accessibility_hint')}
                >
                  {t('onboarding.layout.skip_button')}
                </Button>
              ) : null}
            </View>

            {onNext ? (
              <Button
                mode="contained"
                onPress={onNext}
                disabled={nextButtonDisabled}
                loading={nextButtonLoading}
                style={styles.nextButton}
                contentStyle={styles.nextButtonContent}
                accessibilityLabel={resolvedNextButtonLabel}
                accessibilityHint={t('onboarding.layout.next_accessibility_hint')}
              >
                {resolvedNextButtonLabel}
              </Button>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 20,
  },
  contentWrapper: {
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 20,
  },
  content: {
    gap: 16,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  footerInner: {
    paddingBottom: 4,
  },
  secondaryButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: TOUCH_TARGET.MIN,
  },
  nextButton: {
    minHeight: TOUCH_TARGET.MIN,
  },
  nextButtonContent: {
    minHeight: TOUCH_TARGET.MIN,
  },
});