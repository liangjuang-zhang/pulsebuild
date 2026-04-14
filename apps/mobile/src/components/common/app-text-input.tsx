/**
 * App TextInput - Styled text input wrapper
 */
import type React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export interface AppTextInputProps extends React.ComponentProps<typeof TextInput> {
  mode?: 'outlined' | 'flat';
  error?: boolean;
  label?: string;
}

export function AppTextInput({
  mode = 'outlined',
  error,
  style,
  ...props
}: AppTextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      style={[
        styles.input,
        {
          borderColor: error ? theme.colors.error : theme.colors.outline,
          backgroundColor: theme.dark ? '#1E1E1E' : '#FFFFFF',
          color: theme.colors.onSurface,
        },
        style,
      ]}
      placeholderTextColor={theme.colors.onSurfaceVariant}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});