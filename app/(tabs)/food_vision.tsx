import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FoodData {
  id: string;
  foodName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  imageUri: string;
  timestamp: string;
  calories?: number;
  confidence?: number;
}

export default function FoodVisionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState<string>('');
  const [estimatedCalories, setEstimatedCalories] = useState<number>(0);
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.uri);
        analyzeFood(photo.base64!);
      } catch (error) {
        console.error('사진 촬영 오류:', error);
        Alert.alert('오류', '사진을 촬영할 수 없습니다.');
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        analyzeFood(result.assets[0].base64!);
      }
    } catch (error) {
      console.error('갤러리 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    }
  };

  const analyzeFood = async (base64Image: string) => {
    setIsAnalyzing(true);
    
    try {
      // 실제 구현에서는 Google Vision API, AWS Rekognition, 
      // 또는 커스텀 AI 모델을 사용하세요
      
      // 임시 데모용 로직 (실제로는 AI API 응답을 파싱)
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
      
      // 데모용 랜덤 음식 인식 결과
      const demoFoods = [
        { name: '김치찌개', calories: 320 },
        { name: '비빔밥', calories: 450 },
        { name: '불고기', calories: 380 },
        { name: '된장찌개', calories: 180 },
        { name: '삼겹살', calories: 520 },
        { name: '냉면', calories: 350 },
        { name: '치킨', calories: 600 },
        { name: '피자', calories: 280 },
      ];
      
      const randomFood = demoFoods[Math.floor(Math.random() * demoFoods.length)];
      setAnalyzedFood(randomFood.name);
      setEstimatedCalories(randomFood.calories);
      
      setShowMealTypeModal(true);
    } catch (error) {
      console.error('음식 분석 오류:', error);
      Alert.alert('오류', '음식을 인식할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveFoodData = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!capturedImage || !analyzedFood) return;

    const foodData: FoodData = {
      id: Date.now().toString(),
      foodName: analyzedFood,
      mealType,
      imageUri: capturedImage,
      timestamp: new Date().toISOString(),
      calories: estimatedCalories,
      confidence: 0.85,
    };

    try {
      const existingData = await AsyncStorage.getItem('foodHistory');
      const foodHistory: FoodData[] = existingData ? JSON.parse(existingData) : [];
      foodHistory.unshift(foodData);
      if (foodHistory.length > 100) {
        foodHistory.splice(100);
      }
      await AsyncStorage.setItem('foodHistory', JSON.stringify(foodHistory));
      
      Alert.alert(
        '저장 완료!',
        `${analyzedFood}이(가) ${getMealTypeKorean(mealType)} 기록에 저장되었습니다.`,
        [{ text: '확인', onPress: resetCamera }]
      );
      
      setShowMealTypeModal(false);
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      Alert.alert('오류', '데이터를 저장할 수 없습니다.');
    }
  };

  const getMealTypeKorean = (mealType: string): string => {
    switch (mealType) {
      case 'breakfast': return '아침식사';
      case 'lunch': return '점심식사';
      case 'dinner': return '저녁식사';
      default: return '식사';
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalyzedFood('');
    setEstimatedCalories(0);
    setShowMealTypeModal(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>카메라 권한을 확인하는 중...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.setupContainer}>
          <Ionicons name="camera-off" size={64} color="#007AFF" />
          <Text style={styles.setupTitle}>카메라 권한이 필요합니다</Text>
          <Text style={styles.setupText}>
            음식 사진을 촬영하기 위해 카메라 접근 권한이 필요합니다.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>권한 허용</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.analyzingText}>음식을 분석하는 중...</Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>인식된 음식</Text>
            <Text style={styles.foodName}>{analyzedFood}</Text>
            <Text style={styles.calories}>예상 칼로리: {estimatedCalories}kcal</Text>
          </View>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.controlButtonText}>다시 촬영</Text>
          </TouchableOpacity>
        </View>

        {/* 식사 시간 선택 모달 */}
        <Modal
          visible={showMealTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMealTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>어떤 식사인가요?</Text>
              <Text style={styles.modalSubtitle}>{analyzedFood}</Text>
              
              <TouchableOpacity
                style={[styles.mealButton, { backgroundColor: '#FF6B6B' }]}
                onPress={() => saveFoodData('breakfast')}
              >
                <Ionicons name="sunny" size={24} color="white" />
                <Text style={styles.mealButtonText}>아침식사</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mealButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => saveFoodData('lunch')}
              >
                <Ionicons name="partly-sunny" size={24} color="white" />
                <Text style={styles.mealButtonText}>점심식사</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mealButton, { backgroundColor: '#45B7D1' }]}
                onPress={() => saveFoodData('dinner')}
              >
                <Ionicons name="moon" size={24} color="white" />
                <Text style={styles.mealButtonText}>저녁식사</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowMealTypeModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={(ref) => setCameraRef(ref)}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topControls}>
          <Text style={styles.title}>음식 사진을 촬영하세요</Text>
          <Text style={styles.subtitle}>AI가 자동으로 음식을 인식합니다</Text>
        </View>

        <View style={styles.focusArea}>
          <View style={styles.focusCorners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
            <Ionicons name="images" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  focusArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCorners: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  capturedImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  analyzingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  calories: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  mealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  mealButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  setupText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});