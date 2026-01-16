/**
 * Session status types
 */
export type SessionStatus =
  | 'uploading'
  | 'transcribing'
  | 'summarizing'
  | 'vectorizing'
  | 'completed'
  | 'failed';

/**
 * Session data from API
 */
export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  transcript: string | null;
  summary: string | null;
  speakers: string[];
  isVectorized: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * File metadata from upload
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

/**
 * Upload response from API
 */
export interface UploadResponse {
  sessionId: string;
  status: string;
  message: string;
  file: FileMetadata;
}

/**
 * List sessions response
 */
export interface ListSessionsResponse {
  sessions: Session[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * API error response
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

/**
 * Check if status is a processing status
 */
export function isProcessingStatus(status: SessionStatus): boolean {
  return ['uploading', 'transcribing', 'summarizing', 'vectorizing'].includes(status);
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: SessionStatus): string {
  const labels: Record<SessionStatus, string> = {
    uploading: 'Uploading',
    transcribing: 'Transcribing',
    summarizing: 'Summarizing',
    vectorizing: 'Vectorizing',
    completed: 'Completed',
    failed: 'Failed',
  };
  return labels[status] || status;
}
