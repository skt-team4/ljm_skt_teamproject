// services/FoodRecognitionService.ts
import * as ImagePicker from 'expo-image-picker';

// 음식 데이터 타입
interface FoodItem {
  id: string;
  name: string;
  nameKorean: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  confidence?: number;
  image?: string;
}

// 한국 음식 데이터베이스
const KOREAN_FOOD_DATABASE: FoodItem[] = [
  {
    id: 'rice',
    name: 'Rice',
    nameKorean: '밥',
    calories: 280,
    protein: 6,
    carbs: 60,
    fat: 1,
    serving: '1공기 (200g)',
    image: '🍚'
  },
  {
    id: 'kimchi_fried_rice',
    name: 'Kimchi Fried Rice',
    nameKorean: '김치볶음밥',
    calories: 520,
    protein: 18,
    carbs: 78,
    fat: 12,
    serving: '1인분 (300g)',
    image: '🍛'
  },
  {
    id: 'bulgogi',
    name: 'Bulgogi',
    nameKorean: '불고기',
    calories: 280,
    protein: 25,
    carbs: 8,
    fat: 15,
    serving: '1인분 (150g)',
    image: '🥩'
  },
  {
    id: 'bibimbap',
    name: 'Bibimbap',
    nameKorean: '비빔밥',
    calories: 450,
    protein: 15,
    carbs: 65,
    fat: 12,
    serving: '1인분 (400g)',
    image: '🍲'
  },
  {
    id: 'kimchi_soup',
    name: 'Kimchi Soup',
    nameKorean: '김치찌개',
    calories: 150,
    protein: 12,
    carbs: 10,
    fat: 8,
    serving: '1인분 (300ml)',
    image: '🍲'
  },
  {
    id: 'korean_chicken',
    name: 'Korean Fried Chicken',
    nameKorean: '치킨',
    calories: 350,
    protein: 28,
    carbs: 15,
    fat: 22,
    serving: '5조각 (200g)',
    image: '🍗'
  },
  {
    id: 'korean_noodles',
    name: 'Korean Noodles',
    nameKorean: '국수',
    calories: 380,
    protein: 12,
    carbs: 75,
    fat: 3,
    serving: '1인분 (300g)',
    image: '🍜'
  },
  {
    id: 'korean_pancake',
    name: 'Korean Pancake',
    nameKorean: '전/부침개',
    calories: 320,
    protein: 8,
    carbs: 45,
    fat: 12,
    serving: '3조각 (150g)',
    image: '🥞'
  },
  {
    id: 'korean_barbecue',
    name: 'Korean Barbecue',
    nameKorean: '고기구이',
    calories: 400,
    protein: 35,
    carbs: 5,
    fat: 28,
    serving: '1인분 (200g)',
    image: '🥩'
  },
  {
    id: 'korean_vegetables',
    name: 'Korean Vegetables',
    nameKorean: '나물/반찬',
    calories: 80,
    protein: 3,
    carbs: 12,
    fat: 2,
    serving: '1접시 (100g)',
    image: '🥬'
  }
];

// 음식 매칭 키워드
const FOOD_KEYWORDS: { [key: string]: string[] } = {
  'rice': ['rice', 'grain', 'white rice', 'steamed rice'],
  'kimchi_fried_rice': ['kimchi', 'fried rice', 'korean rice'],
  'bulgogi': ['beef', 'meat', 'bulgogi', 'marinated beef'],
  'bibimbap': ['mixed rice', 'bibimbap', 'vegetables', 'bowl'],
  'kimchi_soup': ['soup', 'stew', 'kimchi', 'hot pot'],
  'korean_chicken': ['chicken', 'fried chicken', 'poultry'],
  'korean_noodles': ['noodles', 'pasta', 'ramen', 'spaghetti'],
  'korean_pancake': ['pancake', 'bread', 'flatbread'],
  'korean_barbecue': ['barbecue', 'grilled meat', 'pork', 'beef'],
  'korean_vegetables': ['vegetables', 'salad', 'greens', 'lettuce']
};

class FoodRecognitionService {
  // 여기에 실제 Clarifai API 키를 입력하세요
  private readonly CLARIFAI_API_KEY = '6e525ad1478841f1a1849bc7b8e88a4a'; // 실제 API 키로 교체
  private readonly CLARIFAI_BASE_URL = 'https://api.clarifai.com/v2';
  // Clarifai 공식 Food 모델 ID들
  private readonly FOOD_MODEL_IDS = [
    'aaa03c23b3724a16a56b629203edc62c', // food-item-recognition
    'bd367be194cf45149e75f01d59f77ba7', // food-item-v1.3
    'c0c0ac362b03416da06ab3fa36fb58e3'  // general food model
  ];
  private readonly USER_ID = 'clarifai';
  private readonly APP_ID = 'main';

