import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SummarizationService } from './summarization.service';

@Module({
  imports: [DatabaseModule],
  providers: [SummarizationService],
  exports: [SummarizationService],
})
export class SummarizationModule {}
