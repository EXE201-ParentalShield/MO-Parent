import apiClient from './client';
import { handleApiError, logError } from './errorHandler';
import { API_BASE_URL } from '../config/api';

export interface ManagedVideo {
  videoId: number;
  title: string;
  youtubeId: string;
  duration: number;
  thumbnail: string;
  category: string;
}

export interface VideoUpsertPayload {
  title: string;
  youtubeId: string;
  duration: number;
  thumbnail: string;
  category: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const clean = (value: unknown): string => String(value ?? '').trim();

const isHttp = (value: string): boolean => /^https?:\/\//i.test(value);

const normalizeYoutubeId = (input: string): string => {
  const raw = clean(input);
  if (!raw) return '';

  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/vi\/([A-Za-z0-9_-]{11})\//,
  ];

  for (const p of patterns) {
    const m = raw.match(p);
    if (m && m[1]) return m[1];
  }

  return '';
};

const resolveMediaUrl = (rawUrl: string): string => {
  const value = clean(rawUrl);
  if (!value) return '';
  if (/^\/\//.test(value)) return `https:${value}`;
  if (isHttp(value)) return value;
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};

const resolveThumbnail = (video: ManagedVideo): string => {
  const fromApi = resolveMediaUrl(video.thumbnail);
  if (fromApi) return fromApi;

  const id = normalizeYoutubeId(video.youtubeId);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return '';
};

export const getManagedVideos = async (): Promise<ManagedVideo[]> => {
  try {
    const res = await apiClient.get<ManagedVideo[]>('/Videos');
    const list = Array.isArray(res.data) ? res.data : [];

    return list.map((video) => ({
      ...video,
      youtubeId: normalizeYoutubeId(video.youtubeId) || video.youtubeId,
      thumbnail: resolveThumbnail(video),
    }));
  } catch (error) {
    logError(error, 'Videos.getManagedVideos');
    throw new Error(handleApiError(error));
  }
};

export const createManagedVideo = async (payload: VideoUpsertPayload): Promise<ManagedVideo> => {
  try {
    const res = await apiClient.post<ApiResponse<ManagedVideo>>('/Videos', payload);
    if (!res.data?.data) {
      throw new Error('Không thể tạo video');
    }

    return res.data.data;
  } catch (error) {
    logError(error, 'Videos.createManagedVideo');
    throw new Error(handleApiError(error));
  }
};

export const updateManagedVideo = async (
  videoId: number,
  payload: VideoUpsertPayload
): Promise<ManagedVideo> => {
  try {
    const res = await apiClient.put<ApiResponse<ManagedVideo>>(`/Videos/${videoId}`, payload);
    if (!res.data?.data) {
      throw new Error('Không thể cập nhật video');
    }

    return res.data.data;
  } catch (error) {
    logError(error, 'Videos.updateManagedVideo');
    throw new Error(handleApiError(error));
  }
};

export const deleteManagedVideo = async (videoId: number): Promise<void> => {
  try {
    await apiClient.delete(`/Videos/${videoId}`);
  } catch (error) {
    logError(error, 'Videos.deleteManagedVideo');
    throw new Error(handleApiError(error));
  }
};
