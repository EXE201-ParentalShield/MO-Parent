import React, { useCallback, useMemo, useState } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, STORAGE_KEYS } from '../utils/constants';
import { Device, getParentDevices } from '../api/devices';
import { AccessRequest, getPendingRequests } from '../api/requests';
import { FreeTrialStatus, getFreeTrialStatus } from '../api/freeTrial';
import { UsageSession, getUsageSessions } from '../api/usageSessions';

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

type MenuScreen = 'Activity' | 'AccessRequests' | 'Settings' | 'Devices';

type StoryActivity = {
  id: string;
  icon: string;
  tone: 'danger' | 'success' | 'info';
  text: string;
  time: string;
  orderTime: number;
};

const SAFE_LIMIT_MINUTES = 240;

const DashboardStoryScreen = ({ navigation }: DashboardScreenProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [usageSessions, setUsageSessions] = useState<UsageSession[]>([]);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatus | null>(null);
  const [activityLastSeenAt, setActivityLastSeenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      if (!isRefreshing && !hasLoadedOnce) {
        setIsLoading(true);
      }

      const [devicesData, requestsData, trialData] = await Promise.all([
        getParentDevices(),
        getPendingRequests(),
        getFreeTrialStatus().catch(() => null),
      ]);

      const lastSeenAt = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_BADGE_LAST_SEEN_AT);
      setActivityLastSeenAt(lastSeenAt);

      setDevices(devicesData);
      setPendingRequests(requestsData);
      setTrialStatus(trialData);

      if (devicesData.length === 0) {
        setUsageSessions([]);
        return;
      }

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);

      const sessionsByDevice = await Promise.all(
        devicesData.map(async (device) => {
          try {
            return await getUsageSessions(device.deviceId, fromDate.toISOString());
          } catch (error) {
            console.log(`[DashboardStoryScreen] Could not load sessions for ${device.deviceId}`, error);
            return [];
          }
        })
      );

      setUsageSessions(sessionsByDevice.flat());
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('[DashboardStoryScreen] Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [hasLoadedOnce, isRefreshing]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const totalScreenTimeMinutes = useMemo(
    () =>
      usageSessions.reduce((total, session) => {
        const used = Math.max(0, session.allowedMinutes - session.remainingMinutes);
        return total + used;
      }, 0),
    [usageSessions]
  );

  const activeDevicesCount = useMemo(
    () =>
      devices.filter((device) => {
        const normalized = device.status.toLowerCase();
        return normalized === 'active' || device.status === '1';
      }).length,
    [devices]
  );

  const hasActiveAccess = () => trialStatus?.isActive === true;

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const storyInsight = useMemo(() => {
    if (pendingRequests.length > 0) {
      return {
        icon: '📩',
        accent: '#FEF3C7',
        textColor: '#92400E',
        title:
          pendingRequests.length === 1
            ? 'Có 1 yêu cầu đang chờ bạn phê duyệt.'
            : `Có ${pendingRequests.length} yêu cầu đang chờ bạn xem lại.`,
        subtitle: 'Xử lý sớm sẽ giúp con không phải chờ quá lâu.',
      };
    }

    if (totalScreenTimeMinutes > 0) {
      const hourText =
        totalScreenTimeMinutes < 60
          ? `${totalScreenTimeMinutes} phút`
          : `${(totalScreenTimeMinutes / 60).toFixed(1)} giờ`;

      const inSafeRange = totalScreenTimeMinutes <= SAFE_LIMIT_MINUTES;

      return {
        icon: inSafeRange ? '🛡️' : '⏰',
        accent: inSafeRange ? '#DCFCE7' : '#DBEAFE',
        textColor: inSafeRange ? '#166534' : COLORS.primaryDark,
        title: inSafeRange
          ? `Hôm nay bé đã sử dụng ${hourText}, vẫn trong giới hạn an toàn.`
          : `Hôm nay bé đã sử dụng ${hourText}, bạn nên kiểm tra thêm.`,
        subtitle: inSafeRange
          ? 'Mọi thứ đang diễn ra khá ổn và nhẹ nhàng.'
          : 'Bạn có thể vào màn hình hoạt động để xem chi tiết theo ngày.',
      };
    }

    if (devices.length > 0) {
      return {
        icon: '🌱',
        accent: '#EFF6FF',
        textColor: COLORS.primaryDark,
        title: 'Hôm nay chưa có nhiều hoạt động đáng lo.',
        subtitle: 'Ứng dụng sẽ tiếp tục theo dõi và nhắc bạn khi cần.',
      };
    }

    return {
      icon: '👋',
      accent: '#EFF6FF',
      textColor: COLORS.primaryDark,
      title: 'Bạn đã sẵn sàng bắt đầu theo dõi cho gia đình.',
      subtitle: 'Hãy thêm thiết bị đầu tiên để xem báo cáo và yêu cầu của con.',
    };
  }, [devices.length, pendingRequests.length, totalScreenTimeMinutes]);

  const recentActivities = useMemo<StoryActivity[]>(() => {
    const sessionItems: StoryActivity[] = usageSessions
      .slice()
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 4)
      .map((session) => {
        const device = devices.find((item) => item.deviceId === session.deviceId);
        const usedMinutes = Math.max(0, session.allowedMinutes - session.remainingMinutes);
        const childName = device?.childName || session.device?.childName || 'Bé';
        const status = session.status.toLowerCase();

        return {
          id: `session-${session.usageSessionId}`,
          icon: status === 'expired' ? '🚫' : '🎓',
          tone: status === 'expired' ? 'danger' : 'success',
          text:
            usedMinutes > 0
              ? `${childName} đã dùng ${usedMinutes} phút trên ${device?.deviceName || 'thiết bị'}`
              : `${childName} vừa mở ${device?.deviceName || 'thiết bị'}`,
          time: getTimeAgo(new Date(session.startTime)),
          orderTime: new Date(session.startTime).getTime(),
        };
      });

    const requestItems: StoryActivity[] = pendingRequests
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .map((request) => ({
        id: `request-${request.requestId}`,
        icon: '📩',
        tone: 'info',
        text: `${request.device?.childName || 'Bé'} xin thêm ${request.requestedMinutes} phút`,
        time: getTimeAgo(new Date(request.createdAt)),
        orderTime: new Date(request.createdAt).getTime(),
      }));

    return [...requestItems, ...sessionItems]
      .sort((a, b) => b.orderTime - a.orderTime)
      .slice(0, 5);
  }, [devices, pendingRequests, usageSessions]);

  const handleMenuPress = (screen: MenuScreen, title: string, requiresTrial = true) => {
    if (requiresTrial && !hasActiveAccess()) {
      Alert.alert(
        'Cần kích hoạt quyền truy cập',
        `Bạn cần dùng thử hoặc nâng cấp để mở "${title}".`,
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Dùng thử 7 ngày', onPress: () => navigation.navigate('Trial') },
          { text: 'Nâng cấp', onPress: () => navigation.navigate('UpgradePackage') },
        ]
      );
      return;
    }

    if (screen === 'Activity') {
      const nowIso = new Date().toISOString();
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_BADGE_LAST_SEEN_AT, nowIso).catch(() => undefined);
      setActivityLastSeenAt(nowIso);
    }

    navigation.navigate(screen);
  };

  const activityBadgeCount = useMemo(() => {
    const endedSessions = usageSessions.filter((session) => session.status.toLowerCase() !== 'active');

    if (!activityLastSeenAt) {
      return endedSessions.length;
    }

    const lastSeenMs = new Date(activityLastSeenAt).getTime();
    if (Number.isNaN(lastSeenMs)) {
      return endedSessions.length;
    }

    return endedSessions.filter((session) => {
      const endedMs = new Date(session.endTime || session.startTime).getTime();
      return !Number.isNaN(endedMs) && endedMs > lastSeenMs;
    }).length;
  }, [activityLastSeenAt, usageSessions]);

  const handleAddDevicePress = () => {
    if (!hasActiveAccess()) {
      Alert.alert(
        'Cần kích hoạt quyền truy cập',
        'Bạn cần dùng thử hoặc nâng cấp để thêm thiết bị mới.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Dùng thử 7 ngày', onPress: () => navigation.navigate('Trial') },
          { text: 'Nâng cấp', onPress: () => navigation.navigate('UpgradePackage') },
        ]
      );
      return;
    }

    navigation.navigate('AddDevice');
  };

  const calculateDaysRemaining = () => {
    if (!trialStatus?.expiresAt) return 0;
    const expiresDate = new Date(trialStatus.expiresAt);
    const now = new Date();
    return Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const actionCards = [
    {
      icon: '📊',
      title: 'Xem hoạt động',
      description: 'Theo dõi thời gian sử dụng và phiên gần đây.',
      screen: 'Activity' as const,
      requiresTrial: true,
    },
    {
      icon: '📩',
      title: 'Duyệt yêu cầu',
      description: 'Phê duyệt nhanh các yêu cầu thêm thời gian.',
      screen: 'AccessRequests' as const,
      requiresTrial: true,
    },
    {
      icon: '📱',
      title: 'Thiết bị',
      description: 'Xem danh sách thiết bị đang được phụ huynh quản lý.',
      screen: 'Devices' as const,
      requiresTrial: true,
    },
    {
      icon: '⚙️',
      title: 'Cài đặt',
      description: 'Điều chỉnh tài khoản và các tuỳ chọn bảo vệ.',
      screen: 'Settings' as const,
      requiresTrial: false,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={styles.hero}>
        <Text style={styles.heroEyebrow}>Parent Assistant</Text>
        <Text style={styles.heroTitle}>Tổng quan hôm nay</Text>
        <Text style={styles.heroSubtitle}>
          Một góc nhìn nhẹ nhàng để bạn nắm tình hình của con mà không bị quá tải.
        </Text>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang chuẩn bị bức tranh hôm nay...</Text>
        </View>
      ) : (
        <>
          <View style={[styles.insightCard, { backgroundColor: storyInsight.accent }]}>
            <Text style={styles.insightIcon}>{storyInsight.icon}</Text>
            <View style={styles.insightBody}>
              <Text style={[styles.insightTitle, { color: storyInsight.textColor }]}>{storyInsight.title}</Text>
              <Text style={styles.insightSubtitle}>{storyInsight.subtitle}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{activeDevicesCount}</Text>
              <Text style={styles.summaryLabel}>thiết bị đang hoạt động</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{pendingRequests.length}</Text>
              <Text style={styles.summaryLabel}>yêu cầu cần xem</Text>
            </View>
          </View>

          {trialStatus?.isActive ? (
            <View style={[styles.bannerCard, styles.bannerSuccess]}>
              <Text style={styles.bannerTitle}>🎁 Gói dùng thử đang hoạt động</Text>
              <Text style={styles.bannerText}>
                Bạn còn {calculateDaysRemaining()} ngày để trải nghiệm đầy đủ tính năng.
              </Text>
            </View>
          ) : (
            <View style={[styles.bannerCard, styles.bannerInfo]}>
              <Text style={styles.bannerTitle}>✨ Mở thêm tính năng bảo vệ</Text>
              <Text style={styles.bannerText}>
                Kích hoạt dùng thử hoặc nâng cấp để xem hoạt động và duyệt yêu cầu cho con.
              </Text>
              <View style={styles.bannerActions}>
                {!trialStatus?.hasTrial && (
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Trial')}>
                    <Text style={styles.secondaryButtonText}>Dùng thử 7 ngày</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('UpgradePackage')}
                >
                  <Text style={styles.primaryButtonText}>Nâng cấp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thiết bị gia đình</Text>
            <View style={styles.deviceManagerCard}>
              <View style={styles.deviceManagerHeader}>
                <View style={styles.deviceManagerCopy}>
                  <Text style={styles.deviceManagerTitle}>Quản lý thiết bị của con</Text>
                  <Text style={styles.deviceManagerDescription}>
                    {devices.length > 0
                      ? `Hiện bạn đang theo dõi ${devices.length} thiết bị. Bạn có thể thêm thiết bị mới hoặc xem chi tiết danh sách.`
                      : 'Hiện chưa có thiết bị nào được liên kết. Hãy thêm thiết bị đầu tiên để bắt đầu theo dõi.'}
                  </Text>
                </View>
                <Text style={styles.deviceManagerIcon}>📱</Text>
              </View>

              <View style={styles.deviceManagerStats}>
                <View style={styles.devicePill}>
                  <Text style={styles.devicePillValue}>{devices.length}</Text>
                  <Text style={styles.devicePillLabel}>thiết bị đã liên kết</Text>
                </View>
                <View style={styles.devicePill}>
                  <Text style={styles.devicePillValue}>{activeDevicesCount}</Text>
                  <Text style={styles.devicePillLabel}>thiết bị đang hoạt động</Text>
                </View>
              </View>

              <View style={styles.deviceManagerActions}>
                <TouchableOpacity
                  style={styles.deviceSecondaryButton}
                  onPress={() => handleMenuPress('Devices', 'Thiết bị', true)}
                >
                  <Text style={styles.deviceSecondaryButtonText}>Xem thiết bị</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devicePrimaryButton} onPress={handleAddDevicePress}>
                  <Text style={styles.devicePrimaryButtonText}>+ Thêm thiết bị</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lối tắt cho phụ huynh</Text>
            <View style={styles.actionList}>
              {actionCards.map((item) => {
                const locked = item.requiresTrial && !hasActiveAccess();
                const taskCount =
                  item.screen === 'AccessRequests'
                    ? pendingRequests.length
                    : item.screen === 'Activity'
                      ? activityBadgeCount
                      : 0;
                return (
                  <TouchableOpacity
                    key={item.title}
                    style={[styles.actionCard, locked && styles.actionCardLocked]}
                    onPress={() => handleMenuPress(item.screen, item.title, item.requiresTrial)}
                  >
                    <Text style={styles.actionIcon}>{item.icon}</Text>
                    <View style={styles.actionTextBlock}>
                      <Text style={styles.actionTitle}>
                        {item.title}
                        {locked ? '  🔒' : ''}
                      </Text>
                      <Text style={styles.actionDescription}>{item.description}</Text>
                    </View>
                    {taskCount > 0 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{taskCount > 99 ? '99+' : taskCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhịp hoạt động gần đây</Text>
            {recentActivities.length > 0 ? (
              <View style={styles.timeline}>
                {recentActivities.map((activity, index) => (
                  <View key={activity.id} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          activity.tone === 'danger'
                            ? styles.timelineDotDanger
                            : activity.tone === 'success'
                              ? styles.timelineDotSuccess
                              : styles.timelineDotInfo,
                        ]}
                      >
                        <Text style={styles.timelineIcon}>{activity.icon}</Text>
                      </View>
                      {index < recentActivities.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineText}>{activity.text}</Text>
                      <Text style={styles.timelineTime}>{activity.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Chưa có hoạt động mới</Text>
                <Text style={styles.emptySubtitle}>Khi con sử dụng thiết bị, bạn sẽ thấy tóm tắt ở đây.</Text>
              </View>
            )}
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
    borderRadius: 24,
    padding: 24,
    ...baseShadow,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    ...baseShadow,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  insightCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    ...baseShadow,
  },
  insightIcon: {
    fontSize: 32,
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
  },
  insightSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    ...baseShadow,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bannerCard: {
    borderRadius: 20,
    padding: 18,
    ...baseShadow,
  },
  bannerSuccess: {
    backgroundColor: '#ECFDF5',
  },
  bannerInfo: {
    backgroundColor: '#EFF6FF',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  deviceManagerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    ...baseShadow,
  },
  deviceManagerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deviceManagerCopy: {
    flex: 1,
  },
  deviceManagerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  deviceManagerDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  deviceManagerIcon: {
    fontSize: 28,
  },
  deviceManagerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  devicePill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  devicePillValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  devicePillLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  deviceManagerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  devicePrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  devicePrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  deviceSecondaryButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deviceSecondaryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  actionList: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...baseShadow,
  },
  actionCardLocked: {
    opacity: 0.65,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTextBlock: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  timeline: {
    gap: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    alignItems: 'center',
    width: 36,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDanger: {
    backgroundColor: '#FEE2E2',
  },
  timelineDotSuccess: {
    backgroundColor: '#DCFCE7',
  },
  timelineDotInfo: {
    backgroundColor: '#DBEAFE',
  },
  timelineIcon: {
    fontSize: 15,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: -4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...baseShadow,
  },
  timelineText: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text,
    marginBottom: 6,
  },
  timelineTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 22,
    ...baseShadow,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default DashboardStoryScreen;

