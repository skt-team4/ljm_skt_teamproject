// components/SpeechBubble.tsx
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { isSmallScreen, SCREEN_HEIGHT, styles } from '../styles/chatStyles';

interface SpeechBubbleProps {
  isVisible: boolean;
  isKeyboardVisible: boolean;
  currentResponse: string;
  isLoading: boolean;
  apiError: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  isVisible,
  isKeyboardVisible,
  currentResponse,
  isLoading,
  apiError,
  onClose,
  onRetry,
}) => {
  if (!isVisible) return null;

  return (
    <View style={[
      styles.speechBubbleContainer,
      {
        position: 'absolute',
        top: 10,
        left: 20,
        right: 20,
        zIndex: 10,
      }
    ]}>
      <View style={[
        styles.speechBubble,
        {
          maxHeight: isKeyboardVisible ? SCREEN_HEIGHT * 0.4 : SCREEN_HEIGHT * 0.5,
        }
      ]}>
        <TouchableOpacity 
          style={styles.bubbleCloseButton}
          onPress={onClose}
        >
          <Text style={styles.bubbleCloseButtonText}>✕</Text>
        </TouchableOpacity>
        
        {/* 에러 표시 및 재시도 버튼 */}
        {apiError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {apiError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <ScrollView 
          style={[
            styles.bubbleScrollView,
            {
              maxHeight: isKeyboardVisible ? SCREEN_HEIGHT * 0.3 : SCREEN_HEIGHT * 0.4,
            }
          ]}
          contentContainerStyle={styles.bubbleScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.bubbleText, { fontSize: isSmallScreen ? 13 : 15 }]}>
            {isLoading ? "얌이가 맛있는 메뉴를 생각하고 있어요... 🤔💭" : currentResponse}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
};