import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { getParentDevices, Device } from '../api/devices';
import { getPendingRequests, AccessRequest } from '../api/requests';
import { getUsageSessions, UsageSession } from '../api/usageSessions';
import { getFreeTrialStatus, FreeTrialStatus } from '../api/freeTrial';

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [usageSessions, setUsageSessions] = useState<UsageSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      
      console.log('[Dashboard] Loading dashboard data...');
      
      // Fetch all data in parallel
      const [devicesData, requestsData, trialData] = await Promise.all([
        getParentDevices(),
        getPendingRequests(),
        getFreeTrialStatus().catch(err => {
          console.log('[Dashboard] Could not load trial status:', err);
          return null;
        }),
      ]);

      console.log('[Dashboard] Trial status received:', JSON.stringify(trialData, null, 2));
      
      setDevices(devicesData);
      setPendingRequests(requestsData);
      setTrialStatus(trialData);
      
      console.log('[Dashboard] Trial status set in state');

      // Get usage sessions for all devices (last 7 days)
      if (devicesData.length > 0) {
        const allSessions: UsageSession[] = [];
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
        
        for (const device of devicesData) {
          try {
            const sessions = await getUsageSessions(device.deviceId, fromDate.toISOString());
            allSessions.push(...sessions);
          } catch (error) {
            console.log(`[Dashboard] Could not load sessions for device ${device.deviceId}`);
          }
        }
        setUsageSessions(allSessions);
      }
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Calculate stats
  const activeDevicesCount = devices.filter(d => 
    d.status.toLowerCase() === 'active' || d.status === '1'
  ).length;
  const pendingRequestsCount = pendingRequests.length;
  
  const totalScreenTimeMinutes = usageSessions.reduce((total, session) => {
    const used = session.allowedMinutes - session.remainingMinutes;
    return total + used;
  }, 0);
  const totalScreenTimeHours = (totalScreenTimeMinutes / 60).toFixed(1);

  const stats = [
    { label: 'Thời gian màn hình', value: `${totalScreenTimeHours}h`, color: COLORS.primary },
    { label: 'Trang web bị chặn', value: '97', color: COLORS.danger }, // Mock data
    { label: 'Yêu cầu chờ duyệt', value: pendingRequestsCount.toString(), color: COLORS.warning },
    { label: 'Thiết bị đang hoạt động', value: activeDevicesCount.toString(), color: COLORS.success },
  ];

  const menuItems = [
    { title: 'Hoạt động', screen: 'Activity', icon: '📊', requiresTrial: true },
    { title: 'Thiết bị', screen: 'Devices', icon: '📱', requiresTrial: true },
    { title: 'Yêu cầu truy cập', screen: 'AccessRequests', icon: '✅', requiresTrial: true },
    { title: 'Cài đặt', screen: 'Settings', icon: '⚙️', requiresTrial: false },
  ];

  // Check if user has active access
  const hasActiveAccess = (): boolean => {
    console.log('[Dashboard] Checking access - trialStatus:', JSON.stringify(trialStatus, null, 2));
    const hasAccess = trialStatus?.isActive === true;
    console.log('[Dashboard] Has active access:', hasAccess);
    return hasAccess;
    // TODO: Add subscription check when payment is implemented
  };

  const handleMenuPress = (item: { title: string; screen: string; requiresTrial: boolean }) => {
    if (item.requiresTrial && !hasActiveAccess()) {
      Alert.alert(
        'Cần nâng cấp',
        `Bạn cần đăng ký dùng thử hoặc mua gói dịch vụ để sử dụng tính năng "${item.title}".`,
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
      return;
    }
    navigation.navigate(item.screen as any);
  };

  // Generate recent activity from real data
  const getRecentActivities = () => {
    const activities = [];

    // Add recent sessions
    const recentSessions = [...usageSessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 2);
    
    for (const session of recentSessions) {
      const device = devices.find(d => d.deviceId === session.deviceId);
      if (device) {
        const timeAgo = getTimeAgo(new Date(session.startTime));
        const statusText = session.status.toLowerCase() === 'active' 
          ? 'đang sử dụng thiết bị' 
          : 'đã sử dụng thiết bị';
        activities.push({
          text: `📱 ${device.childName} ${statusText}`,
          time: timeAgo,
        });
      }
    }

    // Add recent pending requests
    const recentRequests = [...pendingRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1);
    
    for (const request of recentRequests) {
      activities.push({
        text: `⏳ Yêu cầu mới: ${request.requestedMinutes} phút - "${request.reason}"`,
        time: getTimeAgo(new Date(request.createdAt)),
      });
    }

    // Add mock blocked activity if not enough real data
    if (activities.length < 3) {
      activities.push({
        text: '🚫 Đã chặn truy cập tới Facebook',
        time: '15 phút trước',
      });
    }

    return activities.slice(0, 3);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  // Calculate days remaining for trial
  const calculateDaysRemaining = (): number => {
    if (!trialStatus?.expiresAt) return 0;
    const expiresDate = new Date(trialStatus.expiresAt);
    const now = new Date();
    const diff = expiresDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Calculate trial progress percentage (0-100)
  const calculateTrialProgress = (): number => {
    if (!trialStatus?.startedAt || !trialStatus?.expiresAt) return 0;
    const startDate = new Date(trialStatus.startedAt);
    const expireDate = new Date(trialStatus.expiresAt);
    const now = new Date();
    
    const totalDuration = expireDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = (elapsed / totalDuration) * 100;
    
    return Math.min(100, Math.max(0, progress));
  };

  const formatExpiryDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const recentActivities = getRecentActivities();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Xin chào, Phụ Huynh!</Text>
          <Text style={styles.subtitle}>Tổng quan về hoạt động của con bạn</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.menuGrid}>
              {menuItems.map((item, index) => {
                const isLocked = item.requiresTrial && !hasActiveAccess();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      isLocked && styles.menuItemDisabled
                    ]}
                    onPress={() => handleMenuPress(item)}
                  >
                    <View style={styles.menuIconContainer}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      {isLocked && <Text style={styles.lockBadge}>🔒</Text>}
                    </View>
                    <Text style={[
                      styles.menuTitle,
                      isLocked && styles.menuTitleDisabled
                    ]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Banner for users who haven't registered trial yet or trial expired */}
            {trialStatus && !trialStatus.isActive && (
              <View style={styles.noTrialBanner}>
                <View style={styles.noTrialContent}>
                  <View style={styles.noTrialHeader}>
                    <Text style={styles.noTrialIcon}>⚡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noTrialTitle}>
                        {trialStatus.hasTrial ? 'Thời gian dùng thử đã hết' : 'Bắt đầu trải nghiệm'}
                      </Text>
                      <Text style={styles.noTrialText}>
                        {trialStatus.hasTrial 
                          ? 'Nâng cấp ngay để tiếp tục sử dụng đầy đủ tính năng'
                          : 'Sử dụng gói dùng thử 7 ngày miễn phí hoặc nâng cấp ngay'
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.noTrialButtons}>
                    {!trialStatus.hasTrial && (
                      <TouchableOpacity
                        style={styles.tryFreeButton}
                        onPress={() => navigation.navigate('Trial')}
                      >
                        <Text style={styles.tryFreeButtonText}>🎁 Dùng thử 7 ngày</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={[
                        styles.upgradeNowButton,
                        trialStatus.hasTrial && styles.upgradeNowButtonFull
                      ]}
                      onPress={() => navigation.navigate('UpgradePackage')}
                    >
                      <Text style={[
                        styles.upgradeNowButtonText,
                        trialStatus.hasTrial && styles.upgradeNowButtonTextFull
                      ]}>
                        ✨ Nâng cấp ngay
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {trialStatus?.isActive && (
              <View style={styles.trialBanner}>
                <View style={styles.trialContent}>
                  <View style={styles.trialHeader}>
                    <Text style={styles.trialIcon}>🎁</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trialTitle}>Đang dùng thử miễn phí</Text>
                      <Text style={styles.trialText}>
                        Còn {calculateDaysRemaining()} ngày • Hết hạn: {trialStatus.expiresAt ? formatExpiryDate(trialStatus.expiresAt) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill,
                          { width: `${calculateTrialProgress()}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {(100 - calculateTrialProgress()).toFixed(0)}% thời gian còn lại
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.trialUpgradeButton}
                    onPress={() => navigation.navigate('UpgradePackage')}
                  >
                    <Text style={styles.trialUpgradeText}>✨ Nâng cấp ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.recentActivity}>
              <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View key={index} style={styles.activityCard}>
                    <Text style={styles.activityText}>{activity.text}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyActivity}>
                  <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
                </View>
              )}
            </View>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  menuItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  menuIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 32,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    fontSize: 16,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  menuTitleDisabled: {
    color: '#94a3b8',
  },
  noTrialBanner: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  noTrialContent: {
    gap: 12,
  },
  noTrialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noTrialIcon: {
    fontSize: 32,
  },
  noTrialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  noTrialText: {
    fontSize: 13,
    color: '#d97706',
    lineHeight: 18,
  },
  noTrialButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tryFreeButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tryFreeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  upgradeNowButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  upgradeNowButtonFull: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  upgradeNowButtonText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
  },
  upgradeNowButtonTextFull: {
    color: '#fff',
  },
  recentActivity: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  trialBanner: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trialContent: {
    gap: 12,
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trialIcon: {
    fontSize: 32,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 13,
    color: '#16a34a',
    lineHeight: 18,
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#bbf7d0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  trialUpgradeButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  trialUpgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyActivity: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default DashboardScreen;
