// chat.tsx - 캐릭터 상점 연동 버전 (밥풀 시스템 적용) + 타이핑 효과
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

// 타이핑 효과 컴포넌트
const TypingText = ({ 
  text, 
  speed = 100, 
  style, 
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  style?: any; 
  onComplete?: () => void;
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // 텍스트가 변경되면 초기화
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <Text style={[style, { textAlign: 'left' }]}>
      {displayText}
      {currentIndex < text.length && (
        <Text style={{ opacity: 0.5 }}>|</Text> // 커서 효과
      )}
    </Text>
  );
};

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
  require('../assets/Hi_static.png'),
  require('../assets/Sad_static.png'),
  require('../assets/Dance_static.png'), 
  require('../assets/Jump_static.png'),
  require('../assets/Sunglass_static.png'),
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
  const [showTyping, setShowTyping] = useState(false); // 타이핑 효과 제어
  
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

  // 환영 메시지 텍스트
  const welcomeMessage = "날씨가 더우니까 시원한 거 먹으면 좋을거 같아! 먹고 싶은 거 있으면 말해줘!";

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
      console.log('🎬 애니메이션 설정 로드:', saved);
      if (saved !== null) {
        const enabled = JSON.parse(saved);
        console.log('🎬 애니메이션 활성화 상태:', enabled);
        setIsAnimationEnabled(enabled);
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

  // 애니메이션 설정 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    loadAnimationSettings();
  }, []);

  // 화면 포커스 시 애니메이션 설정 다시 로드
  useFocusEffect(
    useCallback(() => {
      console.log('🎬 화면 포커스 - 애니메이션 설정 다시 로드');
      loadAnimationSettings();
    }, [])
  );

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
        setShowTyping(true); // 타이핑 효과 시작
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
        setShowTyping(true);
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
  const LoadingDots = ({ animationValues}: { 
    animationValues: Animated.Value[], 
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
              paddingHorizontal: 20, // 좌우 패딩 추가
            }
          ]}>
            {!showResponse && (
              <>
                {/* 초기 로딩만 여기서 표시, API 로딩은 말풍선으로 이동 */}
                <View style={{ 
                  alignItems: 'flex-start', // 좌측 정렬로 변경
                  justifyContent: 'center',
                  minHeight: 60,
                  width: '100%' // 전체 너비 사용
                }}>
                  {showLoading ? (
                    <View style={{ alignItems: 'center', width: '100%' }}>
                      <LoadingDots 
                        animationValues={animValues} 
                      />
                    </View>
                  ) : showMessage && showTyping ? (
                    <TypingText
                      text={welcomeMessage}
                      speed={isAnimationEnabled ? 40 : 0} // 애니메이션 비활성화 시 즉시 표시
                      style={[
                        dynamicStyles.welcomeText,
                        { 
                          color: '#333',
                          textAlign: 'left', // 좌측 정렬
                          width: '100%',
                          lineHeight: isSmallScreen ? 24 : 28, // 줄 간격 조정
                        }
                      ]}
                    />
                  ) : null}
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
                transition={isAnimationEnabled ? 1000 : 0}
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