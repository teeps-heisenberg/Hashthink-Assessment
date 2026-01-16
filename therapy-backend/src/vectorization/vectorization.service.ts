import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AppConfig } from '../config/config.interface';
import { DatabaseService } from '../database/database.service';
import { VectorizationResult, SessionVectorizationResult } from './dto/vectorization.dto';

@Injectable()
export class VectorizationService {
  private readonly logger = new Logger(VectorizationService.name);
  private readonly openai: OpenAI;
  private readonly embeddingModel: string;

  constructor(
    private configService: ConfigService<AppConfig>,
    private databaseService: DatabaseService,
  ) {
    const openaiConfig = this.configService.get('openai', { infer: true })!;
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
    });
    this.embeddingModel = openaiConfig.embeddingModel;
    this.logger.log(`VectorizationService initialized with model: ${this.embeddingModel}`);
  }

  /**
   * Generate embedding for a text
   */
  async vectorizeText(text: string): Promise<VectorizationResult> {
    this.logger.log(`Starting vectorization for text of ${text.length} chars`);

    // Truncate text if too long (OpenAI has token limits)
    const maxChars = 25000; // Safe limit for text-embedding-3-small
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: truncatedText,
      });

      const embedding = response.data[0].embedding;

      this.logger.log(
        `Vectorization completed: ${embedding.length} dimensions`,
      );

      return {
        embedding,
        dimensions: embedding.length,
        model: this.embeddingModel,
      };
    } catch (error) {
      this.logger.error(`Vectorization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Vectorize both transcript and summary for a session
   */
  async vectorizeSession(sessionId: string): Promise<SessionVectorizationResult> {
    this.logger.log(`Starting session vectorization for: ${sessionId}`);

    // Get session from database
    const session = await this.databaseService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result: SessionVectorizationResult = {
      sessionId,
    };

    // Vectorize transcript if available
    if (session.transcript) {
      try {
        const transcriptResult = await this.vectorizeText(session.transcript);
        result.transcriptEmbedding = transcriptResult;

        // Store transcript embedding
        await this.databaseService.storeEmbedding({
          session_id: sessionId,
          embedding: transcriptResult.embedding,
          embedding_type: 'transcript',
        });

        this.logger.log(`Transcript embedding stored for session: ${sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to vectorize transcript: ${error}`);
        throw error;
      }
    }

    // Vectorize summary if available
    if (session.summary) {
      try {
        const summaryResult = await this.vectorizeText(session.summary);
        result.summaryEmbedding = summaryResult;

        // Store summary embedding
        await this.databaseService.storeEmbedding({
          session_id: sessionId,
          embedding: summaryResult.embedding,
          embedding_type: 'summary',
        });

        this.logger.log(`Summary embedding stored for session: ${sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to vectorize summary: ${error}`);
        throw error;
      }
    }

    return result;
  }

  /**
   * Process a session: vectorize and update database
   */
  async processSession(sessionId: string): Promise<void> {
    this.logger.log(`Processing vectorization for session: ${sessionId}`);

    try {
      // Get session to verify it exists
      const session = await this.databaseService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (!session.transcript && !session.summary) {
        throw new Error(
          `No transcript or summary available for session: ${sessionId}`,
        );
      }

      // Update status to vectorizing (if not already)
      if (session.status !== 'vectorizing') {
        await this.databaseService.updateSessionStatus(sessionId, 'vectorizing');
      }

      // Perform vectorization
      await this.vectorizeSession(sessionId);

      // Update session status to completed
      await this.databaseService.updateSession(sessionId, {
        status: 'completed',
      });

      this.logger.log(`Vectorization processing completed for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Vectorization processing failed for session ${sessionId}: ${error}`,
      );

      // Update status to failed
      await this.databaseService.updateSessionStatus(sessionId, 'failed');
      throw error;
    }
  }

  /**
   * Generate embedding for a query (for semantic search)
   */
  async vectorizeQuery(query: string): Promise<number[]> {
    const result = await this.vectorizeText(query);
    return result.embedding;
  }
}
