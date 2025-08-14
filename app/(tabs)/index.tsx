import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 깔끔한 헤더 */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appTitle}>밥풀레이스</Text>
            <Text style={styles.appSubtitle}>오늘도 맛있는 하루 되세요!</Text>
          </View>
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
              <TouchableOpacity style={styles.bannerButton}>
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

          {/* 추가 캠페인 카드들 */}
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
  profileContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFBF00',
  },

  // 배너 스타일
  bannerSection: { 
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30, // 배너와 캠페인 사이 간격 추가
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
  bannerDecoration: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEmoji: {
    fontSize: 40,
  },

  // 섹션 공통 스타일
  contentSection: { 
    padding: 20,
    paddingTop: 10,
    marginBottom: 20, // 섹션 간 간격 추가
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
  seeAllText: {
    fontSize: 14,
    color: '#FFBF00',
    fontWeight: '600',
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
    marginBottom: 10, // 캠페인 카드와 다음 섹션 사이 간격
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
  campaignSubtitle: { 
    fontSize: 16, 
    color: '#555', 
    marginBottom: 16,
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
  campaignButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  campaignButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  campaignDetails: {
    marginBottom: 16,
  },
  campaignDetailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },

  // 추가 캠페인 스타일
  additionalCampaigns: {
    marginTop: 16,
  },
  smallCampaignCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  smallCampaignBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  smallCampaignBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  smallCampaignEmoji: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  smallCampaignTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  smallCampaignDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  smallCampaignPeriod: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  smallCampaignPeriodText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
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