import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addTestBalance,
  deleteMealCard,
  getTransactionHistory,
  getUserProfile,
  registerMealCard, // 테스트용
  type MealCardInfo,
  type RicePulLevel,
  type Transaction
} from '../../utils/ricePulManager';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membershipLevel: string;
  points: number;
  card: {
    number: string;
    expiryDate: string;
    holderName: string;
    region: string;
  };
}

interface Address {
  id: number;
  address: string;
  detailAddress: string;
  isDefault: boolean;
}

export default function MyPageScreen() {
  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [currentRicePul, setCurrentRicePul] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<RicePulLevel | null>(null);
  const [mealCardInfo, setMealCardInfo] = useState<MealCardInfo | null>(null);
  const [showRicePulModal, setShowRicePulModal] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);

  const [profile, setProfile] = useState<UserProfile>({
    name: '김철수',
    email: 'kimcheolsu@example.com',
    phone: '010-1234-5678',
    avatar: 'https://via.placeholder.com/120x120/FFBF00/FFFFFF?text=김철수',
    membershipLevel: 'GOLD',
    points: currentRicePul,
    card: {
      number: '',
      expiryDate: '',
      holderName: '',
      region: '',
    },
  });

  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [tempCard, setTempCard] = useState(profile.card);

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 1,
      address: '서울특별시 강남구 테헤란로 123',
      detailAddress: '456호',
      isDefault: true,
    },
    {
      id: 2,
      address: '서울특별시 종로구 종로 89',
      detailAddress: '10층',
      isDefault: false,
    },
  ]);

  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    address: '',
    detailAddress: '',
    isDefault: false,
  });

  // 화면이 포커스될 때마다 통합 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadIntegratedData();
    }, [])
  );

  // ✅ 수정된 통합 데이터 로드 함수
  const loadIntegratedData = async () => {
    try {
      console.log('📦 MyPage - 통합 데이터 로드 시작');
      
      // 사용자 프로필 로드 (밥풀, 레벨, 급식카드 모두 포함)
      const userProfile = await getUserProfile();
      const transactions = await getTransactionHistory(20);
      
      console.log('📦 통합 프로필 데이터:', userProfile);
      
      setCurrentRicePul(userProfile.ricePul);
      setCurrentLevel(userProfile.level);
      
      // ✅ 수정: 단순히 mealCard가 null인지만 체크
      setMealCardInfo(userProfile.mealCard);
      
      setTransactionHistory(transactions);
      
      // 기존 프로필 업데이트
      setProfile(prev => ({
        ...prev,
        name: userProfile.name,
        points: userProfile.ricePul
      }));
      
    } catch (error) {
      console.error('❌ 통합 데이터 로드 실패:', error);
    }
  };

  // 프로필 관련 함수들
  const handleProfileEdit = () => {
    setTempProfile(profile);
    setIsEditingProfile(true);
  };

  const handleProfileSave = () => {
    setProfile(tempProfile);
    setIsEditingProfile(false);
  };

  const handleProfileCancel = () => {
    setTempProfile(profile);
    setIsEditingProfile(false);
  };

  // 급식카드 관련 함수들
  const handleCardEdit = () => {
    setTempCard(profile.card);
    setIsEditingCard(true);
  };

  // ✅ 수정된 급식카드 등록 함수
  const handleCardSave = async () => {
    try {
      // ✅ 실제 registerMealCard 함수 사용
      const newMealCardInfo = await registerMealCard(tempCard.number, 50000);
      
      setProfile({ ...profile, card: tempCard });
      setMealCardInfo(newMealCardInfo);
      setIsEditingCard(false);
      
      Alert.alert('등록 완료', '급식카드가 성공적으로 등록되었습니다!');
      
      // 데이터 새로고침
      await loadIntegratedData();
    } catch (error) {
      console.error('급식카드 등록 실패:', error);
      Alert.alert('등록 실패', '급식카드 등록 중 오류가 발생했습니다.');
    }
  };

  const handleCardCancel = () => {
    setTempCard(profile.card);
    setIsEditingCard(false);
  };

  // ✅ 수정된 급식카드 삭제 함수
  const handleCardDelete = () => {
    Alert.alert(
      '급식카드 삭제',
      '등록된 급식카드를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ 실제 deleteMealCard 함수 사용
              await deleteMealCard();
              
              setMealCardInfo(null);
              setProfile(prev => ({
                ...prev,
                card: {
                  number: '',
                  expiryDate: '',
                  holderName: '',
                  region: '',
                }
              }));
              
              Alert.alert('삭제 완료', '급식카드가 삭제되었습니다.');
              
              // 데이터 새로고침
              await loadIntegratedData();
            } catch (error) {
              console.error('급식카드 삭제 실패:', error);
              Alert.alert('삭제 실패', '급식카드 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // ✅ 테스트용 충전 함수 (개발 중에만 사용)
  const handleTestCharge = async () => {
    try {
      await addTestBalance(30000);
      await loadIntegratedData();
      Alert.alert('테스트 충전 완료', '30,000원이 충전되었습니다!');
    } catch (error) {
      console.error('테스트 충전 실패:', error);
    }
  };

  // 카드 입력 포맷팅 함수들
  const formatCardNumberInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1-');
  };

  const formatExpiryDateInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
  };

  const maskCardNumberInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 8) {
      const visible = numbers.slice(0, 8);
      const masked = '*'.repeat(numbers.length - 8);
      const combined = visible + masked;
      return combined.replace(/(\d{4})(?=\d)/g, '$1-');
    }
    return formatCardNumberInput(numbers);
  };

  const maskExpiryInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 2) {
      const month = numbers.slice(0, 2);
      const year = '*'.repeat(numbers.length - 2);
      return month + '/' + year;
    }
    return formatExpiryDateInput(numbers);
  };

  // 지역 목록
  const regions = [
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',
    '경기도',
    '강원도',
    '충청북도',
    '충청남도',
    '전라북도',
    '전라남도',
    '경상북도',
    '경상남도',
    '제주특별자치도',
  ];

  // 주소 관련 함수들
  const handleAddAddress = () => {
    if (newAddress.address) {
      const id = Math.max(...addresses.map((a) => a.id), 0) + 1;
      setAddresses([...addresses, { ...newAddress, id }]);
      setNewAddress({
        address: '',
        detailAddress: '',
        isDefault: false,
      });
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(addresses.filter((addr) => addr.id !== id));
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  // 레벨 진행률 계산
  const getLevelProgress = () => {
    if (!currentLevel) return 0;
    const total = currentLevel.currentExp + currentLevel.expToNext;
    return total > 0 ? (currentLevel.currentExp / total) * 100 : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appTitle}>마이페이지</Text>
          </View>
          {/* ✅ 테스트용 충전 버튼 (개발 중에만 표시) */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestCharge}
            >
              <Text style={styles.testButtonText}>테스트 충전</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 프로필 배너 */}
        <LinearGradient 
          colors={['#FFBF00', '#FDD046']} 
          style={styles.profileBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileContent}>
            <View style={styles.profileRow}>
              <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profilePhone}>{profile.phone}</Text>
                
                {/* 레벨 정보 */}
                {currentLevel && (
                  <View style={styles.levelContainer}>
                    <Text style={styles.levelText}>
                      Lv.{currentLevel.level} {currentLevel.title}
                    </Text>
                    <View style={styles.levelProgress}>
                      <View 
                        style={[styles.levelProgressFill, { width: `${getLevelProgress()}%` }]} 
                      />
                    </View>
                    <Text style={styles.levelExpText}>
                      {currentLevel.expToNext > 0 
                        ? `다음 레벨까지 ${currentLevel.expToNext}밥풀` 
                        : '최고 레벨!'
                      }
                    </Text>
                  </View>
                )}
                
                {/* 밥풀 정보 */}
                <TouchableOpacity 
                  style={styles.pointsContainer}
                  onPress={loadIntegratedData}
                  activeOpacity={0.7}
                >
                  <View style={styles.riceIcon} />
                  <Text style={styles.pointsText}>
                    {currentRicePul.toLocaleString()}밥풀
                  </Text>
                </TouchableOpacity>
              </View>
              {!isEditingProfile && (
                <TouchableOpacity style={styles.editProfileButton} onPress={handleProfileEdit}>
                  <Text style={styles.editProfileButtonText}>수정</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* 프로필 수정 섹션 */}
        {isEditingProfile && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>개인정보 수정</Text>
            <View style={styles.editCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfile.name}
                  onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
                  placeholder="이름을 입력하세요"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfile.phone}
                  onChangeText={(text) => setTempProfile({ ...tempProfile, phone: text })}
                  placeholder="전화번호를 입력하세요"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.saveButton} onPress={handleProfileSave}>
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleProfileCancel}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 급식카드 등록 섹션 */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>급식카드</Text>
            {!isEditingCard && (
              <TouchableOpacity onPress={handleCardEdit}>
                <Text style={styles.seeAllText}>
                  {mealCardInfo ? '수정' : '등록'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>급식카드를 등록하여 편리하게 결제하세요</Text>

          <View style={styles.cardInfoCard}>
            {!isEditingCard ? (
              <View>
                {mealCardInfo ? (
                  <View style={styles.mealCardContainer}>
                    <View style={styles.mealCardHeader}>
                      <Text style={styles.mealCardTitle}>💳 급식카드</Text>
                      <View style={styles.registeredBadge}>
                        <Text style={styles.registeredBadgeText}>등록완료</Text>
                      </View>
                    </View>
                    
                    <View style={styles.mealCardBalance}>
                      <Text style={styles.balanceLabel}>현재 잔액</Text>
                      <Text style={styles.balanceAmount}>
                        {mealCardInfo.balance.toLocaleString()}원
                      </Text>
                    </View>
                    
                    <View style={styles.mealCardInfo}>
                      <Text style={styles.cardNumberText}>
                        카드번호: {mealCardInfo.cardNumber}
                      </Text>
                      {mealCardInfo.lastUsed && (
                        <Text style={styles.lastUsedText}>
                          최근 사용: {new Date(mealCardInfo.lastUsed).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    
                    {/* 레벨별 할인 혜택 표시 */}
                    {currentLevel && currentLevel.level >= 5 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          🎉 레벨 {currentLevel.level} 혜택: {
                            currentLevel.level >= 7 ? '15%' :
                            currentLevel.level >= 6 ? '10%' : '5%'
                          } 할인!
                        </Text>
                      </View>
                    )}

                    {/* 카드 삭제 버튼 */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.deleteCardButton}
                        onPress={handleCardDelete}
                      >
                        <Text style={styles.deleteCardButtonText}>카드 삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noCardContainer}>
                    <Text style={styles.noCardText}>급식카드를 등록해주세요</Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>카드번호</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 1234-5678-9012-3456"
                    value={formatCardNumberInput(tempCard.number)}
                    onChangeText={(text) => {
                      const numbers = text.replace(/\D/g, '');
                      if (numbers.length <= 16) {
                        setTempCard({ ...tempCard, number: numbers });
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>유효기간</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    value={formatExpiryDateInput(tempCard.expiryDate)}
                    onChangeText={(text) => {
                      const numbers = text.replace(/\D/g, '');
                      if (numbers.length <= 4) {
                        setTempCard({ ...tempCard, expiryDate: numbers });
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>카드 소유자 이름</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 김철수"
                    value={tempCard.holderName}
                    onChangeText={(text) => setTempCard({ ...tempCard, holderName: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>지역 선택</Text>
                  <View style={styles.regionGrid}>
                    {regions.map((region) => (
                      <TouchableOpacity
                        key={region}
                        style={[
                          styles.regionButton,
                          tempCard.region === region && styles.regionButtonSelected
                        ]}
                        onPress={() => setTempCard({ ...tempCard, region })}
                      >
                        <Text style={[
                          styles.regionButtonText,
                          tempCard.region === region && styles.regionButtonTextSelected
                        ]}>
                          {region}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleCardSave}>
                    <Text style={styles.saveButtonText}>등록</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCardCancel}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 주소 설정 섹션 */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>주소 설정</Text>
            <TouchableOpacity onPress={() => setIsAddingAddress(true)}>
              <Text style={styles.seeAllText}>+ 새 주소</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>자주 사용하는 주소를 등록하세요</Text>

          {/* 새 주소 추가 폼 */}
          {isAddingAddress && (
            <LinearGradient 
              colors={['#FFF8E1', '#FFE082']} 
              style={styles.addAddressCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.addAddressTitle}>📍 새 주소 추가</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>주소</Text>
                <TextInput
                  style={styles.input}
                  placeholder="예: 서울특별시 강남구 테헤란로 123"
                  value={newAddress.address}
                  onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
                  multiline
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>상세주소 (선택)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="예: 101동 202호, 3층"
                  value={newAddress.detailAddress}
                  onChangeText={(text) => setNewAddress({ ...newAddress, detailAddress: text })}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>기본 주소로 설정</Text>
                <Switch
                  value={newAddress.isDefault}
                  onValueChange={(value) => setNewAddress({ ...newAddress, isDefault: value })}
                  trackColor={{ false: '#d1d5db', true: '#FFBF00' }}
                  thumbColor={newAddress.isDefault ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.addSubmitButton} onPress={handleAddAddress}>
                  <Text style={styles.addSubmitButtonText}>추가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsAddingAddress(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}

          {/* 주소 목록 */}
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressLabelRow}>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>기본</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.addressText}>
                {address.address}
                {address.detailAddress ? ` ${address.detailAddress}` : ''}
              </Text>

              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <TouchableOpacity
                    style={styles.defaultButton}
                    onPress={() => handleSetDefaultAddress(address.id)}
                  >
                    <Text style={styles.defaultButtonText}>기본 설정</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.editAddressButton}>
                  <Text style={styles.editAddressButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAddress(address.id)}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* 밥풀 현황 섹션 */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>밥풀 현황</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.ricePulSummaryCard}
            onPress={() => setShowRicePulModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.ricePulSummaryContent}>
              <View style={styles.ricePulIconLarge} />
              <View style={styles.ricePulSummaryInfo}>
                <Text style={styles.ricePulSummaryAmount}>{currentRicePul.toLocaleString()}</Text>
                <Text style={styles.ricePulSummaryLabel}>보유 밥풀</Text>
                {currentLevel && (
                  <Text style={styles.ricePulLevelText}>
                    Lv.{currentLevel.level} {currentLevel.title}
                  </Text>
                )}
              </View>
              <View style={styles.ricePulSummaryArrow}>
                <Text style={styles.ricePulArrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 설정 섹션 */}
        <View style={[styles.contentSection, { paddingBottom: 40 }]}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>🔔 알림 설정</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>🔒 개인정보 처리방침</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>📄 이용약관</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.settingItem}>
              <Text style={[styles.settingText, { color: '#FF6B6B' }]}>🚪 로그아웃</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 밥풀 상세 모달 */}
      {showRicePulModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowRicePulModal(false)} 
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>밥풀 & 레벨 현황</Text>
                <Text style={styles.modalSubtitle}>나의 밥풀과 레벨 정보</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.modalRefreshButton}
                onPress={loadIntegratedData}
                activeOpacity={0.7}
              >
                <Text style={styles.modalRefreshButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* 밥풀 & 레벨 카드 */}
              <View style={styles.ricePulDetailCard}>
                <View style={styles.ricePulHeader}>
                  <View style={styles.ricePulIconLarge} />
                  <View style={styles.ricePulInfo}>
                    <Text style={styles.ricePulAmount}>{currentRicePul.toLocaleString()}</Text>
                    <Text style={styles.ricePulLabel}>보유 밥풀</Text>
                  </View>
                </View>
                
                {/* 레벨 정보 */}
                {currentLevel && (
                  <View style={styles.levelDetailSection}>
                    <Text style={styles.levelDetailTitle}>
                      🏆 Lv.{currentLevel.level} {currentLevel.title}
                    </Text>
                    <View style={styles.levelProgressDetail}>
                      <View 
                        style={[styles.levelProgressFillDetail, { width: `${getLevelProgress()}%` }]} 
                      />
                    </View>
                    <Text style={styles.levelDetailExp}>
                      {currentLevel.expToNext > 0 
                        ? `다음 레벨까지 ${currentLevel.expToNext}밥풀` 
                        : '최고 레벨 달성!'
                      }
                    </Text>
                    
                    {/* 레벨 혜택 */}
                    <View style={styles.levelBenefits}>
                      <Text style={styles.levelBenefitsTitle}>🎁 현재 혜택</Text>
                      {currentLevel.benefits.map((benefit, index) => (
                        <Text key={index} style={styles.levelBenefit}>• {benefit}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* 거래 내역 */}
              <View style={styles.historySection}>
                <Text style={styles.historySectionTitle}>📋 최근 거래 내역</Text>
                
                {transactionHistory.length > 0 ? (
                  <View style={styles.historyList}>
                    {transactionHistory.slice(0, 10).map((transaction, index) => (
                      <View key={transaction.id || index} style={styles.historyItem}>
                        <View style={styles.historyContent}>
                          <View style={styles.historyInfo}>
                            <Text style={styles.historyReason}>{transaction.reason}</Text>
                            <Text style={styles.historyDate}>
                              {new Date(transaction.timestamp).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                          <View style={styles.historyAmount}>
                            <Text style={[
                              styles.historyAmountText,
                              transaction.amount > 0
                                ? styles.historyAmountEarn 
                                : styles.historyAmountSpend
                            ]}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noHistoryContainer}>
                    <Text style={styles.noHistoryEmoji}>📝</Text>
                    <Text style={styles.noHistoryText}>아직 거래 내역이 없어요</Text>
                    <Text style={styles.noHistoryDesc}>챗봇과 대화하고 밥풀을 모아보세요!</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
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
  // ✅ 테스트 버튼 스타일 추가
  testButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  profileBanner: {
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
  profileContent: {
    padding: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  // 레벨 관련 스타일
  levelContainer: {
    marginBottom: 12,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  levelProgress: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    marginBottom: 4,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  levelExpText: {
    fontSize: 12,
    color: '#666',
  },
  pointsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  riceIcon: {
    width: 12,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    marginRight: 6,
    transform: [{ rotate: '15deg' }],
  },
  pointsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  editProfileButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  // 급식카드 관련 스타일
  mealCardContainer: {
    padding: 4,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mealCardBalance: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  mealCardInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardNumberText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cardInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  lastUsedText: {
    fontSize: 12,
    color: '#666',
  },
  discountBadge: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  discountText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  // 카드 액션 관련 스타일
  cardActions: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteCardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
  },
  deleteCardButtonText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  // 밥풀 상세 카드 스타일
  ricePulSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ricePulSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ricePulSummaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ricePulSummaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  ricePulSummaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ricePulLevelText: {
    fontSize: 12,
    color: '#FFBF00',
    fontWeight: '600',
    marginTop: 4,
  },
  ricePulSummaryArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ricePulArrowText: {
    fontSize: 16,
    color: '#6b7280',
  },
  // 모달 스타일
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContainer: {
    flex: 0.9,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalRefreshButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRefreshButtonText: {
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  ricePulDetailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ricePulHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ricePulIconLarge: {
    width: 20,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginRight: 12,
    transform: [{ rotate: '15deg' }],
    borderWidth: 1,
    borderColor: '#000000',
  },
  ricePulInfo: {
    flex: 1,
  },
  ricePulAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  ricePulLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // 레벨 상세 정보 스타일
  levelDetailSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  levelDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  levelProgressDetail: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  levelProgressFillDetail: {
    height: '100%',
    backgroundColor: '#FFBF00',
    borderRadius: 4,
  },
  levelDetailExp: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  levelBenefits: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  levelBenefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  levelBenefit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  // 거래 내역 스타일
  historySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyAmountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyAmountEarn: {
    color: '#22c55e',
  },
  historyAmountSpend: {
    color: '#ef4444',
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noHistoryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noHistoryDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
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
  seeAllText: {
    fontSize: 14,
    color: '#FFBF00',
    fontWeight: '600',
  },
  editCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registeredBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  registeredBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  regionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  regionButtonSelected: {
    backgroundColor: '#FFBF00',
    borderColor: '#FFBF00',
  },
  regionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  regionButtonTextSelected: {
    color: '#333',
    fontWeight: '700',
  },
  noCardContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  addAddressCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    padding: 20,
  },
  addAddressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
  },
  saveButtonText: {
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  addSubmitButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
  },
  addSubmitButtonText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    marginBottom: 8,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  defaultButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  editAddressButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editAddressButtonText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 16,
    color: '#6b7280',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
  },
});