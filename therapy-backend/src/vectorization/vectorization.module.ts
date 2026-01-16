import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { VectorizationService } from './vectorization.service';

@Module({
  imports: [DatabaseModule],
  providers: [VectorizationService],
  exports: [VectorizationService],
})
export class VectorizationModule {}
