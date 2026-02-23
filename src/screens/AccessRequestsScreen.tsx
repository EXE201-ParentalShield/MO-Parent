import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';

const AccessRequestsScreen = () => {
  const requests = [
    { 
      id: 1,
      child: 'Thanh Tùng',
      app: 'Instagram',
      reason: 'Muốn xem ảnh của bạn bè',
      time: '5 phút trước',
      status: 'pending'
    },
    { 
      id: 2,
      child: 'Thanh Tùng',
      app: 'Roblox',
      reason: 'Chơi game với bạn',
      time: '15 phút trước',
      status: 'pending'
    },
    { 
      id: 3,
      child: 'Thanh Tùng',
      app: 'Discord',
      reason: 'Chat với nhóm học',
      time: '30 phút trước',
      status: 'pending'
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Yêu cầu chờ duyệt</Text>
        <Text style={styles.subtitle}>{requests.length} yêu cầu mới</Text>

        {requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.childName}>{request.child}</Text>
              <Text style={styles.time}>{request.time}</Text>
            </View>
            
            <Text style={styles.appName}>📱 {request.app}</Text>
            <Text style={styles.reason}>"{request.reason}"</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.approveButton}>
                <Text style={styles.approveButtonText}>✓ Chấp nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.denyButton}>
                <Text style={styles.denyButtonText}>✗ Từ chối</Text>
              </TouchableOpacity>
            </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  reason: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  denyButton: {
    flex: 1,
    backgroundColor: COLORS.danger,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AccessRequestsScreen;
