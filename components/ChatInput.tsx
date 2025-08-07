// components/ChatInput.tsx - 단순한 키보드 대응
import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isSmallScreen, styles } from '../styles/chatStyles';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  onSendMessage: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  isLoading,
  isKeyboardVisible,
  keyboardHeight,
  onSendMessage,
}) => {
  const insets = useSafeAreaInsets();

  // 단순한 위치 계산 (애니메이션 없이 즉시 적용)
  const bottomPosition = isKeyboardVisible ? keyboardHeight + 10 : 0;

  return (
    <View style={[
      styles.inputContainer,
      { 
        bottom: bottomPosition,
        paddingBottom: Math.max(insets.bottom, 10),
      }
    ]}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.textInput,
            { 
              fontSize: isSmallScreen ? 14 : 16,
              opacity: isLoading ? 0.6 : 1,
            }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isLoading ? "처리 중..." : "얌이에게 물어보세요! 🍽️"}
          placeholderTextColor="#999"
          returnKeyType="send"
          onSubmitEditing={onSendMessage}
          blurOnSubmit={true}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            { 
              paddingHorizontal: isSmallScreen ? 16 : 20,
              paddingVertical: isSmallScreen ? 10 : 12,
              opacity: isLoading || inputText.trim() === '' ? 0.6 : 1,
            }
          ]}
          onPress={onSendMessage}
          disabled={isLoading || inputText.trim() === ''}
        >
          <Text style={[
            styles.sendButtonText,
            { fontSize: isSmallScreen ? 14 : 16 }
          ]}>
            {isLoading ? '전송 중...' : '전송'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};