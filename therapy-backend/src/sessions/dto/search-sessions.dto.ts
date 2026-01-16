import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request DTO for semantic search
 */
export class SearchSessionsDto {
  @IsString()
  @MinLength(3, { message: 'Query must be at least 3 characters long' })
  @MaxLength(500, { message: 'Query must not exceed 500 characters' })
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['transcript', 'summary'], {
    message: 'embeddingType must be either "transcript" or "summary"',
  })
  embeddingType?: 'transcript' | 'summary' = 'summary';
}
