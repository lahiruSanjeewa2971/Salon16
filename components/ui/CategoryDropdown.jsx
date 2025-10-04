import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { useTheme } from '../../contexts/ThemeContext';

export default function CategoryDropdown({ 
  label,
  categories = [], 
  selectedCategory, 
  onSelectCategory, 
  error = null,
  placeholder = "Select Category"
}) {
  const theme = useTheme();
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation
  const dropdownAnim = useSharedValue(0);
  
  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Animation styles
  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dropdownAnim.value,
    transform: [
      {
        scaleY: dropdownAnim.value,
      },
    ],
  }));
  
  const handleToggle = useCallback(() => {
    if (isOpen) {
      dropdownAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
      setTimeout(() => setIsOpen(false), 200);
    } else {
      setIsOpen(true);
      dropdownAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  }, [isOpen, dropdownAnim]);
  
  const handleSelect = useCallback((category) => {
    onSelectCategory(category);
    handleToggle();
    setSearchQuery('');
  }, [onSelectCategory, handleToggle]);
  
  const selectedCategoryName = selectedCategory?.name || placeholder;
  
  const styles = {
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    dropdownButton: {
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: borderRadius.large,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: error ? colors.error : colors.border || '#E5E5E5',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    dropdownButtonFocused: {
      borderColor: colors.primary,
      shadowOpacity: 0.15,
      elevation: 4,
    },
    buttonText: {
      fontSize: 16,
      color: selectedCategory ? colors.text : colors.textSecondary,
      fontWeight: '500',
      flex: 1,
    },
    buttonIcon: {
      marginLeft: spacing.sm,
    },
    dropdownList: {
      backgroundColor: colors.surface || '#FFFFFF',
      borderRadius: borderRadius.large,
      borderWidth: 1,
      borderColor: colors.border || '#E5E5E5',
      maxHeight: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      marginTop: spacing.xs,
    },
    categoryItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#E5E5E5',
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryItemLast: {
      borderBottomWidth: 0,
    },
    categoryItemSelected: {
      backgroundColor: colors.primary + '10',
    },
    categoryIcon: {
      marginRight: spacing.sm,
    },
    categoryText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    categoryTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    emptyState: {
      padding: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
    },
  };
  
  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={styles.label}>
          {label}
        </ThemedText>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          isOpen && styles.dropdownButtonFocused,
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.buttonText}>
          {selectedCategoryName}
        </ThemedText>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
          style={styles.buttonIcon}
        />
      </TouchableOpacity>
      
      {isOpen && (
        <Animated.View style={[styles.dropdownList, dropdownAnimatedStyle]}>
          {filteredCategories.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {filteredCategories.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.categoryItem,
                    index === filteredCategories.length - 1 && styles.categoryItemLast,
                    selectedCategory?.id === item.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="grid"
                    size={18}
                    color={selectedCategory?.id === item.id ? colors.primary : colors.textSecondary}
                    style={styles.categoryIcon}
                  />
                  <ThemedText
                    style={[
                      styles.categoryText,
                      selectedCategory?.id === item.id && styles.categoryTextSelected,
                    ]}
                  >
                    {item.name}
                  </ThemedText>
                  {selectedCategory?.id === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                No categories available
              </ThemedText>
            </View>
          )}
        </Animated.View>
      )}
      
      {error && (
        <ThemedText style={styles.errorText}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}
