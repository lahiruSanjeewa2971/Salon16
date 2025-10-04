import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedButton } from '../../../themed/ThemedButton';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function AddServiceButton({ onPress }) {
  const { spacing } = useTheme();

  const styles = {
    addButtonContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
  };

  return (
    <View style={styles.addButtonContainer}>
      <ThemedButton
        title="Add New Service"
        onPress={onPress}
        variant="primary"
        icon={<Ionicons name="add" size={20} color="white" />}
      />
    </View>
  );
}
