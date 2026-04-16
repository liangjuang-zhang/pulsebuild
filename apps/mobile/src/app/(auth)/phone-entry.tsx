/**
 * Phone Entry Screen
 * Internationalized phone number entry with country selector
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneCountryDialog, PhoneNumberInput } from '@/components/common';
import { TOUCH_TARGET } from '@/constants/ui';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import { isNetworkError } from '@/lib/utils/network-error';
import {
  PHONE_COUNTRY_OPTIONS,
  type PhoneCountryOption,
  formatPhoneInput,
  normalizePhoneNumberForSubmission,
} from '@/lib/utils/phone-input';
import { authClient } from '@/lib/auth-client';

export default function PhoneEntryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const horizontalPadding = isLandscape ? 28 : 20;
  const maxContentWidth = isLandscape ? 760 : 560;

  const [phoneInput, setPhoneInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [countryDialogVisible, setCountryDialogVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountryOption>(
    PHONE_COUNTRY_OPTIONS[0],
  );

  // 组件挂载时清理任何残留状态
  useEffect(() => {
    setPhoneInput('');
    setError(null);
    setStatusMessage(null);
    setLoading(false);
  }, []);

  const inputBackgroundColor = theme.dark ? '#1E1E1E' : '#FFFFFF';

  const phoneAccessibilityHint = useMemo(
    () =>
      t('onboarding.onboarding.phone_verification.phone_accessibility_hint_with_country', {
        callingCode: selectedCountry.callingCode,
        localExample: selectedCountry.exampleLocal,
        internationalExample: selectedCountry.exampleInternational,
      }),
    [selectedCountry, t],
  );

  useEffect(() => {
    if (error) {
      void announceForScreenReader(error);
    }
  }, [error]);

  const handlePhoneChange = useCallback((text: string) => {
    if (error) setError(null);
    setPhoneInput(formatPhoneInput(text));
  }, [error]);

  const handleSubmit = useCallback(async () => {
    const normalizedPhone = normalizePhoneNumberForSubmission(phoneInput, selectedCountry);

    if (!normalizedPhone) {
      setError(t('onboarding.phone_verification.error_invalid_phone'));
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(t('onboarding.phone_verification.status_sending_verification_code'));

    try {
      const { error: apiError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: normalizedPhone,
      });

      if (apiError) {
        setError(apiError.message ?? t('onboarding.phone_verification.error_send_failed'));
        setStatusMessage(null);
        return;
      }

      setStatusMessage(t('onboarding.phone_verification.status_verification_code_sent'));
      void announceForScreenReader(t('onboarding.phone_verification.code_sent_announcement'));

      router.push({
        pathname: '/(auth)/code-verification' as const,
        params: { phone: normalizedPhone },
      });
    } catch (err) {
      const errorMsg = err instanceof Error && isNetworkError(err)
        ? t('onboarding.phone_verification.error_connection')
        : err instanceof Error
          ? err.message
          : t('onboarding.phone_verification.error_generic');
      setError(errorMsg);
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }, [phoneInput, selectedCountry, t]);

  const normalizedPhone = normalizePhoneNumberForSubmission(phoneInput, selectedCountry);
  const isSubmitDisabled = loading || !normalizedPhone;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {t('onboarding.phone_verification.title')}
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {t('onboarding.phone_verification.subtitle')}
              </Text>
            </View>

            <View style={styles.content}>
              {statusMessage && (
                <Text style={styles.statusMessage}>{statusMessage}</Text>
              )}

              <PhoneNumberInput
                label={t('onboarding.phone_verification.phone_label')}
                selectedCountry={selectedCountry}
                onOpenCountrySelector={() => setCountryDialogVisible(true)}
                countrySelectAccessibilityLabel={t('onboarding.phone_verification.country_select_accessibility_label')}
                countrySelectAccessibilityHint={t('onboarding.phone_verification.country_select_accessibility_hint')}
                value={phoneInput}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                accessibilityLabel={t('onboarding.phone_verification.phone_accessibility_label')}
                accessibilityHint={error ? t('onboarding.phone_verification.input_error_hint', { error }) : phoneAccessibilityHint}
                error={Boolean(error)}
                editable={!loading}
                style={{ backgroundColor: inputBackgroundColor }}
              />

              {error && (
                <Text
                  style={[styles.errorText, { color: theme.colors.error }]}
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                >
                  {error}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <PhoneCountryDialog
          title={t('onboarding.phone_verification.country_label')}
          visible={countryDialogVisible}
          onDismiss={() => setCountryDialogVisible(false)}
          onSelectPhoneCountry={(option) => {
            setSelectedCountry(option);
            setCountryDialogVisible(false);
          }}
          selectedPhoneCountry={selectedCountry}
        />

        <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={[styles.contentWrapper, styles.footerInner, { maxWidth: maxContentWidth }]}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              loading={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              accessibilityLabel={loading ? t('onboarding.phone_verification.sending_code') : t('onboarding.phone_verification.send_code_button')}
              accessibilityHint={t('onboarding.phone_verification.send_code_accessibility_hint')}
            >
              {loading ? t('onboarding.phone_verification.sending_code') : t('onboarding.phone_verification.send_code_button')}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24, paddingTop: 40 },
  contentWrapper: { alignSelf: 'center', width: '90%' },
  header: { gap: 8, marginBottom: 32 },
  title: { fontWeight: '700' },
  subtitle: { lineHeight: 20 },
  content: { gap: 16 },
  statusMessage: { marginBottom: 12, fontStyle: 'italic' },
  errorText: { marginTop: 6 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  footerInner: { paddingBottom: 4 },
  submitButton: { minHeight: TOUCH_TARGET.MIN },
  submitButtonContent: { minHeight: TOUCH_TARGET.MIN },
});