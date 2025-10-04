import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  Extrapolate,
  FadeIn,
} from 'react-native-reanimated';

import { ThemedText } from '../../../ThemedText';
import { ThemedButton } from '../../../themed/ThemedButton';

const SalonInformation = ({ 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  fadeAnim,
}) => {
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
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    infoCard: {
      width: '48%',
      backgroundColor: '#F9FAFB',
      borderRadius: borderRadius.medium,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 14,
      color: '#1A1A1A',
      fontWeight: '500',
      lineHeight: 20,
    },
    fullWidthCard: {
      width: '100%',
    },
    editButton: {
      marginTop: spacing.md,
      borderRadius: borderRadius.medium,
    },
  });

  // Mock salon data
  const salonData = {
    name: 'Salon 16',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@salon16.com',
    hours: 'Mon-Sat: 9:00 AM - 7:00 PM, Sun: Closed',
    description: 'Premium hair salon offering professional styling and beauty services.',
  };

  const handleEditSalonInfo = () => {
    // TODO: Implement edit salon information
    console.log('Edit salon information');
  };

  return (
    <Animated.View
      entering={FadeIn.delay(200)}
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
          name="business-outline" 
          size={24} 
          color={colors.primary} 
          style={styles.sectionIcon}
        />
        <ThemedText style={styles.sectionTitle}>
          Salon Information
        </ThemedText>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <ThemedText style={styles.infoLabel}>Salon Name</ThemedText>
          <ThemedText style={styles.infoValue}>{salonData.name}</ThemedText>
        </View>

        <View style={styles.infoCard}>
          <ThemedText style={styles.infoLabel}>Phone</ThemedText>
          <ThemedText style={styles.infoValue}>{salonData.phone}</ThemedText>
        </View>

        <View style={[styles.infoCard, styles.fullWidthCard]}>
          <ThemedText style={styles.infoLabel}>Address</ThemedText>
          <ThemedText style={styles.infoValue}>{salonData.address}</ThemedText>
        </View>

        <View style={styles.infoCard}>
          <ThemedText style={styles.infoLabel}>Email</ThemedText>
          <ThemedText style={styles.infoValue}>{salonData.email}</ThemedText>
        </View>

        <View style={styles.infoCard}>
          <ThemedText style={styles.infoLabel}>Hours</ThemedText>
          <ThemedText style={styles.infoValue}>{salonData.hours}</ThemedText>
        </View>

        <View style={[styles.infoCard, styles.fullWidthCard]}>
          <ThemedText style={styles.infoLabel}>Description</ThemedText>
          <ThemedText style={styles.infoValue}>{salonData.description}</ThemedText>
        </View>
      </View>

      <ThemedButton
        title="Edit Salon Information"
        onPress={handleEditSalonInfo}
        variant="outline"
        style={styles.editButton}
        icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
      />
    </Animated.View>
  );
};

export default SalonInformation;