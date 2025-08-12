// SpeechBubble.tsx - 애니메이션 설정 연동 버전
import React from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { isSmallScreen, SCREEN_HEIGHT, styles } from '../styles/chatStyles';

interface SpeechBubbleProps {
  isVisible: boolean;
  isKeyboardVisible: boolean;
  currentResponse: string;
  isLoading: boolean;
  apiError: string | null;
  onClose: () => void;
  onRetry: () => void;
  // 로딩 애니메이션을 위한 props
  apiLoadingAnimValues?: Animated.Value[];
  isAnimationEnabled?: boolean; // 애니메이션 설정 추가
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  isVisible,
  isKeyboardVisible,
  currentResponse,
  isLoading,
  apiError,
  onClose,
  onRetry,
  apiLoadingAnimValues = [],
  isAnimationEnabled = true, // 기본값 true
}) => {
  if (!isVisible) return null;

  // 말풍선 내부 로딩 점 애니메이션 컴포넌트
  const LoadingDotsInBubble = () => (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 20,
    }}>
      {/* 애니메이션 활성화 여부에 따라 다른 표시 */}
      {isAnimationEnabled ? (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: 12 
        }}>
          {apiLoadingAnimValues.map((animValue, index) => (
            <Animated.View
              key={index}
              style={[
                {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FFBF00',
                  marginHorizontal: 3,
                  transform: [{ translateY: animValue }]
                }
              ]}
            />
          ))}
        </View>
      ) : (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: 12 
        }}>
          {/* 정적인 점들 */}
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FFBF00',
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>
      )}
      
      <Text style={[
        styles.bubbleText,
        { 
          fontSize: isSmallScreen ? 13 : 15,
          color: '#666',
          textAlign: 'center'
        }
      ]}>
        {isAnimationEnabled 
          ? "얌이가 맛있는 메뉴를 생각하고 있어요... 🤔💭"
          : "얌이가 메뉴를 준비중이에요... 🤔"
        }
      </Text>
    </View>
  );

  // 일반 로딩 표시 (애니메이션 비활성화 시)
  const StaticLoading = () => (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 20,
    }}>
      <Text style={[
        styles.bubbleText,
        { 
          fontSize: isSmallScreen ? 13 : 15,
          color: '#666',
          textAlign: 'center'
        }
      ]}>
        메뉴를 준비중이에요... 🤔
      </Text>
    </View>
  );

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
        
        {/* 로딩 중일 때는 애니메이션 설정에 따라 다르게 표시 */}
        {isLoading ? (
          isAnimationEnabled ? (
            <LoadingDotsInBubble />
          ) : (
            <StaticLoading />
          )
        ) : (
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
              {currentResponse}
            </Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
};