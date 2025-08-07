// nutrition.tsx - 영양소 분석 페이지 (헤더 중복 해결)
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isSmallScreen, styles } from '../styles/nutritionStyles';

// 영양소 분석 결과 타입
type NutritionData = {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
};

// 영양 레벨 게이지 컴포넌트
const NutritionGauge = ({ label, current, target, unit, color }: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isGood = percentage >= 80 && percentage <= 120;
  const isExcess = percentage > 120;
  
  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <Text style={styles.gaugeLabel}>{label}</Text>
        <Text style={[styles.gaugeValue, { color: isExcess ? '#FF5722' : isGood ? '#4CAF50' : '#FF9800' }]}>
          {current}{unit} / {target}{unit}
        </Text>
      </View>
      <View style={styles.gaugeBarContainer}>
        <View style={styles.gaugeBarBackground}>
          <View 
            style={[
              styles.gaugeBarFill, 
              { 
                width: `${percentage}%`, 
                backgroundColor: isExcess ? '#FF5722' : isGood ? '#4CAF50' : '#FF9800'
              }
            ]} 
          />
        </View>
        <Text style={styles.gaugePercentage}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

// Expo Router 옵션 - 상단 네비게이션 바 숨기기
export const options = {
  gestureEnabled: false,
  swipeEnabled: false,
  presentation: 'card',
  headerShown: false, // 🎯 상단 네비게이션 바 숨기기
};

export default function NutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [foodInput, setFoodInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  // 임시 일일 영양 섭취 데이터
  const dailyNutrition = {
    calories: { current: 1650, target: 2000 },
    protein: { current: 65, target: 80 },
    carbs: { current: 180, target: 250 },
    fat: { current: 45, target: 65 },
    fiber: { current: 18, target: 25 },
    sodium: { current: 1800, target: 2000 },
  };

  // 음식 분석 함수 (실제로는 API 호출)
  const analyzeFood = async () => {
    if (!foodInput.trim()) {
      Alert.alert('알림', '분석할 음식을 입력해주세요!');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 실제로는 여기서 API 호출
      // 예시 데이터
      setTimeout(() => {
        const mockData: NutritionData = {
          food: foodInput,
          calories: 350,
          protein: 15.2,
          carbs: 45.8,
          fat: 12.1,
          fiber: 3.5,
          sodium: 450,
          sugar: 8.2,
        };
        setNutritionData(mockData);
        setIsAnalyzing(false);
      }, 2000);
    } catch (error) {
      setIsAnalyzing(false);
      Alert.alert('오류', '분석 중 오류가 발생했습니다.');
    }
  };

  // 결과 초기화
  const resetAnalysis = () => {
    setNutritionData(null);
    setFoodInput('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 커스텀 헤더 (Safe Area까지 확장) */}
      <LinearGradient
        colors={['#FFBF00', '#FDD046']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { fontSize: isSmallScreen ? 20 : 24 }]}>
              영양소
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 메인 컨텐츠 */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 일일 영양 레벨 게이지 섹션 */}
        <View style={styles.dailyNutritionSection}>
          <Text style={styles.sectionTitle}>🎯 오늘의 영양 달성률</Text>
          <Text style={styles.sectionSubtitle}>권장 섭취량 대비 현재 상태</Text>
          
          <View style={styles.gaugeGrid}>
            <NutritionGauge
              label="칼로리"
              current={dailyNutrition.calories.current}
              target={dailyNutrition.calories.target}
              unit="kcal"
              color="#FF8F00"
            />
            <NutritionGauge
              label="단백질"
              current={dailyNutrition.protein.current}
              target={dailyNutrition.protein.target}
              unit="g"
              color="#4CAF50"
            />
            <NutritionGauge
              label="탄수화물"
              current={dailyNutrition.carbs.current}
              target={dailyNutrition.carbs.target}
              unit="g"
              color="#2196F3"
            />
            <NutritionGauge
              label="지방"
              current={dailyNutrition.fat.current}
              target={dailyNutrition.fat.target}
              unit="g"
              color="#FF9800"
            />
            <NutritionGauge
              label="식이섬유"
              current={dailyNutrition.fiber.current}
              target={dailyNutrition.fiber.target}
              unit="g"
              color="#8BC34A"
            />
            <NutritionGauge
              label="나트륨"
              current={dailyNutrition.sodium.current}
              target={dailyNutrition.sodium.target}
              unit="mg"
              color="#9C27B0"
            />
          </View>
          
          {/* 오늘의 영양 상태 요약 */}
          <View style={styles.nutritionSummary}>
            <Text style={styles.summaryTitle}>📊 오늘의 영양 상태</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.goodCard]}>
                <Text style={styles.summaryIcon}>✅</Text>
                <Text style={styles.summaryLabel}>양호</Text>
                <Text style={styles.summaryCount}>3개</Text>
              </View>
              <View style={[styles.summaryCard, styles.warningCard]}>
                <Text style={styles.summaryIcon}>⚠️</Text>
                <Text style={styles.summaryLabel}>부족</Text>
                <Text style={styles.summaryCount}>2개</Text>
              </View>
              <View style={[styles.summaryCard, styles.excessCard]}>
                <Text style={styles.summaryIcon}>🔴</Text>
                <Text style={styles.summaryLabel}>과다</Text>
                <Text style={styles.summaryCount}>1개</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 섭취한 영양에 대한 설명 섹션 */}
        <View style={styles.nutritionInfoSection}>
          <Text style={styles.sectionTitle}>📚 영양소 가이드</Text>
          
          <View style={styles.nutritionInfoGrid}>
            <View style={styles.nutritionInfoCard}>
              <Text style={styles.infoIcon}>💪</Text>
              <Text style={styles.infoTitle}>단백질</Text>
              <Text style={styles.infoDescription}>
                근육 형성과 유지에 필수적인 영양소입니다. 
                육류, 생선, 계란, 콩류에 풍부하게 들어있어요.
              </Text>
              <Text style={styles.infoRecommend}>권장: 체중 1kg당 0.8-1.2g</Text>
            </View>
            
            <View style={styles.nutritionInfoCard}>
              <Text style={styles.infoIcon}>🍞</Text>
              <Text style={styles.infoTitle}>탄수화물</Text>
              <Text style={styles.infoDescription}>
                뇌와 근육의 주요 에너지원입니다. 
                현미, 통곡물, 과일 등 복합탄수화물을 선택하세요.
              </Text>
              <Text style={styles.infoRecommend}>권장: 총 칼로리의 45-65%</Text>
            </View>
            
            <View style={styles.nutritionInfoCard}>
              <Text style={styles.infoIcon}>🥑</Text>
              <Text style={styles.infoTitle}>지방</Text>
              <Text style={styles.infoDescription}>
                호르몬 생성과 비타민 흡수에 중요합니다. 
                견과류, 올리브오일, 생선 등 좋은 지방을 섭취하세요.
              </Text>
              <Text style={styles.infoRecommend}>권장: 총 칼로리의 20-35%</Text>
            </View>
            
            <View style={styles.nutritionInfoCard}>
              <Text style={styles.infoIcon}>🌾</Text>
              <Text style={styles.infoTitle}>식이섬유</Text>
              <Text style={styles.infoDescription}>
                소화 건강과 포만감에 도움을 줍니다. 
                채소, 과일, 통곡물에서 충분히 섭취하세요.
              </Text>
              <Text style={styles.infoRecommend}>권장: 하루 25-35g</Text>
            </View>
          </View>
        </View>

        {/* 음식 분석 입력 섹션 */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>🔍 음식 영양소 분석</Text>
          <Text style={styles.inputLabel}>분석할 음식을 입력하세요</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={foodInput}
              onChangeText={setFoodInput}
              placeholder="예: 김치찌개, 치킨 샐러드, 비빔밥..."
              placeholderTextColor="#999"
              returnKeyType="search"
              onSubmitEditing={analyzeFood}
              editable={!isAnalyzing}
            />
            <TouchableOpacity 
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={analyzeFood}
              disabled={isAnalyzing}
            >
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? '분석 중...' : '분석하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 로딩 상태 */}
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <Text style={styles.loadingText}>🔍</Text>
            </View>
            <Text style={styles.loadingMessage}>영양소를 분석하고 있어요...</Text>
          </View>
        )}

        {/* 분석 결과 */}
        {nutritionData && !isAnalyzing && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>📊 {nutritionData.food} 영양 정보</Text>
              <TouchableOpacity onPress={resetAnalysis} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>새로 분석</Text>
              </TouchableOpacity>
            </View>

            {/* 칼로리 카드 */}
            <View style={[styles.nutritionCard, styles.calorieCard]}>
              <Text style={styles.calorieValue}>{nutritionData.calories}</Text>
              <Text style={styles.calorieUnit}>kcal</Text>
              <Text style={styles.calorieLabel}>총 칼로리</Text>
            </View>

            {/* 영양소 상세 정보 */}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutritionData.protein}g</Text>
                <Text style={styles.nutritionLabel}>단백질</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutritionData.carbs}g</Text>
                <Text style={styles.nutritionLabel}>탄수화물</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutritionData.fat}g</Text>
                <Text style={styles.nutritionLabel}>지방</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutritionData.fiber}g</Text>
                <Text style={styles.nutritionLabel}>식이섬유</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutritionData.sodium}mg</Text>
                <Text style={styles.nutritionLabel}>나트륨</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutritionData.sugar}g</Text>
                <Text style={styles.nutritionLabel}>당분</Text>
              </View>
            </View>

            {/* 건강 팁 */}
            <View style={styles.tipSection}>
              <Text style={styles.tipTitle}>💡 건강 팁</Text>
              <Text style={styles.tipText}>
                균형 잡힌 식사를 위해 단백질, 탄수화물, 지방을 적절히 섭취하세요. 
                나트륨 섭취량을 주의하고, 충분한 물을 마시는 것도 잊지 마세요!
              </Text>
            </View>
          </View>
        )}

        {/* 추천 음식 섹션 */}
        {!nutritionData && !isAnalyzing && (
          <View style={styles.recommendationSection}>
            <Text style={styles.recommendationTitle}>🍽️ 인기 분석 음식</Text>
            <View style={styles.foodChips}>
              {['김치찌개', '불고기', '비빔밥', '된장찌개', '치킨 샐러드', '삼겹살'].map((food) => (
                <TouchableOpacity
                  key={food}
                  style={styles.foodChip}
                  onPress={() => setFoodInput(food)}
                >
                  <Text style={styles.foodChipText}>{food}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}