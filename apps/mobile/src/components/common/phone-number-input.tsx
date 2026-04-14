/**
 * Phone Number Input - Combined country selector + phone input
 */
import type React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { BORDER_RADIUS, TOUCH_TARGET } from '@/constants/ui';
import { type PhoneCountryOption, getCountryFlag } from '@/lib/utils/phone-input';
import { AppTextInput } from './app-text-input';

export interface PhoneNumberInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  selectedCountry: PhoneCountryOption | null;
  onOpenCountrySelector: () => void;
  countrySelectAccessibilityLabel: string;
  countrySelectAccessibilityHint?: string;
  error?: boolean;
  keyboardType?: 'phone-pad' | 'default';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  editable?: boolean;
  style?: any;
}

export function PhoneNumberInput({
  label,
  value,
  onChangeText,
  selectedCountry,
  onOpenCountrySelector,
  countrySelectAccessibilityLabel,
  countrySelectAccessibilityHint,
  error = false,
  keyboardType = 'phone-pad',
  returnKeyType = 'done',
  onSubmitEditing,
  accessibilityLabel,
  accessibilityHint,
  editable = true,
  style,
}: PhoneNumberInputProps) {
  const theme = useTheme();
  const countryButtonLabel = selectedCountry
    ? `${getCountryFlag(selectedCountry.code)} ${selectedCountry.callingCode}`
    : '选择国家';

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
          {label}
        </Text>
      )}

      <View style={styles.phoneInputRow}>
        <Button
          mode="outlined"
          style={styles.countryButton}
          contentStyle={styles.countryButtonContent}
          onPress={onOpenCountrySelector}
          disabled={!editable}
          accessibilityLabel={countrySelectAccessibilityLabel}
          accessibilityHint={countrySelectAccessibilityHint}
        >
          {countryButtonLabel}
        </Button>

        <AppTextInput
          mode="outlined"
          value={value}
          onChangeText={onChangeText}
          error={error}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          editable={editable}
          style={[styles.phoneInput, style]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryButton: {
    minWidth: 100,
    borderRadius: BORDER_RADIUS.LG,
  },
  countryButtonContent: {
    height: TOUCH_TARGET.XL,
  },
  phoneInput: {
    flex: 1,
  },
});