// services/apiService.ts
export type MealCategory = 'distance' | 'cost' | 'preference' | 'allergy';

export type ApiResponse = {
  success: boolean;
  message: string;
  data?: {
    recommendations?: any[];
    category?: string;
    usage?: any;
  };
  error?: string;
};

export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
};

// 환경 변수에서 API 키 가져오기
const getApiKey = (): string => {
  // Expo 환경 변수 (EXPO_PUBLIC_ 접두사 사용)
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('⚠️ OpenAI API 키가 설정되지 않았습니다. .env 파일에 EXPO_PUBLIC_OPENAI_API_KEY를 설정해주세요.');
    return '';
  }
  
  return apiKey;
};

// OpenAI API 설정
const API_CONFIG = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-3.5-turbo',
  },
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000'), // 기본 15초
};

// 카테고리별 시스템 프롬프트 생성
const getCategoryPrompt = (category?: MealCategory) => {
  const basePrompt = `당신은 "얌이"라는 이름의 친근하고 귀여운 음식 추천 및 길 안내 AI입니다. 
어린이들이 좋아할 만한 톤으로 대화합니다.
응답은 한국어로 하며, 200자 이내로 간결하게 답변해주세요.
이모지를 적절히 사용해서 친근하게 답변해주세요.`;

  const categoryPrompts = {
    distance: `${basePrompt}\n지금은 "거리/접근성" 관련 급식 추천을 요청받았습니다. 현재 위치 주변에서 먹을 수 있는 메뉴를 추천해주세요.`,
    cost: `${basePrompt}\n지금은 "가격/영양" 관련 음식 추천을 요청받았습니다. 경제적이면서도 영양가 높은 메뉴를 추천해주세요.`,
    preference: `${basePrompt}\n지금은 "선호도" 관련 급식 추천을 요청받았습니다. 평소에 뭐 좋아하는지 물어보고 그에 맞는 음식 및 음식점 추천해주세요.`,
    allergy: `${basePrompt}\n지금은 "알레르기" 관련 정보를 요청받았습니다. 사용자의 알레르기 정보를 물어보고 안전한 식사에 대해 안내해주세요.`
  };

  return category ? categoryPrompts[category] : basePrompt;
};

// OpenAI API를 통한 챗봇 메시지 전송
export async function sendChatMessage(message: string, category?: MealCategory): Promise<ApiResponse> {
  try {
    const apiKey = getApiKey();
    
    // API 키가 없으면 에러 반환
    if (!apiKey) {
      return {
        success: false,
        message: '⚠️ API 키가 설정되지 않았어요. 설정을 확인해주세요.',
        error: 'API key not found',
      };
    }

    const response = await fetch(API_CONFIG.openai.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.openai.model,
        messages: [
          {
            role: 'system',
            content: getCategoryPrompt(category)
          },
          {
            role: 'user',
            content: message.trim()
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      success: true,
      message: data.choices[0].message.content.trim(),
      data: {
        category: category,
        usage: data.usage,
      }
    };
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    
    // API 키 관련 오류 체크
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        message: '⚠️ API 키 설정을 확인해주세요. OpenAI API 키가 올바르지 않습니다.',
        error: 'Invalid API key',
      };
    }
    
    // 할당량 초과 오류 체크
    if (error instanceof Error && error.message.includes('429')) {
      return {
        success: false,
        message: '⚠️ API 사용량이 초과되었어요. 잠시 후 다시 시도해주세요.',
        error: 'Rate limit exceeded',
      };
    }

    return {
      success: false,
      message: '죄송해요, 일시적으로 응답할 수 없어요. 잠시 후 다시 시도해 주세요. 🥺',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 카테고리별 추천 메시지
const categoryQuestions = {
  distance: '학교 근처에서 쉽게 구할 수 있는 재료로 만든 오늘의 급식 메뉴를 추천해주세요',
  cost: '경제적이면서도 영양가 높은 급식 메뉴를 추천해주세요',
  preference: '아이들이 가장 좋아하는 인기 급식 메뉴를 추천해주세요',
  allergy: '급식의 알레르기 주의사항과 안전한 식사 방법에 대해 알려주세요'
};

// OpenAI API를 통한 카테고리별 추천
export async function getCategoryRecommendation(category: MealCategory): Promise<ApiResponse> {
  try {
    return await sendChatMessage(categoryQuestions[category], category);
  } catch (error) {
    console.error('카테고리 추천 오류:', error);
    return {
      success: false,
      message: '추천 메뉴를 불러오는 중 오류가 발생했어요. 다시 시도해 주세요. 😅',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}