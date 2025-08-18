// CharacterShopModal.tsx - 밥풀 시스템 적용
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getRicePul, spendRicePul } from '../utils/ricePulManager';
import StorageService from '../utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CharacterShopModalProps {
  visible: boolean;
  onClose: () => void;
  currentGifIndex: number;
  onGifChange: (index: number) => void;
  isAnimationEnabled: boolean;
}

// 캐릭터 아이템 타입 정의
interface CharacterItem {
  id: string;
  name: string;
  description: string;
  gifSource: any;
  staticSource: any;
  price: number;
  category: 'emotion' | 'action' | 'special';
  unlocked: boolean;
}

// 밥풀 아이콘 컴포넌트 생성
const RiceIcon = ({ size = 4 }) => (
  <Image
    source={require('../assets/rice.png')}
    style={{
      width: size,
      height: size, // 밥알 모양에 맞게 비율 조정
      resizeMode: 'contain',
      transform: [{ rotate: '30deg' }],
    }}
  />
);

// 상점 아이템들 정의
const SHOP_ITEMS: CharacterItem[] = [
  {
    id: 'hi',
    name: '인사하기',
    description: '친근한 인사 모션',
    gifSource: require('../assets/Hi.gif'),
    staticSource: require('../assets/Hi.gif'),
    price: 0, // 기본 무료
    category: 'emotion',
    unlocked: true,
  },
  {
    id: 'sad',
    name: '슬픈 표정',
    description: '애교 가득한 슬픈 모션',
    gifSource: require('../assets/Sad.gif'),
    staticSource: require('../assets/Sad.gif'),
    price: 100,
    category: 'emotion',
    unlocked: false,
  },
  {
    id: 'dance',
    name: '춤추기',
    description: '신나는 댄스 모션',
    gifSource: require('../assets/Dance.gif'),
    staticSource: require('../assets/Dance.gif'),
    price: 200,
    category: 'action',
    unlocked: false,
  },
  {
    id: 'jump',
    name: '점프하기',
    description: '활발한 점프 모션',
    gifSource: require('../assets/Jump.gif'),
    staticSource: require('../assets/Jump.gif'),
    price: 150,
    category: 'action',
    unlocked: false,
  },
  {
    id: 'sunglass',
    name: '선글라스',
    description: '멋진 선글라스 착용',
    gifSource: require('../assets/Sunglass.gif'),
    staticSource: require('../assets/Sunglass.gif'),
    price: 0, // 기본 무료 (수정: 200 -> 0)
    category: 'special',
    unlocked: true,
  },
];

