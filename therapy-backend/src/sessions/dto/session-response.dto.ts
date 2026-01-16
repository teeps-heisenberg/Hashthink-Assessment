import { FileMetadata } from '../../file-upload/dto/upload-file.dto';

/**
 * Response DTO for upload endpoint
 */
export interface UploadSessionResponse {
  sessionId: string;
  status: string;
  message: string;
  file: FileMetadata;
}

/**
 * Response DTO for session details
 */
export interface SessionResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  transcript: string | null;
  summary: string | null;
  speakers: string[];
  isVectorized: boolean;
  metadata?: Record<string, any>;
}

/**
 * Response DTO for session list
 */
export interface ListSessionsResponse {
  sessions: SessionResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Error response DTO
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
