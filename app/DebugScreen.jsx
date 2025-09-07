import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { ThemedButton } from '../components/themed/ThemedButton';
import { useTheme } from '../contexts/ThemeContext';

// Global error storage
let errorLogs = [];

// Override console.error to capture errors
const originalConsoleError = console.error;
console.error = (...args) => {
  errorLogs.push({
    timestamp: new Date().toISOString(),
    message: args.join(' '),
    type: 'console.error'
  });
  originalConsoleError(...args);
};

export default function DebugScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Update logs every second
    const interval = setInterval(() => {
      setLogs([...errorLogs]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    errorLogs = [];
    setLogs([]);
    Alert.alert('Logs Cleared', 'All error logs have been cleared.');
  };

  const testError = () => {
    try {
      // Intentionally throw an error for testing
      throw new Error('Test error from DebugScreen');
    } catch (error) {
      console.error('Test error:', error.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    logContainer: {
      flex: 1,
      padding: spacing.md,
    },
    logItem: {
      backgroundColor: colors.cardBackground,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    logTimestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    logMessage: {
      fontSize: 14,
      color: colors.text,
      ...Platform.select({
        ios: {
          fontFamily: 'Courier',
        },
        android: {
          fontFamily: 'monospace',
        },
        web: {
          fontFamily: 'monospace',
        },
      }),
    },
    buttonContainer: {
      flexDirection: 'row',
      padding: spacing.lg,
      gap: spacing.md,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Debug Logs</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={{ color: colors.primary }}>Close</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No errors logged yet.{'\n'}
              Try triggering an error to see it here.
            </ThemedText>
          </View>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <ThemedText style={styles.logTimestamp}>
                {log.timestamp}
              </ThemedText>
              <ThemedText style={styles.logMessage}>
                {log.message}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <ThemedButton
          title="Test Error"
          onPress={testError}
          variant="outline"
          style={{ flex: 1 }}
        />
        <ThemedButton
          title="Clear Logs"
          onPress={clearLogs}
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>
    </ThemedView>
  );
}
