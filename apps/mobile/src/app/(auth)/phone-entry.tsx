import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';

const COUNTRY_CODES = [
  { label: '+86 中国', value: '+86' },
  { label: '+61 澳大利亚', value: '+61' },
  { label: '+1 美国', value: '+1' },
  { label: '+44 英国', value: '+44' },
];

export default function PhoneEntry() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+86');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhoneNumber = `${countryCode}${phone.replace(/\s/g, '')}`;
  const isValidPhone = phone.replace(/\s/g, '').length >= 8;

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError('请输入有效的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: apiError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: fullPhoneNumber,
      });

      if (apiError) {
        setError(apiError.message ?? '发送验证码失败');
        return;
      }

      router.push({
        pathname: '/(auth)/code-verification' as const,
        params: { phone: fullPhoneNumber, countryCode },
      });
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          输入手机号
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          我们将发送验证码到你的手机
        </Text>

        <View style={styles.phoneRow}>
          <TextInput
            mode="outlined"
            label="区号"
            value={countryCode}
            onChangeText={setCountryCode}
            style={styles.countryCodeInput}
            keyboardType="phone-pad"
          />
          <TextInput
            mode="outlined"
            label="手机号"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError('');
            }}
            style={styles.phoneInput}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSendOtp}
          loading={loading}
          disabled={loading || !isValidPhone}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          发送验证码
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
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeInput: {
    width: 100,
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
