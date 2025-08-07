// chat.tsx - 완전히 수정된 버전
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 분리된 파일들 import
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
  
  // 로딩 애니메이션 상태
  const [showLoading, setShowLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  
  // 애니메이션 값들 (초기 로딩용)
  const [animValues] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  // API 로딩 애니메이션 값들
  const [apiLoadingAnimValues] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

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
    handleSendMessage,
    handleBackToMenu,
    handleRetry,
  } = useChatLogic();

  // 점 애니메이션 생성 함수
  const createBounceAnimation = (animValues: Animated.Value[], shouldLoop = true) => {
    const createSingleBounceAnimation = (animValue: Animated.Value, delay: number) => {
      const animation = Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animValue, {
          toValue: -10,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      return shouldLoop ? Animated.loop(animation) : animation;
    };

    return animValues.map((animValue, index) => 
      createSingleBounceAnimation(animValue, index * 150)
    );
  };

  // 초기 로딩 애니메이션
  useEffect(() => {
    if (showLoading) {
      const animations = createBounceAnimation(animValues, true);
      animations.forEach(anim => anim.start());

      // 1.5초 후 로딩 숨기고 메시지 표시
      const timer = setTimeout(() => {
        animations.forEach(anim => anim.stop());
        setShowLoading(false);
        setShowMessage(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        animations.forEach(anim => anim.stop());
      };
    }
  }, [showLoading, animValues]);

  // API 로딩 애니메이션
  useEffect(() => {
    if (isLoading) {
      const animations = createBounceAnimation(apiLoadingAnimValues, true);
      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // 로딩이 끝나면 애니메이션 정지 및 초기화
      apiLoadingAnimValues.forEach(animValue => {
        animValue.stopAnimation();
        animValue.setValue(0);
      });
    }
  }, [isLoading, apiLoadingAnimValues]);

  // 점 애니메이션 컴포넌트
  const LoadingDots = ({ animationValues, loadingText }: { 
    animationValues: Animated.Value[], 
    loadingText: string 
  }) => (
    <View style={{ alignItems: 'center' }}>
      {/* 세 개의 점이 튀는 애니메이션 */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 10 
      }}>
        {animationValues.map((animValue, index) => (
          <Animated.View
            key={index}
            style={[
              {
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#FFBF00',
                marginHorizontal: 4,
                transform: [{ translateY: animValue }]
              }
            ]}
          />
        ))}
      </View>
      
      <Text style={[
        dynamicStyles.welcomeText,
        { fontSize: 14, color: '#999', textAlign: 'center' }
      ]}>
        {loadingText}
      </Text>
    </View>
  );

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
      <View style={styles.mainContainer}>
        {/* 말풍선 컴포넌트 */}
        <SpeechBubble
          isVisible={showResponse}
          isKeyboardVisible={false}
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
              paddingBottom: 120, // 입력창 공간 확보
              minHeight: SCREEN_HEIGHT * 0.6,
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
                
                {/* 로딩 상태에 따른 애니메이션 표시 */}
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 60 
                }}>
                  {showLoading && !isLoading ? (
                    <LoadingDots 
                      animationValues={animValues} 
                      loadingText="추천을 준비중..."
                    />
                  ) : isLoading ? (
                    <LoadingDots 
                      animationValues={apiLoadingAnimValues} 
                      loadingText="맛있는 추천을 준비중..."
                    />
                  ) : (
                    <Text style={[
                      dynamicStyles.welcomeText,
                      { 
                        opacity: showMessage ? 1 : 0,
                        color: showMessage ? '#333' : '#999',
                        textAlign: 'center'
                      }
                    ]}>
                      오늘은 "치킨" 어때요? 🍚
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* 카테고리 버튼 컴포넌트 제거됨 */}

          {/* 캐릭터 애니메이션 */}
          <View style={[
            styles.characterContainer,
            { 
              minHeight: isSmallScreen ? 150 : 200,
              marginTop: 120,
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
        </ScrollView>
      </View>

      {/* 하단 입력창 - 고정 위치 */}
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