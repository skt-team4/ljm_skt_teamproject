import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StorageService from '../utils/storage';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 로그인 상태 확인
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { token } = await StorageService.getAuthData();
      
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth state check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 상태 변경에 따른 네비게이션 처리
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isModalScreen = ['chat', 'nutrition', 'settings'].includes(segments[0]);

    if (!isLoggedIn && !inAuthGroup && !isModalScreen) {
      router.replace('/(auth)/welcome');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading]);

  // 로그인 성공 핸들러
  const handleLoginSuccess = async (userToken: string, userId: string) => {
    try {
      await StorageService.setAuthData(userToken, userId);
      await StorageService.initializeUserData();
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login success handling failed:', error);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await StorageService.clearAuthData();
      setIsLoggedIn(false);
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 플로팅 버튼 표시 로직
  const hideFloatingButtonScreens = ['chat', 'food_vision', 'nutrition'];
  const currentScreen = segments[segments.length - 1];
  const shouldHideFloatingButton = hideFloatingButtonScreens.includes(currentScreen);
  
  const isTabScreen = segments.length > 0 && segments[0] === '(tabs)';
  const isInitialLoad = segments.length === 0;
  
  const shouldShowFloatingButton = !isLoading && 
                                   isLoggedIn && 
                                   !shouldHideFloatingButton && 
                                   (isInitialLoad || isTabScreen || segments[0] === '(tabs)');

  // 로딩 화면
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBF00" />
        <Text style={styles.loadingText}>YUM:AI</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <Stack>
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }}
        />
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="chat" 
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
            gestureDirection: 'horizontal',
          }} 
        />
        <Stack.Screen 
          name="nutrition" 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
      
      {shouldShowFloatingButton && (
        <View style={styles.floatingContainer}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>오늘의 메뉴를{'\n'}알고 싶다면?</Text>
            <View style={styles.speechBubbleTail} />
          </View>
          
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={() => router.push('/chat')}
          >
            <Image
              source={require('../assets/그르시.png')}
              style={styles.chatButtonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFBF00',
    marginTop: 16,
  },
  
  floatingContainer: {
    position: 'absolute',
    bottom: 120,
    right: 30,
    alignItems: 'center',
    zIndex: 10,
  },
  speechBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  speechBubbleText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  floatingButton: { 
    width: 75,
    height: 75,
    backgroundColor: 'white',
    borderRadius: 37.5,
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  chatButtonImage: {
    width: 105,
    height: 105,
    borderRadius: 35,
  },
});