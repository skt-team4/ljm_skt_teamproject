// app/food_vision.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFoodRecognition } from '../../services/FoodRecognitionService';

const { width } = Dimensions.get('window');

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

export default function FoodVisionScreen() {
  const router = useRouter();
  const { recognizeFood, searchFood, calculateNutrition, foodDatabase } = useFoodRecognition();
  
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedFoods, setRecognizedFoods] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<{food: FoodItem, amount: number}[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);

  // 카메라로 사진 촬영
  const handleTakePhoto = async () => {
    setIsLoading(true);
    try {
      const result = await recognizeFood('camera');
      
      if (result.success && result.foods.length > 0) {
        setCapturedImage(result.image || null);
        setRecognizedFoods(result.foods);
        setShowResults(true);
        
        // 첫 번째 인식된 음식을 기본 선택
        setSelectedFoods([{
          food: result.foods[0],
          amount: 100 // 기본 100g
        }]);
      } else {
        Alert.alert('인식 실패', result.message);
      }
    } catch (error) {
      Alert.alert('오류', '음식 인식 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 갤러리에서 사진 선택
  const handlePickPhoto = async () => {
    setIsLoading(true);
    try {
      const result = await recognizeFood('gallery');
      
      if (result.success && result.foods.length > 0) {
        setCapturedImage(result.image || null);
        setRecognizedFoods(result.foods);
        setShowResults(true);
        
        setSelectedFoods([{
          food: result.foods[0],
          amount: 100
        }]);
      } else {
        Alert.alert('인식 실패', result.message);
      }
    } catch (error) {
      Alert.alert('오류', '음식 인식 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 수동 음식 검색
  const handleManualSearch = async () => {
    if (!searchTerm.trim()) return;
    
    const result = await searchFood(searchTerm);
    setSearchResults(result.foods);
  };

  // 음식 선택
  const handleSelectFood = (food: FoodItem) => {
    const existing = selectedFoods.find(sf => sf.food.id === food.id);
    if (!existing) {
      setSelectedFoods([...selectedFoods, { food, amount: 100 }]);
    }
    setShowManualSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  // 음식 수량 변경
  const updateFoodAmount = (foodId: string, amount: number) => {
    setSelectedFoods(prev =>
      prev.map(sf =>
        sf.food.id === foodId ? { ...sf, amount } : sf
      )
    );
  };

  // 음식 제거
  const removeFoodItem = (foodId: string) => {
    setSelectedFoods(prev => prev.filter(sf => sf.food.id !== foodId));
  };

  // 영양소 계산 및 저장
  const handleSaveNutrition = () => {
    if (selectedFoods.length === 0) {
      Alert.alert('알림', '선택된 음식이 없습니다.');
      return;
    }

    const nutrition = calculateNutrition(selectedFoods);
    
    Alert.alert(
      '영양소 정보 저장됨! 🎉',
      `칼로리: ${nutrition.calories}kcal\n단백질: ${nutrition.protein}g\n탄수화물: ${nutrition.carbs}g\n지방: ${nutrition.fat}g`,
      [
        {
          text: '영양소 리포트 보기',
          onPress: () => router.push('/nutrition')
        },
        {
          text: '확인',
          style: 'default'
        }
      ]
    );
  };

  // 다시 촬영
  const handleRetake = () => {
    setCapturedImage(null);
    setRecognizedFoods([]);
    setSelectedFoods([]);
    setShowResults(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>음식 인식</Text>
        <TouchableOpacity 
          onPress={() => setShowManualSearch(true)}
          style={styles.searchButton}
        >
          <Text style={styles.searchButtonText}>🔍 검색</Text>
        </TouchableOpacity>
      </View>

      {!showResults ? (
        // 촬영 화면
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>음식 사진을 촬영하거나{'\n'}갤러리에서 선택해주세요</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cameraButton]}
              onPress={handleTakePhoto}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>📸</Text>
                  <Text style={styles.buttonText}>사진 촬영</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.galleryButton]}
              onPress={handlePickPhoto}
              disabled={isLoading}
            >
              <Text style={styles.buttonIcon}>🖼️</Text>
              <Text style={styles.buttonText}>갤러리</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // 결과 화면
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {/* 촬영된 이미지 */}
          {capturedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Text style={styles.retakeButtonText}>다시 촬영</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 인식된 음식들 */}
          <View style={styles.recognizedSection}>
            <Text style={styles.sectionTitle}>🔍 인식된 음식</Text>
            {recognizedFoods.map((food, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.foodCard}
                onPress={() => handleSelectFood(food)}
              >
                <Text style={styles.foodEmoji}>{food.image}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.nameKorean}</Text>
                  <Text style={styles.foodDetails}>{food.serving} • {food.calories}kcal</Text>
                  {food.confidence && (
                    <Text style={styles.confidence}>신뢰도: {food.confidence}%</Text>
                  )}
                </View>
                <Text style={styles.addButton}>+</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 선택된 음식들 */}
          {selectedFoods.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>✅ 선택된 음식</Text>
              {selectedFoods.map((selectedFood, index) => (
                <View key={index} style={styles.selectedFoodCard}>
                  <Text style={styles.foodEmoji}>{selectedFood.food.image}</Text>
                  <View style={styles.selectedFoodInfo}>
                    <Text style={styles.selectedFoodName}>{selectedFood.food.nameKorean}</Text>
                    <View style={styles.amountContainer}>
                      <TouchableOpacity 
                        onPress={() => updateFoodAmount(selectedFood.food.id, Math.max(10, selectedFood.amount - 10))}
                        style={styles.amountButton}
                      >
                        <Text style={styles.amountButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.amountText}>{selectedFood.amount}g</Text>
                      <TouchableOpacity 
                        onPress={() => updateFoodAmount(selectedFood.food.id, selectedFood.amount + 10)}
                        style={styles.amountButton}
                      >
                        <Text style={styles.amountButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeFoodItem(selectedFood.food.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* 영양소 요약 */}
              <View style={styles.nutritionSummary}>
                <Text style={styles.nutritionTitle}>영양소 요약</Text>
                {(() => {
                  const nutrition = calculateNutrition(selectedFoods);
                  return (
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                        <Text style={styles.nutritionLabel}>칼로리</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                        <Text style={styles.nutritionLabel}>단백질</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                        <Text style={styles.nutritionLabel}>탄수화물</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                        <Text style={styles.nutritionLabel}>지방</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>

              {/* 저장 버튼 */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveNutrition}>
                <Text style={styles.saveButtonText}>✅ 영양소 정보 저장</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* 수동 검색 모달 */}
      <Modal
        visible={showManualSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowManualSearch(false)}>
              <Text style={styles.modalCloseButton}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>음식 검색</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="음식 이름을 입력하세요"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleManualSearch}
              autoFocus
            />
            <TouchableOpacity style={styles.searchActionButton} onPress={handleManualSearch}>
              <Text style={styles.searchActionText}>검색</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.searchResults}>
            {searchResults.length > 0 ? (
              searchResults.map((food, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectFood(food)}
                >
                  <Text style={styles.foodEmoji}>{food.image}</Text>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{food.nameKorean}</Text>
                    <Text style={styles.searchResultDetails}>{food.serving} • {food.calories}kcal</Text>
                  </View>
                  <Text style={styles.addButton}>+</Text>
                </TouchableOpacity>
              ))
            ) : searchTerm ? (
              <Text style={styles.noResultsText}>검색 결과가 없습니다.</Text>
            ) : (
              <View style={styles.popularFoods}>
                <Text style={styles.popularTitle}>인기 음식</Text>
                {foodDatabase.slice(0, 6).map((food, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectFood(food)}
                  >
                    <Text style={styles.foodEmoji}>{food.image}</Text>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{food.nameKorean}</Text>
                      <Text style={styles.searchResultDetails}>{food.serving} • {food.calories}kcal</Text>
                    </View>
                    <Text style={styles.addButton}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFBF00',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 5,
  },
  searchButtonText: {
    fontSize: 14,
    color: '#FFBF00',
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    marginBottom: 60,
  },
  cameraIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  cameraText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: '#FFBF00',
  },
  galleryButton: {
    backgroundColor: '#4ECDC4',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  capturedImage: {
    width: width - 40,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  retakeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  retakeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recognizedSection: {
    marginBottom: 20,
  },
  selectedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  confidence: {
    fontSize: 12,
    color: '#FFBF00',
    fontWeight: '500',
  },
  addButton: {
    fontSize: 24,
    color: '#FFBF00',
    fontWeight: 'bold',
  },
  selectedFoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFBF00',
  },
  selectedFoodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedFoodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFBF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutritionSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFBF00',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#FFBF00',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchActionButton: {
    backgroundColor: '#FFBF00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
  },
  searchActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultDetails: {
    fontSize: 14,
    color: '#666',
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  popularFoods: {
    marginTop: 20,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});