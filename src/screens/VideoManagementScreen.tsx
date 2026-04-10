import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import {
  ManagedVideo,
  VideoUpsertPayload,
  createManagedVideo,
  deleteManagedVideo,
  getManagedVideos,
} from '../api/videos';

type Props = {
  route: RouteProp<RootStackParamList, 'VideoManagement'>;
};

type VideoFormState = {
  title: string;
  youtubeId: string;
  category: string;
};

type DropdownLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const CATEGORY_OPTIONS = [
  { label: 'Giáo dục', value: 'Education', icon: '🎓' },
  { label: 'Học tập', value: 'Learning', icon: '📘' },
  { label: 'Hoạt hình', value: 'Cartoon', icon: '🧸' },
  { label: 'Giải trí', value: 'Relax', icon: '🌿' },
];

const CATEGORY_LABEL_BY_VALUE: Record<string, string> = {
  Education: 'Giáo dục',
  Learning: 'Học tập',
  Cartoon: 'Hoạt hình',
  Relax: 'Giải trí',
};

const CATEGORY_ICON_BY_VALUE: Record<string, string> = {
  Education: '🎓',
  Learning: '📘',
  Cartoon: '🧸',
  Relax: '🌿',
};

const CATEGORY_VALUES = CATEGORY_OPTIONS.map((item) => item.value);
const DROPDOWN_MAX_HEIGHT = 220;

const EMPTY_FORM: VideoFormState = {
  title: '',
  youtubeId: '',
  category: 'Education',
};

