import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  Extrapolate,
  FadeIn,
} from 'react-native-reanimated';

import { ThemedText } from '../../ThemedText';
import { ThemedButton } from '../../themed/ThemedButton';

const AITrendsSection = ({ 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  fadeAnim,
}) => {
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  const styles = StyleSheet.create({
    sectionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      ...shadows.small,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1A1A1A',
    },
    aiBadge: {
      backgroundColor: colors.success + '15',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      marginBottom: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    aiBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.success,
      textAlign: 'center',
    },
    comingSoonCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: colors.success + '20',
      borderStyle: 'dashed',
    },
    comingSoonIcon: {
      marginBottom: spacing.md,
    },
    comingSoonTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    comingSoonDescription: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    featureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    featureItem: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      backgroundColor: 'white',
      borderRadius: borderRadius.small,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    featureIcon: {
      marginRight: spacing.sm,
    },
    featureText: {
      fontSize: 12,
      color: '#6B7280',
      flex: 1,
      fontWeight: '500',
    },
    refreshButton: {
      marginTop: spacing.md,
      borderRadius: borderRadius.medium,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginLeft: spacing.sm,
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  const handleRefreshTrends = () => {
    setIsLoadingTrends(true);
    // Simulate AI trend analysis
    setTimeout(() => {
      setIsLoadingTrends(false);
      console.log('AI trends refreshed');
    }, 2000);
  };

  const upcomingFeatures = [
    'Real-time booking trend analysis',
    'Customer preference insights',
    'Revenue optimization suggestions',
    'Peak hours identification',
    'Service popularity predictions',
    'Customer retention recommendations',
    'Seasonal trend analysis',
    'Competitor pricing insights',
  ];

  return (
    <Animated.View
      entering={FadeIn.delay(600)}
      style={[
        styles.sectionCard,
        {
          opacity: fadeAnim.value,
          transform: [
            {
              translateY: interpolate(
                fadeAnim.value,
                [0, 1],
                [50, 0],
                Extrapolate.CLAMP
              ),
            },
          ],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons 
          name="trending-up-outline" 
          size={24} 
          color={colors.success} 
          style={styles.sectionIcon}
        />
        <ThemedText style={styles.sectionTitle}>
          AI Trends & Insights
        </ThemedText>
      </View>

      <View style={styles.aiBadge}>
        <ThemedText style={styles.aiBadgeText}>
          🤖 AI-Powered Analytics Coming Soon
        </ThemedText>
      </View>

      <View style={styles.comingSoonCard}>
        <Ionicons 
          name="bulb-outline" 
          size={48} 
          color={colors.success} 
          style={styles.comingSoonIcon}
        />
        <ThemedText style={styles.comingSoonTitle}>
          Intelligent Salon Insights
        </ThemedText>
        <ThemedText style={styles.comingSoonDescription}>
          Our AI system will analyze your salon data and provide personalized insights 
          to help optimize your business operations and improve customer satisfaction.
        </ThemedText>

        <View style={styles.featureGrid}>
          {upcomingFeatures.map((feature, index) => (
            <Animated.View 
              key={index} 
              entering={FadeIn.delay(700 + index * 50)}
              style={styles.featureItem}
            >
              <Ionicons 
                name="checkmark-circle-outline" 
                size={16} 
                color={colors.success} 
                style={styles.featureIcon}
              />
              <ThemedText style={styles.featureText}>
                {feature}
              </ThemedText>
            </Animated.View>
          ))}
        </View>
      </View>

      <ThemedButton
        title={isLoadingTrends ? "Analyzing Trends..." : "Refresh AI Insights"}
        onPress={handleRefreshTrends}
        variant="success"
        style={styles.refreshButton}
        loading={isLoadingTrends}
        icon={
          isLoadingTrends ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh" size={20} color="white" />
              <ThemedText style={styles.loadingText}>Loading...</ThemedText>
            </View>
          ) : (
            <Ionicons name="refresh-outline" size={20} color="white" />
          )
        }
      />
    </Animated.View>
  );
};

export default AITrendsSection;