import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { SummarizationModule } from './summarization/summarization.module';
import { VectorizationModule } from './vectorization/vectorization.module';
import { SessionsModule } from './sessions/sessions.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),
    DatabaseModule,
    FileUploadModule,
    TranscriptionModule,
    SummarizationModule,
    VectorizationModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