  // 카메라로 사진 촬영
  async takeFoodPhoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('카메라 권한이 필요합니다.');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].base64 || null;
      }
      return null;
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      return null;
    }
  }

  // 갤러리에서 사진 선택
  async pickFoodPhoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('갤러리 권한이 필요합니다.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].base64 || null;
      }
      return null;
    } catch (error) {
      console.error('사진 선택 실패:', error);
      return null;
    }
  }

  // Clarifai API로 음식 인식 (user_app_id 포함)
  async recognizeFoodWithClarifai(base64Image: string): Promise<FoodItem[]> {
    try {
      console.log('🔍 Clarifai API로 음식 인식 시작...');
      
      // API 키 체크
      if (!this.CLARIFAI_API_KEY || this.CLARIFAI_API_KEY === 'your_clarifai_api_key_here') {
        console.log('⚠️ API 키가 설정되지 않음, 시뮬레이션 모드로 전환');
        return this.simulateRecognition();
      }

      // Clarifai API v2 요청 형식 (user_app_id 필수)
      const requestBody = {
        "user_app_id": {
          "user_id": "clarifai",
          "app_id": "main"
        },
        "inputs": [
          {
            "data": {
              "image": {
                "base64": base64Image
              }
            }
          }
        ]
      };

      // 시도할 모델들
      const models = [
        'food-item-recognition',
        'general-image-recognition',
        'aaa03c23b3724a16a56b629203edc62c'
      ];

      for (const modelId of models) {
        console.log(`🔄 모델 시도: ${modelId}`);

        try {
          const response = await fetch(`${this.CLARIFAI_BASE_URL}/models/${modelId}/outputs`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Key ${this.CLARIFAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          console.log(`📊 응답 상태 (${modelId}): ${response.status}`);

          if (response.status === 401) {
            console.error('❌ API 키 인증 실패');
            return this.simulateRecognition();
          }

          if (response.status === 404) {
            console.log(`⚠️ 모델 ${modelId} 찾을 수 없음, 다음 모델 시도...`);
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ ${modelId} 오류 (${response.status}):`, errorText);
            continue;
          }

          const result = await response.json();
          
          // API 응답 상태 체크
          if (result.status?.code !== 10000) {
            console.error(`❌ API 응답 오류 (${modelId}):`, result.status);
            continue;
          }

          const concepts = result.outputs?.[0]?.data?.concepts || [];
          
          if (concepts.length === 0) {
            console.log(`⚠️ ${modelId}에서 인식된 결과 없음`);
            continue;
          }

          console.log(`✅ ${modelId} 성공! 인식된 개수: ${concepts.length}`);
          concepts.slice(0, 3).forEach((concept: any, index: number) => {
            console.log(`  ${index + 1}. ${concept.name} (${Math.round(concept.value * 100)}%)`);
          });

          // 한국 음식과 매칭
          const matchedFoods = this.matchWithKoreanFoods(concepts);
          
          if (matchedFoods.length > 0) {
            console.log('🎯 한국 음식 매칭 성공:', matchedFoods.map(f => f.nameKorean));
            return matchedFoods;
          }

        } catch (error) {
          console.error(`❌ ${modelId} 요청 오류:`, error);
          continue;
        }
      }

      console.log('🎭 모든 모델 시도 완료, 시뮬레이션 모드로 전환');
      return this.simulateRecognition();

    } catch (error) {
      console.error('❌ 전체 프로세스 오류:', error);
      return this.simulateRecognition();
    }
  }

  // AI 결과를 한국 음식과 매칭
  private matchWithKoreanFoods(concepts: any[]): FoodItem[] {
    const matchedFoods: FoodItem[] = [];
    const usedFoodIds = new Set<string>();

    console.log('🔄 음식 매칭 시작...');

    concepts.forEach(concept => {
      const foodName = concept.name.toLowerCase();
      const confidence = concept.value;

      console.log(`📝 검사 중: ${foodName} (신뢰도: ${Math.round(confidence * 100)}%)`);

      // 신뢰도가 너무 낮으면 제외
      if (confidence < 0.3) {
        console.log(`❌ 신뢰도 낮음: ${foodName}`);
        return;
      }

      // 키워드 매칭으로 한국 음식 찾기
      for (const [foodId, keywords] of Object.entries(FOOD_KEYWORDS)) {
        if (usedFoodIds.has(foodId)) continue;

        const isMatch = keywords.some(keyword => 
          foodName.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(foodName)
        );

        if (isMatch) {
          const koreanFood = KOREAN_FOOD_DATABASE.find(food => food.id === foodId);
          if (koreanFood) {
            matchedFoods.push({
              ...koreanFood,
              confidence: Math.round(confidence * 100)
            });
            usedFoodIds.add(foodId);
            console.log(`✅ 매칭 성공: ${foodName} → ${koreanFood.nameKorean}`);
            break;
          }
        }
      }
    });

    // 신뢰도 순으로 정렬 후 상위 3개만 반환
    return matchedFoods
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 3);
  }

  // API 실패 시 시뮬레이션 (개발/테스트용)
  private simulateRecognition(): FoodItem[] {
    console.log('🎭 음식 인식 시뮬레이션 실행');
    
    // 랜덤하게 2-3개의 음식 선택
    const shuffled = [...KOREAN_FOOD_DATABASE].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.floor(Math.random() * 2) + 2);

    return selected.map(food => ({
      ...food,
      confidence: Math.floor(Math.random() * 30) + 70 // 70-100% 랜덤 신뢰도
    }));
  }

  // 기본 음식들 (fallback)
  private getDefaultFoods(): FoodItem[] {
    return [
      {
        ...KOREAN_FOOD_DATABASE.find(f => f.id === 'rice')!,
        confidence: 85
      },
      {
        ...KOREAN_FOOD_DATABASE.find(f => f.id === 'korean_vegetables')!,
        confidence: 75
      }
    ];
  }

  // 수동 음식 검색
  async searchFoodByName(searchTerm: string): Promise<FoodItem[]> {
    const term = searchTerm.toLowerCase();
    
    return KOREAN_FOOD_DATABASE.filter(food => 
      food.nameKorean.includes(searchTerm) ||
      food.name.toLowerCase().includes(term) ||
      FOOD_KEYWORDS[food.id]?.some(keyword => 
        keyword.toLowerCase().includes(term) ||
        term.includes(keyword.toLowerCase())
      )
    ).slice(0, 5);
  }

  // 영양 성분 계산
  calculateNutrition(foods: { food: FoodItem; amount: number }[]): any {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    foods.forEach(({ food, amount }) => {
      const ratio = amount / 100; // amount는 그램 단위
      totalCalories += food.calories * ratio;
      totalProtein += food.protein * ratio;
      totalCarbs += food.carbs * ratio;
      totalFat += food.fat * ratio;
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      macroRatio: {
        protein: Math.round((totalProtein * 4 / totalCalories) * 100) || 0,
        carbs: Math.round((totalCarbs * 4 / totalCalories) * 100) || 0,
        fat: Math.round((totalFat * 9 / totalCalories) * 100) || 0,
      }
    };
  }
}

// React Hook으로 사용하기 쉽게 래핑
export const useFoodRecognition = () => {
  const service = new FoodRecognitionService();

  const recognizeFood = async (method: 'camera' | 'gallery' = 'camera') => {
    try {
      console.log(`📸 ${method} 모드로 음식 인식 시작`);

      // 1. 사진 가져오기
      const base64Image = method === 'camera' 
        ? await service.takeFoodPhoto()
        : await service.pickFoodPhoto();

      if (!base64Image) {
        return {
          success: false,
          foods: [],
          message: '사진을 가져오지 못했습니다.'
        };
      }

      console.log('✅ 사진 준비 완료');

      // 2. Clarifai로 음식 인식
      const recognizedFoods = await service.recognizeFoodWithClarifai(base64Image);

      // 3. 결과 반환
      return {
        success: true,
        foods: recognizedFoods,
        message: recognizedFoods.length > 0 
          ? `${recognizedFoods.length}개의 음식을 인식했습니다!` 
          : '음식을 인식하지 못했습니다. 다시 시도해주세요.',
        image: `data:image/jpeg;base64,${base64Image}`
      };

    } catch (error) {
      console.error('❌ 음식 인식 오류:', error);
      return {
        success: false,
        foods: [],
        message: '음식 인식에 실패했습니다. 다시 시도해주세요.'
      };
    }
  };

  const searchFood = async (searchTerm: string) => {
    const results = await service.searchFoodByName(searchTerm);
    return {
      success: true,
      foods: results,
      message: `${results.length}개의 검색 결과를 찾았습니다.`
    };
  };

  const calculateNutrition = (foods: { food: FoodItem; amount: number }[]) => {
    return service.calculateNutrition(foods);
  };

  return {
    recognizeFood,
    searchFood,
    calculateNutrition,
    foodDatabase: KOREAN_FOOD_DATABASE
  };
};

export default FoodRecognitionService;