// components/ChatHeader.tsx
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isSmallScreen, styles } from '../styles/chatStyles';

export const ChatHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 영양소 분석 페이지로 이동
  const navigateToNutrition = () => {
    router.push('/nutrition');
  };

  return (
    <LinearGradient
      colors={['#FFBF00', '#FDD046']}
      style={[styles.header, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <Text style={[styles.headerTitle, { fontSize: isSmallScreen ? 24 : 28 }]}>
            YUM:AI
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.settingsButton}>
            <Image
              source={require('../../assets/settings.svg')}
              style={styles.settingsIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>챗봇</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={navigateToNutrition}
          >
            <Text style={styles.headerButtonText}>영양소 분석</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButtonContainer}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};