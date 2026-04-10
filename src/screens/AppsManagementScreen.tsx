import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { ManagedApp, getManagedApps } from '../api/apps';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppsManagement'>;
};

const AppsManagementScreen = ({ navigation }: Props) => {
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [brokenIcons, setBrokenIcons] = useState<Record<number, boolean>>({});

  const isYoutubeApp = (app: ManagedApp) => {
    const appName = app.appName.toLowerCase();
    const pkg = app.packageName.toLowerCase();
    return appName.includes('youtube') || pkg.includes('youtube');
  };

  const fetchApps = useCallback(async () => {
    try {
      const data = await getManagedApps('');
      setApps(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách ứng dụng');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchApps();
    }, [fetchApps])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchApps();
  };

  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => {
      const aYoutube = isYoutubeApp(a);
      const bYoutube = isYoutubeApp(b);

      if (aYoutube && !bYoutube) return -1;
      if (!aYoutube && bYoutube) return 1;
      return a.appName.localeCompare(b.appName);
    });
  }, [apps]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải ứng dụng...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Quản lý ứng dụng của bé</Text>
          <Text style={styles.heroSubtitle}>
            Ấn vào logo để có thể chỉnh sửa các tác vụ phù hợp với con bạn
          </Text>
        </View>

        <View style={styles.grid}>
          {sortedApps.map((app, index) => {
            const isYoutube = isYoutubeApp(app);
            const isThirdColumn = index % 3 === 2;
            return (
              <TouchableOpacity
                key={app.appId}
                style={[
                  styles.logoTile,
                  !isThirdColumn && styles.logoTileWithRightGap,
                  isYoutube && styles.youtubeTile,
                ]}
                onPress={() => {
                  if (isYoutube) {
                    navigation.navigate('VideoManagement', { appName: app.appName });
                    return;
                  }

                  Alert.alert(app.appName, 'Comming soon');
                }}
                activeOpacity={0.86}
              >
                {brokenIcons[app.appId] || !app.iconUrl ? (
                  <View style={styles.logoFallback}>
                    <Text style={styles.logoFallbackText}>{(app.appName || '?').slice(0, 1).toUpperCase()}</Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: app.iconUrl }}
                    style={styles.logoImage}
                    resizeMode="contain"
                    onError={() => setBrokenIcons((prev) => ({ ...prev, [app.appId]: true }))}
                  />
                )}
                <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
                {!app.isActive && <View style={styles.inactiveDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textSecondary },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    borderRadius: 12,
  },
  heroTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  heroSubtitle: { marginTop: 6, color: COLORS.textSecondary, lineHeight: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  logoTile: {
    width: '31%',
    height: 114,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 12,
    paddingHorizontal: 6,
  },
  logoTileWithRightGap: {
    marginRight: '3.5%',
  },
  youtubeTile: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  logoImage: {
    width: 44,
    height: 44,
    marginBottom: 10,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoFallbackText: {
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: 18,
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  inactiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
});

export default AppsManagementScreen;
