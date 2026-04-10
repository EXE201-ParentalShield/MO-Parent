import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';  
import { COLORS } from '../utils/constants';
import { 
  getPendingRequests, 
  approveRequest, 
  rejectRequest,
  AccessRequest 
} from '../api/requests';
import { getParentDevices, Device } from '../api/devices';

const AccessRequestsScreen = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actioningRequestId, setActioningRequestId] = useState<number | null>(null);
  
  // Approve modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [approvedMinutes, setApprovedMinutes] = useState('');
  const [parentNote, setParentNote] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const [requestsData, devicesData] = await Promise.all([
        getPendingRequests(),
        getParentDevices()
      ]);
      setRequests(requestsData);
      setDevices(devicesData);
    } catch (error: any) {
      console.error('[AccessRequestsScreen] Error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Helper to get child name from deviceId
  const getChildName = (deviceId: number): string => {
    const device = devices.find(d => d.deviceId === deviceId);
    return device?.childName || 'Unknown Child';
  };

  // Helper to get device name from deviceId
  const getDeviceName = (deviceId: number): string => {
    const device = devices.find(d => d.deviceId === deviceId);
    return device?.deviceName || 'Unknown Device';
  };

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

  const handleApprovePress = (request: AccessRequest) => {
    setSelectedRequest(request);
    setApprovedMinutes(request.requestedMinutes.toString());
    setParentNote('');
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;
    
    const minutes = parseInt(approvedMinutes);
    if (!approvedMinutes || isNaN(minutes) || minutes <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số phút hợp lệ');
      return;
    }

    setActioningRequestId(selectedRequest.requestId);
    setShowApproveModal(false);
    
    try {
      await approveRequest(selectedRequest.requestId, minutes, parentNote.trim() || undefined);
      Alert.alert('Thành công', 'Đã chấp nhận yêu cầu');
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chấp nhận yêu cầu');
    } finally {
      setActioningRequestId(null);
      setSelectedRequest(null);
      setApprovedMinutes('');
      setParentNote('');
    }
  };

  const handleReject = async (request: AccessRequest) => {
    Alert.prompt(
      'Từ chối yêu cầu',
      'Nhập lý do từ chối (tùy chọn):',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async (reason?: string) => {
            setActioningRequestId(request.requestId);
            try {
              await rejectRequest(request.requestId, reason || 'Không được phép');
              Alert.alert('Đã từ chối', 'Yêu cầu đã bị từ chối');
              await fetchRequests();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể từ chối yêu cầu');
            } finally {
              setActioningRequestId(null);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Yêu cầu chờ duyệt</Text>
          <Text style={styles.subtitle}>{requests.length} yêu cầu mới</Text>

          {isLoading && !isRefreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
              <Text style={styles.emptySubtext}>Tất cả yêu cầu đã được xử lý</Text>
            </View>
          ) : (
            requests.map((request) => (
              <View key={request.requestId} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.childName}>
                    {getChildName(request.deviceId)}
                  </Text>
                  <Text style={styles.time}>{formatTime(request.createdAt)}</Text>
                </View>
                
                <Text style={styles.appName}>⏱️ {request.requestedMinutes} phút</Text>
                <Text style={styles.reason}>"{request.reason}"</Text>

                <View style={styles.actions}>
                  {actioningRequestId === request.requestId ? (
                    <View style={styles.loadingActions}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.loadingActionText}>Đang xử lý...</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={styles.approveButton}
                        onPress={() => handleApprovePress(request)}
                      >
                        <Text style={styles.approveButtonText}>✓ Chấp nhận</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.denyButton}
                        onPress={() => handleReject(request)}
                      >
                        <Text style={styles.denyButtonText}>✗ Từ chối</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chấp nhận yêu cầu</Text>
            <Text style={styles.modalSubtitle}>
              Yêu cầu: {selectedRequest?.requestedMinutes} phút
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Số phút cho phép:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập số phút"
                value={approvedMinutes}
                onChangeText={setApprovedMinutes}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Ghi chú (tùy chọn):</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Ghi chú cho con..."
                value={parentNote}
                onChangeText={setParentNote}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowApproveModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleApproveConfirm}
              >
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadingActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  loadingActionText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AccessRequestsScreen;
