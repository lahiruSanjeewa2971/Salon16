import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemedInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
  inputStyle,
  ...props
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = () => ({
    marginBottom: spacing.md,
  });

  const getLabelStyle = () => ({
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  });

  const getInputStyle = () => ({
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: error ? colors.inputError : isFocused ? colors.inputFocus : colors.inputBorder,
    borderRadius: borderRadius.input.medium,
    paddingVertical: spacing.input.vertical,
    paddingHorizontal: spacing.input.horizontal,
    fontSize: 16,
    color: colors.text,
    opacity: disabled ? 0.6 : 1,
    minHeight: multiline ? 80 : 44,
    textAlignVertical: multiline ? 'top' : 'center',
  });

  const getErrorStyle = () => ({
    ...typography.captionMD,
    color: colors.error,
    marginTop: spacing.xs,
  });

  return (
    <View style={[getContainerStyle(), style]}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <TextInput
        style={[getInputStyle(), inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        {...props}
      />
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
}

export default ThemedInput;
