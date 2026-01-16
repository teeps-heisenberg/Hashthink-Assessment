import axios, { AxiosError } from 'axios';
import { config } from './config';
import { Session, UploadResponse, ListSessionsResponse, ApiError } from './types';

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
 * Handle API errors
 */
function handleError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const message = axiosError.response?.data?.message || axiosError.message;
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

export default api;
