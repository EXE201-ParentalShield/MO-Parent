import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { storage } from '../utils/storage';
import * as ExpoLinking from 'expo-linking';
import { API_BASE_URL } from '../config/api';

type UpgradePackageScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UpgradePackage'>;
};

const UpgradePackageScreen = ({ navigation }: UpgradePackageScreenProps) => {
  const [loadingId, setLoadingId] = React.useState<number | null>(null);

  const packages = [
    {
      id: 1,
      name: 'Gói Ngày',
      price: '5.000đ',
      period: '/ngày',
      devices: 1,
      features: ['1 thiết bị', 'Theo dõi cơ bản', 'Hỗ trợ 24/7'],
      color: COLORS.primary,
    },
    {
      id: 2,
      name: 'Gói Tuần',
      price: '19.000đ',
      period: '/tuần',
      devices: 1,
      features: ['1 thiết bị', 'Theo dõi đầy đủ', 'Báo cáo chi tiết', 'Hỗ trợ 24/7'],
      color: COLORS.secondary,
    },
    {
      id: 3,
      name: 'Gói Tháng',
      price: '39.000đ',
      period: '/tháng',
      devices: 2,
      features: [
        '2 thiết bị',
        'Theo dõi đầy đủ',
        'Báo cáo chi tiết',
        'Tùy chỉnh nâng cao',
        'Hỗ trợ 24/7',
      ],
      color: COLORS.success,
    },
  ];

  const handleUpgrade = async (pkg: any) => {
    const confirm = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Nâng cấp gói',
        `Bạn có chắc muốn nâng cấp lên ${pkg.name} với giá ${pkg.price}${pkg.period}?`,
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Nâng cấp', onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirm) return;

    try {
      setLoadingId(pkg.id);

      const token = await storage.getToken();
      const user = await storage.getUserData();
      const userId =
        Number(user?.id) ||
        Number(user?.userId) ||
        Number(user?.userID) ||
        Number(user?.Id) ||
        Number(user?.UserId) ||
        0;

      if (!userId)
        throw new Error('Không tìm thấy userId. Vui lòng đăng nhập lại.');
      if (!token)
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');

      const amount = Number(String(pkg.price).replace(/[^\d]/g, '')) || 0;
      const orderId = `ORDER-${Date.now()}`;

      // Lấy returnUrl động theo môi trường
      const returnUrl = ExpoLinking.createURL('payment-result');
      console.log('returnUrl:', returnUrl);

      const res = await fetch(`${API_BASE_URL}/api/Payment/vnpay-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          amount,
          orderId,
          description: `Nâng cấp ${pkg.name}`,
          provider: 1,
          returnUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.message || err?.error || 'Tạo thanh toán thất bại'
        );
      }

      const data = await res.json();
      const paymentId: number | null =
        data?.data?.paymentId ?? data?.data?.id ?? null;
      const paymentUrl: string | null =
        data?.data?.paymentUrl ||
        data?.paymentUrl ||
        data?.url ||
        data?.redirectUrl ||
        null;

      if (!paymentUrl)
        throw new Error('Không nhận được URL thanh toán từ máy chủ');
      if (!paymentId)
        throw new Error('Không nhận được mã thanh toán từ máy chủ');

      navigation.navigate('VNPayWebView', {
        paymentUrl,
        paymentId,
        token,
        packageName: pkg.name,
      });
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nâng cấp gói dịch vụ</Text>
          <Text style={styles.subtitle}>
            Chọn gói phù hợp với nhu cầu bảo vệ con bạn
          </Text>
        </View>

        {/* Package Cards */}
        <View style={styles.packagesContainer}>
          {packages.map((pkg) => (
            <View
              key={pkg.id}
              style={[styles.packageCard, { borderTopColor: pkg.color }]}
            >
              <View style={styles.packageHeader}>
                <Text style={[styles.packageName, { color: pkg.color }]}>
                  {pkg.name}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{pkg.price}</Text>
                  <Text style={styles.period}>{pkg.period}</Text>
                </View>
              </View>

              <Text style={styles.deviceInfo}>📱 {pkg.devices} thiết bị</Text>

              <View style={styles.featuresList}>
                {pkg.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  {
                    backgroundColor: pkg.color,
                    opacity: loadingId === pkg.id ? 0.7 : 1,
                  },
                ]}
                onPress={() => handleUpgrade(pkg)}
                disabled={loadingId !== null}
              >
                <Text style={styles.upgradeButtonText}>
                  {loadingId === pkg.id ? 'Đang khởi tạo...' : 'Nâng cấp ngay'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Lưu ý</Text>
          <Text style={styles.infoText}>
            • Sau khi thanh toán, vui lòng quay lại ứng dụng{'\n'}
            • Hệ thống sẽ tự động xác nhận ngay khi bạn quay lại{'\n'}
            • Có thể nâng cấp bất kỳ lúc nào{'\n'}
            • Thanh toán một lần, sử dụng ngay
          </Text>
        </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderTopWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  period: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  deviceInfo: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    fontWeight: '600',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    color: COLORS.success,
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
  },
  upgradeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#e8f4ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default UpgradePackageScreen;
