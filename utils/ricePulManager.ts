// utils/ricePulManager.ts - 통합 밥풀 & 급식카드 관리 시스템
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const RICE_PUL_KEY = 'user_rice_pul';
const RICE_PUL_LEVEL_KEY = 'user_rice_pul_level';
const MEAL_CARD_BALANCE_KEY = 'meal_card_balance';
const TRANSACTION_HISTORY_KEY = 'integrated_transaction_history';
const USER_PROFILE_KEY = 'user_profile';

// 🔥 프로필 캐시 추가
let profileCache: UserProfile | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// 인터페이스 정의
export interface Transaction {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
  type: 'earn_ricepul' | 'spend_ricepul' | 'charge_card' | 'spend_card' | 'level_reward';
  category?: 'food_recommendation' | 'chatbot_interaction' | 'daily_bonus' | 'meal_purchase' | 'card_charge';
}

export interface RicePulLevel {
  level: number;
  currentExp: number;
  expToNext: number;
  title: string;
  benefits: string[];
}

export interface MealCardInfo {
  balance: number;
  cardNumber: string;
  lastUsed?: number;
}

export interface UserProfile {
  name: string;
  ricePul: number;
  level: RicePulLevel;
  mealCard: MealCardInfo | null;  // null 허용 - 카드가 등록되지 않을 수 있음
  totalEarnedRicePul: number;
  totalSpentRicePul: number;
  totalMealSpent: number;
  joinDate: number;
}

// 레벨 시스템 설정
const LEVEL_CONFIG = [
  { level: 1, expRequired: 0, title: "밥풀 새싹", benefits: ["기본 추천 기능"] },
  { level: 2, expRequired: 100, title: "밥풀 새내기", benefits: ["추천 기록 저장", "일일 보너스 +5"] },
  { level: 3, expRequired: 250, title: "밥풀 도전자", benefits: ["특별 추천 메뉴", "일일 보너스 +10"] },
  { level: 4, expRequired: 500, title: "밥풀 전문가", benefits: ["개인 맞춤 추천", "주간 보너스 +50"] },
  { level: 5, expRequired: 1000, title: "밥풀 마스터", benefits: ["프리미엄 추천", "급식카드 5% 할인"] },
  { level: 6, expRequired: 2000, title: "밥풀 전설", benefits: ["무제한 추천", "급식카드 10% 할인"] },
  { level: 7, expRequired: 4000, title: "밥풀 신", benefits: ["모든 기능 무제한", "급식카드 15% 할인"] }
];

// ===================
// 밥풀 관리 함수들
// ===================

// 밥풀 획득
export const awardRicePul = async (amount: number, reason: string, category?: string): Promise<{ levelUp: boolean, newLevel?: RicePulLevel }> => {
  try {
    const profile = await getUserProfile();
    const newRicePul = profile.ricePul + amount;
    const newTotalEarned = profile.totalEarnedRicePul + amount;
    
    // 레벨 체크
    const levelResult = await checkAndUpdateLevel(newTotalEarned);
    
    // 프로필 업데이트
    const updatedProfile: UserProfile = {
      ...profile,
      ricePul: newRicePul,
      totalEarnedRicePul: newTotalEarned,
      level: levelResult.newLevel || profile.level
    };
    
    await AsyncStorage.setItem(RICE_PUL_KEY, newRicePul.toString());
    await saveUserProfile(updatedProfile);
    
    // 거래 기록 추가
    await addTransaction({
      id: Date.now().toString(),
      amount,
      reason,
      timestamp: Date.now(),
      type: 'earn_ricepul',
      category: category as any
    });
    
    console.log(`밥풀 ${amount}개 획득! (사유: ${reason})`);
    
    return {
      levelUp: levelResult.levelUp,
      newLevel: levelResult.newLevel
    };
  } catch (error) {
    console.error('밥풀 획득 실패:', error);
    return { levelUp: false };
  }
};

