import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/constants';
import { getUsageSessions, UsageSession } from '../api/usageSessions';
import { getParentDevices, Device } from '../api/devices';

const ActivityScreen = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<UsageSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDevices();
    }, [])
  );

  useEffect(() => {
    if (selectedDeviceId) {
      loadSessions();
    }
  }, [selectedDeviceId]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const devicesData = await getParentDevices();
      setDevices(devicesData);
      
      // Auto-select first device
      if (devicesData.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devicesData[0].deviceId);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách thiết bị');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    if (!selectedDeviceId) return;
    
    try {
      if (!isRefreshing) setIsLoading(true);
      const sessionsData = await getUsageSessions(selectedDeviceId);
      setSessions(sessionsData);
    } catch (error: any) {
      console.error('[ActivityScreen] Error loading sessions:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải lịch sử hoạt động');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateActualUsed = (session: UsageSession) => {
    return session.allowedMinutes - session.remainingMinutes;
  };

  const getTotalUsedMinutes = () => {
    return sessions.reduce((total, session) => {
      return total + calculateActualUsed(session);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return COLORS.warning;
      case 'stopped': return COLORS.success;
      case 'expired': return COLORS.danger;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'Đang hoạt động';
      case 'stopped': return 'Đã kết thúc';
      case 'expired': return 'Đã hết hạn';
      default: return status;
    }
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Báo cáo hoạt động</Text>
        
        {/* Device Selector */}
        {devices.length > 0 && (
          <View style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Chọn thiết bị:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deviceSelector}>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.deviceId}
                  style={[
                    styles.deviceButton,
                    selectedDeviceId === device.deviceId && styles.deviceButtonActive
                  ]}
                  onPress={() => setSelectedDeviceId(device.deviceId)}
                >
                  <Text style={[
                    styles.deviceButtonText,
                    selectedDeviceId === device.deviceId && styles.deviceButtonTextActive
                  ]}>
                    {device.childName}
                  </Text>
                  <Text style={[
                    styles.deviceName,
                    selectedDeviceId === device.deviceId && styles.deviceNameActive
                  ]}>
                    {device.deviceName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Statistics Card */}
        {selectedDevice && sessions.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 Thống kê</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sessions.length}</Text>
                <Text style={styles.statLabel}>Phiên sử dụng</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{getTotalUsedMinutes()}</Text>
                <Text style={styles.statLabel}>Tổng phút</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(getTotalUsedMinutes() / 60)}h
                </Text>
                <Text style={styles.statLabel}>Tổng giờ</Text>
              </View>
            </View>
          </View>
        )}

        {/* Loading state */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Chưa có lịch sử hoạt động</Text>
            <Text style={styles.emptySubtext}>
              {selectedDevice 
                ? `${selectedDevice.childName} chưa có phiên sử dụng nào`
                : 'Vui lòng chọn thiết bị để xem báo cáo'
              }
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Lịch sử hoạt động ({sessions.length})
            </Text>
            
            {sessions.map((session) => {
              const actualUsed = calculateActualUsed(session);
              const usagePercentage = (actualUsed / session.allowedMinutes) * 100;
              
              return (
                <View key={session.usageSessionId} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionDate}>
                      📅 {formatDate(session.startTime)}
                    </Text>
                    <View 
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(session.status)}20` }
                      ]}
                    >
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(session.status) }
                      ]}>
                        {getStatusText(session.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>⏰ Thời gian:</Text>
                    <Text style={styles.timeValue}>
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </Text>
                  </View>

                  <View style={styles.usageRow}>
                    <View style={styles.usageInfo}>
                      <Text style={styles.usageLabel}>Được phép:</Text>
                      <Text style={styles.usageValue}>
                        {session.allowedMinutes} phút
                      </Text>
                    </View>
                    <View style={styles.usageInfo}>
                      <Text style={styles.usageLabel}>Đã sử dụng:</Text>
                      <Text style={[
                        styles.usageValue,
                        actualUsed > session.allowedMinutes && styles.overUsage
                      ]}>
                        {actualUsed} phút
                      </Text>
                    </View>
                    <View style={styles.usageInfo}>
                      <Text style={styles.usageLabel}>Còn lại:</Text>
                      <Text style={styles.usageValue}>
                        {session.remainingMinutes} phút
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { 
                          width: `${Math.min(usagePercentage, 100)}%`,
                          backgroundColor: usagePercentage > 100 
                            ? COLORS.danger 
                            : usagePercentage > 90 
                            ? COLORS.warning 
                            : COLORS.success
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {usagePercentage.toFixed(0)}% thời gian đã dùng
                  </Text>
                </View>
              );
            })}
          </>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  pickerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  deviceSelector: {
    flexDirection: 'row',
  },
  deviceButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deviceButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deviceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  deviceButtonTextActive: {
    color: '#fff',
  },
  deviceName: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  deviceNameActive: {
    color: '#fff',
    opacity: 0.9,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
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
  sessionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  usageInfo: {
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  overUsage: {
    color: COLORS.danger,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});

export default ActivityScreen;
