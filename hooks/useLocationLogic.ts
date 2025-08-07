// hooks/useLocationLogic.ts
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';

export interface NearbyStore {
  name: string;
  address: string;
  distance: number;
  tmapLink: string;
  category: string;
  rating?: number;
  phone?: string;
  id?: string;
}

export const useLocationLogic = () => {
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // TMAP 링크 생성 함수
  const generateTmapLink = (lat: number, lng: number, name: string) => {
    return `tmap://search?name=${encodeURIComponent(name)}&coordinate=${lat},${lng}`;
  };

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // TMAP API를 사용한 실제 가게 검색
  const searchNearbyStores = async (latitude: number, longitude: number) => {
    try {
      const TMAP_API_KEY = process.env.EXPO_PUBLIC_TMAP_API_KEY;
      
      if (!TMAP_API_KEY) {
        throw new Error('TMAP API 키가 설정되지 않았습니다.');
      }

      // TMAP POI 통합검색 API 사용 - 음식점 검색
      const searchKeywords = ['맛집', '음식점', '식당', '카페', '치킨', '피자', '햄버거'];
      const allStores: NearbyStore[] = [];
      
      // 여러 키워드로 검색하여 다양한 가게 찾기
      for (const keyword of searchKeywords.slice(0, 3)) { // 처음 3개 키워드만 사용
        try {
          const response = await fetch(
            `https://apis.openapi.sk.com/tmap/pois/search/around?version=1&searchKeyword=${encodeURIComponent(keyword)}&centerLon=${longitude}&centerLat=${latitude}&radius=2000&searchType=all&searchtypCd=A&reqCoordType=WGS84GEO&resCoordType=WGS84GEO&count=10`,
            {
              headers: {
                'Accept': 'application/json',
                'appKey': TMAP_API_KEY,
              },
            }
          );

          if (!response.ok) {
            console.warn(`TMAP API 호출 실패 (${keyword}):`, response.status, response.statusText);
            continue;
          }

          const data = await response.json();
          
          if (data.searchPoiInfo && data.searchPoiInfo.pois && data.searchPoiInfo.pois.poi) {
            const pois = Array.isArray(data.searchPoiInfo.pois.poi) 
              ? data.searchPoiInfo.pois.poi 
              : [data.searchPoiInfo.pois.poi];

            const stores = pois
              .filter((poi: any) => {
                // 음식점 관련 카테고리만 필터링
                const categoryName = poi.upperBizName || poi.middleBizName || poi.lowerBizName || '';
                return categoryName.includes('음식') || 
                       categoryName.includes('식당') || 
                       categoryName.includes('카페') ||
                       categoryName.includes('치킨') ||
                       categoryName.includes('피자') ||
                       categoryName.includes('햄버거') ||
                       categoryName.includes('중국') ||
                       categoryName.includes('한식') ||
                       categoryName.includes('양식') ||
                       categoryName.includes('일식') ||
                       poi.name.includes('식당') ||
                       poi.name.includes('카페');
              })
              .map((poi: any) => {
                const poiLat = parseFloat(poi.noorLat);
                const poiLon = parseFloat(poi.noorLon);
                const distance = calculateDistance(latitude, longitude, poiLat, poiLon);
                
                // 카테고리 결정
                let category = '기타';
                const bizName = (poi.upperBizName || poi.middleBizName || poi.lowerBizName || '').toLowerCase();
                const name = poi.name.toLowerCase();
                
                if (bizName.includes('치킨') || name.includes('치킨')) category = '치킨';
                else if (bizName.includes('피자') || name.includes('피자')) category = '피자';
                else if (bizName.includes('햄버거') || name.includes('버거') || name.includes('맥도날드') || name.includes('버거킹') || name.includes('맘스터치') || name.includes('롯데리아')) category = '햄버거';
                else if (bizName.includes('중국') || bizName.includes('중식') || name.includes('짜장') || name.includes('짬뽕')) category = '중식';
                else if (bizName.includes('일식') || name.includes('초밥') || name.includes('라멘') || name.includes('돈까스')) category = '일식';
                else if (bizName.includes('카페') || name.includes('카페') || name.includes('커피')) category = '카페';
                else if (bizName.includes('한식') || name.includes('한식')) category = '한식';
                else if (bizName.includes('양식')) category = '양식';
                else if (bizName.includes('음식') || bizName.includes('식당')) category = '음식점';

                return {
                  name: poi.name,
                  address: poi.upperAddrName && poi.middleAddrName 
                    ? `${poi.upperAddrName} ${poi.middleAddrName} ${poi.lowerAddrName || ''}`.trim()
                    : (poi.roadName || poi.detailAddrname || '주소 정보 없음'),
                  distance,
                  tmapLink: generateTmapLink(poiLat, poiLon, poi.name),
                  category,
                  phone: poi.telNo || undefined,
                  id: poi.id,
                };
              })
              .filter((store: NearbyStore) => store.distance <= 2); // 2km 이내만

            allStores.push(...stores);
          }
        } catch (keywordError) {
          console.warn(`키워드 "${keyword}" 검색 중 오류:`, keywordError);
        }
      }

      // 중복 제거 (같은 이름의 가게)
      const uniqueStores = allStores.filter((store, index, self) => 
        index === self.findIndex((s) => s.name === store.name)
      );

      // 거리순으로 정렬하고 상위 10개만 반환
      const sortedStores = uniqueStores
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);

      if (sortedStores.length === 0) {
        // TMAP에서 결과를 찾지 못한 경우 기본 검색 시도
        return await fallbackSearch(latitude, longitude);
      }

      return sortedStores;
    } catch (error) {
      console.error('TMAP API 가게 검색 오류:', error);
      // 에러 발생시 기본 검색으로 폴백
      return await fallbackSearch(latitude, longitude);
    }
  };

  // 폴백 검색 (일반적인 POI 검색)
  const fallbackSearch = async (latitude: number, longitude: number) => {
    try {
      const TMAP_API_KEY = process.env.EXPO_PUBLIC_TMAP_API_KEY;
      
      const response = await fetch(
        `https://apis.openapi.sk.com/tmap/pois/search/around?version=1&searchKeyword=음식점&centerLon=${longitude}&centerLat=${latitude}&radius=1500&searchType=all&searchtypCd=A&reqCoordType=WGS84GEO&resCoordType=WGS84GEO&count=15`,
        {
          headers: {
            'Accept': 'application/json',
            'appKey': TMAP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TMAP API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.searchPoiInfo || !data.searchPoiInfo.pois || !data.searchPoiInfo.pois.poi) {
        return [];
      }

      const pois = Array.isArray(data.searchPoiInfo.pois.poi) 
        ? data.searchPoiInfo.pois.poi 
        : [data.searchPoiInfo.pois.poi];

      return pois.map((poi: any) => {
        const poiLat = parseFloat(poi.noorLat);
        const poiLon = parseFloat(poi.noorLon);
        const distance = calculateDistance(latitude, longitude, poiLat, poiLon);
        
        return {
          name: poi.name,
          address: poi.upperAddrName && poi.middleAddrName 
            ? `${poi.upperAddrName} ${poi.middleAddrName} ${poi.lowerAddrName || ''}`.trim()
            : (poi.roadName || poi.detailAddrname || '주소 정보 없음'),
          distance,
          tmapLink: generateTmapLink(poiLat, poiLon, poi.name),
          category: '음식점',
          phone: poi.telNo || undefined,
        };
      })
      .filter((store: NearbyStore) => store.distance <= 1.5)
      .sort((a: NearbyStore, b: NearbyStore) => a.distance - b.distance)
      .slice(0, 8);

    } catch (error) {
      console.error('폴백 검색 오류:', error);
      throw new Error('주변 가게를 찾을 수 없습니다. 네트워크 연결을 확인해주세요.');
    }
  };

  // 위치 권한 요청 및 현재 위치 가져오기
  const getCurrentLocation = async (): Promise<Location.LocationObject> => {
    // 권한 요청
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.');
    }

    // 현재 위치 가져오기
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  };

  // 거리 버튼 클릭 핸들러
  const handleDistancePress = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      // 현재 위치 가져오기
      const location = await getCurrentLocation();
      const { latitude, longitude } = location.coords;

      // 가까운 가게 검색
      const stores = await searchNearbyStores(latitude, longitude);
      setNearbyStores(stores);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '위치를 가져오는 중 오류가 발생했습니다.';
      setLocationError(errorMessage);
      
      // 사용자에게 알림
      Alert.alert(
        '위치 오류',
        errorMessage,
        [
          {
            text: '설정으로 이동',
            onPress: () => {
              // 설정 앱으로 이동하는 로직 추가 가능
            }
          },
          {
            text: '확인',
            style: 'default'
          }
        ]
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  return {
    nearbyStores,
    isLocationLoading,
    locationError,
    handleDistancePress,
  };
};