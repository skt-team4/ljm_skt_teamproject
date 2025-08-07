// screens/FoodCategoryScreen.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import userLocationStore from '../stores/userLocationStore';

interface FoodCategory {
  id: string;
  name: string;
  emoji: string;
  keywords: string[];
}

const FOOD_CATEGORIES: FoodCategory[] = [
  { id: 'korean', name: '한식', emoji: '🍚', keywords: ['한식', '김치찌개', '불고기', '비빔밥'] },
  { id: 'chinese', name: '중식', emoji: '🥢', keywords: ['중식', '짜장면', '짬뽕', '탕수육'] },
  { id: 'japanese', name: '일식', emoji: '🍣', keywords: ['일식', '초밥', '라멘', '우동'] },
  { id: 'western', name: '양식', emoji: '🍝', keywords: ['양식', '파스타', '스테이크', '샐러드'] },
  { id: 'pizza', name: '피자', emoji: '🍕', keywords: ['피자'] },
  { id: 'burger', name: '햄버거', emoji: '🍔', keywords: ['햄버거', '버거'] },
  { id: 'chicken', name: '치킨', emoji: '🍗', keywords: ['치킨', '닭'] },
  { id: 'pork', name: '고기구이', emoji: '🥓', keywords: ['삼겹살', '갈비', '곱창'] },
  { id: 'jokbal', name: '족발/보쌈', emoji: '🥩', keywords: ['족발', '보쌈'] },
  { id: 'cafe', name: '카페', emoji: '☕', keywords: ['카페', '커피', '디저트'] },
  { id: 'bakery', name: '베이커리', emoji: '🥐', keywords: ['빵', '베이커리', '케이크'] },
  { id: 'etc', name: '기타', emoji: '🍽️', keywords: ['기타'] },
];

export default function FoodCategoryScreen() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    checkUserLocation();
  }, []);

  const checkUserLocation = async () => {
    const location = await userLocationStore.getUserLocation();
    if (!location) {
      Alert.alert(
        '위치 정보 없음',
        '위치가 설정되지 않았습니다. 설정에서 위치를 등록해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정하기', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }
    setUserLocation(location);
  };

  const handleCategorySelect = async (category: FoodCategory) => {
    if (!userLocation) {
      Alert.alert('오류', '위치 정보가 없습니다.');
      return;
    }

    setSelectedCategory(category.id);
    setLoading(true);

    try {
      // 세부 음식 종류 선택
      const selectedFood = await showFoodOptionsDialog(category);
      if (!selectedFood) {
        setSelectedCategory(null);
        setLoading(false);
        return;
      }

      // 음식점 검색 화면으로 이동 (파라미터 전달)
      router.push({
        pathname: '/restaurant-search',
        params: {
          foodType: selectedFood,
          categoryName: category.name,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          locationName: userLocation.name,
        },
      });
    } catch (error) {
      Alert.alert('오류', '음식점 검색 중 오류가 발생했습니다.');
    } finally {
      setSelectedCategory(null);
      setLoading(false);
    }
  };

  const showFoodOptionsDialog = (category: FoodCategory): Promise<string | null> => {
    return new Promise((resolve) => {
      const options = category.keywords.map((keyword, index) => ({
        text: keyword,
        onPress: () => resolve(keyword),
      }));
      
      options.push({ text: '취소', onPress: () => resolve(null) });

      Alert.alert(
        `${category.name} 세부 선택`,
        '어떤 음식을 찾고 계신가요?',
        options
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>음식 카테고리 선택</Text>
        {userLocation && (
          <Text style={styles.locationText}>
            📍 {userLocation.name}
          </Text>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesGrid}>
          {FOOD_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.selectedCard,
              ]}
              onPress={() => handleCategorySelect(category)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              
              {selectedCategory === category.id && loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#FFBF00" size="small" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.locationButtonText}>📍 위치 변경</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#FFBF00',
    backgroundColor: '#fffbf0',
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  footer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  locationButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});