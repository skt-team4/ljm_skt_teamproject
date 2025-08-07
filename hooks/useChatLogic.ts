// hooks/useChatLogic.ts
import { useEffect, useState } from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { getCategoryRecommendation, MealCategory, Message, sendChatMessage } from '../services/apiService';

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

  // 키보드 이벤트 리스너
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
        setTimeout(() => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        }, 100);
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

  // GIF 클릭 핸들러
  const handleGifClick = () => {
    setCurrentGifIndex((prevIndex) => 
      (prevIndex + 1) % 4 // gifAnimations.length
    );
  };

  // 카테고리 버튼 클릭 처리
  const handleCategoryPress = async (category: MealCategory) => {
    setIsLoading(true);
    setApiError(null);
    
    // 로딩 중 애니메이션 변경
    setCurrentGifIndex(1); // yammi_think.gif
    
    try {
      const response = await getCategoryRecommendation(category);
      
      if (response.success) {
        setCurrentResponse(response.message);
        setShowResponse(true);
        
        // 메시지 히스토리에 추가
        const newMessage: Message = {
          id: Date.now().toString(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          category: category,
        };
        setMessages(prev => [...prev, newMessage]);
        
        // 카테고리에 따라 다른 애니메이션
        switch (category) {
          case 'distance':
            setCurrentGifIndex(2); // yammi_waiting.gif
            break;
          case 'cost':
            setCurrentGifIndex(3); // yammi_tmp.gif
            break;
          case 'preference':
            setCurrentGifIndex(0); // yammi_welcome.gif
            break;
          case 'allergy':
            setCurrentGifIndex(1); // yammi_think.gif
            break;
          default:
            setCurrentGifIndex(0);
        }
      } else {
        // API 오류 처리
        setApiError(response.error || '알 수 없는 오류가 발생했습니다.');
        setCurrentResponse(response.message);
        setShowResponse(true);
        setCurrentGifIndex(0); // 기본 애니메이션
      }
    } catch (error) {
      console.error('카테고리 처리 오류:', error);
      setApiError('네트워크 오류가 발생했습니다.');
      setCurrentResponse('죄송해요, 일시적으로 서비스에 문제가 있어요. 잠시 후 다시 시도해 주세요.');
      setShowResponse(true);
      setCurrentGifIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 텍스트 입력으로 질문하기
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
  };

  // 에러 다시 시도
  const handleRetry = () => {
    setApiError(null);
    setShowResponse(false);
    setCurrentResponse('');
  };

  return {
    // State
    inputText,
    setInputText,
    currentResponse,
    showResponse,
    isKeyboardVisible,
    keyboardHeight,
    currentGifIndex,
    isLoading,
    messages,
    apiError,
    
    // Handlers
    handleGifClick,
    handleCategoryPress,
    handleSendMessage,
    handleBackToMenu,
    handleRetry,
  };
};