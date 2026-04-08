import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/constants';
import { Device, getParentDevices } from '../api/devices';
import { AccessRequest, approveRequest, getPendingRequests, rejectRequest } from '../api/requests';

type ActiveModal =
  | { type: 'approve'; request: AccessRequest }
  | { type: 'reject'; request: AccessRequest }
  | null;

const AccessRequestsStoryScreen = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actioningRequestId, setActioningRequestId] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [approvedMinutes, setApprovedMinutes] = useState('');
  const [parentNote, setParentNote] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const [requestsData, devicesData] = await Promise.all([getPendingRequests(), getParentDevices()]);
      setRequests(requestsData);
      setDevices(devicesData);
    } catch (error: any) {
      console.error('[AccessRequestsStoryScreen] Error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const getChildName = (request: AccessRequest) => {
    const matched = devices.find((device) => device.deviceId === request.deviceId);
    return request.device?.childName || matched?.childName || 'Bé';
  };

  const getDeviceName = (request: AccessRequest) => {
    const matched = devices.find((device) => device.deviceId === request.deviceId);
    return request.device?.deviceName || matched?.deviceName || 'thiết bị';
  };

  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'vừa gửi';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  };

  const getUrgency = (request: AccessRequest) => {
    const ageMinutes = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 60000);
    if (request.requestedMinutes >= 60 || ageMinutes >= 180) {
      return { label: 'Cần chú ý', style: styles.urgencyHigh };
    }
    return { label: 'Bình thường', style: styles.urgencyNormal };
  };

  const openApproveModal = (request: AccessRequest) => {
    setApprovedMinutes(String(request.requestedMinutes));
    setParentNote('');
    setActiveModal({ type: 'approve', request });
  };

  const openRejectModal = (request: AccessRequest) => {
    setApprovedMinutes('');
    setParentNote('');
    setActiveModal({ type: 'reject', request });
  };

  const closeModal = () => {
    setActiveModal(null);
    setApprovedMinutes('');
    setParentNote('');
  };

  const handleApproveConfirm = async () => {
    if (!activeModal || activeModal.type !== 'approve') return;

    const request = activeModal.request;
    const note = parentNote.trim() || undefined;
    const minutes = parseInt(approvedMinutes, 10);
    if (!approvedMinutes || Number.isNaN(minutes) || minutes <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số phút hợp lệ');
      return;
    }

    setActioningRequestId(request.requestId);
    closeModal();

    try {
      await approveRequest(request.requestId, minutes, note);
      Alert.alert('Đã phê duyệt', 'Yêu cầu của con đã được chấp nhận.');
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chấp nhận yêu cầu');
    } finally {
      setActioningRequestId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!activeModal || activeModal.type !== 'reject') return;

    const request = activeModal.request;
    const note = parentNote.trim() || 'Không được phép';
    setActioningRequestId(request.requestId);
    closeModal();

    try {
      await rejectRequest(request.requestId, note);
      Alert.alert('Đã từ chối', 'Yêu cầu đã được từ chối.');
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActioningRequestId(null);
    }
  };

  const headline = useMemo(() => {
    if (requests.length === 0) {
      return 'Không có yêu cầu nào cần xử lý lúc này.';
    }
    if (requests.length === 1) {
      return 'Có 1 yêu cầu đang chờ bạn phản hồi.';
    }
    return `Có ${requests.length} yêu cầu đang chờ bạn phản hồi.`;
  }, [requests.length]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Hộp thư phê duyệt</Text>
          <Text style={styles.heroSubtitle}>{headline}</Text>
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Mọi thứ đang yên tâm</Text>
            <Text style={styles.emptySubtitle}>Khi con cần thêm thời gian hoặc quyền truy cập, bạn sẽ thấy tại đây.</Text>
          </View>
        ) : (
          <View style={styles.requestList}>
            {requests.map((request) => {
              const urgency = getUrgency(request);
              return (
                <View key={request.requestId} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestIdentity}>
                      <Text style={styles.requestChild}>{getChildName(request)}</Text>
                      <Text style={styles.requestDevice}>Từ {getDeviceName(request)}</Text>
                    </View>
                    <View style={[styles.urgencyBadge, urgency.style]}>
                      <Text style={styles.urgencyText}>{urgency.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.requestTitle}>⏳ Xin thêm {request.requestedMinutes} phút sử dụng</Text>
                  <Text style={styles.requestMeta}>Lý do: {request.reason || 'Không có ghi chú'}</Text>
                  <Text style={styles.requestTime}>{formatTimeAgo(request.createdAt)}</Text>

                  {actioningRequestId === request.requestId ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.loadingActionText}>Đang xử lý yêu cầu...</Text>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.approveButton} onPress={() => openApproveModal(request)}>
                        <Text style={styles.approveButtonText}>✅ Phê duyệt</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton} onPress={() => openRejectModal(request)}>
                        <Text style={styles.rejectButtonText}>❌ Từ chối</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!activeModal} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activeModal?.type === 'approve' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {activeModal
                ? `${getChildName(activeModal.request)} đang xin thêm ${activeModal.request.requestedMinutes} phút.`
                : ''}
            </Text>

            {activeModal?.type === 'approve' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số phút cho phép</Text>
                <TextInput
                  style={styles.input}
                  value={approvedMinutes}
                  onChangeText={setApprovedMinutes}
                  keyboardType="numeric"
                  placeholder="Nhập số phút"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {activeModal?.type === 'approve' ? 'Lời nhắn cho con (tuỳ chọn)' : 'Lý do từ chối'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={parentNote}
                onChangeText={setParentNote}
                multiline
                numberOfLines={4}
                placeholder={
                  activeModal?.type === 'approve'
                    ? 'Ví dụ: Con nhớ nghỉ mắt sau khi dùng nhé.'
                    : 'Ví dụ: Hôm nay con đã dùng đủ thời gian rồi.'
                }
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={closeModal}>
                <Text style={styles.modalSecondaryText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={activeModal?.type === 'approve' ? handleApproveConfirm : handleRejectConfirm}
              >
                <Text style={styles.modalPrimaryText}>
                  {activeModal?.type === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const baseShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    padding: 22,
    ...baseShadow,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 40,
    ...baseShadow,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    ...baseShadow,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  requestList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    ...baseShadow,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  requestIdentity: {
    flex: 1,
  },
  requestChild: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  requestDevice: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  urgencyBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  urgencyHigh: {
    backgroundColor: '#FEE2E2',
  },
  urgencyNormal: {
    backgroundColor: '#DBEAFE',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  requestMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '800',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingActionText: {
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});

export default AccessRequestsStoryScreen;
