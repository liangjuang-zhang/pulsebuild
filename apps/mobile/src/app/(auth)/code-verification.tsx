/**
 * Code Verification Screen
 * Internationalized verification code entry
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOUCH_TARGET } from '@/constants/ui';
import { AuthError, AuthErrorCode } from '@/lib/types/auth-errors';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import { isNetworkError } from '@/lib/utils/network-error';
import { authClient } from '@/lib/auth-client';

const RESEND_COOLDOWN = 60;

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export default function CodeVerificationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const codeInputRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => codeInputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (error) {
      void announceForScreenReader(error);
    }
  }, [error]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      setError(t('phone_verification.error_invalid_code'));
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(t('phone_verification.status_verifying_code'));

    try {
      const { error: apiError } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
      });

      if (apiError) {
        throw new AuthError(
          apiError.message ?? t('phone_verification.error_wrong_code'),
          AuthErrorCode.INVALID_CODE,
          true,
        );
      }

      setStatusMessage(t('phone_verification.status_verification_successful'));
      void announceForScreenReader(t('phone_verification.status_verification_successful'));

      // Update user timezone
      await authClient.updateUser({
        timezone: getDeviceTimezone(),
      });
    } catch (err) {
      let errorMsg = t('phone_verification.error_generic');
      if (err instanceof AuthError) {
        errorMsg = err.message;
      } else if (err instanceof Error && isNetworkError(err)) {
        errorMsg = t('phone_verification.error_connection');
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  }, [code, phone, t]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError(null);
    setStatusMessage(t('phone_verification.status_sending_new_code'));

    try {
      const { error: apiError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });

      if (apiError) {
        throw new AuthError(
          apiError.message ?? t('phone_verification.error_resend_failed'),
          AuthErrorCode.UNKNOWN_ERROR,
          true,
        );
      }

      setCountdown(RESEND_COOLDOWN);
      setStatusMessage(t('phone_verification.status_new_code_sent'));
      void announceForScreenReader(t('phone_verification.code_resent_announcement'));
    } catch (err) {
      let errorMsg = t('phone_verification.error_resend_failed');
      if (err instanceof Error && isNetworkError(err)) {
        errorMsg = t('phone_verification.error_connection');
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setStatusMessage(null);
    } finally {
      setResending(false);
    }
  }, [phone, t]);

  const handleCodeChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  }, [error]);

  const isVerifyDisabled = loading || code.length !== 6;
  const isResendDisabled = countdown > 0 || resending;

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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {t('phone_verification.enter_code_title')}
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {t('phone_verification.code_sent_to_phone', {
                  phone: phone ?? t('phone_verification.fallback_phone'),
                })}
              </Text>
            </View>

            <View style={styles.content}>
              {statusMessage && (
                <Text style={styles.statusMessage}>{statusMessage}</Text>
              )}

              <TextInput
                ref={codeInputRef}
                mode="outlined"
                label={t('phone_verification.code_label')}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                error={Boolean(error)}
                style={styles.codeInput}
                placeholder={t('phone_verification.code_placeholder')}
                editable={!loading}
                accessibilityLabel={t('phone_verification.code_accessibility_label')}
                accessibilityHint={t('phone_verification.code_accessibility_hint')}
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

        <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={styles.footerInner}>
            <Button
              mode="contained"
              onPress={handleVerify}
              disabled={isVerifyDisabled}
              loading={loading}
              style={styles.verifyButton}
              contentStyle={styles.buttonContent}
              accessibilityLabel={loading ? t('phone_verification.verifying') : t('phone_verification.verify_button')}
              accessibilityHint={t('phone_verification.verify_accessibility_hint')}
            >
              {loading ? t('phone_verification.verifying') : t('phone_verification.verify_button')}
            </Button>

            <Button
              mode="text"
              onPress={handleResend}
              disabled={isResendDisabled}
              loading={resending}
              style={styles.resendButton}
              accessibilityLabel={
                countdown > 0
                  ? t('phone_verification.resend_accessibility_wait', { seconds: countdown })
                  : t('phone_verification.resend_accessibility_ready')
              }
              accessibilityHint={t('phone_verification.resend_accessibility_hint')}
            >
              {countdown > 0
                ? t('phone_verification.resend_in', { seconds: countdown })
                : t('phone_verification.resend_button')}
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
  scrollContent: { paddingBottom: 24, paddingTop: 40, paddingHorizontal: 20 },
  contentWrapper: { alignSelf: 'center', width: '100%', maxWidth: 560 },
  header: { gap: 8, marginBottom: 32 },
  title: { fontWeight: '700' },
  subtitle: { lineHeight: 20 },
  content: { gap: 16 },
  statusMessage: { marginBottom: 12, fontStyle: 'italic' },
  codeInput: { fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  errorText: { marginTop: 6 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  footerInner: { paddingHorizontal: 20, gap: 8 },
  verifyButton: { minHeight: TOUCH_TARGET.MIN },
  buttonContent: { minHeight: TOUCH_TARGET.MIN },
  resendButton: { marginTop: 4 },
});