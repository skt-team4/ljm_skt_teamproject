// AddressSearchModal.tsx
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddressSearchResult {
  fullAddress: string;
  roadAddress: string;
  jibunAddress: string;
  latitude: number;
  longitude: number;
  buildingName?: string;
  zipCode?: string;
}

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: AddressSearchResult) => void;
}

const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  visible,
  onClose,
  onSelectAddress,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TMAP API 키 (실제 프로젝트에서는 환경변수로 관리하세요)
  const TMAP_API_KEY = 'YOUR_TMAP_API_KEY';

  const searchAddress = async () => {
    if (!searchText.trim()) {
      Alert.alert('알림', '검색할 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://apis.openapi.sk.com/tmap/pois?version=1&format=json&searchKeyword=${encodeURIComponent(
          searchText
        )}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&count=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'appKey': TMAP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('주소 검색에 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.searchPoiInfo && data.searchPoiInfo.pois) {
        const results: AddressSearchResult[] = data.searchPoiInfo.pois.poi.map((poi: any) => ({
          fullAddress: poi.newAddressList?.newAddress?.[0]?.fullAddressRoad || poi.upperAddrName + ' ' + poi.middleAddrName + ' ' + poi.lowerAddrName,
          roadAddress: poi.newAddressList?.newAddress?.[0]?.fullAddressRoad || '',
          jibunAddress: poi.upperAddrName + ' ' + poi.middleAddrName + ' ' + poi.lowerAddrName,
          latitude: parseFloat(poi.noorLat),
          longitude: parseFloat(poi.noorLon),
          buildingName: poi.name,
          zipCode: poi.zipCode,
        }));
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
        Alert.alert('알림', '검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      Alert.alert('오류', '주소 검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address: AddressSearchResult) => {
    onSelectAddress(address);
    onClose();
    setSearchText('');
    setSearchResults([]);
  };

  const renderAddressItem = ({ item }: { item: AddressSearchResult }) => (
    <TouchableOpacity
      style={styles.addressItem}
      onPress={() => handleSelectAddress(item)}
    >
      <View style={styles.addressInfo}>
        {item.buildingName && (
          <Text style={styles.buildingName}>{item.buildingName}</Text>
        )}
        <Text style={styles.roadAddress}>{item.roadAddress || item.fullAddress}</Text>
        {item.jibunAddress && item.jibunAddress !== item.roadAddress && (
          <Text style={styles.jibunAddress}>지번: {item.jibunAddress}</Text>
        )}
        {item.zipCode && (
          <Text style={styles.zipCode}>우편번호: {item.zipCode}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>주소 검색</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 검색 입력 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="도로명, 건물명, 지번 검색"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchAddress}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchAddress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.searchButtonText}>검색</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 검색 결과 */}
        <View style={styles.resultContainer}>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderAddressItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isLoading ? '검색 중...' : '주소를 검색해보세요'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#FF8F00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addressItem: {
    paddingVertical: 16,
  },
  addressInfo: {
    gap: 4,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roadAddress: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  jibunAddress: {
    fontSize: 13,
    color: '#666',
  },
  zipCode: {
    fontSize: 12,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AddressSearchModal;