import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { networkService } from '../services/networkService';
import { ThemedText } from './ThemedText';
import { useTheme } from '../contexts/ThemeContext';

/**
 * AuthFlowDebugger Component
 * Debug component to monitor authentication flow
 * Only for development/testing purposes
 */
export default function AuthFlowDebugger() {
  const { colors, spacing } = useTheme();
  const { isAuthenticated, user, isLoading, error } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Set up network status listener
    const unsubscribeNetwork = networkService.addListener((connected) => {
      setIsOnline(connected);
    });

    // Update debug info
    const updateDebugInfo = () => {
      setDebugInfo({
        timestamp: new Date().toISOString(),
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
        userUid: user?.uid,
        isLoading,
        isOnline,
        error: error || 'None',
        networkInfo: networkService.getNetworkInfo()
      });
    };

    // Update debug info initially and on changes
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);

    return () => {
      unsubscribeNetwork();
      clearInterval(interval);
    };
  }, [isAuthenticated, user, isLoading, isOnline, error]);

  // Only show in development
  if (__DEV__ === false) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Auth Flow Debugger
        </ThemedText>
        
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Authentication Status
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Has User: {user ? '✅ Yes' : '❌ No'}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Loading: {isLoading ? '⏳ Yes' : '✅ No'}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Error: {error || 'None'}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            User Details
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            UID: {user?.uid || 'N/A'}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Email: {user?.email || 'N/A'}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Name: {user?.displayName || user?.name || 'N/A'}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Network Status
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Online: {isOnline ? '✅ Yes' : '❌ No'}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Debug Info
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            Last Updated: {debugInfo.timestamp || 'N/A'}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
