// hooks/useDistanceCategory.js
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import userLocationStore from '../stores/userLocationStore';

export const useDistanceCategory = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * 거리 카테고리 버튼 클릭 처리
   */
  const handleDistanceCategoryPress = useCallback(async () => {
    setLoading(true);
    
    try {
      // 사용자 위치 확인
      const userLocation = await userLocationStore.getUserLocation();
      
      if (!userLocation) {
        Alert.alert(
          '위치 정보 없음',
          '거리 기반 검색을 위해서는 위치 설정이 필요합니다.\n설정에서 위치를 등록해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '설정하기', 
              onPress: () => router.push('/settings')
            },
          ]
        );
        return;
      }

      // 음식 카테고리 선택 화면으로 이동
      router.push('../food-category');
      
    } catch (error) {
      console.error('Distance category error:', error);
      Alert.alert('오류', '위치 정보를 확인하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    loading,
    handleDistanceCategoryPress,
  };
};