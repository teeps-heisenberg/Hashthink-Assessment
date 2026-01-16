import { ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { AppConfig } from '../../config/config.interface';
import { isAudioMimeType } from '../utils/file.util';

/**
 * Create Multer configuration factory
 */
export const multerConfigFactory = (configService: ConfigService<AppConfig>) => {
  const fileUploadConfig = configService.get('fileUpload', { infer: true })!;

  return {
    storage: memoryStorage(),
    limits: {
      fileSize: fileUploadConfig.maxFileSize,
      files: 1, // Single file upload only
    },
    fileFilter: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      // Check if file is present
      if (!file) {
        callback(new Error('No file provided'), false);
        return;
      }

      // Check MIME type is audio
      if (!isAudioMimeType(file.mimetype)) {
        callback(
          new Error(
            `Invalid file type: ${file.mimetype}. Only audio files are allowed.`,
          ),
          false,
        );
        return;
      }

      // Check against allowed MIME types
      if (!fileUploadConfig.allowedMimeTypes.includes(file.mimetype)) {
        callback(
          new Error(
            `File type not allowed: ${file.mimetype}. Allowed types: ${fileUploadConfig.allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
        return;
      }

      // File is valid
      callback(null, true);
    },
  };
};

/**
 * Get allowed file extensions from config
 */
export const getAllowedExtensions = (
  configService: ConfigService<AppConfig>,
): string[] => {
  const allowedMimeTypes =
    configService.get('fileUpload', { infer: true })?.allowedMimeTypes || [];

  const mimeToExt: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/m4a': 'm4a',
    'audio/webm': 'webm',
  };

  return allowedMimeTypes
    .map((mime) => mimeToExt[mime])
    .filter(Boolean) as string[];
};
