import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking as RNLinking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { storage } from '../utils/storage';
import * as ExpoLinking from 'expo-linking';

type UpgradePackageScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UpgradePackage'>;
};

const UpgradePackageScreen = ({ navigation }: UpgradePackageScreenProps) => {
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const [isWaitingPayment, setIsWaitingPayment] = React.useState(false);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = React.useRef(AppState.currentState);
  const pendingPaymentIdRef = React.useRef<number | null>(null);
  const pendingTokenRef = React.useRef<string | null>(null);

  const API_BASE_URL = 'https://be-ikk8.onrender.com';

  const clearPaymentState = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pendingPaymentIdRef.current = null;
    pendingTokenRef.current = null;
    setIsWaitingPayment(false);
  };

  const handlePaymentResult = (data: any, success: boolean) => {
    clearPaymentState();

    if (success) {
      navigation.navigate('PaymentResult', {
        success: true,
        packageName: data?.data?.description || 'Gói dịch vụ',
        amount: new Intl.NumberFormat('vi-VN').format(data?.data?.amount) + 'đ',
        transactionNo: data?.data?.providerTransactionNo,
        paidAt: data?.data?.paidAt,
      });
    } else {
      navigation.navigate('PaymentResult', {
        success: false,
        packageName: '',
        amount: '',
      });
    }
  };

  const checkPaymentStatus = async (
    paymentId: number,
    token: string
  ): Promise<'Success' | 'Failed' | 'Pending'> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Payment/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return 'Pending';
      const data = await res.json();
      const status = data?.data?.status;

      if (status === 'Success') {
        handlePaymentResult(data, true);
        return 'Success';
      } else if (status === 'Failed' || status === 'Cancelled') {
        handlePaymentResult(data, false);
        return 'Failed';
      }
      return 'Pending';
    } catch {
      return 'Pending';
    }
  };

  // Deep Link listener
  React.useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (!url.includes('payment-result')) return;

      const query = url.split('?')[1] || '';
      const params = Object.fromEntries(
        query.split('&').map(p => {
          const [k, v] = p.split('=');
          return [k, decodeURIComponent(v || '')];
        })
      );

      clearPaymentState();

      navigation.navigate('PaymentResult', {
        success: params.status === 'Success',
        packageName: params.packageName || 'Gói dịch vụ',
        amount: params.amount || '',
        transactionNo: params.transactionNo,
        paidAt: params.paidAt,
      });
    };

    // App đang mở → nhận Deep Link
    const deepLinkSub = RNLinking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // App bị tắt → được mở lại bằng Deep Link
    RNLinking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => deepLinkSub.remove();
  }, []);

  // AppState listener — kích hoạt ngay khi user quay lại app
  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (
          appStateRef.current === 'background' &&
          nextState === 'active' &&
          pendingPaymentIdRef.current &&
          pendingTokenRef.current
        ) {
          await checkPaymentStatus(
            pendingPaymentIdRef.current,
            pendingTokenRef.current
          );
        }
        appStateRef.current = nextState;
      }
    );

    return () => {
      subscription.remove();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = (paymentId: number, token: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let attempts = 0;
    const maxAttempts = 24; // 24 x 5s = 2 phút

    pollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        pendingPaymentIdRef.current = null;
        pendingTokenRef.current = null;
        setIsWaitingPayment(false);
        Alert.alert(
          'Hết thời gian',
          'Không thể xác nhận kết quả thanh toán. Vui lòng kiểm tra lại lịch sử giao dịch.'
        );
        return;
      }

      await checkPaymentStatus(paymentId, token);
    }, 5000);
  };

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

      const supported = await RNLinking.canOpenURL(paymentUrl);
      if (!supported)
        throw new Error('Thiết bị không thể mở trình duyệt cho URL thanh toán');

      await RNLinking.openURL(paymentUrl);

      if (paymentId && token) {
        pendingPaymentIdRef.current = paymentId;
        pendingTokenRef.current = token;
        setIsWaitingPayment(true);
        startPolling(paymentId, token);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Banner chờ xác nhận */}
      {isWaitingPayment && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>
            ⏳ Đang chờ xác nhận thanh toán... Vui lòng quay lại app sau khi
            thanh toán xong.
          </Text>
          <TouchableOpacity
            onPress={() => {
              clearPaymentState();
            }}
          >
            <Text style={styles.waitingCancel}>Hủy</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    opacity: loadingId === pkg.id || isWaitingPayment ? 0.7 : 1,
                  },
                ]}
                onPress={() => handleUpgrade(pkg)}
                disabled={loadingId !== null || isWaitingPayment}
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
  waitingBanner: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waitingText: {
    fontSize: 13,
    color: '#9a3412',
    flex: 1,
    lineHeight: 20,
  },
  waitingCancel: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: 'bold',
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