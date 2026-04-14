import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';
import { TextInput as PaperTextInput, type TextInputProps } from 'react-native-paper';

export interface AppTextInputProps extends TextInputProps {
  hidePlaceholderOnFocus?: boolean;
}

type AppTextInputComponent = React.ForwardRefExoticComponent<
  AppTextInputProps & React.RefAttributes<React.ComponentRef<typeof PaperTextInput>>
> & {
  Icon: typeof PaperTextInput.Icon;
  Affix: typeof PaperTextInput.Affix;
};

type AppTextInputHandle = React.ComponentRef<typeof PaperTextInput>;
type InternalTextInputHandle = NativeTextInput & AppTextInputHandle;

const AppTextInputBase = forwardRef<AppTextInputHandle, AppTextInputProps>(
  ({ hidePlaceholderOnFocus = true, placeholder, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<InternalTextInputHandle | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => inputRef.current?.clear(),
        blur: () => inputRef.current?.blur(),
        isFocused: () => inputRef.current?.isFocused() ?? false,
        setNativeProps: (nativeProps: Parameters<AppTextInputHandle['setNativeProps']>[0]) => {
          inputRef.current?.setNativeProps(nativeProps);
        },
        setSelection: (...args: Parameters<AppTextInputHandle['setSelection']>) => {
          inputRef.current?.setSelection(...args);
        },
      }),
      [],
    );

    const handleFocus = useCallback(
      (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        setIsFocused(true);
        onFocus?.(event);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        setIsFocused(false);
        onBlur?.(event);
      },
      [onBlur],
    );

    return (
      <PaperTextInput
        {...props}
        ref={inputRef}
        placeholder={hidePlaceholderOnFocus && isFocused ? undefined : placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  },
);

AppTextInputBase.displayName = 'AppTextInput';

export const AppTextInput = AppTextInputBase as AppTextInputComponent;
AppTextInput.Icon = PaperTextInput.Icon;
AppTextInput.Affix = PaperTextInput.Affix;
