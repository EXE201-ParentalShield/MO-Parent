import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const SettingsScreen = () => {
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [safeMode, setSafeMode] = React.useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [planName, setPlanName] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined);

  const loadAccountStatus = async () => {
    try {
      setLoadingAccount(true);
      const settingsStr = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const currentUserId =
        Number(user?.userId) ||
        Number((user as any)?.id) ||
        Number((user as any)?.userID) ||
        0;
      const subs = settings?.subscriptions || {};
      const sub = subs?.[currentUserId];
      const hasSub = !!sub;
      setHasSubscription(hasSub);
      setPlanName(sub?.planName);
      setExpiresAt(sub?.expiresAt);
      if (sub?.expiresAt) {
        const active = new Date(sub.expiresAt).getTime() > Date.now();
        setIsActive(active);
      } else {
        setIsActive(false);
      }
    } catch (error) {
      setHasSubscription(null);
      setPlanName(undefined);
      setExpiresAt(undefined);
      setIsActive(false);
    } finally {
      setLoadingAccount(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccountStatus();
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

  const handleRefreshAccount = () => {
    Alert.alert(
      'Làm mới trạng thái',
      'Kiểm tra lại trạng thái tài khoản của bạn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Kiểm tra', onPress: loadAccountStatus }
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
          <Text style={styles.sectionTitle}>Trạng thái tài khoản</Text>
          <View style={styles.card}>
            {loadingAccount ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : hasSubscription !== null ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Đã đăng ký gói:</Text>
                  <Text style={[styles.infoValue, { color: hasSubscription ? COLORS.success : COLORS.danger }]}>
                    {hasSubscription ? '✅ Có' : '❌ Chưa'}
                  </Text>
                </View>
                {hasSubscription && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tên gói:</Text>
                      <Text style={styles.infoValue}>{planName || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Hết hạn:</Text>
                      <Text style={styles.infoValue}>{formatDate(expiresAt)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Trạng thái:</Text>
                      <Text style={[styles.infoValue, { color: isActive ? COLORS.success : COLORS.danger }]}>
                        {isActive ? 'Hoạt động' : 'Hết hạn'}
                      </Text>
                    </View>
                  </>
                )}
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshAccount}>
                  <Text style={styles.refreshButtonText}>🔄 Làm mới</Text>
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
