import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { getFreeTrialStatus, FreeTrialStatus } from '../api/freeTrial';

const SettingsScreen = () => {
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [safeMode, setSafeMode] = React.useState(true);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatus | null>(null);
  const [loadingTrial, setLoadingTrial] = useState(false);

  const loadTrialStatus = async () => {
    try {
      setLoadingTrial(true);
      const status = await getFreeTrialStatus();
      console.log('[Settings] Trial status loaded:', JSON.stringify(status, null, 2));
      setTrialStatus(status);
    } catch (error) {
      console.error('[Settings] Error loading trial status:', error);
    } finally {
      setLoadingTrial(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrialStatus();
    }, [])
  );

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysRemaining = (): number => {
    if (!trialStatus?.expiresAt) return 0;
    const expiresDate = new Date(trialStatus.expiresAt);
    const now = new Date();
    const diff = expiresDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleRefreshTrial = () => {
    Alert.alert(
      'Làm mới trạng thái',
      'Kiểm tra lại trạng thái dùng thử của bạn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Kiểm tra', onPress: loadTrialStatus }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            console.log('[Settings] Logging out...');
            await logout();
            console.log('[Settings] Logout successful, navigating to Login');
            // AppNavigator sẽ tự động navigate về Login khi isAuthenticated = false
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên:</Text>
              <Text style={styles.infoValue}>{user?.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái dùng thử</Text>
          <View style={styles.card}>
            {loadingTrial ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : trialStatus ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Đã đăng ký:</Text>
                  <Text style={[styles.infoValue, { color: trialStatus.hasTrial ? COLORS.success : COLORS.danger }]}>
                    {trialStatus.hasTrial ? '✅ Có' : '❌ Chưa'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Đang hoạt động:</Text>
                  <Text style={[styles.infoValue, { color: trialStatus.isActive ? COLORS.success : COLORS.danger }]}>
                    {trialStatus.isActive ? '✅ Có' : '❌ Không'}
                  </Text>
                </View>
                {trialStatus.hasTrial && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Bắt đầu:</Text>
                      <Text style={styles.infoValue}>{formatDate(trialStatus.startedAt)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Hết hạn:</Text>
                      <Text style={styles.infoValue}>{formatDate(trialStatus.expiresAt)}</Text>
                    </View>
                    {trialStatus.isActive && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Còn lại:</Text>
                        <Text style={[styles.infoValue, { fontWeight: 'bold', color: COLORS.primary }]}>
                          {calculateDaysRemaining()} ngày
                        </Text>
                      </View>
                    )}
                  </>
                )}
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshTrial}>
                  <Text style={styles.refreshButtonText}>🔄 Làm mới trạng thái</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.infoValue}>Không thể tải thông tin</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt bảo vệ</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Chế độ an toàn</Text>
              <Switch value={safeMode} onValueChange={setSafeMode} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Thông báo</Text>
              <Switch value={notifications} onValueChange={setNotifications} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới hạn thời gian</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giới hạn hàng ngày:</Text>
              <Text style={styles.infoValue}>4 giờ</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
