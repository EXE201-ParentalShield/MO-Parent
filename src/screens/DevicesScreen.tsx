import React, { useState, useCallback, useRef } from 'react';
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
import {
  getParentDevices,
  lockDevice,
  unlockDevice,
  Device,
  getDeviceEntitlementStatus,
  resolveDowngradeSelection,
  DeviceEntitlementStatus,
} from '../api/devices';
import { getFreeTrialStatus, FreeTrialStatus } from '../api/freeTrial';

type DevicesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Devices'>;

interface Props {
  navigation: DevicesScreenNavigationProp;
}

const DevicesScreen: React.FC<Props> = ({ navigation }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lockingDeviceId, setLockingDeviceId] = useState<number | null>(null);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatus | null>(null);
  const [entitlementStatus, setEntitlementStatus] = useState<DeviceEntitlementStatus | null>(null);
  const isShowingSelectionPromptRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFocusFetchAtRef = useRef(0);

  const showDowngradeSelectionPrompt = useCallback((status: DeviceEntitlementStatus) => {
    if (isShowingSelectionPromptRef.current) {
      return;
    }

    if (!status.requiresDeviceSelection || status.selectableDevices.length === 0) {
      return;
    }

    isShowingSelectionPromptRef.current = true;

    const buttons = [
      ...status.selectableDevices.map((item) => ({
        text: `${item.childName} (${item.deviceName})`,
        onPress: async () => {
          try {
            await resolveDowngradeSelection(item.deviceId);
            Alert.alert('Đã cập nhật', 'Thiết bị giữ lại đã được lưu. Các thiết bị còn lại đã bị vô hiệu hóa.');
            await fetchDevices();
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể lưu lựa chọn thiết bị');
          } finally {
            isShowingSelectionPromptRef.current = false;
          }
        },
      })),
      {
        text: 'Để sau',
        style: 'cancel' as const,
        onPress: () => {
          isShowingSelectionPromptRef.current = false;
        },
      },
    ];

    Alert.alert(
      'Chọn thiết bị giữ lại',
      status.message || 'Gói hiện tại chỉ cho phép 1 thiết bị. Hãy chọn thiết bị được phép tiếp tục sử dụng.',
      buttons
    );
  }, []);

  const fetchDevices = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const [devicesData, trialData, currentEntitlement] = await Promise.all([
        getParentDevices(),
        getFreeTrialStatus().catch(err => {
          return null;
        }),
        getDeviceEntitlementStatus().catch(err => {
          return null;
        }),
      ]);
      setDevices(devicesData);
      setTrialStatus(trialData);
      setEntitlementStatus(currentEntitlement);

      if (currentEntitlement?.requiresDeviceSelection) {
        showDowngradeSelectionPrompt(currentEntitlement);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách thiết bị');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showDowngradeSelectionPrompt]);

  // Fetch devices mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusFetchAtRef.current < 1500) {
        return;
      }

      lastFocusFetchAtRef.current = now;
      setIsLoading(true);
      fetchDevices();
    }, [fetchDevices])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDevices();
  };

  // Check if user has active trial or paid package access
  const hasActiveAccess = (): boolean => {
    const hasAccess =
      entitlementStatus?.hasAccess === true ||
      trialStatus?.hasAccess === true ||
      trialStatus?.isActive === true;
    console.log('[DevicesScreen] Checking access - entitlementStatus:', JSON.stringify(entitlementStatus, null, 2));
    console.log('[DevicesScreen] Checking access - trialStatus:', JSON.stringify(trialStatus, null, 2));
    console.log('[DevicesScreen] Has active access:', hasAccess);
    return hasAccess;
  };

  const showUpgradeAlert = () => {
    Alert.alert(
      'Cần nâng cấp',
      'Bạn cần đăng ký dùng thử hoặc mua gói dịch vụ để sử dụng tính năng này.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Dùng thử 7 ngày', 
          onPress: () => navigation.navigate('Trial')
        },
        { 
          text: 'Nâng cấp ngay', 
          onPress: () => navigation.navigate('UpgradePackage')
        }
      ]
    );
  };

  const handleAddDevice = () => {
    if (!hasActiveAccess()) {
      showUpgradeAlert();
      return;
    }
    navigation.navigate('AddDevice');
  };

  const handleLockDevice = async (deviceId: number, deviceName: string) => {
    if (!hasActiveAccess()) {
      showUpgradeAlert();
      return;
    }

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
    if (!hasActiveAccess()) {
      showUpgradeAlert();
      return;
    }

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
        {!hasActiveAccess() && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Tính năng bị khóa</Text>
              <Text style={styles.warningText}>
                Đăng ký dùng thử 7 ngày miễn phí hoặc nâng cấp để quản lý thiết bị
              </Text>
            </View>
          </View>
        )}

        {entitlementStatus?.requiresDeviceSelection && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Cần chọn thiết bị giữ lại</Text>
              <Text style={styles.warningText}>
                {entitlementStatus.message || 'Gói hiện tại chỉ hỗ trợ 1 thiết bị.'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.addButton,
            !hasActiveAccess() && styles.addButtonDisabled
          ]}
          onPress={handleAddDevice}
          disabled={!hasActiveAccess()}
        >
          <Text style={[
            styles.addButtonText,
            !hasActiveAccess() && styles.addButtonTextDisabled
          ]}>
            {hasActiveAccess() ? '+ Thêm thiết bị mới' : '🔒 Thêm thiết bị mới (Cần nâng cấp)'}
          </Text>
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
                      device.isLocked ? styles.unlockButton : styles.lockButtonActive,
                      !hasActiveAccess() && styles.lockButtonDisabled
                    ]}
                    onPress={() =>
                      device.isLocked
                        ? handleUnlockDevice(device.deviceId, device.deviceName)
                        : handleLockDevice(device.deviceId, device.deviceName)
                    }
                    disabled={!hasActiveAccess()}
                  >
                    <Text style={[
                      styles.lockButtonText,
                      !hasActiveAccess() && styles.lockButtonTextDisabled
                    ]}>
                      {!hasActiveAccess() ? '🔒' : (device.isLocked ? '🔓 Mở khóa' : '🔒 Khóa')}
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
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningIcon: {
    fontSize: 28,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#d97706',
    lineHeight: 18,
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
  addButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addButtonTextDisabled: {
    color: '#cbd5e1',
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
  lockButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lockButtonTextDisabled: {
    color: '#cbd5e1',
  },
});

export default DevicesScreen;
