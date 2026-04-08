import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, STORAGE_KEYS } from '../utils/constants';
import { Device, getParentDevices } from '../api/devices';
import { UsageSession, getUsageSessions } from '../api/usageSessions';

const ActivityStoryScreen = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<UsageSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      const devicesData = await getParentDevices();
      setDevices(devicesData);

      if (devicesData.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devicesData[0].deviceId);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách thiết bị');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId]);

  const loadSessions = useCallback(async () => {
    if (!selectedDeviceId) return;

    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }

      const sessionsData = await getUsageSessions(selectedDeviceId);
      setSessions(sessionsData);
    } catch (error: any) {
      console.error('[ActivityStoryScreen] Error loading sessions:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải lịch sử hoạt động');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, selectedDeviceId]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_BADGE_LAST_SEEN_AT, new Date().toISOString()).catch(
        () => undefined
      );
      loadDevices();
    }, [loadDevices])
  );

  useEffect(() => {
    if (selectedDeviceId) {
      loadSessions();
    }
  }, [loadSessions, selectedDeviceId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const calculateActualUsed = (session: UsageSession) => {
    const status = session.status.toLowerCase();
    if (status === 'active') {
      const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000);
      return Math.min(session.allowedMinutes, Math.max(0, elapsed));
    }

    const usedByRemaining = session.allowedMinutes - session.remainingMinutes;
    return Math.min(session.allowedMinutes, Math.max(0, usedByRemaining));
  };

  const getLocalDateKey = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  const chartData = useMemo(() => {
    const days: { key: string; label: string; value: number }[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = getLocalDateKey(date);
      days.push({
        key,
        label: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        value: 0,
      });
    }

    sessions.forEach((session) => {
      const key = getLocalDateKey(session.startTime);
      const target = days.find((item) => item.key === key);
      if (target) {
        target.value += calculateActualUsed(session);
      }
    });

    return days;
  }, [sessions]);

  const maxChartValue = Math.max(...chartData.map((item) => item.value), 60);
  const totalMinutes = sessions.reduce((sum, session) => sum + calculateActualUsed(session), 0);
  const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId);

  const insightText =
    totalMinutes === 0
      ? 'Hôm nay chưa có phiên sử dụng nào đáng chú ý.'
      : `Trong giai đoạn gần đây, ${selectedDevice?.childName || 'bé'} đã dùng tổng ${totalMinutes} phút.`;

  const getStatusLabel = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'active') return 'Đang diễn ra';
    if (normalized === 'stopped') return 'Đã kết thúc';
    if (normalized === 'expired') return 'Hết thời gian';
    return status;
  };

  const getStatusTone = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'expired') return styles.statusDanger;
    if (normalized === 'active') return styles.statusWarning;
    return styles.statusSuccess;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Bức tranh hoạt động</Text>
        <Text style={styles.heroSubtitle}>{insightText}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chọn thiết bị</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.deviceRow}>
            {devices.map((device) => {
              const active = device.deviceId === selectedDeviceId;
              return (
                <TouchableOpacity
                  key={device.deviceId}
                  style={[styles.deviceChip, active && styles.deviceChipActive]}
                  onPress={() => setSelectedDeviceId(device.deviceId)}
                >
                  <Text style={[styles.deviceChipTitle, active && styles.deviceChipTitleActive]}>
                    {device.childName}
                  </Text>
                  <Text style={[styles.deviceChipSubtitle, active && styles.deviceChipSubtitleActive]}>
                    {device.deviceName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải báo cáo hoạt động...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu hoạt động</Text>
          <Text style={styles.emptySubtitle}>
            {selectedDevice ? `${selectedDevice.childName} chưa có phiên sử dụng nào.` : 'Hãy chọn một thiết bị để xem.'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{sessions.length}</Text>
              <Text style={styles.statLabel}>phiên sử dụng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalMinutes}</Text>
              <Text style={styles.statLabel}>phút đã dùng</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian theo ngày</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartColumns}>
                {chartData.map((item) => (
                  <View key={item.key} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{item.value}</Text>
                    <View style={styles.chartTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height:
                              item.value > 0
                                ? `${Math.max(8, (item.value / maxChartValue) * 100)}%`
                                : 0,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dòng thời gian</Text>
            <View style={styles.timeline}>
              {sessions
                .slice()
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((session) => (
                  <View key={session.usageSessionId} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View>
                        <Text style={styles.sessionDate}>{formatDate(session.startTime)}</Text>
                        <Text style={styles.sessionTime}>
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, getStatusTone(session.status)]}>
                        <Text style={styles.statusText}>{getStatusLabel(session.status)}</Text>
                      </View>
                    </View>

                    <Text style={styles.sessionStory}>
                      Bé đã dùng {calculateActualUsed(session)} / {session.allowedMinutes} phút trong phiên này.
                    </Text>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${Math.min(100, (calculateActualUsed(session) / session.allowedMinutes) * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const baseShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    padding: 22,
    ...baseShadow,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },
  deviceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deviceChip: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 140,
    ...baseShadow,
  },
  deviceChipActive: {
    backgroundColor: COLORS.primary,
  },
  deviceChipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  deviceChipTitleActive: {
    color: '#fff',
  },
  deviceChipSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  deviceChipSubtitleActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    ...baseShadow,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    ...baseShadow,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    ...baseShadow,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    ...baseShadow,
  },
  chartColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartTrack: {
    width: 28,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
  },
  chartLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  timeline: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    ...baseShadow,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sessionStory: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDanger: {
    backgroundColor: '#FEE2E2',
  },
  statusWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
});

export default ActivityStoryScreen;
