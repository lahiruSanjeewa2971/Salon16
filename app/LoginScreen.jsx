import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { ThemedButton } from '../components/themed/ThemedButton';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const handleBackToWelcome = () => {
    router.back();
  };

  const handleLogin = () => {
    // TODO: Implement actual login logic
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Login
        </ThemedText>
        
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Welcome back to Salon 16
        </ThemedText>

        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Login (Coming Soon)"
            onPress={handleLogin}
            variant="primary"
            size="large"
            style={styles.button}
          />
          
          <ThemedButton
            title="Back to Welcome"
            onPress={handleBackToWelcome}
            variant="outline"
            size="large"
            style={styles.button}
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: 16,
  },
});
