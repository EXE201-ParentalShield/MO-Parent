import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import * as ExpoLinking from 'expo-linking';
import { API_BASE_URL } from '../config/api';

type VNPayWebViewScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VNPayWebView'>;
  route: RouteProp<RootStackParamList, 'VNPayWebView'>;
};

const VNPayWebViewScreen = ({ navigation, route }: VNPayWebViewScreenProps) => {
  const { paymentUrl, orderCode, token, packageName } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHandledRef = useRef(false);

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handlePaymentResult = (data: any, success: boolean) => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;
    clearPolling();

    if (success) {
      navigation.replace('PaymentResult', {
        success: true,
        packageName: data?.data?.description || packageName || 'Gói dịch vụ',
        amount: new Intl.NumberFormat('vi-VN').format(data?.data?.amount) + 'đ',
        transactionNo: data?.data?.providerTransactionNo,
        paidAt: data?.data?.paidAt,
      });
    } else {
      navigation.replace('PaymentResult', {
        success: false,
        packageName: '',
        amount: '',
      });
    }
  };

  const checkPaymentStatus = async (): Promise<'Success' | 'Failed' | 'Pending'> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Payment/status/${orderCode}`, {
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

  const startPolling = () => {
    clearPolling();
    let attempts = 0;
    const maxAttempts = 24; // 24 × 5s = 2 phút

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearPolling();
        if (!isHandledRef.current) {
          isHandledRef.current = true;
          Alert.alert(
            'Hết thời gian',
            'Không thể xác nhận kết quả thanh toán. Vui lòng kiểm tra lại lịch sử giao dịch.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
        return;
      }
      await checkPaymentStatus();
    }, 5000);
  };

  // Lắng nghe URL thay đổi trong WebView để bắt redirect VNPay trả về
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url || '';

    // Bắt redirect về payment result/cancel để bắt đầu polling trạng thái PayOS.
    const appScheme = ExpoLinking.createURL('');
    if (
      url.startsWith(appScheme) ||
      url.includes('payment-result') ||
      url.includes('payment-cancel') ||
      url.includes('payos')
    ) {
      if (isHandledRef.current) return;

      startPolling();
    }
  };

  React.useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Loading indicator */}
      {isLoading && !hasError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải cổng thanh toán...</Text>
        </View>
      )}

      {/* Error screen */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Không thể tải trang thanh toán</Text>
          <Text style={styles.errorSubtitle}>
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              setIsLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {!hasError && (
        <WebView
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          allowsBackForwardNavigationGestures
          // Cho phép giả lập mobile để cổng thanh toán hiển thị đúng
          userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default VNPayWebViewScreen;
