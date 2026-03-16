import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { getParentDevices, Device } from '../api/devices';
import { getPendingRequests, AccessRequest } from '../api/requests';
import { getUsageSessions, UsageSession } from '../api/usageSessions';

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [usageSessions, setUsageSessions] = useState<UsageSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTrialBanner, setShowTrialBanner] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      
      // Fetch all data in parallel
      const [devicesData, requestsData] = await Promise.all([
        getParentDevices(),
        getPendingRequests(),
      ]);

      setDevices(devicesData);
      setPendingRequests(requestsData);

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
    { title: 'Hoạt động', screen: 'Activity', icon: '📊' },
    { title: 'Thiết bị', screen: 'Devices', icon: '📱' },
    { title: 'Yêu cầu truy cập', screen: 'AccessRequests', icon: '✅' },
    { title: 'Cài đặt', screen: 'Settings', icon: '⚙️' },
    { title: 'Tạo tài khoản trẻ em', screen: 'CreateChildAccount', icon: '👶' },
  ];

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
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => navigation.navigate(item.screen as any)}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {showTrialBanner && (
              <View style={styles.trialBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trialTitle}>🎁 Đang dùng thử 7 ngày</Text>
                  <Text style={styles.trialText}>
                    Nâng cấp để tiếp tục sử dụng đầy đủ tính năng sau thời gian dùng thử.
                  </Text>
                </View>
                <View style={styles.trialActions}>
                  <TouchableOpacity
                    style={styles.trialUpgradeButton}
                    onPress={() => navigation.navigate('UpgradePackage')}
                  >
                    <Text style={styles.trialUpgradeText}>Nâng cấp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowTrialBanner(false)}>
                    <Text style={styles.trialDismissText}>Bỏ qua</Text>
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
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
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
    backgroundColor: '#e8f4ff',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  trialText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  trialActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  trialUpgradeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trialUpgradeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  trialDismissText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
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
