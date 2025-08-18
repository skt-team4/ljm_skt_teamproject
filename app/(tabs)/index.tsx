import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Local Notification 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function HomeScreen() {
  const router = useRouter();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    initializeLocalNotifications();
    
    // 알림 리스너 설정
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 로컬 알림 수신:', notification);
      setHasUnreadNotifications(true);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 알림 탭됨:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, []);

  const initializeLocalNotifications = async () => {
    try {
      console.log('🔔 로컬 알림 초기화 시작...');
      
      // 알림 권한 요청
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ 알림 권한이 거부되었습니다.');
        Alert.alert(
          '알림 권한', 
          '식사 리마인더를 받으려면 설정에서 알림 권한을 허용해주세요.',
          [
            { text: '나중에', style: 'cancel' },
            { text: '확인', style: 'default' }
          ]
        );
        return;
      }

      console.log('✅ 알림 권한 승인됨');
      await setupMealReminders();
      setNotificationsEnabled(true);
      
    } catch (error) {
      console.error('❌ 로컬 알림 초기화 실패:', error);
      setNotificationsEnabled(false);
    }
  };

  const setupMealReminders = async () => {
    try {
      // 기존 스케줄된 알림 취소
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ 기존 알림 취소됨');

      // 저녁 알림 (20시) - 원래 코드와 동일하게
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ 밥풀레이스',
          body: '오늘 잘 드셨나요? 식사 기록을 남겨보세요!',
          data: { type: 'daily_check' },
          sound: true,
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });

      console.log('📅 저녁 알림이 설정되었습니다!');
      
    } catch (error) {
      console.error('❌ 알림 설정 오류:', error);
    }
  };

  const handleNotificationResponse = (response: any) => {
    try {
      const notificationType = response.notification.request.content.data?.type;
      console.log('🎯 알림 응답 처리:', notificationType);
      
      if (notificationType === 'daily_check') {
        console.log('🍽️ 저녁 알림 탭 - 영양소 리포트로 이동');
        // router.push('/nutrition'); // 필요시 활성화
      }
      
      setHasUnreadNotifications(false);
    } catch (error) {
      console.error('알림 응답 처리 오류:', error);
    }
  };

  const handleNotificationIconPress = () => {
    setHasUnreadNotifications(false);
    
    if (!notificationsEnabled) {
      Alert.alert(
        '🔔 알림 설정',
        '저녁 식사 리마인더 알림이 비활성화되어 있습니다. 설정하시겠어요?',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정하기', onPress: () => initializeLocalNotifications() }
        ]
      );
      return;
    }
    
    Alert.alert(
      '🔔 저녁 알림 설정',
      '밥풀레이스에서 식사 기록 알림을 보내드려요!',
      [
        { text: '알림 끄기', onPress: () => turnOffNotifications(), style: 'destructive' },
        { text: '테스트 알림', onPress: () => sendTestNotification() },
        { text: '확인', style: 'default' }
      ]
    );
  };

  const turnOffNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔕 모든 알림이 취소됨');
      Alert.alert('알림 해제', '저녁 알림이 해제되었습니다.');
      setNotificationsEnabled(false);
    } catch (error) {
      console.error('알림 해제 오류:', error);
      Alert.alert('오류', '알림 해제 중 문제가 발생했습니다.');
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 테스트 알림',
          body: '로컬 알림이 정상적으로 작동합니다!',
          data: { type: 'test' },
        },
        trigger: { seconds: 2 },
      });
      
      console.log('🧪 테스트 알림 전송됨');
      Alert.alert('테스트 알림', '2초 후 테스트 알림이 도착합니다!');
    } catch (error) {
      console.error('테스트 알림 오류:', error);
      Alert.alert('오류', '테스트 알림 전송에 실패했습니다.');
    }
  };

  // 가맹점 지도 열기 함수
  const openStoreMap = async () => {
    try {
      // 여기에 실제 HTML 지도 파일의 URL을 넣으세요
      const mapUrl = 'http://192.168.68.62:5500/tmap_folium_map.html'; // 실제 지도 URL로 변경 필요
      
      console.log('🗺️ 가맹점 지도 열기:', mapUrl);
      await WebBrowser.openBrowserAsync(mapUrl);
    } catch (error) {
      console.error('❌ 지도 열기 실패:', error);
      Alert.alert('오류', '지도를 열 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 깔끔한 헤더 */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appTitle}>밥풀레이스</Text>
            <Text style={styles.appSubtitle}>오늘도 맛있는 하루 되세요!</Text>
          </View>
          
          {/* 알림 아이콘 */}
          <TouchableOpacity 
            style={styles.notificationContainer}
            onPress={handleNotificationIconPress}
            activeOpacity={0.7}
          >
            <View style={[
              styles.notificationIcon,
              !notificationsEnabled && styles.notificationIconDisabled
            ]}>
              <Text style={styles.notificationEmoji}>
                {notificationsEnabled ? '🔔' : '🔕'}
              </Text>
              {hasUnreadNotifications && notificationsEnabled && (
                <View style={styles.notificationBadge}>
                  <View style={styles.notificationDot} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 메인 배너 */}
        <LinearGradient 
          colors={['#FFBF00', '#FDD046']} 
          style={styles.bannerSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerSubtext}>🍽️ 맛있는 식사의 시작</Text>
              <Text style={styles.bannerTitle}>서울시 강남구{'\n'}급식카드 결제 서비스 OPEN</Text>
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={openStoreMap}
                activeOpacity={0.7}
              >
                <Text style={styles.bannerButtonText}>가맹점 찾아보기</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerImageContainer}>
            </View>
          </View>
        </LinearGradient>

        {/* 캠페인 섹션 */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>진행중인 캠페인</Text>
          </View>
          <Text style={styles.sectionSubtitle}>캠페인 참여하고 따뜻한 혜택 받아가세요</Text>
          
          {/* 메인 캠페인 카드 */}
          <LinearGradient 
            colors={['#FFF8E1', '#FFE082']} 
            style={styles.campaignCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.campaignContent}>
              <View style={styles.campaignBadge}>
                <Text style={styles.campaignBadgeText}>HOT</Text>
              </View>
              <Text style={styles.campaignTitle}>마음 한 숟갈</Text>
              <View style={styles.campaignTagContainer}>
                <Text style={styles.campaignTag}>📍 서울시 강남구 내 매장 전용</Text>
              </View>
              <View style={styles.campaignDetails}>
                <Text style={styles.campaignDetailText}>• 참여 기간: 12월 1일 ~ 12월 31일</Text>
                <Text style={styles.campaignDetailText}>• 혜택: 도시락 구매 시 10% 할인</Text>
                <Text style={styles.campaignDetailText}>• 대상: 급식카드 소지자 누구나</Text>
              </View>
            </View>
            <View style={styles.campaignImageContainer}>
              <View style={styles.campaignImage}>
                <Text style={styles.campaignImageEmoji}>🍱</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 인기 메뉴 섹션 */}
        <View style={[styles.contentSection, { paddingBottom: 40 }]}>
          <Text style={styles.sectionTitle}>오늘의 인기 메뉴</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularMenus}>
            {[
              { name: '치킨버거', rating: '4.8', image: '🍔' },
              { name: '김치찌개', rating: '4.7', image: '🍲' },
              { name: '파스타', rating: '4.6', image: '🍝' },
              { name: '피자', rating: '4.9', image: '🍕' },
            ].map((menu, index) => (
              <TouchableOpacity key={index} style={styles.popularMenuItem}>
                <View style={styles.popularMenuImage}>
                  <Text style={styles.popularMenuEmoji}>{menu.image}</Text>
                </View>
                <Text style={styles.popularMenuName}>{menu.name}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐ {menu.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fafafa' 
  },
  
  // 헤더 스타일
  appHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
  },
  appTitle: { 
    fontSize: 28, 
    fontWeight: '800',
    color: '#FFBF00',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  
  // 알림 상태 배너 스타일
  notificationStatusBanner: {
    flexDirection: 'row',
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#155724',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
  },
  
  // 알림 아이콘 스타일
  notificationContainer: {
    position: 'relative',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIconDisabled: {
    backgroundColor: '#e9ecef',
    opacity: 0.6,
  },
  notificationEmoji: {
    fontSize: 20,
    color: '#666',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },

  // 배너 스타일
  bannerSection: { 
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerSubtext: { 
    fontSize: 14, 
    color: '#333', 
    marginBottom: 8,
    opacity: 0.8,
  },
  bannerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333',
    lineHeight: 26,
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerImageContainer: {
    marginLeft: 16,
  },

  // 섹션 공통 스타일
  contentSection: { 
    padding: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333',
  },
  sectionSubtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 16,
    lineHeight: 20,
  },

  // 식사 체크 스타일
  mealCheckContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealCheckItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  mealText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mealStatus: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealStatusCompleted: {
    backgroundColor: '#dcfce7',
  },
  mealStatusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  mealStatusCompletedText: {
    color: '#166534',
  },

  // 캠페인 카드 스타일
  campaignCard: { 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  campaignContent: {
    padding: 24,
    flex: 1,
  },
  campaignBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  campaignBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  campaignTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#333',
    marginBottom: 4,
  },
  campaignTagContainer: { 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 16, 
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  campaignTag: { 
    color: 'white', 
    fontSize: 12,
    fontWeight: '500',
  },
  campaignDetails: {
    marginBottom: 16,
  },
  campaignDetailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  campaignImageContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  campaignImage: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignImageEmoji: {
    fontSize: 50,
  },

  // 인기 메뉴 스타일
  popularMenus: {
    marginTop: 12,
  },
  popularMenuItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 120,
  },
  popularMenuImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  popularMenuEmoji: {
    fontSize: 30,
  },
  popularMenuName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});