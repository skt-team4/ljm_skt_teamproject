// utils/storage.ts - AsyncStorage 중앙 관리
import AsyncStorage from '@react-native-async-storage/async-storage';

// 스토리지 키 상수 정의
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_ID: 'userId',
  USER_COINS: 'userCoins',
  OWNED_ITEMS: 'ownedCharacterItems',
  IS_FIRST_LOGIN: 'isFirstLogin',
  LAST_LOGIN_DATE: 'lastLoginDate',
} as const;

// 기본값 정의
const DEFAULT_VALUES = {
  COINS: 1000,
  FIRST_LOGIN_BONUS: 1500,
  DEFAULT_ITEMS: ['hi', 'sunglass'],
} as const;

// 타입 정의
export interface UserData {
  token?: string;
  userId?: string;
  coins: number;
  ownedItems: string[];
  isFirstLogin: boolean;
}

export class StorageService {
  // === 인증 관련 ===
  static async setAuthData(token: string, userId: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_TOKEN, token],
        [STORAGE_KEYS.USER_ID, userId],
      ]);
    } catch (error) {
      console.error('Auth data save failed:', error);
      throw error;
    }
  }

  static async getAuthData(): Promise<{ token?: string; userId?: string }> {
    try {
      const [[, token], [, userId]] = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_ID,
      ]);
      return { token: token || undefined, userId: userId || undefined };
    } catch (error) {
      console.error('Auth data load failed:', error);
      return {};
    }
  }

  static async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_ID,
      ]);
    } catch (error) {
      console.error('Auth data clear failed:', error);
      throw error;
    }
  }

  // === 사용자 게임 데이터 ===
  static async getUserData(): Promise<UserData> {
    try {
      const [
        [, token],
        [, userId], 
        [, coinsStr],
        [, itemsStr],
        [, isFirstStr]
      ] = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_COINS,
        STORAGE_KEYS.OWNED_ITEMS,
        STORAGE_KEYS.IS_FIRST_LOGIN,
      ]);

      return {
        token: token || undefined,
        userId: userId || undefined,
        coins: coinsStr ? parseInt(coinsStr, 10) : DEFAULT_VALUES.COINS,
        ownedItems: itemsStr ? JSON.parse(itemsStr) : DEFAULT_VALUES.DEFAULT_ITEMS,
        isFirstLogin: isFirstStr === 'true',
      };
    } catch (error) {
      console.error('User data load failed:', error);
      // 오류시 기본값 반환
      return {
        coins: DEFAULT_VALUES.COINS,
        ownedItems: DEFAULT_VALUES.DEFAULT_ITEMS,
        isFirstLogin: false,
      };
    }
  }

  // === 코인 관리 ===
  static async getCoins(): Promise<number> {
    try {
      const coinsStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_COINS);
      return coinsStr ? parseInt(coinsStr, 10) : DEFAULT_VALUES.COINS;
    } catch (error) {
      console.error('Coins load failed:', error);
      return DEFAULT_VALUES.COINS;
    }
  }

  static async setCoins(coins: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_COINS, coins.toString());
    } catch (error) {
      console.error('Coins save failed:', error);
      throw error;
    }
  }

  static async addCoins(amount: number): Promise<number> {
    try {
      const currentCoins = await this.getCoins();
      const newCoins = currentCoins + amount;
      await this.setCoins(newCoins);
      return newCoins;
    } catch (error) {
      console.error('Add coins failed:', error);
      throw error;
    }
  }

  // === 아이템 관리 ===
  static async getOwnedItems(): Promise<string[]> {
    try {
      const itemsStr = await AsyncStorage.getItem(STORAGE_KEYS.OWNED_ITEMS);
      return itemsStr ? JSON.parse(itemsStr) : DEFAULT_VALUES.DEFAULT_ITEMS;
    } catch (error) {
      console.error('Items load failed:', error);
      return DEFAULT_VALUES.DEFAULT_ITEMS;
    }
  }

  static async setOwnedItems(items: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Items save failed:', error);
      throw error;
    }
  }

  static async addOwnedItem(itemId: string): Promise<string[]> {
    try {
      const currentItems = await this.getOwnedItems();
      if (!currentItems.includes(itemId)) {
        const newItems = [...currentItems, itemId];
        await this.setOwnedItems(newItems);
        return newItems;
      }
      return currentItems;
    } catch (error) {
      console.error('Add item failed:', error);
      throw error;
    }
  }

  // === 구매 처리 (원자적 연산) ===
  static async purchaseItem(itemId: string, price: number): Promise<{ success: boolean; coins: number; items: string[] }> {
    try {
      const currentCoins = await this.getCoins();
      const currentItems = await this.getOwnedItems();

      // 이미 보유한 아이템 체크
      if (currentItems.includes(itemId)) {
        return { success: false, coins: currentCoins, items: currentItems };
      }

      // 코인 부족 체크
      if (currentCoins < price) {
        return { success: false, coins: currentCoins, items: currentItems };
      }

      // 구매 실행 (둘 다 성공해야 함)
      const newCoins = currentCoins - price;
      const newItems = [...currentItems, itemId];

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_COINS, newCoins.toString()],
        [STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(newItems)],
      ]);

      return { success: true, coins: newCoins, items: newItems };
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // === 초기화 관리 ===
  static async initializeUserData(): Promise<void> {
    try {
      const userData = await this.getUserData();
      
      // 첫 로그인이면 보너스 지급
      if (userData.token && userData.isFirstLogin) {
        return; // 이미 초기화됨
      }

      // 새 사용자 초기화
      const isFirstLogin = !userData.isFirstLogin;
      const initialCoins = isFirstLogin ? DEFAULT_VALUES.FIRST_LOGIN_BONUS : DEFAULT_VALUES.COINS;

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_COINS, initialCoins.toString()],
        [STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(DEFAULT_VALUES.DEFAULT_ITEMS)],
        [STORAGE_KEYS.IS_FIRST_LOGIN, 'true'],
        [STORAGE_KEYS.LAST_LOGIN_DATE, new Date().toISOString()],
      ]);

      console.log(`User initialized - First login: ${isFirstLogin}, Coins: ${initialCoins}`);
    } catch (error) {
      console.error('User initialization failed:', error);
      throw error;
    }
  }

  // === 개발용 도구 ===
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('All storage data cleared');
    } catch (error) {
      console.error('Clear all failed:', error);
      throw error;
    }
  }

  static async debugPrintAllData(): Promise<void> {
    try {
      const userData = await this.getUserData();
      console.log('=== Storage Debug Info ===');
      console.log('Token:', userData.token ? '***' + userData.token.slice(-4) : 'None');
      console.log('User ID:', userData.userId || 'None');
      console.log('Coins:', userData.coins);
      console.log('Items:', userData.ownedItems);
      console.log('First Login:', userData.isFirstLogin);
      console.log('========================');
    } catch (error) {
      console.error('Debug print failed:', error);
    }
  }

  // === 일일 로그인 보상 등 확장 가능 ===
  static async getDailyLoginReward(): Promise<{ canClaim: boolean; reward: number }> {
    try {
      const lastLoginStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN_DATE);
      const today = new Date().toDateString();
      const lastLogin = lastLoginStr ? new Date(lastLoginStr).toDateString() : '';
      
      const canClaim = lastLogin !== today;
      const reward = canClaim ? 50 : 0; // 일일 로그인 보상 50코인
      
      if (canClaim) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN_DATE, new Date().toISOString());
        await this.addCoins(reward);
      }
      
      return { canClaim, reward };
    } catch (error) {
      console.error('Daily login reward failed:', error);
      return { canClaim: false, reward: 0 };
    }
  }
}

export default StorageService;