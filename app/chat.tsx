import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// 화면 크기 가져오기
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

// --- 1. 타입 및 데이터 정의 ---

// 식사 메뉴 관련 타입 정의
type Meal = {
  name: string;
  description: string;
  emoji: string;
};
type MealCategory = 'distance' | 'cost' | 'preference' | 'allergy';

// 챗봇이 사용할 식사 추천 데이터
const mealRecommendations: Record<MealCategory, Meal[]> = {
  distance: [
    { name: '비빔밥', description: '색깔 야채가 가득한 영양 만점 급식!', emoji: '🍚' },
    { name: '된장찌개', description: '따뜻하고 건강한 한식 메뉴!', emoji: '🍲' },
    { name: '잡채', description: '쫄깃한 당면과 야채의 조화!', emoji: '🍜' },
  ],
  cost: [
    { name: '현미밥', description: '식이섬유가 풍부한 건강한 주식!', emoji: '🍚' },
    { name: '생선구이', description: '단백질과 오메가3가 풍부!', emoji: '🐟' },
    { name: '나물반찬', description: '각종 비타민이 가득한 나물들!', emoji: '🥬' },
  ],
  preference: [
    { name: '김밥 도시락', description: '한 끼 식사로 완벽한 김밥!', emoji: '🍙' },
    { name: '치킨 도시락', description: '아이들이 좋아하는 치킨!', emoji: '🍗' },
    { name: '불고기 도시락', description: '달콤한 불고기와 밥!', emoji: '🥩' },
  ],
  allergy: [
    { name: '알레르기 표시', description: '견과류, 우유, 계란 등 주의 표시를 확인하세요!', emoji: '⚠️' },
    { name: '대체 메뉴', description: '알레르기가 있다면 영양사 선생님께 문의!', emoji: '👨‍⚕️' },
    { name: '안전한 급식', description: '모든 아이들이 안전하게 먹을 수 있어요!', emoji: '✅' },
  ],
};

// 카테고리별 챗봇 초기 응답 메시지
const responses: Record<MealCategory, string> = {
  distance: '오늘의 추천 급식 메뉴예요! 영양사 선생님이 특별히 준비하신 메뉴들이에요!',
  cost: '건강한 급식 메뉴를 추천해드릴게요! 성장기 어린이에게 꼭 필요한 영양소가 가득해요!',
  preference: '맛있는 도시락 메뉴를 준비했어요! 한 끼 식사로 완벽한 구성이에요!',
  allergy: '알레르기 관련 안내해드릴게요! 안전한 급식을 위해 꼭 확인하세요!',
};

// --- 2. 챗봇 로직 함수 ---

// 사용자 입력을 분석하여 카테고리를 결정하는 함수
function analyzeInput(message: string): { category: MealCategory } {
  const msg = message.toLowerCase();
  if (msg.includes('거리') || msg.includes('추천')) return { category: 'distance' };
  if (msg.includes('가격') || msg.includes('영양')) return { category: 'cost' };
  if (msg.includes('선호도')) return { category: 'preference' };
  if (msg.includes('알레르기') || msg.includes('주의')) return { category: 'allergy' };
  return { category: 'distance' };
}

