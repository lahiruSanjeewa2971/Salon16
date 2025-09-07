import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '../components/themed/ThemedButton';
import { useTheme } from '../contexts/ThemeContext';

export default function TestScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        ✅ App is Working!
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Theme system is loaded correctly
      </Text>
      
      <ThemedButton
        title="Open Debug Screen"
        onPress={() => router.push('/DebugScreen')}
        variant="primary"
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
