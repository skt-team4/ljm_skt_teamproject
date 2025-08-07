// chat.tsx - 정리된 최종 버전
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 분리된 파일들 import
import { CategoryButtons } from '../components/CategoryButtons';
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { SpeechBubble } from '../components/SpeechBubble';
import { useChatLogic } from '../hooks/useChatLogic';
import { isSmallScreen, SCREEN_HEIGHT, styles } from '../styles/chatStyles';

// GIF 애니메이션 배열
const gifAnimations = [
  require('../assets/yammi_welcome.gif'),
  require('../assets/yammi_think.gif'),
  require('../assets/yammi_waiting.gif'),
  require('../assets/yammi_tmp.gif'),
];

// Expo Router 옵션
export const options = {
  gestureEnabled: false,
  swipeEnabled: false,
  presentation: 'card',
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  
  // 커스텀 훅에서 로직 가져오기
  const {
    inputText,
    setInputText,
    currentResponse,
    showResponse,
    isKeyboardVisible,
    keyboardHeight,
    currentGifIndex,
    isLoading,
    apiError,
    handleGifClick,
    handleCategoryPress,
    handleSendMessage,
    handleBackToMenu,
    handleRetry,
  } = useChatLogic();

  // 반응형 스타일 계산
  const dynamicStyles = {
    welcomeText: {
      ...styles.welcomeText,
      fontSize: isSmallScreen ? 18 : 22,
    },
    characterGif: {
      ...styles.characterGif,
      width: isSmallScreen ? 200 : 280,
      height: isSmallScreen ? 200 : 280,
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 헤더 컴포넌트 */}
      <ChatHeader />

      {/* 메인 컨텐츠 */}
      <View style={[styles.mainContainer, isKeyboardVisible && styles.keyboardActiveContainer]}>
        {/* 말풍선 컴포넌트 */}
        <SpeechBubble
          isVisible={showResponse}
          isKeyboardVisible={isKeyboardVisible}
          currentResponse={currentResponse}
          isLoading={isLoading}
          apiError={apiError}
          onClose={handleBackToMenu}
          onRetry={handleRetry}
        />

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingBottom: isKeyboardVisible ? keyboardHeight + 20 : 120,
              minHeight: isKeyboardVisible ? undefined : SCREEN_HEIGHT * 0.6,
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 환영 메시지 */}
          <View style={[
            styles.welcomeContainer, 
            { 
              marginTop: isSmallScreen ? 15 : 30,
              marginBottom: isSmallScreen ? 15 : 30,
              minHeight: isSmallScreen ? 80 : 100,
            }
          ]}>
            {!showResponse && (
              <>
                <Text style={dynamicStyles.welcomeText}>안녕하세요! 얌이에요! 🍽️</Text>
                <Text style={dynamicStyles.welcomeText}>
                  {isLoading ? "맛있는 추천을 준비하고 있어요... 🤔" : "오늘은 \"치킨\" 어때요? 🍚"}
                </Text>
              </>
            )}
          </View>

          {/* 카테고리 버튼 컴포넌트 */}
          <CategoryButtons
            isVisible={!isKeyboardVisible && !showResponse}
            isLoading={isLoading}
            onCategoryPress={handleCategoryPress}
          />

          {/* 캐릭터 애니메이션 - 키보드가 올라오면 숨기기 */}
          {!isKeyboardVisible && (
            <View style={[
              styles.characterContainer,
              { 
                minHeight: isSmallScreen ? 150 : 200,
                marginTop: 60,
              }
            ]}>
              <TouchableOpacity onPress={handleGifClick} activeOpacity={0.8}>
                <Image
                  source={gifAnimations[currentGifIndex]}
                  style={dynamicStyles.characterGif}
                  contentFit="contain"
                  transition={1000}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 하단 입력창 */}
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        isLoading={isLoading}
        isKeyboardVisible={isKeyboardVisible}
        keyboardHeight={keyboardHeight}
        onSendMessage={handleSendMessage}
      />
    </View>
  );
}