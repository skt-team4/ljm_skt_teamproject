// services/restaurantSearchService.js
const TMAP_API_KEY = 'YOUR_TMAP_API_KEY_HERE';

class RestaurantSearchService {
  constructor() {
    this.baseURL = 'https://apis.openapi.sk.com/tmap';
  }

  /**
   * 주변 음식점 검색 (TMAP POI 검색)
   * @param {number} lat - 중심점 위도
   * @param {number} lng - 중심점 경도
   * @param {string} foodType - 음식 종류 키워드
   * @param {number} radius - 검색 반경 (미터, 기본 1000m)
   * @param {number} count - 결과 개수 (기본 10개)
   * @returns {Promise<object>} 검색 결과
   */
  async searchNearbyRestaurants(lat, lng, foodType, radius = 1000, count = 10) {
    try {
      const url = `${this.baseURL}/pois`;
      
      const searchKeyword = this.getFoodKeyword(foodType);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'appKey': TMAP_API_KEY,
        },
        // URL 파라미터로 전송
      });

      // TMAP POI 검색 API는 GET 방식이므로 URL에 파라미터를 포함해야 함
      const searchUrl = `${url}?version=1&format=json&callback=result&searchKeyword=${encodeURIComponent(searchKeyword)}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&centerLon=${lng}&centerLat=${lat}&radius=${radius}&count=${count}&searchtypCd=A&multiPoint=N&poiGroupYn=N`;
      
      const actualResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'appKey': TMAP_API_KEY,
        },
      });

      if (!actualResponse.ok) {
        throw new Error(`HTTP error! status: ${actualResponse.status}`);
      }

      const data = await actualResponse.json();
      
      if (data.searchPoiInfo && data.searchPoiInfo.pois) {
        const restaurants = data.searchPoiInfo.pois.poi.map(poi => ({
          id: poi.id,
          name: poi.name,
          address: `${poi.upperAddrName || ''} ${poi.middleAddrName || ''} ${poi.lowerAddrName || ''}`.trim(),
          detailAddress: poi.detailAddrname || '',
          lat: parseFloat(poi.noorLat),
          lng: parseFloat(poi.noorLon),
          phone: poi.telNo || '',
          category: poi.firstNo || '',
          distance: this.calculateDistance(lat, lng, parseFloat(poi.noorLat), parseFloat(poi.noorLon)),
        }));

        // 거리순 정렬
        restaurants.sort((a, b) => a.distance - b.distance);

        return {
          success: true,
          restaurants,
          totalCount: data.searchPoiInfo.totalCount,
        };
      }

      return {
        success: true,
        restaurants: [],
        totalCount: 0,
      };
    } catch (error) {
      console.error('Restaurant search error:', error);
      return {
        success: false,
        error: error.message,
        restaurants: [],
      };
    }
  }

  /**
   * 음식 종류에 따른 검색 키워드 매핑
   * @param {string} foodType - 음식 종류
   * @returns {string} 검색 키워드
   */
  getFoodKeyword(foodType) {
    const keywordMap = {
      // 한식
      '한식': '한식',
      '김치찌개': '한식 김치찌개',
      '불고기': '한식 불고기',
      '비빔밥': '한식 비빔밥',
      '냉면': '한식 냉면',
      '갈비': '한식 갈비',
      
      // 중식
      '중식': '중식',
      '짜장면': '중식 짜장면',
      '짬뽕': '중식 짬뽕',
      '탕수육': '중식 탕수육',
      '마파두부': '중식',
      
      // 일식
      '일식': '일식',
      '초밥': '일식 초밥',
      '라멘': '일식 라멘',
      '돈까스': '일식 돈까스',
      '우동': '일식 우동',
      '회': '일식 회',
      
      // 양식
      '양식': '양식',
      '파스타': '양식 파스타',
      '피자': '피자',
      '스테이크': '양식 스테이크',
      '햄버거': '햄버거',
      
      // 기타
      '치킨': '치킨',
      '족발': '족발',
      '보쌈': '보쌈',
      '곱창': '곱창',
      '삼겹살': '삼겹살',
      '카페': '카페',
      '디저트': '디저트',
      '빵': '베이커리',
    };

    return keywordMap[foodType] || foodType;
  }

  /**
   * Haversine 공식을 사용한 거리 계산
   * @param {number} lat1 - 첫 번째 위도
   * @param {number} lon1 - 첫 번째 경도
   * @param {number} lat2 - 두 번째 위도
   * @param {number} lon2 - 두 번째 경도
   * @returns {number} 거리 (미터)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * 도를 라디안으로 변환
   * @param {number} degrees - 도
   * @returns {number} 라디안
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * 거리를 사용자 친화적으로 포맷
   * @param {number} meters - 미터 단위 거리
   * @returns {string} 포맷된 거리
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
}

export default new RestaurantSearchService();