const CharacterShopModal: React.FC<CharacterShopModalProps> = ({
  visible,
  onClose,
  currentGifIndex,
  onGifChange,
  isAnimationEnabled,
}) => {
  const [ricePul, setRicePul] = useState(1000); 
  const [ownedItems, setOwnedItems] = useState<string[]>(['hi', 'sunglass']); // StorageService 기본값과 동일
  const [selectedCategory, setSelectedCategory] = useState<'emotion' | 'action' | 'special'>('emotion');
  const [isLoading, setIsLoading] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  // 사용자 데이터 로드 (밥풀 + 아이템)
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // 밥풀 데이터 로드
      const currentRicePul = await getRicePul();
      
      // 아이템 데이터 로드 (기존 StorageService 사용)
      const userData = await StorageService.getUserData();
      
      console.log('📦 CharacterShop - 데이터 로드:', {
        ricePul: currentRicePul,
        items: userData.ownedItems
      });
      
      setRicePul(currentRicePul);
      setOwnedItems(userData.ownedItems);
    } catch (error) {
      console.error('❌ 사용자 데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 아이템 구매 처리
  const handlePurchase = async (item: CharacterItem, itemIndex: number) => {
    console.log('🛒 구매 시도:', {
      item: item.name,
      id: item.id,
      price: item.price,
      itemIndex,
      currentRicePul: ricePul,
      alreadyOwned: ownedItems.includes(item.id)
    });
    
    // 이미 보유한 아이템은 바로 사용
    if (ownedItems.includes(item.id)) {
      console.log('✅ 보유 아이템 사용:', itemIndex);
      onGifChange(itemIndex);
      return;
    }

    // 무료 아이템은 바로 사용
    if (item.price === 0) {
      console.log('🆓 무료 아이템 사용:', itemIndex);
      try {
        const newItems = await StorageService.addOwnedItem(item.id);
        setOwnedItems(newItems);
        onGifChange(itemIndex);
      } catch (error) {
        console.error('무료 아이템 추가 실패:', error);
      }
      return;
    }

    // 밥풀 부족 체크
    if (ricePul < item.price) {
      Alert.alert('밥풀 부족', '밥풀이 부족합니다. 밥풀을 모아보세요!');
      return;
    }

    // 구매 확인 팝업
    Alert.alert(
      '아이템 구매',
      `${item.name}을(를) ${item.price} 밥풀로 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: () => executePurchase(item, itemIndex),
        },
      ]
    );
  };

  // 실제 구매 실행
  const executePurchase = async (item: CharacterItem, itemIndex: number) => {
    try {
      setIsLoading(true);
      console.log('💳 구매 실행 중...', item.name);

      // 밥풀 사용
      const success = await spendRicePul(item.price, `캐릭터 아이템 구매: ${item.name}`);
      
      if (success) {
        // 아이템 보유 목록에 추가
        const newItems = await StorageService.addOwnedItem(item.id);
        
        // 최신 밥풀 수량 조회
        const newRicePul = await getRicePul();
        
        console.log('✅ 구매 성공:', {
          item: item.name,
          newRicePul: newRicePul,
          newItems: newItems
        });

        // UI 상태 업데이트
        setRicePul(newRicePul);
        setOwnedItems(newItems);
        
        // 구매한 아이템 바로 적용
        onGifChange(itemIndex);
        
        // 성공 메시지
        Alert.alert('구매 완료', `${item.name}을(를) 구매했습니다! 🎉`);
      } else {
        console.log('❌ 구매 실패: 밥풀 부족');
        Alert.alert('구매 실패', '구매 중 문제가 발생했습니다.');
      }
    } catch (error) {
      console.error('💥 구매 오류:', error);
      Alert.alert('오류', '구매 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리별 아이템 필터링
  const getFilteredItems = () => {
    return SHOP_ITEMS.filter(item => item.category === selectedCategory);
  };

  // 카테고리 버튼 렌더링
  const renderCategoryButton = (category: 'emotion' | 'action' | 'special', label: string, emoji: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonSelected
      ]}
      onPress={() => setSelectedCategory(category)}
      disabled={isLoading}
    >
      <Text style={styles.categoryEmoji}>{emoji}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.categoryTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 아이템 카드 렌더링
  const renderItemCard = (item: CharacterItem, index: number) => {
    const isOwned = ownedItems.includes(item.id);
    const realIndex = SHOP_ITEMS.findIndex(shopItem => shopItem.id === item.id);
    const isSelected = currentGifIndex === realIndex;
    const isFree = item.price === 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemCard,
          isSelected && styles.itemCardSelected,
          isOwned && styles.itemCardOwned,
          isLoading && styles.itemCardDisabled,
        ]}
        onPress={() => handlePurchase(item, realIndex)}
        disabled={isLoading}
      >
        {/* 아이템 이미지 */}
        <View style={styles.itemImageContainer}>
          <Image
            source={isAnimationEnabled ? item.gifSource : item.staticSource}
            style={styles.itemImage}
            contentFit="contain"
          />
          
          {/* 선택 표시 */}
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>사용중</Text>
            </View>
          )}
          
          {/* 보유 표시 */}
          {isOwned && !isSelected && (
            <View style={styles.ownedBadge}>
              <Text style={styles.ownedBadgeText}>보유</Text>
            </View>
          )}

          {/* 무료 표시 */}
          {!isOwned && isFree && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>무료</Text>
            </View>
          )}
        </View>

        {/* 아이템 정보 */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          
          {/* 가격 또는 상태 */}
          <View style={styles.itemPriceContainer}>
            {isOwned ? (
              <Text style={styles.ownedText}>
                {isSelected ? '사용중' : '보유함'}
              </Text>
            ) : isFree ? (
              <Text style={styles.freeText}>무료</Text>
            ) : (
              <View style={styles.priceRow}>
                <RiceIcon size={14} />
                <Text style={styles.itemPrice}>{item.price.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            disabled={isLoading}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>캐릭터 상점</Text>
            <Text style={styles.subtitle}>
              {isLoading ? '로딩 중...' : '르시를 꾸며보세요!'}
            </Text>
          </View>
          
          {/* 밥풀 표시 - SVG 아이콘 적용 */}
          <View style={styles.ricePulContainer}>
            <RiceIcon size={16} />
            <Text style={styles.ricePulAmount}>{ricePul.toLocaleString()}</Text>
          </View>
        </View>

        {/* 카테고리 선택 */}
        <View style={styles.categoryContainer}>
          {renderCategoryButton('emotion', '감정', '😊')}
          {renderCategoryButton('action', '액션', '🏃')}
          {renderCategoryButton('special', '특별', '✨')}
        </View>

        {/* 아이템 목록 */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isLoading}
        >
          <View style={styles.itemGrid}>
            {getFilteredItems().map((item, index) => renderItemCard(item, index))}
          </View>
          
          {/* 밥풀 획득 안내 */}
          <View style={styles.ricePulGuideContainer}>
            <Text style={styles.ricePulGuideTitle}>💡 밥풀 획득 방법</Text>
            <Text style={styles.ricePulGuideText}>
              • 매일 로그인: 10 밥풀{'\n'}
              • 메뉴 추천 받기: 5 밥풀{'\n'}
              • 추천 받은 식당 찾아가기: 5 밥풀{'\n'}
              • 리뷰 작성: 50 밥풀
            </Text>
          </View>
        </ScrollView>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>처리 중...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ricePulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a8e6a8',
  },
  ricePulAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5a2d',
    marginLeft: 6, // SVG 아이콘과의 간격
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  categoryButtonSelected: {
    backgroundColor: '#FFBF00',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCardSelected: {
    borderColor: '#FFBF00',
    backgroundColor: '#fff9e6',
  },
  itemCardOwned: {
    borderColor: '#28a745',
  },
  itemCardDisabled: {
    opacity: 0.7,
  },
  itemImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFBF00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  ownedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  freeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#17a2b8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemInfo: {
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemPriceContainer: {
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // SVG 아이콘과 텍스트 사이 간격
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5a2d',
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  freeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17a2b8',
  },
  ricePulGuideContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ricePulGuideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ricePulGuideText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default CharacterShopModal;