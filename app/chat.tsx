import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 화면 크기 가져오기
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

// --- 1. 타입 및 API 설정 ---

// API 응답 타입 정의
type ApiResponse = {
  success: boolean;
  message: string;
  data?: {
    recommendations?: any[];
    category?: string;
    usage?: any;
  };
  error?: string;
};

// OpenAI API 설정
const API_CONFIG = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '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', // 실제 OpenAI API 키로 변경 필요
    model: 'gpt-3.5-turbo',
  },
  timeout: 15000, // 15초 타임아웃
};

// 메시지 타입 정의
type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
};

type MealCategory = 'distance' | 'cost' | 'preference' | 'allergy';

// --- 2. API 호출 함수들 ---

// OpenAI API를 통한 챗봇 메시지 전송
async function sendChatMessage(message: string, category?: MealCategory): Promise<ApiResponse> {
  try {
    // 카테고리별 시스템 프롬프트 설정
    const getCategoryPrompt = (cat?: MealCategory) => {
      const basePrompt = `당신은 "얌이"라는 이름의 친근하고 귀여운 급식 추천 AI입니다. 
한국의 초등학교/중학교 급식을 전문으로 추천하며, 어린이들이 좋아할 만한 톤으로 대화합니다.
응답은 한국어로 하며, 200자 이내로 간결하게 답변해주세요.
이모지를 적절히 사용해서 친근하게 답변해주세요.`;

      const categoryPrompts = {
        distance: `${basePrompt}\n지금은 "거리/접근성" 관련 급식 추천을 요청받았습니다. 학교 근처에서 쉽게 구할 수 있는 재료로 만든 급식 메뉴를 추천해주세요.`,
        cost: `${basePrompt}\n지금은 "가격/영양" 관련 급식 추천을 요청받았습니다. 경제적이면서도 영양가 높은 급식 메뉴를 추천해주세요.`,
        preference: `${basePrompt}\n지금은 "선호도" 관련 급식 추천을 요청받았습니다. 아이들이 좋아하는 인기 급식 메뉴를 추천해주세요.`,
        allergy: `${basePrompt}\n지금은 "알레르기" 관련 정보를 요청받았습니다. 급식의 알레르기 정보와 안전한 식사에 대해 안내해주세요.`
      };

      return cat ? categoryPrompts[cat] : basePrompt;
    };

    const response = await fetch(API_CONFIG.openai.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.openai.model,
        messages: [
          {
            role: 'system',
            content: getCategoryPrompt(category)
          },
          {
            role: 'user',
            content: message.trim()
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      success: true,
      message: data.choices[0].message.content.trim(),
      data: {
        category: category,
        usage: data.usage,
      }
    };
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    
    // API 키 관련 오류 체크
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        message: '⚠️ API 키 설정을 확인해주세요. OpenAI API 키가 올바르지 않습니다.',
        error: 'Invalid API key',
      };
    }
    
    // 할당량 초과 오류 체크
    if (error instanceof Error && error.message.includes('429')) {
      return {
        success: false,
        message: '⚠️ API 사용량이 초과되었어요. 잠시 후 다시 시도해주세요.',
        error: 'Rate limit exceeded',
      };
    }

    return {
      success: false,
      message: '죄송해요, 일시적으로 응답할 수 없어요. 잠시 후 다시 시도해 주세요. 🥺',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// OpenAI API를 통한 카테고리별 추천
async function getCategoryRecommendation(category: MealCategory): Promise<ApiResponse> {
  try {
    // 카테고리별 미리 정의된 질문들
    const categoryQuestions = {
      distance: '학교 근처에서 쉽게 구할 수 있는 재료로 만든 오늘의 급식 메뉴를 추천해주세요',
      cost: '경제적이면서도 영양가 높은 급식 메뉴를 추천해주세요',
      preference: '아이들이 가장 좋아하는 인기 급식 메뉴를 추천해주세요',
      allergy: '급식의 알레르기 주의사항과 안전한 식사 방법에 대해 알려주세요'
    };

    // sendChatMessage 함수를 재사용
    return await sendChatMessage(categoryQuestions[category], category);
  } catch (error) {
    console.error('카테고리 추천 오류:', error);
    return {
      success: false,
      message: '추천 메뉴를 불러오는 중 오류가 발생했어요. 다시 시도해 주세요. 😅',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// --- 3. React 컴포넌트 ---

// Expo Router 옵션 - 제스처 비활성화
export const options = {
  gestureEnabled: false,
  swipeEnabled: false,
  presentation: 'card',
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  
  // 새로 추가된 상태들
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // 여러 GIF 애니메이션 배열
  const gifAnimations = [
    require('../assets/yammi_welcome.gif'),
    require('../assets/yammi_think.gif'),
    require('../assets/yammi_waiting.gif'),
    require('../assets/yammi_tmp.gif'),
  ];

  // GIF 클릭 핸들러
  const handleGifClick = () => {
    setCurrentGifIndex((prevIndex) => 
      (prevIndex + 1) % gifAnimations.length
    );
  };

  // 키보드 이벤트 리스너 - 높이 포함
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

  // --- 4. API 호출 함수들 ---

  // 카테고리 버튼 클릭 처리 (API 버전)
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

  // 텍스트 입력으로 질문하기 (API 버전)
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

  // 반응형 스타일 계산
  const dynamicStyles = {
    welcomeText: {
      ...styles.welcomeText,
      fontSize: isSmallScreen ? 18 : 22,
    },
    categoryButton: {
      ...styles.categoryButton,
      paddingVertical: isSmallScreen ? 8 : 12,
      paddingHorizontal: isSmallScreen ? 6 : 8,
      opacity: isLoading ? 0.6 : 1, // 로딩 중 버튼 비활성화 표시
    },
    categoryButtonText: styles.categoryButtonText,
    characterGif: {
      ...styles.characterGif,
      width: isSmallScreen ? 200 : 280,
      height: isSmallScreen ? 200 : 280,
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 헤더 */}
      <LinearGradient
        colors={['#FFBF00', '#FDD046']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <Text style={[styles.headerTitle, { fontSize: isSmallScreen ? 24 : 28 }]}>YUM:AI</Text>
          </View>
          
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.settingsButton}>
              <Image
                source={require('../assets/settings.svg')}
                style={styles.settingsIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>챗봇</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>영양소 분석</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* 메인 컨텐츠 */}
      <View style={[styles.mainContainer, isKeyboardVisible && styles.keyboardActiveContainer]}>
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
                  {isLoading ? "맛있는 추천을 준비하고 있어요... 🤔" : "오늘은 \"비빔밥\" 어때요? 🍚"}
                </Text>
                {API_CONFIG.openai.apiKey === 'YOUR_OPENAI_API_KEY_HERE' && (
                  <Text style={styles.apiKeyWarning}>
                    ⚠️ OpenAI API 키를 설정해주세요
                  </Text>
                )}
              </>
            )}
          </View>

          {/* 카테고리 버튼들 */}
          <View style={[
            styles.categoryContainer,
            {
              marginBottom: isSmallScreen ? 15 : 30,
              paddingHorizontal: isSmallScreen ? 5 : 15,
            }
          ]}>
            <TouchableOpacity 
              style={dynamicStyles.categoryButton}
              onPress={() => handleCategoryPress('distance')}
              disabled={isLoading}
            >
              <Text style={dynamicStyles.categoryButtonText}>거리</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.categoryButton}
              onPress={() => handleCategoryPress('cost')}
              disabled={isLoading}
            >
              <Text style={dynamicStyles.categoryButtonText}>가격</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.categoryButton}
              onPress={() => handleCategoryPress('preference')}
              disabled={isLoading}
            >
              <Text style={dynamicStyles.categoryButtonText}>선호도</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={dynamicStyles.categoryButton}
              onPress={() => handleCategoryPress('allergy')}
              disabled={isLoading}
            >
              <Text style={dynamicStyles.categoryButtonText}>알레르기</Text>
            </TouchableOpacity>
          </View>

          {/* 캐릭터 애니메이션과 말풍선 */}
          {!isKeyboardVisible && (
            <View style={[
              styles.characterContainer,
              { minHeight: isSmallScreen ? 150 : 200 }
            ]}>
              {/* 말풍선 - 응답이 있을 때만 표시 */}
              {showResponse && (
                <View style={styles.speechBubbleContainer}>
                  <View style={styles.speechBubble}>
                    <TouchableOpacity 
                      style={styles.bubbleCloseButton}
                      onPress={handleBackToMenu}
                    >
                      <Text style={styles.bubbleCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                    
                    {/* 에러 표시 및 재시도 버튼 */}
                    {apiError && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {apiError}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                          <Text style={styles.retryButtonText}>다시 시도</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <ScrollView 
                      style={styles.bubbleScrollView}
                      contentContainerStyle={styles.bubbleScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={[styles.bubbleText, { fontSize: isSmallScreen ? 13 : 15 }]}>
                        {isLoading ? "얌이가 맛있는 메뉴를 생각하고 있어요... 🤔💭" : currentResponse}
                      </Text>
                    </ScrollView>
                  </View>
                  <View style={styles.speechBubbleTail} />
                </View>
              )}
              
              {/* GIF 캐릭터 */}
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
      <View style={[
        styles.inputContainer,
        { 
          bottom: isKeyboardVisible ? keyboardHeight + 30 : 0,
          paddingBottom: isKeyboardVisible ? 15 : Math.max(insets.bottom, 10),
        }
      ]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.textInput,
              { 
                fontSize: isSmallScreen ? 14 : 16,
                opacity: isLoading ? 0.6 : 1, // 로딩 중 입력창 비활성화 표시
              }
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isLoading ? "처리 중..." : "얌이에게 급식 메뉴를 물어보세요! 🍽️"}
            placeholderTextColor="#999"
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={true}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { 
                paddingHorizontal: isSmallScreen ? 16 : 20,
                paddingVertical: isSmallScreen ? 10 : 12,
                opacity: isLoading || inputText.trim() === '' ? 0.6 : 1,
              }
            ]}
            onPress={handleSendMessage}
            disabled={isLoading || inputText.trim() === ''}
          >
            <Text style={[
              styles.sendButtonText,
              { fontSize: isSmallScreen ? 14 : 16 }
            ]}>
              {isLoading ? '전송 중...' : '전송'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- 5. 스타일시트 (기존 + 새로운 스타일 추가) ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
    width: '100%',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  leftSection: {
    flex: 0,
    alignItems: 'flex-start',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  settingsButton: {
    padding: 5,
  },
  settingsIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  closeButtonContainer: {
    padding: 5,
  },
  closeButton: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
  },
  keyboardActiveContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 26 : 30,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: isSmallScreen ? 4 : 8,
  },
  categoryButton: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: isSmallScreen ? 8 : 12,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: isSmallScreen ? 2 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    marginTop: 60,
    position: 'relative',
  },
  
  // 말풍선 관련 스타일들
  speechBubbleContainer: {
    position: 'absolute',
    top: -285,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  
  speechBubble: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxWidth: SCREEN_WIDTH - 40,
    minWidth: 280,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFBF00',
  },
  
  speechBubbleTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -4,
  },
  
  bubbleCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: '#FFBF00',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  bubbleCloseButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  
  bubbleScrollView: {
    maxHeight: 220,
    paddingTop: 10,
  },
  
  bubbleScrollContent: {
    paddingBottom: 5,
  },
  
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
    textAlign: 'left',
  },
  
  characterGif: {
    width: 250,
    height: 250,
  },
  
  // 새로 추가된 API 키 경고 스타일
  apiKeyWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFB3B3',
  },
  
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  retryButton: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'center',
  },
  
  retryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },

  // 기존 스타일들
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 15,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderRadius: 25,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sendButton: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});