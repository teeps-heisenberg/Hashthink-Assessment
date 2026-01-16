import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileStorageService } from '../file-upload/file-storage.service';
import { FileValidationService } from '../file-upload/file-validation.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { SummarizationService } from '../summarization/summarization.service';
import { VectorizationService } from '../vectorization/vectorization.service';
import {
  UploadSessionResponse,
  SessionResponse,
  ListSessionsResponse,
} from './dto/session-response.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private databaseService: DatabaseService,
    private fileStorageService: FileStorageService,
    private fileValidationService: FileValidationService,
    private transcriptionService: TranscriptionService,
    private summarizationService: SummarizationService,
    private vectorizationService: VectorizationService,
  ) {}

  /**
   * Upload a new session and start processing
   */
  async uploadSession(file: Express.Multer.File): Promise<UploadSessionResponse> {
    this.logger.log(`Starting session upload: ${file.originalname}`);

    // Validate file
    const validationResult = this.fileValidationService.validateFile(file);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    // Create session in database
    const session = await this.databaseService.createSession({
      status: 'uploading',
      metadata: {
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    this.logger.log(`Session created: ${session.id}`);

    // Store file in memory
    const fileMetadata = this.fileStorageService.storeFile(session.id, file);

    // Start async processing (don't await)
    this.processSessionAsync(session.id);

    return {
      sessionId: session.id,
      status: session.status,
      message: 'Session created and processing started',
      file: fileMetadata,
    };
  }

  /**
   * Process session asynchronously (background)
   */
  private processSessionAsync(sessionId: string): void {
    // Run processing in background
    this.processSession(sessionId).catch((error) => {
      this.logger.error(
        `Background processing failed for session ${sessionId}: ${error.message}`,
      );
    });
  }

  /**
   * Process session through the entire pipeline
   */
  async processSession(sessionId: string): Promise<void> {
    this.logger.log(`Starting processing pipeline for session: ${sessionId}`);

    try {
      // Step 1: Transcription
      this.logger.log(`[${sessionId}] Step 1/3: Transcription`);
      await this.transcriptionService.processSession(sessionId);

      // Step 2: Summarization
      this.logger.log(`[${sessionId}] Step 2/3: Summarization`);
      await this.summarizationService.processSession(sessionId);

      // Step 3: Vectorization
      this.logger.log(`[${sessionId}] Step 3/3: Vectorization`);
      await this.vectorizationService.processSession(sessionId);

      this.logger.log(`Processing completed for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Processing failed for session ${sessionId}: ${error}`,
      );
      // Status is already updated to 'failed' by individual services
    } finally {
      // Always clean up the file from memory
      this.fileStorageService.removeFile(sessionId);
      this.logger.log(`File cleaned up for session: ${sessionId}`);
    }
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<SessionResponse> {
    const session = await this.databaseService.getSession(id);

    if (!session) {
      throw new NotFoundException(`Session not found: ${id}`);
    }

    // Check if session has embeddings
    const embeddings = await this.databaseService.getSessionEmbeddings(id);
    const isVectorized = embeddings.length > 0;

    return this.mapToResponse(session, isVectorized);
  }

  /**
   * List sessions with pagination
   */
  async listSessions(
    limit: number = 20,
    offset: number = 0,
  ): Promise<ListSessionsResponse> {
    const sessions = await this.databaseService.listSessions(limit, offset);

    // Get vectorization status for each session
    const sessionsWithStatus = await Promise.all(
      sessions.map(async (session) => {
        const embeddings = await this.databaseService.getSessionEmbeddings(
          session.id,
        );
        return this.mapToResponse(session, embeddings.length > 0);
      }),
    );

    return {
      sessions: sessionsWithStatus,
      total: sessionsWithStatus.length,
      limit,
      offset,
    };
  }

  /**
   * Map database session to response DTO
   */
  private mapToResponse(
    session: any,
    isVectorized: boolean,
  ): SessionResponse {
    return {
      id: session.id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      status: session.status,
      transcript: session.transcript,
      summary: session.summary,
      speakers: session.speakers || [],
      isVectorized,
      metadata: session.metadata,
    };
  }
}
