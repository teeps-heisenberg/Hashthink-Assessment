import axios, { AxiosError } from 'axios';
import { config } from './config';
import {
  Session,
  UploadResponse,
  ListSessionsResponse,
  SearchSessionsResponse,
  ApiError,
} from './types';

/**
 * Axios instance with base configuration
 */
const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Handle API errors and extract meaningful messages
 */
function handleError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    let message = axiosError.response?.data?.message || axiosError.message;
    
    if (axiosError.response?.status === 413) {
      message = 'File is too large. Maximum file size is 100MB.';
    } else if (axiosError.response?.status === 400) {
      message = message || 'Invalid request. Please check your file and try again.';
    } else if (axiosError.response?.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (axiosError.code === 'ECONNABORTED') {
      message = 'Request timeout. Please check your connection and try again.';
    } else if (axiosError.code === 'ERR_NETWORK') {
      message = 'Network error. Please check your connection and try again.';
    }
    
    throw new Error(message);
  }
  throw error;
}

/**
 * Upload an audio file to create a new session
 */
export async function uploadSession(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await api.post<UploadResponse>('/sessions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000,
    });

    return response.data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * Get list of all sessions
 */
export async function getSessions(
  limit: number = 50,
  offset: number = 0
): Promise<ListSessionsResponse> {
  try {
    const response = await api.get<ListSessionsResponse>('/sessions', {
      params: { limit, offset },
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * Get a single session by ID
 */
export async function getSession(id: string): Promise<Session> {
  try {
    const response = await api.get<Session>(`/sessions/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * Search sessions using semantic search
 */
export async function searchSessions(
  query: string,
  limit: number = 10,
  embeddingType: 'transcript' | 'summary' = 'summary',
): Promise<SearchSessionsResponse> {
  try {
    const response = await api.post<SearchSessionsResponse>('/sessions/search', {
      query,
      limit,
      embeddingType,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

export default api;
