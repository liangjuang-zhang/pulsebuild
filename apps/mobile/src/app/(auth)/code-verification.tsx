/**
 * Code Verification Screen
 * Internationalized verification code entry
 */
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOUCH_TARGET } from '@/constants/ui';
import { useCodeVerification } from '@/hooks/use-code-verification';

export default function CodeVerificationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const {
    code,
    error,
    loading,
    countdown,
    statusMessage,
    isVerifyDisabled,
    isResendDisabled,
    codeInputRef,
    handleVerify,
    handleResend,
    handleCodeChange,
    phone,
  } = useCodeVerification();

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
                {t('onboarding.phone_verification.enter_code_title')}
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {t('onboarding.phone_verification.code_sent_to_phone', {
                  phone: phone ?? t('onboarding.phone_verification.fallback_phone'),
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
                label={t('onboarding.phone_verification.code_label')}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                error={Boolean(error)}
                style={styles.codeInput}
                placeholderTextColor='#64676abc'
                placeholder={t('onboarding.phone_verification.code_placeholder')}
                editable={!loading}
                accessibilityLabel={t('onboarding.phone_verification.code_accessibility_label')}
                accessibilityHint={t('onboarding.phone_verification.code_accessibility_hint')}
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
              accessibilityLabel={
                loading
                  ? t('onboarding.phone_verification.verifying')
                  : t('onboarding.phone_verification.verify_button')
              }
              accessibilityHint={t('onboarding.phone_verification.verify_accessibility_hint')}
            >
              {loading
                ? t('onboarding.phone_verification.verifying')
                : t('onboarding.phone_verification.verify_button')}
            </Button>

            <Button
              mode="text"
              onPress={handleResend}
              disabled={isResendDisabled}
              style={styles.resendButton}
              accessibilityLabel={
                countdown > 0
                  ? t('onboarding.phone_verification.resend_accessibility_wait', { seconds: countdown })
                  : t('onboarding.phone_verification.resend_accessibility_ready')
              }
              accessibilityHint={t('onboarding.phone_verification.resend_accessibility_hint')}
            >
              {countdown > 0
                ? t('onboarding.phone_verification.resend_in', { seconds: countdown })
                : t('onboarding.phone_verification.resend_button')}
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
  codeInput: { fontSize: 24, textAlign: 'center', letterSpacing: 8 ,  },
  errorText: { marginTop: 6 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  footerInner: { paddingHorizontal: 20, gap: 8 },
  verifyButton: { minHeight: TOUCH_TARGET.MIN },
  buttonContent: { minHeight: TOUCH_TARGET.MIN },
  resendButton: { marginTop: 4 },
});