// 밥풀 사용
export const spendRicePul = async (amount: number, reason: string, category?: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    
    if (profile.ricePul < amount) {
      console.log('밥풀이 부족합니다!');
      return false;
    }
    
    const newRicePul = profile.ricePul - amount;
    const newTotalSpent = profile.totalSpentRicePul + amount;
    
    const updatedProfile: UserProfile = {
      ...profile,
      ricePul: newRicePul,
      totalSpentRicePul: newTotalSpent
    };
    
    await AsyncStorage.setItem(RICE_PUL_KEY, newRicePul.toString());
    await saveUserProfile(updatedProfile);
    
    // 거래 기록 추가
    await addTransaction({
      id: Date.now().toString(),
      amount: -amount,
      reason,
      timestamp: Date.now(),
      type: 'spend_ricepul',
      category: category as any
    });
    
    console.log(`밥풀 ${amount}개 사용! (사유: ${reason})`);
    return true;
  } catch (error) {
    console.error('밥풀 사용 실패:', error);
    return false;
  }
};

// ===================
// 레벨 시스템 함수들
// ===================

// 레벨 체크 및 업데이트
const checkAndUpdateLevel = async (totalExp: number): Promise<{ levelUp: boolean, newLevel?: RicePulLevel }> => {
  const currentLevel = await getRicePulLevel();
  
  // 다음 레벨 찾기
  let newLevelIndex = LEVEL_CONFIG.findIndex(config => totalExp < config.expRequired);
  if (newLevelIndex === -1) newLevelIndex = LEVEL_CONFIG.length - 1;
  else newLevelIndex = Math.max(0, newLevelIndex - 1);
  
  const newLevelConfig = LEVEL_CONFIG[newLevelIndex];
  const nextLevelConfig = LEVEL_CONFIG[newLevelIndex + 1];
  
  const newLevel: RicePulLevel = {
    level: newLevelConfig.level,
    currentExp: totalExp,
    expToNext: nextLevelConfig ? nextLevelConfig.expRequired - totalExp : 0,
    title: newLevelConfig.title,
    benefits: newLevelConfig.benefits
  };
  
  // 레벨업 체크
  const levelUp = newLevel.level > currentLevel.level;
  
  if (levelUp) {
    // 레벨업 보너스 지급
    const bonus = newLevel.level * 10;
    await addTransaction({
      id: `levelup_${Date.now()}`,
      amount: bonus,
      reason: `레벨 ${newLevel.level} 달성 보너스`,
      timestamp: Date.now(),
      type: 'level_reward'
    });
    
    console.log(`레벨업! ${currentLevel.level} → ${newLevel.level}`);
  }
  
  await AsyncStorage.setItem(RICE_PUL_LEVEL_KEY, JSON.stringify(newLevel));
  
  return { levelUp, newLevel: levelUp ? newLevel : undefined };
};

// 현재 레벨 조회
export const getRicePulLevel = async (): Promise<RicePulLevel> => {
  try {
    const levelJson = await AsyncStorage.getItem(RICE_PUL_LEVEL_KEY);
    if (levelJson) {
      return JSON.parse(levelJson);
    }
    
    // 기본 레벨 반환
    const defaultLevel: RicePulLevel = {
      level: 1,
      currentExp: 0,
      expToNext: 100,
      title: "밥풀 새싹",
      benefits: ["기본 추천 기능"]
    };
    
    await AsyncStorage.setItem(RICE_PUL_LEVEL_KEY, JSON.stringify(defaultLevel));
    return defaultLevel;
  } catch (error) {
    console.error('레벨 조회 실패:', error);
    return {
      level: 1,
      currentExp: 0,
      expToNext: 100,
      title: "밥풀 새싹",
      benefits: ["기본 추천 기능"]
    };
  }
};

// ===================
// 급식카드 관리 함수들
// ===================

// 급식카드 충전
export const chargeMealCard = async (amount: number, method: string = '카드충전'): Promise<boolean> => {
  try {
    const mealCard = await getMealCardInfo();
    
    // ✅ 수정: 카드가 등록되지 않은 경우 체크
    if (!mealCard) {
      console.log('급식카드가 등록되지 않았습니다!');
      return false;
    }
    
    const newBalance = mealCard.balance + amount;
    
    const updatedCard: MealCardInfo = {
      ...mealCard,
      balance: newBalance
    };
    
    await AsyncStorage.setItem(MEAL_CARD_BALANCE_KEY, JSON.stringify(updatedCard));
    
    // 거래 기록 추가
    await addTransaction({
      id: Date.now().toString(),
      amount,
      reason: `급식카드 충전 (${method})`,
      timestamp: Date.now(),
      type: 'charge_card',
      category: 'card_charge'
    });
    
    console.log(`급식카드 ${amount}원 충전 완료!`);
    return true;
  } catch (error) {
    console.error('급식카드 충전 실패:', error);
    return false;
  }
};

