// components/CategoryButtons.tsx
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MealCategory } from '../services/apiService';
import { isSmallScreen, styles } from '../styles/chatStyles';

interface CategoryButtonsProps {
  isVisible: boolean;
  isLoading: boolean;
  onCategoryPress: (category: MealCategory) => void;
}

export const CategoryButtons: React.FC<CategoryButtonsProps> = ({
  isVisible,
  isLoading,
  onCategoryPress,
}) => {
  const dynamicButtonStyle = {
    ...styles.categoryButton,
    paddingVertical: isSmallScreen ? 8 : 12,
    paddingHorizontal: isSmallScreen ? 6 : 8,
    opacity: isLoading ? 0.6 : 1,
  };

  if (!isVisible) return null;

  return (
    <View style={[
      styles.categoryContainer,
      {
        marginBottom: isSmallScreen ? 15 : 30,
        paddingHorizontal: isSmallScreen ? 5 : 15,
      }
    ]}>
      <TouchableOpacity 
        style={dynamicButtonStyle}
        onPress={() => onCategoryPress('distance')}
        disabled={isLoading}
      >
        <Text style={styles.categoryButtonText}>거리</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={dynamicButtonStyle}
        onPress={() => onCategoryPress('cost')}
        disabled={isLoading}
      >
        <Text style={styles.categoryButtonText}>가격</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={dynamicButtonStyle}
        onPress={() => onCategoryPress('preference')}
        disabled={isLoading}
      >
        <Text style={styles.categoryButtonText}>선호도</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={dynamicButtonStyle}
        onPress={() => onCategoryPress('allergy')}
        disabled={isLoading}
      >
        <Text style={styles.categoryButtonText}>알레르기</Text>
      </TouchableOpacity>
    </View>
  );
};