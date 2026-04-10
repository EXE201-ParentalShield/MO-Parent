import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { getFreeTrialStatus, registerFreeTrial, FreeTrialStatus } from '../api';

type TrialScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Trial'>;

interface Props {
  navigation: TrialScreenNavigationProp;
}

const TrialScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatus | null>(null);

  useEffect(() => {
    loadTrialStatus();
  }, []);

  const loadTrialStatus = async () => {
    try {
      setLoading(true);
      const status = await getFreeTrialStatus();
      setTrialStatus(status);
      
      // Nếu đã có trial active, có thể tự động chuyển sang Dashboard
      if (status.isActive) {
        console.log('[TrialScreen] User has active trial, showing details');
      }
    } catch (error) {
      console.error('[TrialScreen] Error loading trial status:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải thông tin dùng thử. Vui lòng thử lại sau.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    // Kiểm tra nếu đã có trial
    if (trialStatus?.hasTrial && !trialStatus?.isActive) {
      navigation.navigate('UpgradePackage');
      return;
    }

    if (trialStatus?.isActive) {
      // Đã có trial active, chuyển sang Dashboard
      navigation.replace('Dashboard');
      return;
    }

    // Đăng ký trial mới
    try {
      setRegistering(true);
      const result = await registerFreeTrial();
      
      if (result.success) {
        Alert.alert(
          '🎉 Thành công!',
          'Bạn đã đăng ký dùng thử 7 ngày thành công. Bắt đầu trải nghiệm ngay!',
          [{ 
            text: 'Bắt đầu', 
            onPress: () => navigation.replace('Dashboard')
          }]
        );
      }
    } catch (error: any) {
      console.error('[TrialScreen] Error registering trial:', error);
      Alert.alert(
        'Lỗi đăng ký',
        error?.message || 'Không thể đăng ký dùng thử. Vui lòng thử lại sau.'
      );
    } finally {
      setRegistering(false);
    }
  };

  const calculateDaysRemaining = (): number => {
    if (!trialStatus?.expiresAt) return 0;
    const expiresDate = new Date(trialStatus.expiresAt);
    const now = new Date();
    const diff = expiresDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </LinearGradient>
    );
  }

  const features = [
    { icon: '👨‍👩‍👧‍👦', title: 'Quản lý nhiều thiết bị', desc: 'Theo dõi tất cả thiết bị của con bạn' },
    { icon: '⏰', title: 'Giới hạn thời gian', desc: 'Kiểm soát thời gian sử dụng thiết bị' },
    { icon: '🛡️', title: 'Lọc nội dung', desc: 'Chặn nội dung không phù hợp' },
    { icon: '📊', title: 'Báo cáo chi tiết', desc: 'Xem hoạt động của con theo thời gian thực' },
    { icon: '✅', title: 'Phê duyệt yêu cầu', desc: 'Con có thể yêu cầu thêm thời gian sử dụng' },
    { icon: '🔒', title: 'Khóa từ xa', desc: 'Khóa thiết bị ngay lập tức khi cần' },
  ];

  // Render Active Trial Banner
  const renderActiveTrialBanner = () => {
    if (!trialStatus?.isActive) return null;
    
    const daysRemaining = calculateDaysRemaining();
    
    return (
      <View style={styles.activeTrialBanner}>
        <Text style={styles.activeTrialIcon}>✅</Text>
        <View style={styles.activeTrialContent}>
          <Text style={styles.activeTrialTitle}>
            Bạn đang dùng thử miễn phí
          </Text>
          <Text style={styles.activeTrialText}>
            Còn {daysRemaining} ngày • Hết hạn: {trialStatus.expiresAt ? formatDate(trialStatus.expiresAt) : 'N/A'}
          </Text>
        </View>
      </View>
    );
  };

  // Render Expired Trial Banner
  const renderExpiredTrialBanner = () => {
    if (!trialStatus?.hasTrial || trialStatus?.isActive) return null;
    
    return (
      <View style={styles.expiredTrialBanner}>
        <Text style={styles.expiredTrialIcon}>⏰</Text>
        <View style={styles.expiredTrialContent}>
          <Text style={styles.expiredTrialTitle}>
            Thời gian dùng thử đã hết
          </Text>
          <Text style={styles.expiredTrialText}>
            Nâng cấp ngay để tiếp tục sử dụng các tính năng
          </Text>
        </View>
      </View>
    );
  };

  // Button Text và Action
  const getButtonConfig = () => {
    if (trialStatus?.isActive) {
      return {
        text: 'Vào Dashboard',
        disabled: false,
      };
    }
    if (trialStatus?.hasTrial && !trialStatus?.isActive) {
      return {
        text: 'Bạn muốn nâng cấp gói?',
        disabled: false,
      };
    }
    return {
      text: 'Bắt đầu dùng thử ngay',
      disabled: registering,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <LinearGradient
      colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#FFFFFF']}
      locations={[0, 0.4, 1]}
      style={styles.gradient}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎁</Text>
            </View>
            <Text style={styles.title}>Dùng thử 7 ngày miễn phí</Text>
            <Text style={styles.subtitle}>
              Trải nghiệm đầy đủ tính năng bảo vệ con bạn trên thiết bị số
            </Text>
          </View>

          <View style={styles.trialBanner}>
            <Text style={styles.trialTitle}>✨ Miễn phí 100%</Text>
            <Text style={styles.trialText}>
              Không cần thẻ tín dụng • Không tự động gia hạn
            </Text>
          </View>

          {renderActiveTrialBanner()}
          {renderExpiredTrialBanner()}

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Tính năng nổi bật</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>7 ngày dùng thử</Text>
                <Text style={styles.infoText}>
                  Sau khi hết hạn, bạn có thể nâng cấp để tiếp tục sử dụng
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💳</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Không mất phí</Text>
                <Text style={styles.infoText}>
                  Không yêu cầu thông tin thanh toán trong thời gian dùng thử
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🔔</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Thông báo kịp thời</Text>
                <Text style={styles.infoText}>
                  Chúng tôi sẽ nhắc bạn trước khi hết hạn dùng thử
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.startButton,
              buttonConfig.disabled && styles.startButtonDisabled
            ]}
            onPress={handleStartTrial}
            activeOpacity={0.8}
            disabled={buttonConfig.disabled}
          >
            {registering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>{buttonConfig.text}</Text>
            )}
          </TouchableOpacity>

          {/* Nút Bỏ qua - chỉ hiển thị khi chưa có trial */}
          {!trialStatus?.hasTrial && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                console.log('[TrialScreen] User skipped trial, navigating to Dashboard');
                navigation.replace('Dashboard');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Bỏ qua, vào Dashboard</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.termsText}>
            Bằng cách tiếp tục, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconText: {
    fontSize: 56,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  trialBanner: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  trialTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 8,
  },
  trialText: {
    fontSize: 14,
    color: '#0284c7',
    textAlign: 'center',
  },
  activeTrialBanner: {
    flexDirection: 'row',
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  activeTrialIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  activeTrialContent: {
    flex: 1,
  },
  activeTrialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 4,
  },
  activeTrialText: {
    fontSize: 13,
    color: '#16a34a',
  },
  expiredTrialBanner: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  expiredTrialIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  expiredTrialContent: {
    flex: 1,
  },
  expiredTrialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  expiredTrialText: {
    fontSize: 13,
    color: '#dc2626',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    marginLeft: 48,
    marginTop: -20,
  },
  infoSection: {
    marginBottom: 32,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default TrialScreen;
