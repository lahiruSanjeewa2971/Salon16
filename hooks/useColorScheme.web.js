import { useColorScheme as _useColorScheme } from 'react-native';
import { useColorScheme as _useColorSchemeWeb } from 'use-color-scheme';

export function useColorScheme() {
  return _useColorSchemeWeb() ?? _useColorScheme();
}
