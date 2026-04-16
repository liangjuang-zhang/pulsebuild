/**
 * Code Verification Hook
 * Handles verification code logic for phone authentication
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import { isNetworkError } from '@/lib/utils/network-error';
import { authClient } from '@/lib/auth-client';
import { useAuthSessionStore } from '@/stores/auth-session-store';
import { syncDatabase } from '@/lib/database/sync-manager';

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
  const refreshSession = useAuthSessionStore((s) => s.refreshSession);

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
        setError(apiError.message ?? t('onboarding.phone_verification.error_wrong_code'));
        setStatusMessage(null);
        setLoading(false);
        return;
      }

      setStatusMessage(t('onboarding.phone_verification.status_verification_successful'));
      void announceForScreenReader(t('onboarding.phone_verification.status_verification_successful'));

      // Update user timezone
      await authClient.updateUser({
        timezone: getDeviceTimezone(),
      });

      // 执行 sync pull，从服务器获取用户数据写入本地
      // 这样用户记录会有正确的 _status: synced
      try {
        await syncDatabase();
        console.log('[CodeVerification] Sync completed after login');
      } catch (syncError) {
        console.warn('[CodeVerification] Sync failed after login:', syncError);
      }

      // 刷新 store，触发路由跳转
      await refreshSession();
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
        setError(apiError.message ?? t('onboarding.phone_verification.error_resend_failed'));
        setStatusMessage(null);
        setResending(false);
        return;
      }

      setCountdown(RESEND_COOLDOWN);
      setStatusMessage(t('onboarding.phone_verification.status_new_code_sent'));
      void announceForScreenReader(t('onboarding.phone_verification.code_resent_announcement'));
    } catch (err) {
      const errorMsg = err instanceof Error && isNetworkError(err)
        ? t('onboarding.phone_verification.error_connection')
        : err instanceof Error
          ? err.message
          : t('onboarding.phone_verification.error_resend_failed');
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