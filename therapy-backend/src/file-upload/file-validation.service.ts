import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.interface';
import { FileValidationResult, UploadedFile } from './dto/upload-file.dto';
import {
  isAllowedAudioExtension,
  getFileExtension,
  formatFileSize,
  isAudioMimeType,
} from './utils/file.util';

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService<AppConfig>) {
    const fileUploadConfig = this.configService.get('fileUpload', {
      infer: true,
    })!;
    this.maxFileSize = fileUploadConfig.maxFileSize;
    this.allowedMimeTypes = fileUploadConfig.allowedMimeTypes;
  }

  /**
   * Validate an uploaded file
   */
  validateFile(file: UploadedFile | Express.Multer.File): FileValidationResult {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided',
      };
    }

    // Check file size
    const sizeResult = this.validateFileSize(file.size);
    if (!sizeResult.isValid) {
      return sizeResult;
    }

    // Check MIME type
    const mimeResult = this.validateMimeType(file.mimetype);
    if (!mimeResult.isValid) {
      return mimeResult;
    }

    // Check file extension
    const extResult = this.validateFileExtension(file.originalname);
    if (!extResult.isValid) {
      return extResult;
    }

    // All validations passed
    this.logger.log(
      `File validated successfully: ${file.originalname} (${formatFileSize(file.size)})`,
    );

    return {
      isValid: true,
      details: {
        mimeType: file.mimetype,
        size: file.size,
        extension: getFileExtension(file.originalname),
      },
    };
  }

  /**
   * Validate file size against max limit
   */
  validateFileSize(size: number): FileValidationResult {
    if (size > this.maxFileSize) {
      const formattedSize = formatFileSize(size);
      const formattedMax = formatFileSize(this.maxFileSize);

      this.logger.warn(
        `File size exceeds limit: ${formattedSize} > ${formattedMax}`,
      );

      return {
        isValid: false,
        error: `File size (${formattedSize}) exceeds maximum allowed size (${formattedMax})`,
        details: {
          size,
          maxSize: this.maxFileSize,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate MIME type against allowed types
   */
  validateMimeType(mimeType: string): FileValidationResult {
    // Check if it's an audio MIME type
    if (!isAudioMimeType(mimeType)) {
      this.logger.warn(`Invalid MIME type (not audio): ${mimeType}`);

      return {
        isValid: false,
        error: `Invalid file type: ${mimeType}. Only audio files are allowed.`,
        details: {
          mimeType,
          allowedTypes: this.allowedMimeTypes,
        },
      };
    }

    // Check against allowed MIME types
    if (!this.allowedMimeTypes.includes(mimeType)) {
      this.logger.warn(`MIME type not in allowed list: ${mimeType}`);

      return {
        isValid: false,
        error: `File type not allowed: ${mimeType}. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
        details: {
          mimeType,
          allowedTypes: this.allowedMimeTypes,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file extension
   */
  validateFileExtension(filename: string): FileValidationResult {
    if (!isAllowedAudioExtension(filename)) {
      const ext = getFileExtension(filename);

      this.logger.warn(`Invalid file extension: ${ext}`);

      return {
        isValid: false,
        error: `Invalid file extension: ${ext}. Only audio files are allowed.`,
        details: {
          extension: ext,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Get configuration values (for error messages)
   */
  getConfig() {
    return {
      maxFileSize: this.maxFileSize,
      maxFileSizeFormatted: formatFileSize(this.maxFileSize),
      allowedMimeTypes: this.allowedMimeTypes,
    };
  }
}