// 분석된 카테고리에 맞는 전체 응답 메시지를 생성하는 함수
function generateResponse(analysis: { category: MealCategory }): string {
  let response = responses[analysis.category] + '\n\n';
  const meals = mealRecommendations[analysis.category];

  if (meals) {
    meals.forEach(meal => {
      response += `${meal.emoji} ${meal.name}\n${meal.description}\n\n`;
    });
  }
  return response.trim();
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
        // 키보드가 완전히 사라진 후 상태 업데이트
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

  // 카테고리 버튼 클릭 처리
  const handleCategoryPress = (category: MealCategory) => {
    const analysis = { category };
    const response = generateResponse(analysis);
    setCurrentResponse(response);
    setShowResponse(true);
  };

  // 텍스트 입력으로 질문하기
  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    const analysis = analyzeInput(inputText);
    const response = generateResponse(analysis);
    setCurrentResponse(response);
    setShowResponse(true);
    setInputText('');
    
    // 키보드 숨기기 - 더 빠른 타이밍
    Keyboard.dismiss();
  };

  // 초기 화면으로 돌아가기
  const handleBackToMenu = () => {
    // 키보드 먼저 숨기고 즉시 상태 초기화
    Keyboard.dismiss();
    setShowResponse(false);
    setCurrentResponse('');
  };

  // 반응형 스타일 계산 - 스마트폰만
  const dynamicStyles = {
    welcomeText: {
      ...styles.welcomeText,
      fontSize: isSmallScreen ? 18 : 22,
    },
    categoryButton: {
      ...styles.categoryButton,
      paddingVertical: isSmallScreen ? 8 : 12,
      paddingHorizontal: isSmallScreen ? 6 : 8,
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
          {/* 왼쪽: YUM:AI 로고 */}
          <View style={styles.leftSection}>
            <Text style={[styles.headerTitle, { fontSize: isSmallScreen ? 24 : 28 }]}>YUM:AI</Text>
          </View>
          
          {/* 오른쪽: 설정, 챗봇, 영양소 분석, X 버튼 */}
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
        {!showResponse ? (
          // 초기 화면
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContent,
              { 
                // 키보드에 따른 동적 패딩
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
              }
            ]}>
              <Text style={dynamicStyles.welcomeText}>안녕하세요! 얌이에요!</Text>
              <Text style={dynamicStyles.welcomeText}>오늘은 "오일 파스타" 어때요?</Text>
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
              >
                <Text style={dynamicStyles.categoryButtonText}>거리</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={dynamicStyles.categoryButton}
                onPress={() => handleCategoryPress('cost')}
              >
                <Text style={dynamicStyles.categoryButtonText}>가격</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={dynamicStyles.categoryButton}
                onPress={() => handleCategoryPress('preference')}
              >
                <Text style={dynamicStyles.categoryButtonText}>선호도</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={dynamicStyles.categoryButton}
                onPress={() => handleCategoryPress('allergy')}
              >
                <Text style={dynamicStyles.categoryButtonText}>알레르기</Text>
              </TouchableOpacity>
            </View>

            {/* 캐릭터 애니메이션 */}
            {!isKeyboardVisible && (
              <View style={[
                styles.characterContainer,
                { minHeight: isSmallScreen ? 150 : 200 }
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
        ) : (
          // 응답 화면
          <ScrollView 
            style={styles.responseContainer}
            contentContainerStyle={[
              styles.responseScrollContent,
              { 
                paddingBottom: isKeyboardVisible ? keyboardHeight + 20 : 120,
                minHeight: isKeyboardVisible ? undefined : SCREEN_HEIGHT * 0.5,
              }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToMenu}
            >
              <Text style={styles.backButtonText}>← 메뉴로 돌아가기</Text>
            </TouchableOpacity>
            
            <View style={styles.responseBox}>
              <Text style={[styles.responseText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                {currentResponse}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* 하단 입력창 - 절대 위치로 고정 */}
      <View style={[
        styles.inputContainer,
        { 
          // 키보드 높이만큼 위로 이동 (직접 계산)
          bottom: isKeyboardVisible ? keyboardHeight + 30 : 0,
          paddingBottom: isKeyboardVisible ? 15 : Math.max(insets.bottom, 10),
        }
      ]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.textInput,
              { fontSize: isSmallScreen ? 14 : 16 }
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="얌이에게 메뉴 추천을 받아보세요!"
            placeholderTextColor="#999"
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={true}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { 
                paddingHorizontal: isSmallScreen ? 16 : 20,
                paddingVertical: isSmallScreen ? 10 : 12,
              }
            ]}
            onPress={handleSendMessage}
          >
            <Text style={[
              styles.sendButtonText,
              { fontSize: isSmallScreen ? 14 : 16 }
            ]}>전송</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- 4. 스타일시트 ---

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
    justifyContent: 'center',
    flex: 1,
  },
  characterGif: {
    width: 280,
    height: 280,
  },
  responseContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  responseScrollContent: {
    paddingTop: 20,
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#FFBF00',
    fontWeight: 'bold',
  },
  responseBox: {
    backgroundColor: 'white',
    padding: isSmallScreen ? 16 : 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseText: {
    fontSize: 16,
    lineHeight: isSmallScreen ? 22 : 24,
    color: '#333',
  },
  inputContainer: {
    position: 'absolute', // 절대 위치로 고정
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