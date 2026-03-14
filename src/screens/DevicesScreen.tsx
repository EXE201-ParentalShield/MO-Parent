import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { getParentDevices, lockDevice, unlockDevice, Device } from '../api/devices';

type DevicesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Devices'>;

interface Props {
  navigation: DevicesScreenNavigationProp;
}

const DevicesScreen: React.FC<Props> = ({ navigation }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lockingDeviceId, setLockingDeviceId] = useState<number | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      console.log('[DevicesScreen] Fetching devices...');
      const data = await getParentDevices();
      console.log('[DevicesScreen] Fetched devices count:', data.length);
      setDevices(data);
    } catch (error: any) {
      console.error('[DevicesScreen] Error fetching devices:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách thiết bị');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch devices mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      console.log('[DevicesScreen] Screen focused, fetching devices...');
      setIsLoading(true);
      fetchDevices();
    }, [fetchDevices])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDevices();
  };

  const handleLockDevice = async (deviceId: number, deviceName: string) => {
    Alert.alert(
      'Khóa thiết bị',
      `Bạn có chắc muốn khóa thiết bị "${deviceName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khóa',
          style: 'destructive',
          onPress: async () => {
            setLockingDeviceId(deviceId);
            try {
              await lockDevice(deviceId, 'Bị khóa bởi phụ huynh');
              Alert.alert('Thành công', 'Đã khóa thiết bị');
              await fetchDevices();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể khóa thiết bị');
            } finally {
              setLockingDeviceId(null);
            }
          }
        }
      ]
    );
  };

  const handleUnlockDevice = async (deviceId: number, deviceName: string) => {
    Alert.alert(
      'Mở khóa thiết bị',
      `Bạn có chắc muốn mở khóa thiết bị "${deviceName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Mở khóa',
          onPress: async () => {
            setLockingDeviceId(deviceId);
            try {
              await unlockDevice(deviceId);
              Alert.alert('Thành công', 'Đã mở khóa thiết bị');
              await fetchDevices();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể mở khóa thiết bị');
            } finally {
              setLockingDeviceId(null);
            }
          }
        }
      ]
    );
  };

  const getStatusText = (device: Device) => {
    if (device.isLocked) return 'Đã khóa';
    switch (device.status) {
      case 'Active': return 'Hoạt động';
      case 'Locked': return 'Đã khóa';
      case 'Offline': return 'Ngoại tuyến';
      case 'Deleted': return 'Đã xóa';
      default: return device.status;
    }
  };

  const getStatusColor = (device: Device) => {
    if (device.isLocked) return '#EF4444';
    switch (device.status) {
      case 'Active': return COLORS.success;
      case 'Locked': return '#EF4444';
      case 'Offline': return '#94a3b8';
      default: return COLORS.textSecondary;
    }
  };

  const getLastSeen = (lastHeartbeat: string) => {
    const now = new Date();
    const heartbeatDate = new Date(lastHeartbeat);
    const diffMs = now.getTime() - heartbeatDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách thiết bị...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDevice')}
        >
          <Text style={styles.addButtonText}>+ Thêm thiết bị mới</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Thiết bị đang quản lý ({devices.length})</Text>

        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyText}>Chưa có thiết bị nào</Text>
            <Text style={styles.emptySubtext}>Nhấn nút "Thêm thiết bị mới" để bắt đầu</Text>
          </View>
        ) : (
          devices.map((device) => (
            <View key={device.deviceId} style={styles.deviceCard}>
              <View style={styles.deviceIcon}>
                <Text style={styles.deviceIconText}>📱</Text>
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.deviceName}</Text>
                <Text style={styles.childName}>Trẻ em: {device.childName}</Text>
                <Text style={styles.deviceDetails}>
                  {device.deviceType} • {device.osVersion}
                </Text>
                <Text style={styles.lastSync}>
                  Đồng bộ: {getLastSeen(device.lastHeartbeat)}
                </Text>
                {device.batteryLevel !== undefined && device.batteryLevel > 0 && (
                  <Text style={styles.batteryText}>🔋 {device.batteryLevel}%</Text>
                )}
              </View>
              <View style={styles.rightSection}>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(device) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(device) }]}>
                    {getStatusText(device)}
                  </Text>
                </View>
                {lockingDeviceId === device.deviceId ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={styles.lockButton} />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.lockButton,
                      device.isLocked ? styles.unlockButton : styles.lockButtonActive
                    ]}
                    onPress={() =>
                      device.isLocked
                        ? handleUnlockDevice(device.deviceId, device.deviceName)
                        : handleLockDevice(device.deviceId, device.deviceName)
                    }
                  >
                    <Text style={styles.lockButtonText}>
                      {device.isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 16,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  childName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  deviceDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  lastSync: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  batteryText: {
    fontSize: 12,
    color: COLORS.success,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lockButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  lockButtonActive: {
    backgroundColor: '#EF4444',
  },
  unlockButton: {
    backgroundColor: COLORS.success,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DevicesScreen;
