import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StorageService from '../../utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // 개발용: 데이터 초기화
  const clearStorage = async () => {
    await StorageService.clearAllData();
    console.log('Storage cleared');
  };

  // 개발용: 디버그 정보 출력
  const showDebugInfo = async () => {
    await StorageService.debugPrintAllData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFBF00', '#FDD046']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* 상단 여백 */}
        <View style={styles.topSection}>
          {/* 로고/타이틀 영역 */}
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>밥풀레이스</Text>
            <Text style={styles.appSubtitle}>맛있는 식사의 시작</Text>
            <Text style={styles.welcomeEmoji}>🍽️</Text>
          </View>
        </View>

        {/* 중간 설명 영역 */}
        <View style={styles.middleSection}>
          <Text style={styles.descriptionTitle}>나비얌이와 함께</Text>
          <Text style={styles.descriptionText}>
            맞춤형 음식 추천부터{'\n'}
            급식카드 결제 서비스까지{'\n'}
            모든 식사 고민을 해결해보세요
          </Text>
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.bottomSection}>
          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.signupButtonText}>회원가입</Text>
          </TouchableOpacity>

          {/* 임시 스킵 버튼 (개발용) */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.skipButtonText}>임시로 건너뛰기</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
    fontWeight: '500',
  },
  welcomeEmoji: {
    fontSize: 60,
    marginTop: 20,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  loginButton: {
    backgroundColor: '#333',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  signupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#333',
    fontSize: 14,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
    opacity: 0.8,
  },
});