import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsProps {
  // 필요한 props 타입 정의
}

interface AddressInfo {
  address: string;
  latitude?: number;
  longitude?: number;
  detailAddress?: string;
}

// 추천 카테고리 타입 정의
interface RecommendationCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

// 알러지 항목 타입 정의
interface AllergyItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

// 사용 가능한 추천 카테고리들
const AVAILABLE_CATEGORIES: RecommendationCategory[] = [
  { id: 'korean', name: '한식', emoji: '🍚', description: '김치찌개, 비빔밥, bulgogi 등' },
  { id: 'chinese', name: '중식', emoji: '🥢', description: '짜장면, 탕수육, 마라탕 등' },
  { id: 'japanese', name: '일식', emoji: '🍣', description: '초밥, 라멘, 돈가스 등' },
  { id: 'western', name: '양식', emoji: '🍝', description: '파스타, 스테이크, 피자 등' },
  { id: 'fastfood', name: '패스트푸드', emoji: '🍔', description: '햄버거, 치킨, 피자 등' },
  { id: 'cafe', name: '카페/디저트', emoji: '☕', description: '커피, 케이크, 브런치 등' },
  { id: 'healthy', name: '건강식', emoji: '🥗', description: '샐러드, 포케볼, 수프 등' },
  { id: 'spicy', name: '매운음식', emoji: '🌶️', description: '떡볶이, 매운탕, 마라탕 등' },
  { id: 'sweet', name: '단맛', emoji: '🍰', description: '케이크, 아이스크림, 과자 등' },
  { id: 'vegetarian', name: '채식', emoji: '🌱', description: '샐러드, 두부요리, 나물 등' },
];

// 사용 가능한 알러지 항목들
const AVAILABLE_ALLERGIES: AllergyItem[] = [
  { id: 'nuts', name: '견과류', emoji: '🥜', description: '아몬드, 호두, 땅콩, 캐슈넛 등' },
  { id: 'shellfish', name: '갑각류', emoji: '🦐', description: '새우, 게, 바닷가재 등' },
  { id: 'eggs', name: '계란', emoji: '🥚', description: '달걀, 메추리알 등' },
  { id: 'dairy', name: '유제품', emoji: '🥛', description: '우유, 치즈, 버터, 요거트 등' },
  { id: 'soy', name: '대두', emoji: '🌱', description: '콩, 두부, 된장, 간장 등' },
  { id: 'wheat', name: '밀/글루텐', emoji: '🌾', description: '밀가루, 빵, 파스타, 라면 등' },
  { id: 'fish', name: '생선', emoji: '🐟', description: '고등어, 연어, 참치 등' },
  { id: 'mollusks', name: '조개류', emoji: '🐚', description: '조개, 굴, 전복, 오징어 등' },
  { id: 'sesame', name: '참깨', emoji: '🍃', description: '참깨, 들깨, 참기름 등' },
  { id: 'peach', name: '복숭아', emoji: '🍑', description: '복숭아, 자두, 살구 등' },
  { id: 'tomato', name: '토마토', emoji: '🍅', description: '토마토, 토마토 소스 등' },
  { id: 'sulfites', name: '아황산염', emoji: '⚗️', description: '와인, 건포도, 가공식품 등' },
];

// Expo Router 옵션 - 상단 네비게이션 바 숨기기
export const options = {
  gestureEnabled: false,
  swipeEnabled: false,
  presentation: 'card',
  headerShown: false,
};

