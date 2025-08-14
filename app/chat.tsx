// chat.tsx - 캐릭터 상점 연동 버전 (밥풀 시스템 적용)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 분리된 파일들 import
import CharacterShopModal from '../components/CharacterShopModal'; // 상점 모달 import
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { SpeechBubble } from '../components/SpeechBubble';
import useChatLogic from '../hooks/useChatLogic'; // 기본 import로 변경
import { isSmallScreen, SCREEN_HEIGHT, styles } from '../styles/chatStyles';
import { awardRicePul } from '../utils/ricePulManager'; // 밥풀 매니저 import

// GIF 애니메이션 배열
const gifAnimations = [
  require('../assets/Hi.gif'),
  require('../assets/Sad.gif'),
  require('../assets/Dance.gif'),
  require('../assets/Jump.gif'),
  require('../assets/Sunglass.gif'),
];

// 정적 이미지 배열 (애니메이션 비활성화 시 사용)
const staticImages = [
  require('../assets/Hi.gif'), // 첫 번째 프레임만 사용
  require('../assets/Sad.gif'),
  require('../assets/Dance.gif'), 
  require('../assets/Jump.gif'),
  require('../assets/Sunglass.gif'),
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
  
  // 애니메이션 설정 상태
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  
  // 상점 모달 상태
  const [showShopModal, setShowShopModal] = useState(false);
  
  // 애니메이션 값들 (초기 로딩용)
  const [animValues] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  // API 로딩 애니메이션 값들 - SpeechBubble로 전달
  const [apiLoadingAnimValues] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  // 커스텀 훅에서 로직 가져오기 (handleGifClick, awardCoins 제외)
  const {
    inputText,
    setInputText,
    currentResponse,
    showResponse,
    isKeyboardVisible,
    keyboardHeight,
    currentGifIndex,
    setCurrentGifIndex, // GIF 변경을 위한 setter 추가
    isLoading,
    apiError,
    handleSendMessage,
    handleBackToMenu,
    handleRetry,
    handleGifChange, // 상점용 GIF 변경 핸들러 (훅에서 가져옴)
    // handleGifClick과 awardCoins는 여기서 덮어쓸 예정이므로 가져오지 않음
  } = useChatLogic(); // 기본 import 사용

  // 화면이 포커스될 때마다 애니메이션 설정 다시 로드
  useFocusEffect(
    useCallback(() => {
      loadAnimationSettings();
    }, [])
  );

  // 애니메이션 설정 불러오기 및 실시간 감지
  useEffect(() => {
    loadAnimationSettings();
    
    // 설정 변경을 실시간으로 감지하는 인터벌 설정
    const interval = setInterval(() => {
      loadAnimationSettings();
    }, 1000); // 1초마다 체크

    return () => clearInterval(interval);
  }, []);

  const loadAnimationSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('animationEnabled');
      if (saved !== null) {
        const enabled = JSON.parse(saved);
        if (enabled !== isAnimationEnabled) {
          setIsAnimationEnabled(enabled);
        }
      }
    } catch (error) {
      console.error('애니메이션 설정 불러오기 실패:', error);
    }
  };

  // GIF 클릭 핸들러 - 상점 모달 열기
  const handleGifClick = () => {
    console.log('GIF 클릭됨, 현재 인덱스:', currentGifIndex);
    setShowShopModal(true);
  };

  // GIF 변경 시 콘솔 로그 추가 (디버깅용)
  const handleGifChangeWithLog = (newIndex: number) => {
    console.log(`[Chat] GIF 변경 요청: ${currentGifIndex} -> ${newIndex}`);
    console.log(`[Chat] gifAnimations 배열 길이: ${gifAnimations.length}`);
    console.log(`[Chat] 요청된 인덱스 ${newIndex}의 GIF:`, gifAnimations[newIndex] ? '존재' : 'undefined');
    
    // 인덱스가 유효한지 확인
    if (newIndex >= 0 && newIndex < gifAnimations.length && gifAnimations[newIndex]) {
      handleGifChange(newIndex);
    } else {
      console.error(`[Chat] 유효하지 않은 GIF 인덱스: ${newIndex}`);
      // 기본값으로 0번 인덱스 사용
      handleGifChange(0);
    }
  };

  // currentGifIndex 변경 감지 (디버깅용)
  useEffect(() => {
    console.log(`[Chat] currentGifIndex 변경됨: ${currentGifIndex}`);
    console.log(`[Chat] 현재 표시될 GIF:`, gifAnimations[currentGifIndex]);
  }, [currentGifIndex]);

  // 메시지 전송시 밥풀 보상
  const handleSendMessageWithReward = async (message: string) => {
    handleSendMessage(message);
    // 밥풀 10개 지급
    await awardRicePul(10, '음식 추천 요청');
  };

  // 점 애니메이션 생성 함수
  const createBounceAnimation = (animValues: Animated.Value[], shouldLoop = true) => {
    // 애니메이션이 비활성화되면 애니메이션 실행하지 않음
    if (!isAnimationEnabled) {
      return animValues.map(() => ({ start: () => {}, stop: () => {} }));
    }

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
    if (showLoading && isAnimationEnabled) {
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
    } else if (showLoading && !isAnimationEnabled) {
      // 애니메이션 비활성화 시 즉시 메시지 표시
      const timer = setTimeout(() => {
        setShowLoading(false);
        setShowMessage(true);
      }, 300); // 짧은 딜레이만 적용

      return () => clearTimeout(timer);
    }
  }, [showLoading, animValues, isAnimationEnabled]);

  // API 로딩 애니메이션 - 말풍선이 보이고 로딩중일 때만 실행
  useEffect(() => {
    if (isLoading && showResponse && isAnimationEnabled) {
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
  }, [isLoading, showResponse, apiLoadingAnimValues, isAnimationEnabled]);

  // 점 애니메이션 컴포넌트 (초기 로딩용)
  const LoadingDots = ({ animationValues, loadingText }: { 
    animationValues: Animated.Value[], 
    loadingText: string 
  }) => (
    <View style={{ alignItems: 'center' }}>
      {/* 애니메이션이 활성화된 경우에만 점 애니메이션 표시 */}
      {isAnimationEnabled ? (
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
      ) : (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: 10 
        }}>
          {/* 정적인 점들 */}
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#FFBF00',
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
      )}
      
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
      width: isSmallScreen ? 300 : 350, 
      height: isSmallScreen ? 300 : 350,
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 헤더 컴포넌트 */}
      <ChatHeader />

      {/* 메인 컨텐츠 */}
      <View style={styles.mainContainer}>
        {/* 말풍선 컴포넌트 - 로딩 애니메이션 props 추가 */}
        <SpeechBubble
          isVisible={showResponse}
          isKeyboardVisible={isKeyboardVisible}
          currentResponse={currentResponse}
          isLoading={isLoading}
          apiError={apiError}
          onClose={handleBackToMenu}
          onRetry={handleRetry}
          // 로딩 애니메이션을 위한 추가 props
          apiLoadingAnimValues={apiLoadingAnimValues}
          isAnimationEnabled={isAnimationEnabled}
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
                <Text style={dynamicStyles.welcomeText}>안녕하세요!!</Text>
                
                {/* 초기 로딩만 여기서 표시, API 로딩은 말풍선으로 이동 */}
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 60 
                }}>
                  {showLoading ? (
                    <LoadingDots 
                      animationValues={animValues} 
                      loadingText="추천을 준비중..."
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
                      오늘은 "치킨" 어때요? 
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* 캐릭터 애니메이션 */}
          <View style={[
            styles.characterContainer,
            { 
              minHeight: isSmallScreen ? 150 : 200,
              marginTop: 30,
            }
          ]}>
            {/* 캐릭터 클릭 안내 텍스트 - GIF 바로 위 */}
            <View style={styles.characterGuideContainer}>
              <Text style={styles.characterGuideText}>
               캐릭터를 클릭해서 꾸며보세요!
              </Text>
            </View>

            <TouchableOpacity onPress={handleGifClick} activeOpacity={0.8}>
              <Image
                source={
                  isAnimationEnabled 
                    ? (gifAnimations[currentGifIndex] || gifAnimations[0]) 
                    : (staticImages[currentGifIndex] || staticImages[0])
                }
                style={dynamicStyles.characterGif}
                contentFit="contain"
                transition={isAnimationEnabled ? 1000 : 0} // 애니메이션 비활성화 시 전환 효과 제거
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
        onSendMessage={handleSendMessageWithReward} // 밥풀 보상이 포함된 핸들러 사용
      />

      {/* 캐릭터 상점 모달 */}
      <CharacterShopModal
        visible={showShopModal}
        onClose={() => setShowShopModal(false)}
        currentGifIndex={currentGifIndex}
        onGifChange={handleGifChangeWithLog} // 디버깅용 래퍼 함수 사용
        isAnimationEnabled={isAnimationEnabled}
      />
    </View>
  );
}