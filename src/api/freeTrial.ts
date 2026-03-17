// Shield Parent App - Free Trial API
import apiClient from './client';
import { handleApiError, logError } from './errorHandler';

export interface FreeTrialStatus {
  hasTrial: boolean;        // Đã từng đăng ký free trial hay chưa
  isActive: boolean;        // Đang trong thời gian dùng thử hay không
  startedAt?: string;       // Thời gian bắt đầu
  expiresAt?: string;       // Thời gian hết hạn
}

export interface FreeTrialRegisterResponse {
  success: boolean;
  message: string;
  trial?: {
    startedAt: string;
    expiresAt: string;
  };
}

// Backend response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Lấy trạng thái free trial của user hiện tại
 * GET /api/FreeTrial/status
 */
export const getFreeTrialStatus = async (): Promise<FreeTrialStatus> => {
  try {
    const response = await apiClient.get<ApiResponse<FreeTrialStatus>>('/FreeTrial/status');
    console.log('[FreeTrial] Status response:', response.data);
    
    // Unwrap the data field from backend response
    if (response.data.data) {
      console.log('[FreeTrial] Unwrapped status:', response.data.data);
      return response.data.data;
    }
    
    // Fallback if backend returns flat structure
    console.log('[FreeTrial] Using flat structure');
    return response.data as any;
  } catch (error) {
    logError(error, 'FreeTrial.getStatus');
    throw new Error(handleApiError(error));
  }
};

/**
 * Đăng ký free trial 7 ngày cho user hiện tại
 * POST /api/FreeTrial/register
 */
export const registerFreeTrial = async (): Promise<FreeTrialRegisterResponse> => {
  try {
    const response = await apiClient.post<FreeTrialRegisterResponse>('/FreeTrial/register');
    console.log('[FreeTrial] Register result:', response.data);
    return response.data;
  } catch (error) {
    logError(error, 'FreeTrial.register');
    throw new Error(handleApiError(error));
  }
};
