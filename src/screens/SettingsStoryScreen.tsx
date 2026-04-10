import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { FreeTrialStatus, getFreeTrialStatus } from '../api/freeTrial';
import { COLORS } from '../utils/constants';

type SettingsStoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const SettingsStoryScreen = ({ navigation }: SettingsStoryScreenProps) => {
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatus | null>(null);
  const [loadingTrial, setLoadingTrial] = useState(false);

  const loadTrialStatus = async () => {
    try {
      setLoadingTrial(true);
      const status = await getFreeTrialStatus();
      setTrialStatus(status);
    } catch (error) {
      console.error('[SettingsStoryScreen] Lỗi khi tải trạng thái dùng thử:', error);
    } finally {
      setLoadingTrial(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrialStatus();
    }, [])
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateCurrentAccessDaysRemaining = () => {
    // Always prioritize paid package remaining days when package is active.
    if (trialStatus?.isPaidActive && trialStatus?.activePackageExpiresAt) {
      const paidExpireDate = new Date(trialStatus.activePackageExpiresAt);
      return Math.max(0, Math.ceil((paidExpireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    if (typeof trialStatus?.trialRemainingDays === 'number') {
      return Math.max(0, trialStatus.trialRemainingDays);
    }

    if (!trialStatus?.expiresAt) return 0;
    const expiresDate = new Date(trialStatus.expiresAt);
    return Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const handleRefreshTrial = () => {
    Alert.alert('Làm mới trạng thái', 'Kiểm tra lại gói dùng thử hiện tại?', [
      { text: 'Để sau', style: 'cancel' },
      { text: 'Kiểm tra', onPress: loadTrialStatus },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Không gian cài đặt</Text>
        <Text style={styles.heroSubtitle}>
          Mọi tùy chọn quan trọng được gom lại rõ ràng để bạn dễ theo dõi và điều chỉnh.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ tên</Text>
            <Text style={styles.infoValue}>{user?.fullName || 'Chưa có thông tin'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Chưa có thông tin'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt bảo vệ</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Chế độ an toàn</Text>
              <Text style={styles.settingDescription}>Giữ trải nghiệm của con trong vùng an toàn hơn.</Text>
            </View>
            <Switch value={safeMode} onValueChange={setSafeMode} trackColor={{ true: '#BFDBFE' }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Thông báo cho phụ huynh</Text>
              <Text style={styles.settingDescription}>
                Nhận nhắc nhở khi có yêu cầu hoặc thay đổi quan trọng.
              </Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#BFDBFE' }} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giới hạn thời gian màn hình</Text>
        <View style={styles.card}>
          <View style={styles.limitRow}>
            <View style={styles.limitText}>
              <Text style={styles.limitValue}>4 giờ / ngày</Text>
              <Text style={styles.settingDescription}>
                Giới hạn hiện tại đang được hiển thị theo cấu hình sẵn có.
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trạng thái quyền truy cập</Text>
        <View style={styles.card}>
          {loadingTrial ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nguồn quyền hiện tại</Text>
                <Text style={styles.infoValue}>
                  {trialStatus?.accessSource === 'PaidPackage'
                    ? 'Gói nâng cấp'
                    : trialStatus?.accessSource === 'FreeTrial'
                      ? 'Dùng thử miễn phí'
                      : 'Chưa kích hoạt'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Có quyền truy cập</Text>
                <Text style={styles.infoValue}>{trialStatus?.hasAccess ? 'Có' : 'Không'}</Text>
              </View>
              {trialStatus?.isPaidActive && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gói nâng cấp</Text>
                    <Text style={styles.infoValue}>{trialStatus.activePackageName || 'Gói dịch vụ'}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gói nâng cấp hết hạn</Text>
                    <Text style={styles.infoValue}>{formatDate(trialStatus.activePackageExpiresAt)}</Text>
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Đã đăng ký</Text>
                <Text style={styles.infoValue}>{trialStatus?.hasTrial ? 'Có' : 'Chưa'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dùng thử đang hoạt động</Text>
                <Text style={styles.infoValue}>{trialStatus?.isTrialActive ?? trialStatus?.isActive ? 'Có' : 'Không'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bắt đầu</Text>
                <Text style={styles.infoValue}>{formatDate(trialStatus?.startedAt)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hết hạn</Text>
                <Text style={styles.infoValue}>{formatDate(trialStatus?.expiresAt)}</Text>
              </View>
              {trialStatus?.hasAccess && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Còn lại (gói hiện tại)</Text>
                    <Text style={[styles.infoValue, styles.highlightValue]}>{calculateCurrentAccessDaysRemaining()} ngày</Text>
                  </View>
                </>
              )}
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshTrial}>
                <Text style={styles.refreshButtonText}>Làm mới trạng thái</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dùng thử và thanh toán</Text>
        <View style={styles.card}>
          <Text style={styles.serviceTitle}>
            {trialStatus?.isPaidActive
              ? `${trialStatus.activePackageName || 'Gói nâng cấp'} đang hoạt động.`
              : (trialStatus?.isTrialActive ?? trialStatus?.isActive)
                ? 'Gói dùng thử 7 ngày vẫn đang hoạt động.'
              : trialStatus?.hasTrial
                ? 'Bạn đã dùng xong trial, có thể nâng cấp bất kỳ lúc nào.'
                : 'Bạn vẫn có thể bắt đầu trial 7 ngày hoặc xem các gói dịch vụ.'}
          </Text>
          <Text style={styles.serviceDescription}>
            Trạng thái quyền sử dụng được ưu tiên theo gói nâng cấp khi có thanh toán thành công.
          </Text>
          <View style={styles.serviceActions}>
            <TouchableOpacity
              style={styles.servicePrimaryButton}
              onPress={() => navigation.navigate('UpgradePackage')}
            >
              <Text style={styles.servicePrimaryButtonText}>Các gói thanh toán</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    ...baseShadow,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  limitText: {
    flex: 1,
  },
  limitValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
    fontSize: 14,
  },
  highlightValue: {
    color: COLORS.primaryDark,
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  serviceTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  servicePrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  servicePrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  serviceSecondaryButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  serviceSecondaryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 16,
    ...baseShadow,
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default SettingsStoryScreen;
