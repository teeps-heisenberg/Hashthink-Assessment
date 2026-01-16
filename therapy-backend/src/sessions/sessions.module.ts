import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { TranscriptionModule } from '../transcription/transcription.module';
import { SummarizationModule } from '../summarization/summarization.module';
import { VectorizationModule } from '../vectorization/vectorization.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    DatabaseModule,
    FileUploadModule,
    TranscriptionModule,
    SummarizationModule,
    VectorizationModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
