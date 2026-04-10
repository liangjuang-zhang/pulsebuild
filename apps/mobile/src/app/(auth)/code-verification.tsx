import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';

const RESEND_COOLDOWN = 60;

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export default function CodeVerification() {
  const router = useRouter();
  const { phone, countryCode } = useLocalSearchParams<{ phone: string; countryCode: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('请输入 6 位验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: apiError } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
      });

      if (apiError) {
        setError(apiError.message ?? '验证码错误');
        return;
      }

      // 登录成功，补充用户信息（时区、区号）
      await authClient.updateUser({
        timezone: getDeviceTimezone(),
        countryCode,
      });
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    setResending(true);
    setError('');

    try {
      const { error: apiError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });

      if (apiError) {
        setError(apiError.message ?? '重发失败');
        return;
      }

      setCountdown(RESEND_COOLDOWN);
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setResending(false);
    }
  }, [phone]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          输入验证码
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          验证码已发送到 {phone}
        </Text>

        <TextInput
          mode="outlined"
          label="验证码"
          value={code}
          onChangeText={(text) => {
            setCode(text.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.codeInput}
        />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={loading}
          disabled={loading || code.length !== 6}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          验证
        </Button>

        <Button
          mode="text"
          onPress={handleResend}
          disabled={countdown > 0 || resending}
          loading={resending}
          style={styles.resendButton}
        >
          {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  codeInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendButton: {
    marginTop: 12,
  },
});
