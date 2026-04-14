/**
 * Phone Country Dialog - Country selector bottom sheet
 */
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { BottomSheet } from './bottom-sheet';
import { PHONE_COUNTRY_OPTIONS, type PhoneCountryOption, getCountryFlag } from '@/lib/utils/phone-input';

const COUNTRY_NAMES: Record<string, string> = {
  CN: '中国',
  AU: '澳大利亚',
  US: '美国',
  CA: '加拿大',
  GB: '英国',
  NZ: '新西兰',
  SG: '新加坡',
  IN: '印度',
};

export interface PhoneCountryDialogProps {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  onSelectPhoneCountry: (option: PhoneCountryOption) => void;
  selectedPhoneCountry: PhoneCountryOption | null;
}

export function PhoneCountryDialog({
  visible,
  title,
  onDismiss,
  onSelectPhoneCountry,
  selectedPhoneCountry,
}: PhoneCountryDialogProps) {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} title={title} onDismiss={onDismiss}>
      <View style={styles.list}>
        {PHONE_COUNTRY_OPTIONS.map((option) => {
          const isSelected = option.code === selectedPhoneCountry?.code;
          const flag = getCountryFlag(option.code);
          const countryName = COUNTRY_NAMES[option.code] ?? option.code;

          return (
            <Pressable
              key={option.code}
              style={({ pressed }) => [
                styles.item,
                isSelected && { backgroundColor: theme.colors.primaryContainer },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onSelectPhoneCountry(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${countryName} ${option.callingCode}`}
            >
              <Text style={styles.flag}>{flag}</Text>
              <Text style={[styles.countryName, { color: theme.colors.onSurface }]}>
                {countryName}
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{option.callingCode}</Text>
              {isSelected && <Icon source="check" size={18} color={theme.colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 8,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  flag: {
    fontSize: 24,
    lineHeight: 30,
  },
  countryName: {
    flex: 1,
    fontWeight: '500',
  },
});