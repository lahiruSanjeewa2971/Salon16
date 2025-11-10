import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';
import CustomerDetailBottomSheet from '../../../ui/bottomSheets/CustomerDetailBottomSheet';

export default function CustomerList({ customers, animatedStyle, onCustomerPress }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const colors = theme?.colors || {};

  // Bottom sheet state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: colors.success || '#10B981',
          color: 'white'
        };
      case 'inactive':
        return {
          backgroundColor: colors.warning || '#F59E0B',
          color: 'white'
        };
      case 'new':
        return {
          backgroundColor: colors.info || '#3B82F6',
          color: 'white'
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.8)'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  // Bottom sheet handlers
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setBottomSheetVisible(true);
    // Also call the original onCustomerPress if provided
    if (onCustomerPress) {
      onCustomerPress(customer);
    }
  };

  const handleCloseBottomSheet = () => {
    setBottomSheetVisible(false);
    setSelectedCustomer(null);
  };

  const handleRemoveCustomer = (customer) => {
    console.log('Remove customer:', customer.name);
    // Here you would typically call an API to remove the customer
    // For now, just log it
  };

  const styles = {
    listContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    customerCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    customerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary || '#6C2A52',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#171717',
      marginBottom: spacing.xs,
    },
    customerEmail: {
      fontSize: 14,
      color: '#525252',
      marginBottom: spacing.xs,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    customerStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#171717',
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: '#525252',
      textAlign: 'center',
    },
    customerDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    detailItem: {
      alignItems: 'center',
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: '#A3A3A3',
      marginBottom: spacing.xs,
    },
    detailValue: {
      fontSize: 14,
      color: '#171717',
      fontWeight: '500',
    },
    viewButton: {
      backgroundColor: colors.primary || '#6C2A52',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl,
    },
    emptyIcon: {
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      lineHeight: 20,
    },
  };

  if (!customers || customers.length === 0) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.listContainer}>
          <View style={styles.emptyState}>
            <Ionicons 
              name="people-outline" 
              size={48} 
              color="rgba(255, 255, 255, 0.6)" 
              style={styles.emptyIcon}
            />
            <ThemedText style={styles.emptyTitle}>No Customers Found</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              No customers match your current search criteria. Try adjusting your filters.
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <ScrollView 
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {customers.map((customer, index) => {
          const statusStyle = getStatusBadgeStyle(customer.status);
          
          return (
            <TouchableOpacity
              key={customer.id || index}
              style={styles.customerCard}
              onPress={() => onCustomerPress(customer)}
              activeOpacity={0.7}
            >
              {/* Customer Header */}
              <View style={styles.customerHeader}>
                <View style={styles.avatarContainer}>
                  <ThemedText style={styles.avatarText}>
                    {customer.name?.charAt(0)?.toUpperCase() || '?'}
                  </ThemedText>
                </View>
                <View style={styles.customerInfo}>
                  <ThemedText style={styles.customerName}>
                    {customer.name || 'Unknown Customer'}
                  </ThemedText>
                  <ThemedText style={styles.customerEmail}>
                    {customer.email || 'No email provided'}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                  <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>
                    {customer.status || 'Active'}
                  </ThemedText>
                </View>
              </View>

              {/* Customer Stats */}
              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>
                    {customer.totalBookings || 0}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Bookings</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>
                    ${customer.totalSpent || 0}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>
                    {customer.favoriteService || 'N/A'}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Favorite</ThemedText>
                </View>
              </View>

              {/* Customer Details */}
              <View style={styles.customerDetails}>
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Last Visit</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {formatDate(customer.lastVisit)}
                  </ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Member Since</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {customer.memberSince ? new Date(customer.memberSince).toLocaleDateString() : 'N/A'}
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleViewCustomer(customer)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye" size={16} color="white" />
                  <ThemedText style={styles.viewButtonText}>View</ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Customer Detail Bottom Sheet */}
      {selectedCustomer && (
        <CustomerDetailBottomSheet
          visible={bottomSheetVisible}
          customer={selectedCustomer}
          onClose={handleCloseBottomSheet}
          onRemoveCustomer={handleRemoveCustomer}
        />
      )}
    </Animated.View>
  );
}
