import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';
import { serviceService, categoryService } from '../../../../services/firebaseService';
import { useToastHelpers } from '../../../ui/ToastSystem';

export default function CategoryManager({ categories, animatedStyle, onAddCategory, onEditCategory, onToggleCategoryStatus, onDeleteCategory }) {
  const theme = useTheme();
  const { showSuccess, showError } = useToastHelpers();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const colors = theme?.colors || {};

  // Add null safety for categories
  const safeCategories = categories || [];

  const handleDeleteCategory = (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteCategory(category);
          },
        },
      ]
    );
  };

  const handleToggleCategoryStatus = async (category) => {
    try {
      const newStatus = !category.isActive;
      
      if (!newStatus) {
        // Deactivating - check for any services (active or inactive)
        console.log('🔍 CategoryManager: Checking for services in category...');
        const allServices = await serviceService.getServicesByCategory(category.id);
        
        if (allServices.length > 0) {
          console.log(`⚠️ CategoryManager: Found ${allServices.length} services in category, preventing deactivation`);
          showError(
            'Cannot Deactivate Category',
            `There are ${allServices.length} services related to this category. Please remove or reassign them before deactivating this category.`
          );
          return; // Stop the process
        }
      }
      
      // No services found or reactivating - proceed with toggle
      console.log('✅ CategoryManager: No services found, proceeding with status change');
      await categoryService.toggleCategoryStatus(category.id, newStatus);
      onToggleCategoryStatus(category);
      
    } catch (error) {
      console.error('❌ CategoryManager: Error toggling category status:', error);
      showError('Failed to Update Category', error.message || 'Please try again.');
    }
  };


  const styles = {
    categoryContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 5,
    },
    categoryHeader: {
      padding: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    categoryTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: 'white',
      marginBottom: spacing.xs,
    },
    categorySubtitle: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '500',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    categoryItem: {
      width: '48%',
      marginBottom: spacing.lg,
    },
    categoryCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '100%',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: spacing.lg,
      minHeight: 120,
      overflow: 'hidden',
    },
    categoryContent: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    categoryName: {
      fontSize: 18,
      fontWeight: '700',
      color: 'white',
      marginBottom: spacing.xs,
      letterSpacing: 0.3,
    },
    categoryCount: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '500',
      marginRight: spacing.xl,
    },
    categoryIcon: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryActions: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      flexDirection: 'row',
      gap: spacing.xs,
    },
    categoryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: borderRadius.medium,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      width: 28,
      height: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statusButton: {
      backgroundColor: 'rgba(156, 163, 175, 0.15)',
      borderColor: 'rgba(156, 163, 175, 0.3)',
    },
    statusButtonActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgba(34, 197, 94, 0.4)',
    },
    deleteButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    bottomActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.large,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    actionButtonText: {
      fontSize: 14,
      color: 'white',
      marginLeft: spacing.sm,
      fontWeight: '600',
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
                <View key={category.id} style={styles.categoryItem}>
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => {
                      console.log('Category card clicked for edit:', category);
                      onEditCategory(category);
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Category Icon - Top Right */}
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name="folder-outline"
                        size={16}
                        color="rgba(255, 255, 255, 0.8)"
                      />
                    </View>

                    {/* Main Content */}
                    <View style={styles.categoryContent}>
                      <ThemedText style={styles.categoryName}>
                        {category.name}
                      </ThemedText>
                      <ThemedText style={styles.categoryCount}>
                        {category.serviceCount} services
                      </ThemedText>
                    </View>

                    {/* Action Buttons - Bottom Right */}
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={[
                          styles.categoryButton, 
                          category.isActive ? styles.statusButtonActive : styles.statusButton
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleCategoryStatus(category);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={category.isActive ? "eye" : "eye-off"} 
                          size={12} 
                          color="white" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.categoryButton, styles.deleteButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onAddCategory}
              >
                <Ionicons name="add" size={16} color="white" />
                <ThemedText style={styles.actionButtonText}>Add Category</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}
