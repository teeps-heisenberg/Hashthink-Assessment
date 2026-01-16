import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [DatabaseModule, FileUploadModule],
  providers: [TranscriptionService],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
