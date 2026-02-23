import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../utils/constants';

const ActivityScreen = () => {
  const activities = [
    { time: '14:30', app: 'YouTube Kids', duration: '25 phút', status: 'safe' },
    { time: '13:45', app: 'Messenger Kids', duration: '15 phút', status: 'safe' },
    { time: '13:00', app: 'Facebook', duration: '0 phút', status: 'blocked' },
    { time: '11:20', app: 'Google Chrome', duration: '45 phút', status: 'safe' },
    { time: '10:00', app: 'TikTok', duration: '0 phút', status: 'blocked' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Lịch sử hoạt động</Text>
        <Text style={styles.subtitle}>Hôm nay - {new Date().toLocaleDateString('vi-VN')}</Text>

        {activities.map((activity, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.time}>{activity.time}</Text>
              <View style={[
                styles.statusBadge,
                activity.status === 'blocked' ? styles.blockedBadge : styles.safeBadge
              ]}>
                <Text style={styles.statusText}>
                  {activity.status === 'blocked' ? 'Bị chặn' : 'An toàn'}
                </Text>
              </View>
            </View>
            <Text style={styles.appName}>{activity.app}</Text>
            <Text style={styles.duration}>{activity.duration}</Text>
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
  activityCard: {
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
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safeBadge: {
    backgroundColor: '#d1fae5',
  },
  blockedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default ActivityScreen;
