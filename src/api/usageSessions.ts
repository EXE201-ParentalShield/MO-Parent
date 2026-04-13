// Shield Parent App - Usage Sessions API
import apiClient from './client';
import { handleApiError, logError } from './errorHandler';

export interface UsageSession {
  usageSessionId: number;
  requestId: number;
  deviceId: number;
  device?: {
    childName: string;
    deviceName: string;
  };
  startTime: string;
  endTime: string;
  allowedMinutes: number;
  remainingMinutes: number;
  status: string;
}

export interface UsageSessionsResponse {
  success: boolean;
  data: UsageSession[];
}

export const getUsageSessions = async (
  deviceId: number,
  fromDate?: string,
  toDate?: string
): Promise<UsageSession[]> => {
  try {
    const params: any = {
      deviceId,
    };

    if (fromDate) {
      params.fromStart = new Date(fromDate).toISOString();
    }
    if (toDate) {
      params.toEnd = new Date(toDate).toISOString();
    }

    const response = await apiClient.get<UsageSessionsResponse>('/usagesessions', { params });
    return response.data.data;
  } catch (error) {
    logError(error, 'UsageSessions.getUsageSessions');
    throw new Error(handleApiError(error));
  }
};

export const calculateTotalUsage = (sessions: UsageSession[]): number => {
  return sessions.reduce((total, session) => {
    const used = session.allowedMinutes - session.remainingMinutes;
    return total + used;
  }, 0);
};

export const getUsageByDate = (sessions: UsageSession[]): Record<string, number> => {
  return sessions.reduce((acc, session) => {
    const date = new Date(session.startTime).toLocaleDateString();
    const used = session.allowedMinutes - session.remainingMinutes;
    acc[date] = (acc[date] || 0) + used;
    return acc;
  }, {} as Record<string, number>);
};
