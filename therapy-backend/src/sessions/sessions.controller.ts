import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.interface';
import { SessionsService } from './sessions.service';
import { ListSessionsDto } from './dto/list-sessions.dto';
import { SearchSessionsDto } from './dto/search-sessions.dto';
import {
  UploadSessionResponse,
  SessionResponse,
  ListSessionsResponse,
  SearchSessionsResponse,
} from './dto/session-response.dto';
import { isAudioMimeType } from '../file-upload/utils/file.util';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(
    private sessionsService: SessionsService,
    private configService: ConfigService<AppConfig>,
  ) {}

  /**
   * Upload audio file and start processing
   * POST /api/sessions/upload
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: {
        fileSize: 104857600, // 100MB default, will be validated in service
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        if (!file) {
          callback(new BadRequestException('No file provided'), false);
          return;
        }

        if (!isAudioMimeType(file.mimetype)) {
          callback(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Only audio files are allowed.`,
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadSessionResponse> {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    this.logger.log(
      `Received upload request: ${file.originalname} (${file.size} bytes)`,
    );

    try {
      const response = await this.sessionsService.uploadSession(file);
      this.logger.log(`Upload successful, session ID: ${response.sessionId}`);
      return response;
    } catch (error) {
      this.logger.error(`Upload failed: ${error}`);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Upload failed',
      );
    }
  }

  /**
   * List all sessions with pagination
   * GET /api/sessions
   */
  @Get()
  async listSessions(
    @Query() query: ListSessionsDto,
  ): Promise<ListSessionsResponse> {
    const { limit = 20, offset = 0 } = query;
    this.logger.log(`Listing sessions: limit=${limit}, offset=${offset}`);

    return this.sessionsService.listSessions(limit, offset);
  }

  /**
   * Get session details by ID
   * GET /api/sessions/:id
   */
  @Get(':id')
  async getSession(@Param('id') id: string): Promise<SessionResponse> {
    this.logger.log(`Getting session: ${id}`);
    return this.sessionsService.getSession(id);
  }

  /**
   * Search sessions using semantic search
   * POST /api/sessions/search
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  async searchSessions(
    @Body() dto: SearchSessionsDto,
  ): Promise<SearchSessionsResponse> {
    this.logger.log(
      `Received search request: query="${dto.query}", limit=${dto.limit}, embeddingType=${dto.embeddingType}`,
    );

    try {
      const response = await this.sessionsService.searchSessions(dto);
      this.logger.log(
        `Search successful: ${response.total} results found for query "${dto.query}"`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Search failed: ${error}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Search failed',
      );
    }
  }
}
