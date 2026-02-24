import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const stats = [
    { label: 'Thời gian màn hình', value: '4.2h', color: COLORS.primary },
    { label: 'Trang web bị chặn', value: '97', color: COLORS.danger },
    { label: 'Yêu cầu chờ duyệt', value: '3', color: COLORS.warning },
    { label: 'Thiết bị đang hoạt động', value: '2', color: COLORS.success },
  ];

  const menuItems = [
    { title: 'Hoạt động', screen: 'Activity', icon: '📊' },
    { title: 'Thiết bị', screen: 'Devices', icon: '📱' },
    { title: 'Yêu cầu truy cập', screen: 'AccessRequests', icon: '✅' },
    { title: 'Cài đặt', screen: 'Settings', icon: '⚙️' },
    { title: 'Tạo tài khoản trẻ em', screen: 'CreateChildAccount', icon: '👶' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Xin chào, Phụ Huynh!</Text>
          <Text style={styles.subtitle}>Tổng quan về hoạt động của con bạn</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen as any)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>📱 Thanh Tùng đã sử dụng YouTube Kids</Text>
            <Text style={styles.activityTime}>5 phút trước</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>🚫 Đã chặn truy cập tới Facebook</Text>
            <Text style={styles.activityTime}>15 phút trước</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>✅ Đã duyệt yêu cầu sử dụng Messenger Kids</Text>
            <Text style={styles.activityTime}>1 giờ trước</Text>
          </View>
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
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  menuItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  recentActivity: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default DashboardScreen;
