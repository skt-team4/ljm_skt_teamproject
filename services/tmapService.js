// services/tmapService.js
const TMAP_API_KEY = 'YOUR_TMAP_API_KEY_HERE'; // .env 파일에서 관리하는 것을 권장

class TmapService {
  constructor() {
    this.baseURL = 'https://apis.openapi.sk.com/tmap';
  }

  /**
   * TMAP 앱에서 길찾기 URL 생성
   * @param {object} destination - 목적지 정보
   * @param {object} origin - 출발지 정보 (선택사항)
   * @returns {string} TMAP URL
   */
  generateTmapUrl(destination, origin = null) {
    const { name, lat, lng } = destination;
    
    if (origin) {
      // 출발지와 목적지가 모두 있는 경우
      return `tmap://route?startname=${encodeURIComponent(origin.name)}&startx=${origin.lng}&starty=${origin.lat}&goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
    } else {
      // 목적지만 있는 경우 (현재 위치에서 출발)
      return `tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
    }
  }

  /**
   * TMAP 웹 버전 URL 생성 (앱이 없을 때 대체)
   * @param {object} destination - 목적지 정보
   * @param {object} origin - 출발지 정보 (선택사항)
   * @returns {string} TMAP 웹 URL
   */
  generateTmapWebUrl(destination, origin = null) {
    const { name, lat, lng } = destination;
    
    if (origin) {
      return `https://tmap.life/route/car?startname=${encodeURIComponent(origin.name)}&startx=${origin.lng}&starty=${origin.lat}&goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
    } else {
      return `https://tmap.life/route/car?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
    }
  }

  /**
   * 두 좌표 간의 거리 계산 (직선거리)
   * @param {number} lat1 - 시작점 위도
   * @param {number} lng1 - 시작점 경도
   * @param {number} lat2 - 도착점 위도
   * @param {number} lng2 - 도착점 경도
   * @returns {Promise<object>} 거리 정보
   */
  async getDistance(lat1, lng1, lat2, lng2) {
    try {
      const url = `${this.baseURL}/routes/distance`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'appKey': TMAP_API_KEY,
        },
        body: JSON.stringify({
          startX: lng1.toString(),
          startY: lat1.toString(),
          endX: lng2.toString(),
          endY: lat2.toString(),
          reqCoordType: 'WGS84GEO',
          resCoordType: 'WGS84GEO',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        distance: data.features[0].properties.totalDistance, // 미터 단위
        duration: data.features[0].properties.totalTime, // 초 단위
      };
    } catch (error) {
      console.error('TMAP Distance API Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 경로 검색 (자동차)
   * @param {number} startLat - 시작점 위도
   * @param {number} startLng - 시작점 경도
   * @param {number} endLat - 도착점 위도
   * @param {number} endLng - 도착점 경도
   * @returns {Promise<object>} 경로 정보
   */
  async getCarRoute(startLat, startLng, endLat, endLng) {
    try {
      const url = `${this.baseURL}/routes`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'appKey': TMAP_API_KEY,
        },
        body: JSON.stringify({
          startX: startLng.toString(),
          startY: startLat.toString(),
          endX: endLng.toString(),
          endY: endLat.toString(),
          reqCoordType: 'WGS84GEO',
          resCoordType: 'WGS84GEO',
          searchOption: '0', // 0: 추천경로, 1: 최단거리, 2: 최단시간
        }),
      });

      const data = await response.json();
      
      return {
        success: true,
        totalDistance: data.features[0].properties.totalDistance,
        totalTime: data.features[0].properties.totalTime,
        totalFare: data.features[0].properties.totalFare,
        coordinates: data.features.map(feature => ({
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        })),
      };
    } catch (error) {
      console.error('TMAP Route API Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 대중교통 경로 검색
   * @param {number} startLat - 시작점 위도
   * @param {number} startLng - 시작점 경도
   * @param {number} endLat - 도착점 위도
   * @param {number} endLng - 도착점 경도
   * @returns {Promise<object>} 대중교통 경로 정보
   */
  async getTransitRoute(startLat, startLng, endLat, endLng) {
    try {
      const url = `${this.baseURL}/routes/transit`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'appKey': TMAP_API_KEY,
        },
        body: JSON.stringify({
          startX: startLng.toString(),
          startY: startLat.toString(),
          endX: endLng.toString(),
          endY: endLat.toString(),
          format: 'json',
        }),
      });

      const data = await response.json();
      
      return {
        success: true,
        routes: data.metaData.plan.itineraries.map(route => ({
          totalTime: route.totalTime,
          totalWalkTime: route.totalWalkTime,
          totalDistance: route.totalDistance,
          fare: route.fare?.regular?.totalFare || 0,
          legs: route.legs.map(leg => ({
            mode: leg.mode,
            distance: leg.distance,
            sectionTime: leg.sectionTime,
            route: leg.route || null,
          })),
        })),
      };
    } catch (error) {
      console.error('TMAP Transit API Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 거리를 사용자 친화적인 형태로 변환
   * @param {number} meters - 미터 단위 거리
   * @returns {string} 포맷된 거리 문자열
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * 시간을 사용자 친화적인 형태로 변환
   * @param {number} seconds - 초 단위 시간
   * @returns {string} 포맷된 시간 문자열
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  }
}

export default new TmapService();