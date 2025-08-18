import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 추천 음식 인터페이스
interface RecommendedFood {
  id: string;
  foodName: string;
  description: string;
  recommendedAt: string;
  timeAgo: string;
}

const RecommendedFoodScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 샘플 추천 음식 데이터
  const sampleRecommendations: RecommendedFood[] = [
    {
      id: '1',
      foodName: '김치찌개',
      description: '매콤하고 얼큰한 김치찌개로 오늘 같은 추운 날씨에 딱이에요!',
      recommendedAt: '2024-08-15 12:30',
      timeAgo: '방금 전'
    },
    {
      id: '2',
      foodName: '연어 샐러드',
      description: '신선한 연어와 각종 야채로 만든 건강한 샐러드입니다.',
      recommendedAt: '2024-08-14 18:45',
      timeAgo: '1시간 전'
    },
    {
      id: '3',
      foodName: '라면',
      description: '간단하면서도 맛있는 라면! 야식으로 최고죠.',
      recommendedAt: '2024-08-14 22:15',
      timeAgo: '3시간 전'
    },
    {
      id: '4',
      foodName: '스크램블 에그',
      description: '부드럽고 고소한 스크램블 에그로 아침을 시작해보세요.',
      recommendedAt: '2024-08-13 07:30',
      timeAgo: '어제'
    },
    {
      id: '5',
      foodName: '아이스크림',
      description: '더운 날씨에 시원한 바닐라 아이스크림은 어떠세요?',
      recommendedAt: '2024-08-12 15:20',
      timeAgo: '2일 전'
    },
    {
      id: '6',
      foodName: '불고기',
      description: '달콤한 양념에 재운 한우 불고기로 든든한 한 끼!',
      recommendedAt: '2024-08-11 12:00',
      timeAgo: '3일 전'
    },
    {
      id: '7',
      foodName: '피자',
      description: '치즈가 듬뿍 올라간 마르게리타 피자 어떠세요?',
      recommendedAt: '2024-08-10 19:30',
      timeAgo: '4일 전'
    },
    {
      id: '8',
      foodName: '비빔밥',
      description: '각종 나물과 고추장이 어우러진 건강한 비빔밥입니다.',
      recommendedAt: '2024-08-09 13:15',
      timeAgo: '5일 전'
    }
  ];

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      // API 호출 시뮬레이션
      setTimeout(() => {
        setRecommendations(sampleRecommendations);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('추천 내역 로딩 실패:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const removeRecommendation = (id: string, foodName: string) => {
    Alert.alert(
      '삭제',
      `"${foodName}" 추천을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setRecommendations(prev => prev.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  const renderTimelineItem = ({ item, index }: { item: RecommendedFood; index: number }) => {
    const isLast = index === recommendations.length - 1;
    
    return (
      <View style={styles.timelineItem}>
        {/* 타임라인 선과 점 */}
        <View style={styles.timelineIndicator}>
          <View style={styles.timelineDot} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        {/* 내용 */}
        <TouchableOpacity 
          style={styles.contentContainer}
          onLongPress={() => removeRecommendation(item.id, item.foodName)}
        >
          <View style={styles.contentHeader}>
            <Text style={styles.foodName}>{item.foodName}</Text>
            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>추천 내역을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>추천받은 음식</Text>
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderTimelineItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyText}>아직 추천받은 음식이 없어요</Text>
            <Text style={styles.emptySubText}>챗봇에서 음식 추천을 받고 👍를 눌러보세요!</Text>
          </View>
        }
        ListFooterComponent={
          recommendations.length > 0 ? (
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>길게 눌러서 삭제할 수 있어요</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginBottom: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e0e0e0',
    minHeight: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default RecommendedFoodScreen;