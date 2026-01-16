import { Module } from '@nestjs/common';
import { FileValidationService } from './file-validation.service';
import { FileStorageService } from './file-storage.service';
import { FileValidationInterceptor } from './interceptors/file-validation.interceptor';

@Module({
  providers: [
    FileValidationService,
    FileStorageService,
    FileValidationInterceptor,
  ],
  exports: [
    FileValidationService,
    FileStorageService,
    FileValidationInterceptor,
  ],
})
export class FileUploadModule {}
