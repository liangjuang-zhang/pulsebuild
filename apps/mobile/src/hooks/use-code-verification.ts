/**
 * Code Verification Hook
 * Handles verification code logic for phone authentication
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
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

export function useCodeVerification() {
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const codeInputRef = useRef<any>(null);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => codeInputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Announce errors for screen reader
  useEffect(() => {
    if (error) {
      void announceForScreenReader(error);
    }
  }, [error]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      setError(t('onboarding.phone_verification.error_invalid_code'));
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(t('onboarding.phone_verification.status_verifying_code'));

    try {
      const { error: apiError } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
      });

      if (apiError) {
        throw new AuthError(
          apiError.message ?? t('onboarding.phone_verification.error_wrong_code'),
          AuthErrorCode.INVALID_CODE,
          true,
        );
      }

      setStatusMessage(t('onboarding.phone_verification.status_verification_successful'));
      void announceForScreenReader(t('onboarding.phone_verification.status_verification_successful'));

      // Update user timezone
      await authClient.updateUser({
        timezone: getDeviceTimezone(),
      });
    } catch (err) {
      let errorMsg = t('onboarding.phone_verification.error_generic');
      if (err instanceof AuthError) {
        errorMsg = err.message;
      } else if (err instanceof Error && isNetworkError(err)) {
        errorMsg = t('onboarding.phone_verification.error_connection');
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
    setStatusMessage(t('onboarding.phone_verification.status_sending_new_code'));

    try {
      const { error: apiError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });

      if (apiError) {
        throw new AuthError(
          apiError.message ?? t('onboarding.phone_verification.error_resend_failed'),
          AuthErrorCode.UNKNOWN_ERROR,
          true,
        );
      }

      setCountdown(RESEND_COOLDOWN);
      setStatusMessage(t('onboarding.phone_verification.status_new_code_sent'));
      void announceForScreenReader(t('onboarding.phone_verification.code_resent_announcement'));
    } catch (err) {
      let errorMsg = t('onboarding.phone_verification.error_resend_failed');
      if (err instanceof Error && isNetworkError(err)) {
        errorMsg = t('onboarding.phone_verification.error_connection');
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

  return {
    // State
    code,
    error,
    loading,
    resending,
    countdown,
    statusMessage,
    isVerifyDisabled: loading || code.length !== 6,
    isResendDisabled: countdown > 0 || resending,
    // Refs
    codeInputRef,
    // Handlers
    handleVerify,
    handleResend,
    handleCodeChange,
    // Params
    phone,
  };
}