// 급식카드 사용
export const useMealCard = async (amount: number, reason: string = '급식 구매'): Promise<boolean> => {
  try {
    const mealCard = await getMealCardInfo();
    
    // ✅ 수정: 카드가 등록되지 않은 경우 체크
    if (!mealCard) {
      console.log('급식카드가 등록되지 않았습니다!');
      return false;
    }
    
    const profile = await getUserProfile();
    
    // 레벨별 할인 적용
    const discountRate = getDiscountRate(profile.level.level);
    const discountedAmount = Math.floor(amount * (1 - discountRate));
    
    if (mealCard.balance < discountedAmount) {
      console.log('급식카드 잔액이 부족합니다!');
      return false;
    }
    
    const newBalance = mealCard.balance - discountedAmount;
    
    const updatedCard: MealCardInfo = {
      ...mealCard,
      balance: newBalance,
      lastUsed: Date.now()
    };
    
    // 프로필 업데이트 (총 급식 지출 기록)
    const updatedProfile: UserProfile = {
      ...profile,
      totalMealSpent: profile.totalMealSpent + discountedAmount
    };
    
    await AsyncStorage.setItem(MEAL_CARD_BALANCE_KEY, JSON.stringify(updatedCard));
    await saveUserProfile(updatedProfile);
    
    // 거래 기록 추가
    await addTransaction({
      id: Date.now().toString(),
      amount: -discountedAmount,
      reason: discountRate > 0 ? `${reason} (${Math.round(discountRate * 100)}% 할인 적용)` : reason,
      timestamp: Date.now(),
      type: 'spend_card',
      category: 'meal_purchase'
    });
    
    // 급식 구매 시 밥풀 보상 (구매액의 1%)
    const ricePulReward = Math.floor(discountedAmount / 100);
    if (ricePulReward > 0) {
      await awardRicePul(ricePulReward, '급식 구매 보상', 'meal_purchase');
    }
    
    console.log(`급식카드 ${discountedAmount}원 사용! (할인율: ${Math.round(discountRate * 100)}%)`);
    return true;
  } catch (error) {
    console.error('급식카드 사용 실패:', error);
    return false;
  }
};

// 급식카드 정보 조회
export const getMealCardInfo = async (): Promise<MealCardInfo | null> => {
  try {
    const cardJson = await AsyncStorage.getItem(MEAL_CARD_BALANCE_KEY);
    if (cardJson) {
      return JSON.parse(cardJson);
    }
    
    // ✅ 수정: 카드가 등록되지 않았으면 null 반환 (새 카드 생성하지 않음)
    return null;
  } catch (error) {
    console.error('급식카드 조회 실패:', error);
    return null;
  }
};

// ===================
// 통합 관리 함수들
// ===================

// 현재 밥풀 조회
export const getRicePul = async (): Promise<number> => {
  try {
    const ricePul = await AsyncStorage.getItem(RICE_PUL_KEY);
    return ricePul ? parseInt(ricePul, 10) : 0;
  } catch (error) {
    console.error('밥풀 조회 실패:', error);
    return 0;
  }
};

