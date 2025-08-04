import React from 'react';
// TouchableOpacity, Image를 import 합니다.
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
// useRouter를 import 합니다.
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 앱 헤더 부분을 수정합니다. */}
        <View style={styles.appHeader}>
          <Text style={styles.appTitle}>나비얌</Text>
          {/* 검은색 네모(알림 아이콘)를 제거하고 프로필 아이콘만 남깁니다. */}
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Image
              source={{ uri: 'https://picsum.photos/seed/696/300/300' }}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>

        {/* 배너 (이하 내용은 동일) */}
        <LinearGradient colors={['#4A90E2', '#7B68EE']} style={styles.bannerSection}>
          <Text style={styles.bannerText}>인천시 가맹점 확인해보세요</Text>
          <Text style={styles.bannerTitle}>인천시 급식카드 결제 OPEN</Text>
        </LinearGradient>

        {/* 콘텐츠 */}
        <View style={styles.contentSection}>
          <Text style={styles.campaignHeader}>캠페인</Text>
          <Text style={styles.campaignSubtitle}>캠페인 참여하고 따뜻한 혜택 받아가세요</Text>
          <LinearGradient colors={['#FFF8E1', '#FFE082']} style={styles.mealCard}>
            <View>
              <Text style={styles.mealTitle}>도시락 한컵</Text>
              <Text style={styles.mealSubtitle}>마음 한 숟갈</Text>
              <View style={styles.mealTagContainer}>
                  <Text style={styles.mealTag}>인천광역시 내 매장 전용</Text>
              </View>
            </View>
            <View style={styles.mealImage} />
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일시트를 수정합니다.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  appHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  appTitle: { fontSize: 24, fontWeight: 'bold' },
  // --- 👇 수정된 스타일 ---
  // notificationIcon과 headerIconsContainer 관련 스타일을 제거하고,
  // profileIcon의 marginLeft를 없애 간격을 조정합니다.
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  // --- 👇 이하 스타일은 동일 ---
  bannerSection: { padding: 20, alignItems: 'center' },
  bannerText: { fontSize: 16, color: 'white', marginBottom: 8 },
  bannerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  contentSection: { padding: 20 },
  campaignHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  campaignSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  mealCard: { borderRadius: 15, padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  mealTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  mealSubtitle: { fontSize: 18, color: '#555', marginTop: 5 },
  mealTagContainer: { backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  mealTag: { color: 'white', fontSize: 12 },
  mealImage: { width: 80, height: 80, backgroundColor: '#D4AF37', borderRadius: 10 },
});