const VideoManagementScreen = ({ route }: Props) => {
  const appName = route.params?.appName || 'YouTube';
  const [videos, setVideos] = useState<ManagedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<DropdownLayout>({ top: 0, left: 0, width: 0, maxHeight: 180 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [thumbnailAttemptIndex, setThumbnailAttemptIndex] = useState<Record<number, number>>({});
  const [form, setForm] = useState<VideoFormState>(EMPTY_FORM);
  const categoryTriggerRef = useRef<View | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const filteredCategoryOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CATEGORY_OPTIONS;
    return CATEGORY_OPTIONS.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const fetchVideos = useCallback(async () => {
    try {
      const data = await getManagedVideos();
      setVideos(data);
    } catch {
      setVideos([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchVideos();
    }, [fetchVideos])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchVideos();
  };

  const formatDurationLabel = (seconds: number) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    const remainSeconds = safe % 60;

    if (minutes > 0) {
      return `${minutes} phút ${remainSeconds} giây`;
    }

    return `${remainSeconds} giây`;
  };

  const getThumbnailCandidates = (video: ManagedVideo): string[] => {
    const candidates: string[] = [];
    if (video.thumbnail) candidates.push(video.thumbnail);

    const id = (video.youtubeId || '').trim();
    if (id) {
      candidates.push(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
      candidates.push(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
      candidates.push(`https://i3.ytimg.com/vi/${id}/hqdefault.jpg`);
      candidates.push(`https://img.youtube.com/vi/${id}/0.jpg`);
    }

    return Array.from(new Set(candidates.filter(Boolean)));
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setSearchQuery('');
    setShowCategoryPicker(false);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setShowCategoryPicker(false);
    setSearchQuery('');
    setForm(EMPTY_FORM);
  };

  const openCategoryDropdown = () => {
    if (!categoryTriggerRef.current) {
      setShowCategoryPicker(true);
      return;
    }

    categoryTriggerRef.current.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const gap = 6;
      const spaceBelow = Math.max(0, screenHeight - (y + height) - 16);
      const spaceAbove = Math.max(0, y - 16);
      const openUpward = spaceBelow < 160 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        140,
        Math.min(DROPDOWN_MAX_HEIGHT, openUpward ? spaceAbove - gap : spaceBelow - gap)
      );

      const top = openUpward
        ? Math.max(16, y - maxHeight - gap)
        : y + height + gap;

      setDropdownLayout({
        top,
        left: x,
        width,
        maxHeight,
      });

      setShowTopFade(false);
      setShowBottomFade(filteredCategoryOptions.length > 4);
      setShowCategoryPicker(true);
    });
  };

  const closeCategoryDropdown = () => {
    setShowCategoryPicker(false);
    setSearchQuery('');
  };

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showCategoryPicker ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [dropdownAnim, showCategoryPicker]);

  const validateForm = () => {
    if (!form.title.trim()) return 'Vui lòng nhập Title';
    if (!form.youtubeId.trim()) return 'Vui lòng nhập YoutubeId';
    if (!CATEGORY_VALUES.includes(form.category)) return 'Category không hợp lệ';

    return '';
  };

  const handleCreateVideo = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Thiếu thông tin', error);
      return;
    }

    const payload: VideoUpsertPayload = {
      title: form.title.trim(),
      youtubeId: form.youtubeId.trim(),
      // Duration will be resolved automatically by backend from YouTube data.
      duration: 0,
      // Thumbnail will be generated by backend from YouTube ID.
      thumbnail: '',
      category: form.category.trim(),
      isActive: true,
    };

    setIsSaving(true);
    try {
      await createManagedVideo(payload);
      closeCreateModal();
      await fetchVideos();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể thêm video mới');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVideo = (video: ManagedVideo) => {
    Alert.alert('Xóa video', `Bạn có chắc muốn xóa "${video.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteManagedVideo(video.videoId);
            await fetchVideos();
          } catch (e: any) {
            Alert.alert('Lỗi', e.message || 'Không thể xóa video');
          }
        },
      },
    ]);
  };

  const activeCount = useMemo(() => videos.length, [videos.length]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách video...</Text>
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
          <Text style={styles.heroTitle}>Danh sách video của {appName}</Text>
          <Text style={styles.heroSubtitle}>Hiện có {activeCount} video từ DB.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
          <Text style={styles.primaryButtonText}>+ Thêm video mới</Text>
        </TouchableOpacity>

        {videos.map((video) => {
          const candidates = getThumbnailCandidates(video);
          const currentIndex = thumbnailAttemptIndex[video.videoId] || 0;
          const currentThumbnail = candidates[currentIndex] || '';

          return (
          <View key={video.videoId} style={styles.card}>
            <View style={styles.rowTop}>
              {currentThumbnail ? (
                <Image
                  source={{ uri: currentThumbnail }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                  onError={() => {
                    setThumbnailAttemptIndex((prev) => ({
                      ...prev,
                      [video.videoId]: (prev[video.videoId] || 0) + 1,
                    }));
                  }}
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                  <Text style={styles.thumbnailFallbackText}>🎬</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.metaText}>YoutubeId: {video.youtubeId}</Text>
                <Text style={styles.metaText}>Category: {CATEGORY_LABEL_BY_VALUE[video.category] || video.category}</Text>
                <Text style={styles.metaText}>Thời lượng: {formatDurationLabel(video.duration)}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionDanger]}
                onPress={() => handleDeleteVideo(video)}
              >
                <Text style={[styles.actionText, styles.actionDangerText]}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        })}

        {videos.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có video nào trong DB.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={closeCreateModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm video mới</Text>

            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Title"
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={styles.input}
              value={form.youtubeId}
              onChangeText={(v) => setForm((p) => ({ ...p, youtubeId: v }))}
              placeholder="YoutubeId"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.selectInput}
              onPress={openCategoryDropdown}
              activeOpacity={0.85}
            >
              <View ref={categoryTriggerRef} collapsable={false} style={styles.selectAnchor} />
              <Text style={styles.selectInputText}>{CATEGORY_LABEL_BY_VALUE[form.category] || form.category}</Text>
              <Text style={styles.selectInputArrow}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Thời lượng và thumbnail sẽ tự lấy từ YouTube khi tạo video.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={closeCreateModal}>
                <Text style={styles.modalSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, isSaving && styles.modalPrimaryBtnDisabled]}
                onPress={handleCreateVideo}
                disabled={isSaving}
              >
                <Text style={styles.modalPrimaryText}>{isSaving ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {showCategoryPicker && (
            <>
              <Pressable style={StyleSheet.absoluteFillObject} onPress={closeCategoryDropdown} />

              <Animated.View
                style={[
                  styles.dropdownPopover,
                  {
                    top: dropdownLayout.top,
                    left: dropdownLayout.left,
                    width: dropdownLayout.width,
                    maxHeight: dropdownLayout.maxHeight,
                    opacity: dropdownAnim,
                    transform: [
                      {
                        scale: dropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {CATEGORY_OPTIONS.length > 5 && (
                  <TextInput
                    style={styles.dropdownSearchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm category..."
                    placeholderTextColor="#94a3b8"
                  />
                )}

                <FlatList
                  data={filteredCategoryOptions}
                  keyExtractor={(item) => item.value}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces
                  decelerationRate="normal"
                  onScroll={(event) => {
                    const y = event.nativeEvent.contentOffset.y;
                    const contentHeight = event.nativeEvent.contentSize.height;
                    const viewportHeight = event.nativeEvent.layoutMeasurement.height;
                    setShowTopFade(y > 2);
                    setShowBottomFade(y + viewportHeight < contentHeight - 2);
                  }}
                  scrollEventThrottle={16}
                  renderItem={({ item }) => {
                    const selected = form.category === item.value;
                    return (
                      <TouchableOpacity
                        style={[styles.pickerOption, selected && styles.pickerOptionActive]}
                        onPress={() => {
                          setForm((p) => ({ ...p, category: item.value }));
                          closeCategoryDropdown();
                        }}
                      >
                        <View style={styles.pickerOptionLeft}>
                          <Text style={styles.pickerOptionIcon}>{CATEGORY_ICON_BY_VALUE[item.value] || item.icon || '•'}</Text>
                          <Text style={[styles.pickerOptionText, selected && styles.pickerOptionTextActive]}>
                            {item.label}
                          </Text>
                        </View>
                        {selected && <Text style={styles.pickerCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />

                {showTopFade && (
                  <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']}
                    style={[styles.fadeEdge, styles.fadeTop]}
                    pointerEvents="none"
                  />
                )}
                {showBottomFade && (
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)']}
                    style={[styles.fadeEdge, styles.fadeBottom]}
                    pointerEvents="none"
                  />
                )}
              </Animated.View>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>

    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textSecondary },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 14,
    borderRadius: 12,
  },
  heroTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  heroSubtitle: { marginTop: 6, color: COLORS.textSecondary },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 82, height: 56, borderRadius: 8, backgroundColor: '#e2e8f0' },
  thumbnailFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailFallbackText: {
    fontSize: 20,
  },
  info: { flex: 1, marginLeft: 10 },
  videoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  actionsRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionText: { color: COLORS.text, fontWeight: '600' },
  actionDanger: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  actionDangerText: { color: '#dc2626' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    marginBottom: 10,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectAnchor: {
    ...StyleSheet.absoluteFillObject,
  },
  selectInputText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  selectInputArrow: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalSecondaryText: { color: COLORS.text, fontWeight: '600' },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnDisabled: { opacity: 0.7 },
  modalPrimaryText: { color: '#fff', fontWeight: '700' },
  dropdownPopover: {
    position: 'absolute',
    zIndex: 30,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownSearchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  pickerOption: {
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerOptionActive: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerOptionIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  pickerOptionText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  pickerCheck: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  fadeEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
  },
  fadeTop: {
    top: 0,
  },
  fadeBottom: {
    bottom: 0,
  },
});

export default VideoManagementScreen;