// 사용자 프로필 조회 (캐싱 적용)
export const getUserProfile = async (forceRefresh: boolean = false): Promise<UserProfile> => {
  try {
    // 캐시가 유효하고 강제 새로고침이 아닌 경우 캐시 반환
    const now = Date.now();
    if (!forceRefresh && profileCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return profileCache;
    }

    const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      const profile = JSON.parse(profileJson);
      
      // 프로필에서 누락된 필드들을 최신 데이터로 보완
      profile.ricePul = await getRicePul();
      profile.level = await getRicePulLevel();
      profile.mealCard = await getMealCardInfo();
      
      // 🔥 이름이 "나비얌 사용자"면 "사용자"로 변경 (한 번만)
      let shouldSave = false;
      if (profile.name === "나비얌 사용자") {
        profile.name = "사용자";
        shouldSave = true;
        console.log('🔄 이름을 "사용자"로 변경합니다.');
      }
      
      // 변경사항이 있으면 저장
      if (shouldSave) {
        await saveUserProfile(profile);
      }
      
      // 🔥 캐시 업데이트
      profileCache = profile;
      cacheTimestamp = now;
      
      return profile;
    }
    
    // 기본 프로필 생성
    const defaultProfile: UserProfile = {
      name: '사용자',
      ricePul: await getRicePul(),
      level: await getRicePulLevel(),
      mealCard: null,
      totalEarnedRicePul: 0,
      totalSpentRicePul: 0,
      totalMealSpent: 0,
      joinDate: Date.now()
    };
    
    await saveUserProfile(defaultProfile);
    
    // 🔥 캐시 업데이트
    profileCache = defaultProfile;
    cacheTimestamp = now;
    
    return defaultProfile;
  } catch (error) {
    console.error('사용자 프로필 조회 실패:', error);
    
    // 에러 시 기본값 반환
    const errorProfile: UserProfile = {
      name: '사용자',
      ricePul: 0,
      level: {
        level: 1,
        currentExp: 0,
        expToNext: 100,
        title: "밥풀 새싹",
        benefits: ["기본 추천 기능"]
      },
      mealCard: null,
      totalEarnedRicePul: 0,
      totalSpentRicePul: 0,
      totalMealSpent: 0,
      joinDate: Date.now()
    };
    
    // 🔥 에러 시에도 캐시 설정
    profileCache = errorProfile;
    cacheTimestamp = Date.now();
    
    return errorProfile;
  }
};

// 사용자 프로필 저장 (캐시 업데이트 포함)
const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    
    // 🔥 저장할 때마다 캐시 업데이트
    profileCache = profile;
    cacheTimestamp = Date.now();
    
    console.log('💾 프로필 저장 및 캐시 업데이트 완료');
  } catch (error) {
    console.error('사용자 프로필 저장 실패:', error);
  }
};

// 거래 기록 추가
const addTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const historyJson = await AsyncStorage.getItem(TRANSACTION_HISTORY_KEY);
    const history: Transaction[] = historyJson ? JSON.parse(historyJson) : [];
    
    history.unshift(transaction); // 최신 거래를 맨 앞에 추가
    
    // 최근 200개의 거래만 보관
    const trimmedHistory = history.slice(0, 200);
    
    await AsyncStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('거래 기록 실패:', error);
  }
};

// 거래 기록 조회
export const getTransactionHistory = async (limit?: number): Promise<Transaction[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(TRANSACTION_HISTORY_KEY);
    const history: Transaction[] = historyJson ? JSON.parse(historyJson) : [];
    return limit ? history.slice(0, limit) : history;
  } catch (error) {
    console.error('거래 기록 조회 실패:', error);
    return [];
  }
};

// ===================
// 유틸리티 함수들
// ===================

// 레벨별 할인율 계산
const getDiscountRate = (level: number): number => {
  if (level >= 7) return 0.15; // 15% 할인
  if (level >= 6) return 0.10; // 10% 할인
  if (level >= 5) return 0.05; // 5% 할인
  return 0; // 할인 없음
};

// 일일 보너스 지급
export const claimDailyBonus = async (): Promise<{ success: boolean, amount?: number, alreadyClaimed?: boolean }> => {
  try {
    const profile = await getUserProfile();
    const today = new Date().toDateString();
    const lastBonusKey = 'last_daily_bonus';
    const lastBonus = await AsyncStorage.getItem(lastBonusKey);
    
    if (lastBonus === today) {
      return { success: false, alreadyClaimed: true };
    }
    
    // 레벨별 보너스 계산
    let bonusAmount = 10; // 기본 보너스
    if (profile.level.level >= 2) bonusAmount += 5;
    if (profile.level.level >= 3) bonusAmount += 5;
    if (profile.level.level >= 4) bonusAmount += 30; // 주간 보너스를 일일로 환산
    
    const result = await awardRicePul(bonusAmount, '일일 보너스', 'daily_bonus');
    await AsyncStorage.setItem(lastBonusKey, today);
    
    return { success: true, amount: bonusAmount };
  } catch (error) {
    console.error('일일 보너스 지급 실패:', error);
    return { success: false };
  }
};

