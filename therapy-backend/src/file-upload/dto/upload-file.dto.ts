/**
 * Metadata extracted from uploaded file
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

/**
 * Response DTO for successful file upload
 */
export interface UploadSessionResponse {
  sessionId: string;
  status: string;
  message: string;
  file: FileMetadata;
}

/**
 * Error response for file upload failures
 */
export interface UploadErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    mimeType?: string;
    size?: number;
    extension?: string;
    maxSize?: number;
    allowedTypes?: string[];
  };
}

/**
 * Uploaded file with buffer (from Multer memory storage)
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
