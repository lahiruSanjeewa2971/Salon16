import { Ionicons } from '@expo/vector-icons';
import { Alert, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { createSecureFirestoreService } from '../../../../services/createSecureFirestoreService';
import { ThemedText } from '../../../ThemedText';
import { useToastHelpers } from '../../../ui/ToastSystem';

export default function CategoryManager({ categories, animatedStyle, onAddCategory, onEditCategory, onToggleCategoryStatus, onDeleteCategory }) {
  const theme = useTheme();
  const { showSuccess, showError } = useToastHelpers();
  const { user } = useAuth();
  
  // Create secure service with user context
  const secureService = createSecureFirestoreService(user);
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const colors = theme?.colors || {};

  // Add null safety for categories
  const safeCategories = categories || [];

  // Reusable function to check for related services and handle the operation
  const checkServicesAndExecute = async (category, operation, operationName) => {
    try {
      console.log(`🔍 CategoryManager: Checking for services before ${operationName}...`);
      const allServices = await secureService.adminOperations.getServicesByCategory(category.id);
      
      if (allServices.length > 0) {
        console.log(`⚠️ CategoryManager: Found ${allServices.length} services in category, preventing ${operationName}`);
        showError(
          `Cannot ${operationName} Category`,
          `There are ${allServices.length} services related to this category. Please remove or reassign them before ${operationName.toLowerCase()}ing this category.`
        );
        return false; // Operation blocked
      }
      
      // No services found - proceed with operation
      console.log(`✅ CategoryManager: No services found, proceeding with ${operationName}`);
      await operation();
      return true; // Operation successful
      
    } catch (error) {
      console.error(`❌ CategoryManager: Error during ${operationName}:`, error);
      showError(`Failed to ${operationName} Category`, error.message || 'Please try again.');
      return false; // Operation failed
    }
  };

  const handleDeleteCategory = async (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleteOperation = async () => {
              await secureService.adminOperations.deleteCategory(category.id);
              onDeleteCategory(category);
            };
            
            await checkServicesAndExecute(category, deleteOperation, 'Delete');
          },
        },
      ]
    );
  };

  const handleToggleCategoryStatus = async (category) => {
    const newStatus = !category.isActive;
    const operationName = newStatus ? 'Activate' : 'Deactivate';
    
    const toggleOperation = async () => {
      await secureService.adminOperations.toggleCategoryStatus(category.id, newStatus);
      onToggleCategoryStatus(category);
    };
    
    await checkServicesAndExecute(category, toggleOperation, operationName);
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
      padding: spacing.md,
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
      minHeight: 130,
      overflow: 'hidden',
    },
    categoryCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    categoryContent: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingBottom: spacing.sm,
    },
    categoryNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      gap: spacing.xs,
    },
    categoryName: {
      fontSize: 18,
      fontWeight: '700',
      color: 'white',
      letterSpacing: 0.3,
      flex: 1,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusIndicatorActive: {
      backgroundColor: '#22C55E',
    },
    statusIndicatorInactive: {
      backgroundColor: '#9CA3AF',
    },
    categoryCount: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.65)',
      fontWeight: '500',
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryActions: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      marginTop: spacing.sm,
      marginHorizontal: -spacing.md,
      marginBottom: -spacing.md,
      gap: spacing.sm,
    },
    categoryActionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.medium,
      minHeight: 40,
    },
    toggleStatusButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    toggleStatusButtonActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgba(34, 197, 94, 0.4)',
    },
    toggleStatusButtonInactive: {
      backgroundColor: 'rgba(156, 163, 175, 0.15)',
      borderColor: 'rgba(156, 163, 175, 0.3)',
    },
    deleteActionButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
      textAlign: 'center',
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
                    {/* Header with Category Name and Status Indicator */}
                    <View style={styles.categoryCardHeader}>
                      <View style={styles.categoryContent}>
                        <View style={styles.categoryNameRow}>
                          <ThemedText style={styles.categoryName}>
                            {category.name}
                          </ThemedText>
                          <View style={[
                            styles.statusIndicator,
                            category.isActive ? styles.statusIndicatorActive : styles.statusIndicatorInactive
                          ]} />
                        </View>
                        <ThemedText style={styles.categoryCount}>
                          {category.serviceCount} {category.serviceCount === 1 ? 'service' : 'services'}
                        </ThemedText>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.categoryIcon}
                        onPress={(e) => {
                          e.stopPropagation();
                          console.log('Category card clicked for edit:', category);
                          onEditCategory(category);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color="rgba(255, 255, 255, 0.8)"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Action Buttons - Bottom */}
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={[
                          styles.categoryActionButton,
                          styles.toggleStatusButton,
                          category.isActive ? styles.toggleStatusButtonActive : styles.toggleStatusButtonInactive
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleCategoryStatus(category);
                        }}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.actionButtonText}>
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </ThemedText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.categoryActionButton, styles.deleteActionButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
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
