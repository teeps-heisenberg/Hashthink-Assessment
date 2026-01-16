import * as path from 'path';

/**
 * Allowed audio file extensions
 */
export const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.webm',
  '.mpeg',
  '.ogg',
  '.flac',
];

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Check if file extension is an allowed audio type
 */
export function isAllowedAudioExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_AUDIO_EXTENSIONS.includes(ext);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal characters
  let sanitized = filename.replace(/\.\./g, '');
  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, '');
  // Replace spaces with underscores
  sanitized = sanitized.replace(/\s+/g, '_');
  // Remove special characters except dots, underscores, and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
  return sanitized;
}

/**
 * Generate a unique filename for storage
 */
export function generateUniqueFilename(
  sessionId: string,
  originalFilename: string,
): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  return `${sessionId}-${timestamp}${ext}`;
}

/**
 * Map MIME type to file extension
 */
export function mimeTypeToExtension(mimeType: string): string | null {
  const mimeToExt: Record<string, string> = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/wave': '.wav',
    'audio/x-wav': '.wav',
    'audio/m4a': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/mp4': '.m4a',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/flac': '.flac',
  };

  return mimeToExt[mimeType] || null;
}

/**
 * Check if MIME type is an audio type
 */
export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}