const Settings: React.FC<SettingsProps> = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [address, setAddress] = useState<string>('');
  const [detailAddress, setDetailAddress] = useState<string>('');
  const [savedAddress, setSavedAddress] = useState<AddressInfo | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // 추천 카테고리 관련 상태
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // 알러지 관련 상태
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [showAllergyModal, setShowAllergyModal] = useState<boolean>(false);

  // 앱 설정 관련 상태
  const [isAnimationEnabled, setIsAnimationEnabled] = useState<boolean>(true);

  // 저장된 주소 불러오기
  useEffect(() => {
    loadSavedAddress();
    loadSelectedCategories();
    loadSelectedAllergies();
    loadAnimationSettings();
  }, []);

  const loadSavedAddress = async () => {
    try {
      const saved = await AsyncStorage.getItem('userAddress');
      if (saved) {
        const addressInfo: AddressInfo = JSON.parse(saved);
        setSavedAddress(addressInfo);
        setAddress(addressInfo.address);
        setDetailAddress(addressInfo.detailAddress || '');
      }
    } catch (error) {
      console.error('주소 불러오기 실패:', error);
    }
  };

  // 저장된 추천 카테고리 불러오기
  const loadSelectedCategories = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedCategories');
      if (saved) {
        const categories: string[] = JSON.parse(saved);
        setSelectedCategories(categories);
      }
    } catch (error) {
      console.error('추천 카테고리 불러오기 실패:', error);
    }
  };

  // 저장된 알러지 정보 불러오기
  const loadSelectedAllergies = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedAllergies');
      if (saved) {
        const allergies: string[] = JSON.parse(saved);
        setSelectedAllergies(allergies);
      }
    } catch (error) {
      console.error('알러지 정보 불러오기 실패:', error);
    }
  };

  // 저장된 애니메이션 설정 불러오기
  const loadAnimationSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('animationEnabled');
      if (saved !== null) {
        const enabled: boolean = JSON.parse(saved);
        setIsAnimationEnabled(enabled);
      }
    } catch (error) {
      console.error('애니메이션 설정 불러오기 실패:', error);
    }
  };

  // 추천 카테고리 저장
  const saveSelectedCategories = async (categories: string[]) => {
    try {
      await AsyncStorage.setItem('selectedCategories', JSON.stringify(categories));
      setSelectedCategories(categories);
    } catch (error) {
      console.error('추천 카테고리 저장 실패:', error);
      Alert.alert('오류', '추천 카테고리 저장에 실패했습니다.');
    }
  };

  // 알러지 정보 저장
  const saveSelectedAllergies = async (allergies: string[]) => {
    try {
      await AsyncStorage.setItem('selectedAllergies', JSON.stringify(allergies));
      setSelectedAllergies(allergies);
    } catch (error) {
      console.error('알러지 정보 저장 실패:', error);
      Alert.alert('오류', '알러지 정보 저장에 실패했습니다.');
    }
  };

  // 애니메이션 설정 저장
  const saveAnimationSettings = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('animationEnabled', JSON.stringify(enabled));
      setIsAnimationEnabled(enabled);
    } catch (error) {
      console.error('애니메이션 설정 저장 실패:', error);
      Alert.alert('오류', '애니메이션 설정 저장에 실패했습니다.');
    }
  };

  // 카테고리 선택/해제 토글
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // 알러지 선택/해제 토글
  const toggleAllergy = (allergyId: string) => {
    setSelectedAllergies(prev => {
      if (prev.includes(allergyId)) {
        return prev.filter(id => id !== allergyId);
      } else {
        return [...prev, allergyId];
      }
    });
  };

  // 애니메이션 설정 토글
  const toggleAnimation = (enabled: boolean) => {
    saveAnimationSettings(enabled);
  };

  // 카테고리 모달 닫기 및 저장
  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    saveSelectedCategories(selectedCategories);
  };

  // 알러지 모달 닫기 및 저장
  const closeAllergyModal = () => {
    setShowAllergyModal(false);
    saveSelectedAllergies(selectedAllergies);
  };

  const saveAddress = async () => {
    if (!address.trim()) {
      Alert.alert('알림', '주소를 입력해주세요.');
      return;
    }

    try {
      const addressInfo: AddressInfo = {
        address: address.trim(),
        detailAddress: detailAddress.trim(),
      };

      await AsyncStorage.setItem('userAddress', JSON.stringify(addressInfo));
      setSavedAddress(addressInfo);
      setIsEditing(false);
    } catch (error) {
      console.error('주소 저장 실패:', error);
      Alert.alert('오류', '주소 저장에 실패했습니다.');
    }
  };

  const getCurrentLocation = () => {
    Alert.alert('개발중', '현재 위치 가져오기 기능은 개발중입니다.');
  };

  const clearAddress = () => {
    Alert.alert(
      '주소 삭제',
      '저장된 주소를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userAddress');
              setSavedAddress(null);
              setAddress('');
              setDetailAddress('');
              setIsEditing(false);
            } catch (error) {
              console.error('주소 삭제 실패:', error);
            }
          },
        },
      ]
    );
  };

  // 선택된 카테고리 이름들 가져오기
  const getSelectedCategoryNames = () => {
    return selectedCategories
      .map(id => AVAILABLE_CATEGORIES.find(cat => cat.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  // 선택된 알러지 이름들 가져오기
  const getSelectedAllergyNames = () => {
    return selectedAllergies
      .map(id => AVAILABLE_ALLERGIES.find(allergy => allergy.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 헤더 */}
      <LinearGradient
        colors={['#FFBF00', '#FDD046']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>설정</Text>
          </View>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 주소 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 주소 설정</Text>
          
          {savedAddress && !isEditing ? (
            <View style={styles.savedAddressContainer}>
              <Text style={styles.savedAddressLabel}>저장된 주소</Text>
              <Text style={styles.savedAddress}>{savedAddress.address}</Text>
              {savedAddress.detailAddress && (
                <Text style={styles.savedDetailAddress}>
                  상세주소: {savedAddress.detailAddress}
                </Text>
              )}
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={clearAddress}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>주소</Text>
              <TextInput
                style={styles.textInput}
                placeholder="예: 서울시 강남구 테헤란로 123"
                value={address}
                onChangeText={setAddress}
                multiline={true}
                numberOfLines={2}
              />
              
              <Text style={styles.inputLabel}>상세주소 (선택)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="예: 101동 502호"
                value={detailAddress}
                onChangeText={setDetailAddress}
              />
              
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.locationButtonText}>📍 현재 위치 사용</Text>
              </TouchableOpacity>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={saveAddress}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
                
                {savedAddress && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setIsEditing(false);
                      setAddress(savedAddress.address);
                      setDetailAddress(savedAddress.detailAddress || '');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 추천 카테고리 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ 추천 카테고리</Text>
          <Text style={styles.sectionDescription}>
            선호하는 음식 카테고리를 선택하면 더 정확한 추천을 받을 수 있어요
          </Text>
          
          <TouchableOpacity 
            style={styles.categorySettingItem}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.categoryInfo}>
              <Text style={styles.settingLabel}>선호 카테고리</Text>
              <Text style={styles.categoryCount}>
                {selectedCategories.length}개 선택됨
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          {selectedCategories.length > 0 && (
            <View style={styles.selectedCategoriesContainer}>
              <Text style={styles.selectedCategoriesText}>
                {getSelectedCategoryNames()}
              </Text>
            </View>
          )}
        </View>

        {/* 알러지 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 알러지 정보</Text>
          <Text style={styles.sectionDescription}>
            알러지가 있는 식품을 선택하면 해당 식품이 포함된 음식점은 제외하고 추천해드려요
          </Text>
          
          <TouchableOpacity 
            style={styles.categorySettingItem}
            onPress={() => setShowAllergyModal(true)}
          >
            <View style={styles.categoryInfo}>
              <Text style={styles.settingLabel}>알러지 항목</Text>
              <Text style={[styles.categoryCount, selectedAllergies.length > 0 && styles.allergyWarning]}>
                {selectedAllergies.length > 0 ? `${selectedAllergies.length}개 항목` : '설정안함'}
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          {selectedAllergies.length > 0 && (
            <View style={styles.selectedAllergiesContainer}>
              <Text style={styles.selectedAllergiesText}>
                {getSelectedAllergyNames()}
              </Text>
            </View>
          )}
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ 앱 설정</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>애니메이션 효과</Text>
              <Text style={styles.settingDescription}>
                앱 내 애니메이션 효과를 {isAnimationEnabled ? '활성화' : '비활성화'}합니다
              </Text>
            </View>
            <Switch
              value={isAnimationEnabled}
              onValueChange={toggleAnimation}
              trackColor={{ false: '#e0e0e0', true: '#FFD54F' }}
              thumbColor={isAnimationEnabled ? '#FF8F00' : '#9e9e9e'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
        </View>
      </ScrollView>

      {/* 카테고리 선택 모달 */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCategoryModal}
      >
        <View style={styles.modalContainer}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCategoryModal}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>추천 카테고리 선택</Text>
            <TouchableOpacity onPress={closeCategoryModal}>
              <Text style={styles.modalSaveText}>완료</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalDescription}>
              선호하는 음식 종류를 모두 선택해주세요 (다중 선택 가능)
            </Text>
            
            {AVAILABLE_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.categoryOptionSelected
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View style={styles.categoryOptionContent}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <View style={styles.categoryTextContainer}>
                      <Text style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected
                      ]}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* 알러지 선택 모달 */}
      <Modal
        visible={showAllergyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAllergyModal}
      >
        <View style={styles.modalContainer}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeAllergyModal}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>알러지 정보 설정</Text>
            <TouchableOpacity onPress={closeAllergyModal}>
              <Text style={styles.modalSaveText}>완료</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalDescription}>
              알러지가 있는 식품을 모두 선택해주세요 (다중 선택 가능)
            </Text>
            
            {AVAILABLE_ALLERGIES.map((allergy) => {
              const isSelected = selectedAllergies.includes(allergy.id);
              return (
                <TouchableOpacity
                  key={allergy.id}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.allergyOptionSelected
                  ]}
                  onPress={() => toggleAllergy(allergy.id)}
                >
                  <View style={styles.categoryOptionContent}>
                    <Text style={styles.categoryEmoji}>{allergy.emoji}</Text>
                    <View style={styles.categoryTextContainer}>
                      <Text style={[
                        styles.categoryName,
                        isSelected && styles.allergyNameSelected
                      ]}>
                        {allergy.name}
                      </Text>
                      <Text style={styles.categoryDescription}>
                        {allergy.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.allergyCheckboxSelected
                  ]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  savedAddressContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  savedAddressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  savedAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  savedDetailAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  inputContainer: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  locationButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  locationButtonText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '500',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 18,
    color: '#ccc',
  },

  // 일반 설정 항목 스타일
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
  // 추천 카테고리 관련 스타일
  categorySettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: '#FF8F00',
    fontWeight: '500',
    marginTop: 2,
  },
  selectedCategoriesContainer: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  selectedCategoriesText: {
    fontSize: 14,
    color: '#e65100',
    lineHeight: 20,
  },

  // 알러지 관련 스타일
  allergyWarning: {
    color: '#f44336',
    fontWeight: '600',
  },
  selectedAllergiesContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  selectedAllergiesText: {
    fontSize: 14,
    color: '#c62828',
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // 모달 관련 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FF8F00',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#fff3e0',
    borderColor: '#FF8F00',
  },
  allergyOptionSelected: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryNameSelected: {
    color: '#e65100',
    fontWeight: '600',
  },
  allergyNameSelected: {
    color: '#c62828',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF8F00',
    borderColor: '#FF8F00',
  },
  allergyCheckboxSelected: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Settings;