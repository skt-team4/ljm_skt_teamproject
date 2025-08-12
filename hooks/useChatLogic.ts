// hooks/useChatLogic.ts - 캐릭터 상점 연동 버전
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { Message, sendChatMessage } from '../services/apiService';

export const useChatLogic = () => {
  const [inputText, setInputText] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // 간단한 키보드 이벤트 리스너 (애니메이션 없이)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // 안드로이드 뒤로 가기 버튼 처리
  useEffect(() => {
    const backAction = () => {
      if (showResponse) {
        handleBackToMenu();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [showResponse]);

  // 🛍️ 코인 보상 시스템
  const awardCoins = async (amount: number, reason: string) => {
    try {
      const savedCoins = await AsyncStorage.getItem('userCoins');
      const currentCoins = savedCoins ? parseInt(savedCoins, 10) : 1000;
      const newCoins = currentCoins + amount;
      
      await AsyncStorage.setItem('userCoins', newCoins.toString());
      
      // 선택적으로 콘솔 로그 (디버깅용)
      if (__DEV__) {
        console.log(`💰 +${amount} 코인 획득! (${reason}) - 총 ${newCoins} 코인`);
      }
    } catch (error) {
      console.error('코인 보상 실패:', error);
    }
  };

  // GIF 클릭 핸들러 (기존과 동일하게 유지 - 상점은 별도 처리)
  const handleGifClick = () => {
    setCurrentGifIndex((prevIndex) => 
      (prevIndex + 1) % 4 // gifAnimations.length
    );
    
    // GIF 변경시 코인 보상
    awardCoins(5, '캐릭터 변경');
  };

  // 🎨 캐릭터 변경 핸들러 (상점에서 호출)
  const handleGifChange = (newIndex: number) => {
    setCurrentGifIndex(newIndex);
    
    // 상점에서 캐릭터 변경시 코인 보상
    awardCoins(5, '캐릭터 꾸미기');
  };

  // 텍스트 입력으로 질문하기 (코인 보상 추가)
  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setApiError(null);
    
    // 키보드 숨기기
    Keyboard.dismiss();
    
    // 사용자 메시지를 히스토리에 추가
    const userMessageObj: Message = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessageObj]);
    
    // 로딩 애니메이션
    setCurrentGifIndex(1); // yammi_think.gif
    
    try {
      const response = await sendChatMessage(userMessage);
      
      if (response.success) {
        setCurrentResponse(response.message);
        setShowResponse(true);
        
        // 봇 응답을 히스토리에 추가
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          category: response.data?.category,
        };
        setMessages(prev => [...prev, botMessage]);
        
        // 응답 후 애니메이션
        setCurrentGifIndex(0); // yammi_welcome.gif
        
        // 💰 음식 추천 받기 코인 보상
        awardCoins(10, '음식 추천 요청');
        
      } else {
        // API 오류 처리
        setApiError(response.error || '알 수 없는 오류가 발생했습니다.');
        setCurrentResponse(response.message);
        setShowResponse(true);
        setCurrentGifIndex(0);
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      setApiError('네트워크 오류가 발생했습니다.');
      setCurrentResponse('죄송해요, 일시적으로 서비스에 문제가 있어요. 잠시 후 다시 시도해 주세요.');
      setShowResponse(true);
      setCurrentGifIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 화면으로 돌아가기 (말풍선 닫기)
  const handleBackToMenu = () => {
    Keyboard.dismiss();
    setShowResponse(false);
    setCurrentResponse('');
    setInputText('');
    setCurrentGifIndex(0);
    setApiError(null);
    
    // 💰 대화 완료 코인 보상 (적은 양)
    awardCoins(2, '대화 완료');
  };

  // 에러 다시 시도
  const handleRetry = () => {
    setApiError(null);
    setShowResponse(false);
    setCurrentResponse('');
  };

  // 🎯 매일 로그인 보상 체크 (앱 시작시 호출)
  const checkDailyLoginReward = async () => {
    try {
      const lastLoginDate = await AsyncStorage.getItem('lastLoginDate');
      const today = new Date().toDateString();
      
      if (lastLoginDate !== today) {
        // 오늘 첫 로그인
        await AsyncStorage.setItem('lastLoginDate', today);
        awardCoins(50, '매일 로그인 보너스');
        
        if (__DEV__) {
          console.log('🎉 매일 로그인 보너스 50 코인 지급!');
        }
      }
    } catch (error) {
      console.error('매일 로그인 보상 체크 실패:', error);
    }
  };

  // 앱 시작시 매일 로그인 보상 체크
  useEffect(() => {
    checkDailyLoginReward();
  }, []);

  return {
    // State
    inputText,
    setInputText,
    currentResponse,
    showResponse,
    isKeyboardVisible,
    keyboardHeight,
    currentGifIndex,
    setCurrentGifIndex, // 🆕 상점에서 직접 설정할 수 있도록 추가
    isLoading,
    messages,
    apiError,
    
    // Handlers
    handleGifClick,
    handleGifChange, // 🆕 상점에서 사용할 GIF 변경 핸들러
    handleSendMessage,
    handleBackToMenu,
    handleRetry,
    
    // 🆕 코인 시스템
    awardCoins,
    checkDailyLoginReward,
  };
};