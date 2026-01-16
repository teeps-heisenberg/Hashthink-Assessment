import { Injectable, Logger } from '@nestjs/common';
import { FileMetadata, UploadedFile } from './dto/upload-file.dto';
import {
  generateUniqueFilename,
  sanitizeFilename,
  getFileExtension,
} from './utils/file.util';

/**
 * Stored file information (in-memory reference)
 */
export interface StoredFile {
  sessionId: string;
  metadata: FileMetadata;
  buffer: Buffer;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  // In-memory store for files being processed
  // Key: sessionId, Value: StoredFile
  private readonly fileStore = new Map<string, StoredFile>();

  /**
   * Store a file in memory for processing
   * Returns metadata about the stored file
   */
  storeFile(
    sessionId: string,
    file: UploadedFile | Express.Multer.File,
  ): FileMetadata {
    const sanitizedName = sanitizeFilename(file.originalname);
    const uniqueFilename = generateUniqueFilename(sessionId, sanitizedName);

    const metadata: FileMetadata = {
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    // Store file in memory
    this.fileStore.set(sessionId, {
      sessionId,
      metadata,
      buffer: file.buffer,
    });

    this.logger.log(
      `File stored for session ${sessionId}: ${uniqueFilename} (${file.size} bytes)`,
    );

    return metadata;
  }

  /**
   * Get a stored file by session ID
   */
  getFile(sessionId: string): StoredFile | null {
    const storedFile = this.fileStore.get(sessionId);

    if (!storedFile) {
      this.logger.warn(`File not found for session: ${sessionId}`);
      return null;
    }

    return storedFile;
  }

  /**
   * Get file buffer by session ID
   */
  getFileBuffer(sessionId: string): Buffer | null {
    const storedFile = this.getFile(sessionId);
    return storedFile?.buffer || null;
  }

  /**
   * Get file metadata by session ID
   */
  getFileMetadata(sessionId: string): FileMetadata | null {
    const storedFile = this.getFile(sessionId);
    return storedFile?.metadata || null;
  }

  /**
   * Remove a file from storage (cleanup after processing)
   */
  removeFile(sessionId: string): boolean {
    if (this.fileStore.has(sessionId)) {
      this.fileStore.delete(sessionId);
      this.logger.log(`File removed for session: ${sessionId}`);
      return true;
    }

    this.logger.warn(`Cannot remove file - session not found: ${sessionId}`);
    return false;
  }

  /**
   * Check if a file exists in storage
   */
  hasFile(sessionId: string): boolean {
    return this.fileStore.has(sessionId);
  }

  /**
   * Get count of files in storage
   */
  getFileCount(): number {
    return this.fileStore.size;
  }

  /**
   * Clear all files from storage (for cleanup/testing)
   */
  clearAll(): void {
    const count = this.fileStore.size;
    this.fileStore.clear();
    this.logger.log(`Cleared all files from storage (${count} files)`);
  }

  /**
   * Get all session IDs with stored files
   */
  getAllSessionIds(): string[] {
    return Array.from(this.fileStore.keys());
  }

  /**
   * Create a File object for OpenAI API from stored buffer
   * OpenAI API expects a File-like object or Blob
   */
  createFileForApi(sessionId: string): File | null {
    const storedFile = this.getFile(sessionId);

    if (!storedFile) {
      return null;
    }

    const { buffer, metadata } = storedFile;

    // Copy buffer data to a fresh ArrayBuffer to ensure type compatibility
    // This avoids TypeScript issues with ArrayBufferLike vs ArrayBuffer
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(buffer);

    // Create a Blob from the Uint8Array
    const blob = new Blob([uint8Array], { type: metadata.mimeType });

    // Create a File from the Blob
    const file = new File([blob], metadata.filename, {
      type: metadata.mimeType,
    });

    return file;
  }

  /**
   * Get file extension from stored file
   */
  getFileExtension(sessionId: string): string | null {
    const metadata = this.getFileMetadata(sessionId);

    if (!metadata) {
      return null;
    }

    return getFileExtension(metadata.filename);
  }
}
