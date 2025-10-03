import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function CategoryManager({ categories, animatedStyle, onAddCategory, onEditCategory, onViewCategoryStats }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const colors = theme?.colors || {};

  // Add null safety for categories
  const safeCategories = categories || [];

  const getCategoryColor = (categoryName) => {
    const colorMap = {
      'Hair': colors.primary,
      'Nail': colors.accent,
      'Facial': colors.secondary,
      'Spa': colors.info,
      'Massage': colors.warning,
    };
    return colorMap[categoryName] || colors.textSecondary;
  };

  const styles = {
    categoryContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    categoryHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    categorySubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: spacing.md,
    },
    categoryItem: {
      width: '50%',
      padding: spacing.md,
      alignItems: 'center',
    },
    categoryCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: borderRadius.large,
      padding: spacing.md,
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    categoryIcon: {
      marginBottom: spacing.sm,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    categoryCount: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    categoryActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    actionButtonText: {
      fontSize: 12,
      color: 'white',
      marginLeft: spacing.xs,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    addFirstButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
    },
    addFirstButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <ThemedText style={styles.categoryTitle}>Category Management</ThemedText>
          <ThemedText style={styles.categorySubtitle}>
            Organize your services by categories
          </ThemedText>
        </View>
        
        {safeCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No categories created yet. Add your first category to organize services.
            </ThemedText>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={onAddCategory}
            >
              <ThemedText style={styles.addFirstButtonText}>Add Category</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.categoryGrid}>
              {safeCategories.map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => onEditCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryCard}>
                    <Ionicons
                      name="grid"
                      size={24}
                      color={getCategoryColor(category.name)}
                      style={styles.categoryIcon}
                    />
                    <ThemedText style={styles.categoryName}>
                      {category.name}
                    </ThemedText>
                    <ThemedText style={styles.categoryCount}>
                      {category.serviceCount} services
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.categoryActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onAddCategory}
              >
                <Ionicons name="add" size={16} color="white" />
                <ThemedText style={styles.actionButtonText}>Add Category</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onViewCategoryStats}
              >
                <Ionicons name="analytics" size={16} color="white" />
                <ThemedText style={styles.actionButtonText}>View Stats</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}
