import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// 샘플 영양소 데이터
const nutritionData = {
  today: {
    calories: { current: 1850, target: 2000 },
    macros: [
      { name: '단백질', value: 75, target: 100, color: '#FF6B6B', percentage: 20 },
      { name: '탄수화물', value: 220, target: 250, color: '#4ECDC4', percentage: 55 },
      { name: '지방', value: 65, target: 70, color: '#45B7D1', percentage: 25 },
    ],
    micronutrients: [
      { name: '비타민C', percentage: 85, color: '#FF6B6B' },
      { name: '비타민D', percentage: 60, color: '#4ECDC4' },
      { name: '칼슘', percentage: 85, color: '#45B7D1' },
      { name: '철분', percentage: 73, color: '#96CEB4' },
      { name: '아연', percentage: 80, color: '#FECA57' },
      { name: '섬유질', percentage: 72, color: '#FF9FF3' },
    ]
  },
  weekly: {
    calories: [1920, 1850, 2100, 1780, 1950, 1880, 1850],
    balance: [78, 82, 75, 88, 79, 85, 78],
    days: ['월', '화', '수', '목', '금', '토', '일']
  }
};

export default function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly'>('daily');

  // 칼로리 도넛 차트 데이터
  const calorieChartData = [
    {
      name: '섭취',
      population: nutritionData.today.calories.current,
      color: '#FFBF00',
      legendFontColor: '#333',
    },
    {
      name: '남은 칼로리',
      population: nutritionData.today.calories.target - nutritionData.today.calories.current,
      color: '#E0E0E0',
      legendFontColor: '#666',
    }
  ];

  // 3대 영양소 도넛 차트 데이터
  const macroChartData = nutritionData.today.macros.map(macro => ({
    name: macro.name,
    population: macro.percentage,
    color: macro.color,
    legendFontColor: '#333',
  }));

  // 주간 칼로리 라인 차트 데이터
  const weeklyCaloriesData = {
    labels: nutritionData.weekly.days,
    datasets: [
      {
        data: nutritionData.weekly.calories,
        color: (opacity = 1) => `rgba(255, 191, 0, ${opacity})`,
        strokeWidth: 3,
      }
    ],
  };

  // 주간 영양 균형 바 차트 데이터
  const weeklyBalanceData = {
    labels: nutritionData.weekly.days,
    datasets: [
      {
        data: nutritionData.weekly.balance,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      }
    ],
  };

  // 차트 설정
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(255, 191, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  // 원형 진행률 컴포넌트
  const CircularProgress = ({ percentage, color, size = 80, strokeWidth = 8 }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ width: size, height: size, position: 'relative' }}>
        <View style={[styles.circularProgress, { width: size, height: size }]}>
          <View style={[styles.circularTrack, { 
            width: size - strokeWidth, 
            height: size - strokeWidth,
            borderWidth: strokeWidth / 2,
            borderRadius: (size - strokeWidth) / 2,
          }]} />
          <View style={[styles.circularFill, { 
            width: size - strokeWidth, 
            height: size - strokeWidth,
            borderWidth: strokeWidth / 2,
            borderRadius: (size - strokeWidth) / 2,
            borderColor: color,
            transform: [{ rotate: `${(percentage / 100) * 360}deg` }],
          }]} />
        </View>
        <View style={[styles.circularLabel, { width: size, height: size }]}>
          <Text style={[styles.percentageText, { color }]}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    );
  };

  // 미량 영양소 원형 진행률
  const MicronutrientCard = ({ name, percentage, color }: any) => (
    <View style={styles.microCard}>
      <CircularProgress percentage={percentage} color={color} size={60} strokeWidth={6} />
      <Text style={styles.microName}>{name}</Text>
      <View style={[styles.microColorDot, { backgroundColor: color }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>영양소 리포트</Text>
      </View>

      {/* 탭 선택 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'daily' && styles.activeTab]}
          onPress={() => setSelectedTab('daily')}
        >
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.activeTabText]}>
            📊 일간 리포트
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => setSelectedTab('weekly')}
        >
          <Text style={[styles.tabText, selectedTab === 'weekly' && styles.activeTabText]}>
            📈 주간 리포트
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'daily' && (
          <View>
            {/* 칼로리 도넛 차트 */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🔥 오늘의 칼로리</Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={calorieChartData}
                  width={width - 80}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  hasLegend={false}
                />
                <View style={styles.calorieStats}>
                  <Text style={styles.calorieMain}>
                    {nutritionData.today.calories.current.toLocaleString()}
                  </Text>
                  <Text style={styles.calorieTarget}>
                    / {nutritionData.today.calories.target.toLocaleString()} kcal
                  </Text>
                  <Text style={styles.calorieRemaining}>
                    {(nutritionData.today.calories.target - nutritionData.today.calories.current).toLocaleString()}kcal 남음
                  </Text>
                </View>
              </View>
            </View>

            {/* 3대 영양소 도넛 차트 */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🍎 3대 영양소 비율</Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={macroChartData}
                  width={width - 80}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  hasLegend={false}
                />
                <View style={styles.macroLegend}>
                  {nutritionData.today.macros.map((macro, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: macro.color }]} />
                      <Text style={styles.legendText}>
                        {macro.name} {macro.percentage}%
                      </Text>
                      <Text style={styles.legendValue}>
                        {macro.value}g
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 미량 영양소 원형 차트들 */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>💊 비타민 & 미네랄</Text>
              <View style={styles.microGrid}>
                {nutritionData.today.micronutrients.map((micro, index) => (
                  <MicronutrientCard
                    key={index}
                    name={micro.name}
                    percentage={micro.percentage}
                    color={micro.color}
                  />
                ))}
              </View>
            </View>

            {/* 영양 균형 점수 */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🎯 오늘의 영양 균형</Text>
              <View style={styles.radarContainer}>
                <View style={styles.radarChart}>
                  <View style={styles.radarCenter}>
                    <Text style={styles.radarScore}>78</Text>
                    <Text style={styles.radarLabel}>균형점수</Text>
                  </View>
                </View>
                <View style={styles.radarLegend}>
                  <Text style={styles.radarDescription}>
                    전체적으로 균형잡힌 식단이에요! 🎉{'\n'}
                    비타민 D와 식이섬유를 조금 더 섭취해보세요.
                  </Text>
                </View>
              </View>
            </View>

            {/* 개선 제안 */}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>💡 맞춤 조언</Text>
              <View style={styles.adviceList}>
                <View style={styles.adviceItem}>
                  <Text style={styles.adviceEmoji}>🥬</Text>
                  <Text style={styles.adviceText}>녹색 채소로 식이섬유를 늘려보세요</Text>
                </View>
                <View style={styles.adviceItem}>
                  <Text style={styles.adviceEmoji}>☀️</Text>
                  <Text style={styles.adviceText}>햇빛을 쬐거나 비타민D 보충제를 고려해보세요</Text>
                </View>
                <View style={styles.adviceItem}>
                  <Text style={styles.adviceEmoji}>🐟</Text>
                  <Text style={styles.adviceText}>오메가3가 풍부한 생선을 추가해보세요</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'weekly' && (
          <View>
            {/* 주간 칼로리 트렌드 */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📈 주간 칼로리 트렌드</Text>
              <LineChart
                data={weeklyCaloriesData}
                width={width - 48}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 191, 0, ${opacity})`,
                }}
                bezier
                style={styles.lineChart}
                withDots={true}
                withShadow={false}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
              <Text style={styles.chartDescription}>
                이번 주 평균: {Math.round(nutritionData.weekly.calories.reduce((a, b) => a + b) / 7)}kcal
              </Text>
            </View>

            {/* 주간 영양 균형 점수 */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>⚖️ 주간 영양 균형 점수</Text>
              <BarChart
                data={weeklyBalanceData}
                width={width - 48}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                }}
                style={styles.barChart}
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
              <Text style={styles.chartDescription}>
                이번 주 평균 균형 점수: {Math.round(nutritionData.weekly.balance.reduce((a, b) => a + b) / 7)}/100점
              </Text>
            </View>

            {/* 주간 요약 카드 */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 이번 주 요약</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>5</Text>
                  <Text style={styles.summaryLabel}>목표 달성일</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>85%</Text>
                  <Text style={styles.summaryLabel}>평균 달성률</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>👍</Text>
                  <Text style={styles.summaryLabel}>전주 대비</Text>
                </View>
              </View>
            </View>

            {/* 주간 개선 제안 */}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>📊 주간 분석 & 조언</Text>
              <View style={styles.adviceList}>
                <View style={styles.adviceItem}>
                  <Text style={styles.adviceEmoji}>📈</Text>
                  <Text style={styles.adviceText}>이번 주는 전주 대비 영양 균형이 개선되었어요</Text>
                </View>
                <View style={styles.adviceItem}>
                  <Text style={styles.adviceEmoji}>🎯</Text>
                  <Text style={styles.adviceText}>목표 칼로리 달성률이 85%로 양호합니다</Text>
                </View>
                <View style={styles.adviceItem}>
                  <Text style={styles.adviceEmoji}>💪</Text>
                  <Text style={styles.adviceText}>다음 주에는 단백질 섭취를 10% 늘려보세요</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b0b0bff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFBF00',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FFBF00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  calorieStats: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 80,
    left: 0,
    right: 0,
  },
  calorieMain: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFBF00',
  },
  calorieTarget: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calorieRemaining: {
    fontSize: 12,
    color: '#999',
  },
  macroLegend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartDescription: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFBF00',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  microCard: {
    width: (width - 80) / 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  microName: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  microColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  circularProgress: {
    position: 'relative',
  },
  circularTrack: {
    borderColor: '#E0E0E0',
    position: 'absolute',
  },
  circularFill: {
    borderColor: '#FFBF00',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
  },
  circularLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  radarContainer: {
    alignItems: 'center',
  },
  radarChart: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarCenter: {
    alignItems: 'center',
  },
  radarScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  radarLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  radarLegend: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  radarDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  adviceCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  adviceList: {
    gap: 12,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adviceEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
});