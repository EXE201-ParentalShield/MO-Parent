// Shield Parent App - Requests API
import apiClient from './client';
import { handleApiError, logError } from './errorHandler';

export interface AccessRequest {
  requestId: number;
  deviceId: number;
  device: {
    childName: string;
    deviceName: string;
  };
  requestedMinutes: number;
  approvedMinutes?: number;
  reason?: string;
  status: string;
  parentNote?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface RequestsResponse {
  success: boolean;
  data: AccessRequest[];
}

export interface RequestResponse {
  success: boolean;
  data: AccessRequest;
}

export interface UpdateRequestResponse {
  success: boolean;
  message: string;
  data: AccessRequest;
}

export const getPendingRequests = async (): Promise<AccessRequest[]> => {
  try {
    const response = await apiClient.get<RequestsResponse>('/requests', {
      params: { status: 'Pending' },
    });
    return response.data.data;
  } catch (error) {
    logError(error, 'Requests.getPendingRequests');
    throw new Error(handleApiError(error));
  }
};

export const getAllRequests = async (deviceId?: number): Promise<AccessRequest[]> => {
  try {
    const params: any = {};
    if (deviceId) {
      params.deviceId = deviceId;
    }
    
    const response = await apiClient.get<RequestsResponse>('/requests', { params });
    return response.data.data;
  } catch (error) {
    logError(error, 'Requests.getAllRequests');
    throw new Error(handleApiError(error));
  }
};

export const getRequestById = async (requestId: number): Promise<AccessRequest> => {
  try {
    const response = await apiClient.get<RequestResponse>(`/requests/${requestId}`);
    return response.data.data;
  } catch (error) {
    logError(error, 'Requests.getRequestById');
    throw new Error(handleApiError(error));
  }
};

export const approveRequest = async (
  requestId: number,
  approvedMinutes: number,
  parentNote?: string
): Promise<UpdateRequestResponse> => {
  try {
    // Get the original request first to get all required fields
    const originalRequest = await getRequestById(requestId);
    
    const response = await apiClient.put<UpdateRequestResponse>(`/requests/${requestId}`, {
      deviceId: originalRequest.deviceId,
      requestedMinutes: originalRequest.requestedMinutes,
      approvedMinutes: approvedMinutes,
      reason: originalRequest.reason || '',
      status: 'Approved',
      parentNote: parentNote || '',
    });
    return response.data;
  } catch (error) {
    logError(error, 'Requests.approveRequest');
    throw new Error(handleApiError(error));
  }
};

export const rejectRequest = async (
  requestId: number,
  parentNote: string
): Promise<UpdateRequestResponse> => {
  try {
    // Get the original request first to get all required fields
    const originalRequest = await getRequestById(requestId);
    
    const response = await apiClient.put<UpdateRequestResponse>(`/requests/${requestId}`, {
      deviceId: originalRequest.deviceId,
      requestedMinutes: originalRequest.requestedMinutes,
      approvedMinutes: originalRequest.approvedMinutes || 0,
      reason: originalRequest.reason || '',
      status: 'Rejected',
      parentNote: parentNote,
    });
    return response.data;
  } catch (error) {
    logError(error, 'Requests.rejectRequest');
    throw new Error(handleApiError(error));
  }
};
