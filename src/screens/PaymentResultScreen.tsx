import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';

type PaymentResultScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PaymentResult'>;
  route: RouteProp<RootStackParamList, 'PaymentResult'>;
};

const PaymentResultScreen = ({ navigation, route }: PaymentResultScreenProps) => {
  const { success, packageName, amount, transactionNo, paidAt } = route.params;

  const formattedDate = paidAt
    ? new Date(paidAt).toLocaleString('vi-VN')
    : '';

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: success ? '#dcfce7' : '#fee2e2' }]}>
        <Text style={[styles.icon, { color: success ? '#16a34a' : '#ef4444' }]}>
          {success ? '✓' : '✗'}
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: success ? COLORS.success : '#ef4444' }]}>
        {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
      </Text>
      <Text style={styles.subtitle}>
        {success
          ? 'Gói dịch vụ của bạn đã được kích hoạt'
          : 'Giao dịch không thể hoàn tất. Vui lòng thử lại.'}
      </Text>

      {/* Transaction Info */}
      {success && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gói dịch vụ</Text>
            <Text style={styles.infoValue}>{packageName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số tiền</Text>
            <Text style={[styles.infoValue, styles.amountText]}>{amount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã giao dịch</Text>
            <Text style={styles.infoValue}>{transactionNo || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
        </View>
      )}

      {/* Buttons */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          })
        }
      >
        <Text style={styles.primaryButtonText}>
          {success ? 'Về trang chủ' : 'Về trang chủ'}
        </Text>
      </TouchableOpacity>

      {!success && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'UpgradePackage' }],
            })
          }
        >
          <Text style={styles.secondaryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  amountText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentResultScreen;