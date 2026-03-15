import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

type FeatureIntroductionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FeatureIntroduction'>;
};

const FeatureIntroductionScreen = ({ navigation }: FeatureIntroductionScreenProps) => {
  const features = [
    {
      icon: '👁️',
      title: 'Theo dõi hoạt động',
      description: 'Giám sát thời gian sử dụng thiết bị và ứng dụng của con bạn'
    },
    {
      icon: '🚫',
      title: 'Chặn nội dung không phù hợp',
      description: 'Tự động chặn các trang web và ứng dụng không phù hợp với lứa tuổi'
    },
    {
      icon: '⏰',
      title: 'Giới hạn thời gian',
      description: 'Đặt giới hạn thời gian sử dụng thiết bị hàng ngày'
    },
    {
      icon: '📍',
      title: 'Theo dõi vị trí',
      description: 'Biết vị trí của con bạn trong thời gian thực'
    },
    {
      icon: '📊',
      title: 'Báo cáo chi tiết',
      description: 'Nhận báo cáo hàng tuần về hoạt động trực tuyến của con'
    },
    {
      icon: '👪',
      title: 'Quản lý nhiều trẻ',
      description: 'Dễ dàng quản lý nhiều tài khoản trẻ em trong một gia đình'
    },
  ];

  const handleStartTrial = async () => {
    try {
      const settingsStr = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const newSettings = { ...settings, trialExpiresAt: expiresAt };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch {}
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Bảo vệ con bạn an toàn trên mạng</Text>
          <Text style={styles.subtitle}>
            Trải nghiệm tất cả tính năng cao cấp với gói Trial 7 ngày miễn phí
          </Text>
        </View>

        {/* Trial Badge */}
        <View style={styles.trialBadge}>
          <Text style={styles.trialBadgeText}>🎁 7 NGÀY DÙNG THỬ MIỄN PHÍ</Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {Array.from({ length: Math.ceil(features.length / 2) }).map((_, rowIndex) => {
            const rowItems = features.slice(rowIndex * 2, rowIndex * 2 + 2);
            return (
              <View key={rowIndex} style={styles.featureRow}>
                {rowItems.map((feature, idx) => (
                  <View key={idx} style={styles.featureCard}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                ))}
                {rowItems.length === 1 && <View style={[styles.featureCard, { opacity: 0 }]} />}
              </View>
            );
          })}
        </View>

        {/* Trial Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Lợi ích khi dùng thử</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Truy cập đầy đủ tất cả tính năng cao cấp</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Hỗ trợ 1 thiết bị trong 7 ngày</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Không cần thẻ tín dụng để bắt đầu</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Hủy bất kỳ lúc nào, không ràng buộc</Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleStartTrial}>
            <Text style={styles.ctaButtonText}>Bắt đầu dùng thử 7 ngày</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>
            Miễn phí • Không cần thẻ tín dụng • Hủy bất kỳ lúc nào
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Đã có tài khoản? 
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Đăng nhập
            </Text>
          </Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  trialBadge: {
    backgroundColor: '#ffedd5',
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fdba74',
    marginBottom: 32,
    alignSelf: 'center',
  },
  trialBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ea580c',
    textAlign: 'center',
  },
  featuresGrid: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  benefitsSection: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    color: COLORS.success,
    fontWeight: 'bold',
    marginRight: 12,
    fontSize: 16,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ctaSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default FeatureIntroductionScreen;