// 전체 데이터 초기화 (테스트용)
export const resetAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      RICE_PUL_KEY,
      RICE_PUL_LEVEL_KEY,
      MEAL_CARD_BALANCE_KEY,
      TRANSACTION_HISTORY_KEY,
      USER_PROFILE_KEY,
      'last_daily_bonus'
    ]);
    
    // 🔥 캐시도 초기화
    clearProfileCache();
    
    console.log('모든 데이터가 초기화되었습니다.');
  } catch (error) {
    console.error('데이터 초기화 실패:', error);
  }
};

// 통계 조회
export const getStatistics = async () => {
  try {
    const profile = await getUserProfile();
    const history = await getTransactionHistory();
    
    // 오늘 거래 통계
    const today = new Date().toDateString();
    const todayTransactions = history.filter(t => 
      new Date(t.timestamp).toDateString() === today
    );
    
    const todayEarned = todayTransactions
      .filter(t => t.type === 'earn_ricepul')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const todaySpent = todayTransactions
      .filter(t => t.type === 'spend_ricepul' || t.type === 'spend_card')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      profile,
      todayEarned,
      todaySpent,
      totalTransactions: history.length,
      discountRate: getDiscountRate(profile.level.level),
      hasMealCard: profile.mealCard !== null,  // ✅ 추가: 카드 등록 여부
      mealCardBalance: profile.mealCard?.balance || 0  // ✅ 추가: 안전한 잔액 조회
    };
  } catch (error) {
    console.error('통계 조회 실패:', error);
    return null;
  }
};

// ===================
// 추가 유틸리티 함수들
// ===================

// 급식카드에 테스트 잔액 추가 (개발용)
export const addTestBalance = async (amount: number = 50000): Promise<boolean> => {
  try {
    const mealCard = await getMealCardInfo();
    
    // ✅ 수정: 카드가 등록되지 않은 경우 먼저 등록
    if (!mealCard) {
      console.log('카드가 등록되지 않아 테스트 카드를 등록합니다...');
      await registerMealCard('1234567890123456', amount);
      return true;
    }
    
    // 이미 등록된 카드가 있으면 충전
    const result = await chargeMealCard(amount, '테스트 충전');
    console.log(`테스트 잔액 ${amount}원 추가 완료!`);
    return result;
  } catch (error) {
    console.error('테스트 잔액 추가 실패:', error);
    return false;
  }
};

// 밥풀 테스트 지급 (개발용)
export const addTestRicePul = async (amount: number = 1000): Promise<boolean> => {
  try {
    const result = await awardRicePul(amount, '테스트 밥풀 지급', 'daily_bonus');
    console.log(`테스트 밥풀 ${amount}개 지급 완료!`);
    return result.levelUp;
  } catch (error) {
    console.error('테스트 밥풀 지급 실패:', error);
    return false;
  }
};

// 급식카드 등록 및 충전 (UI에서 사용)
export const registerMealCard = async (cardNumber: string, initialBalance: number = 50000): Promise<MealCardInfo> => {
  try {
    const newMealCardInfo: MealCardInfo = {
      balance: initialBalance,
      cardNumber: cardNumber.slice(0, 8) + '****',
      lastUsed: undefined
    };
    
    await AsyncStorage.setItem(MEAL_CARD_BALANCE_KEY, JSON.stringify(newMealCardInfo));
    
    // 거래 기록 추가
    await addTransaction({
      id: Date.now().toString(),
      amount: initialBalance,
      reason: '급식카드 등록 및 초기 충전',
      timestamp: Date.now(),
      type: 'charge_card',
      category: 'card_charge'
    });
    
    console.log(`급식카드 등록 완료! 초기 잔액: ${initialBalance}원`);
    return newMealCardInfo;
  } catch (error) {
    console.error('급식카드 등록 실패:', error);
    throw error;
  }
};

// 급식카드 삭제
export const deleteMealCard = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(MEAL_CARD_BALANCE_KEY);
    console.log('급식카드 삭제 완료!');
    return true;
  } catch (error) {
    console.error('급식카드 삭제 실패:', error);
    return false;
  }
};

// 🔥 캐시 강제 새로고침 함수 추가
export const refreshUserProfile = async (): Promise<UserProfile> => {
  return await getUserProfile(true);
};

// 🔥 캐시 무효화 함수 추가
export const clearProfileCache = (): void => {
  profileCache = null;
  cacheTimestamp = 0;
  console.log('🗑️ 프로필 캐시가 무효화되었습니다.');
};