import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  // 디버깅용 (나중에 제거)
  console.log('Current segments:', segments);
  
  // 플로팅 버튼을 숨길 화면들
  const hideFloatingButtonScreens = ['chat', 'nutrition', 'settings'];
  const currentScreen = segments[segments.length - 1];
  const shouldHideFloatingButton = hideFloatingButtonScreens.includes(currentScreen);
  
  // 더 안전한 조건 검사
  const isTabScreen = segments.length > 0 && segments[0] === '(tabs)';
  const isInitialLoad = segments.length === 0; // 초기 로딩 상태
  
  // 초기 로딩이거나 탭 화면에서 + 제외 화면이 아닐 때 표시
  const shouldShowFloatingButton = (isInitialLoad || isTabScreen) && !shouldHideFloatingButton;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <Stack>
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
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      </Stack>
      
      {/* 플로팅 채팅 버튼과 말풍선 - 탭 화면에서만 표시 (특정 화면 제외) */}
      { shouldShowFloatingButton && (
        <View style={styles.floatingContainer}>
          {/* 말풍선 안내 */}
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>오늘의 메뉴를{'\n'}알고 싶다면?</Text>
            <View style={styles.speechBubbleTail} />
          </View>
          
          {/* 채팅 버튼 */}
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={() => router.push('/chat')}
          >
            <Image
              source={require('../assets/images/chat-button.png')}
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
    width: 60, 
    height: 60, 
    backgroundColor: 'transparent',
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  chatButtonImage: {
    width: 80,
    height: 80,
  },
});