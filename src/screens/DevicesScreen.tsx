import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';

const DevicesScreen = () => {
  const devices = [
    { name: 'Samsung Galaxy A54', child: 'Thanh Tùng', status: 'active', lastSync: '2 phút trước' },
    { name: 'Xiaomi Redmi Note 12', child: 'Thanh Tùng', status: 'active', lastSync: '15 phút trước' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Thêm thiết bị mới</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Thiết bị đang quản lý</Text>

        {devices.map((device, index) => (
          <View key={index} style={styles.deviceCard}>
            <View style={styles.deviceIcon}>
              <Text style={styles.deviceIconText}>📱</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.childName}>Được sử dụng bởi: {device.child}</Text>
              <Text style={styles.lastSync}>Đồng bộ: {device.lastSync}</Text>
            </View>
            <View style={[styles.statusDot, device.status === 'active' && styles.activeDot]} />
          </View>
        ))}
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
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  childName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  lastSync: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textSecondary,
  },
  activeDot: {
    backgroundColor: COLORS.success,
  },
});

export default DevicesScreen;
