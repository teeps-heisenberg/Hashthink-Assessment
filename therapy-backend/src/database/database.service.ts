import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../config/config.interface';
import {
  Session,
  CreateSessionDto,
  UpdateSessionDto,
  SessionStatus,
} from './entities/session.entity';
import {
  SessionEmbedding,
  CreateSessionEmbeddingDto,
} from './entities/session-embedding.entity';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService<AppConfig>) {}

  onModuleInit() {
    const dbConfig = this.configService.get('database', { infer: true })!;
    this.supabase = createClient(dbConfig.url, dbConfig.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.logger.log('Supabase client initialized');
  }

  /**
   * Create a new session
   */
  async createSession(dto: CreateSessionDto): Promise<Session> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        status: dto.status || 'uploading',
        metadata: dto.metadata || {},
        speakers: [],
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return this.mapSession(data);
  }

  /**
   * Get a session by ID
   */
  async getSession(id: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      this.logger.error(`Failed to get session: ${error.message}`);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data ? this.mapSession(data) : null;
  }

  /**
   * Update a session
   */
  async updateSession(id: string, dto: UpdateSessionDto): Promise<Session> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.transcript !== undefined) updateData.transcript = dto.transcript;
    if (dto.summary !== undefined) updateData.summary = dto.summary;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.speakers !== undefined) updateData.speakers = dto.speakers;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    const { data, error } = await this.supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update session: ${error.message}`);
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return this.mapSession(data);
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    id: string,
    status: SessionStatus,
  ): Promise<Session> {
    return this.updateSession(id, { status });
  }

  /**
   * List all sessions with pagination
   */
  async listSessions(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Failed to list sessions: ${error.message}`);
      throw new Error(`Failed to list sessions: ${error.message}`);
    }

    return data.map((item) => this.mapSession(item));
  }

  /**
   * Store session embedding
   */
  async storeEmbedding(
    dto: CreateSessionEmbeddingDto,
  ): Promise<SessionEmbedding> {
    // Validate embedding dimension (1536 for text-embedding-3-small)
    if (dto.embedding.length !== 1536) {
      throw new Error(
        `Invalid embedding dimension: expected 1536, got ${dto.embedding.length}`,
      );
    }

    // Try using RPC function first (if available)
    try {
      const { data, error } = await this.supabase.rpc('store_session_embedding', {
        p_session_id: dto.session_id,
        p_embedding: dto.embedding,
        p_embedding_type: dto.embedding_type,
      });

      if (!error && data) {
        // Fetch the created embedding
        const { data: embeddingData, error: fetchError } = await this.supabase
          .from('session_embeddings')
          .select('*')
          .eq('id', data)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        return {
          id: embeddingData.id,
          session_id: embeddingData.session_id,
          embedding: this.parseVector(embeddingData.embedding),
          embedding_type: embeddingData.embedding_type,
          created_at: embeddingData.created_at,
        };
      }
    } catch (rpcError) {
      this.logger.warn(
        `RPC function not available, using direct insert: ${rpcError}`,
      );
    }

    // Fallback: Direct insert with vector string format
    // PostgreSQL vector type accepts string format: '[1,2,3]'
    const vectorString = `[${dto.embedding.join(',')}]`;

    const { data, error } = await this.supabase
      .from('session_embeddings')
      .insert({
        session_id: dto.session_id,
        embedding: vectorString,
        embedding_type: dto.embedding_type,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to store embedding: ${error.message}`);
      throw new Error(`Failed to store embedding: ${error.message}`);
    }

    // Convert vector back to array for return
    return {
      id: data.id,
      session_id: data.session_id,
      embedding: this.parseVector(data.embedding),
      embedding_type: data.embedding_type,
      created_at: data.created_at,
    };
  }

  /**
   * Get embeddings for a session
   */
  async getSessionEmbeddings(
    sessionId: string,
  ): Promise<SessionEmbedding[]> {
    const { data, error } = await this.supabase
      .from('session_embeddings')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      this.logger.error(`Failed to get embeddings: ${error.message}`);
      throw new Error(`Failed to get embeddings: ${error.message}`);
    }

    return data.map((item) => ({
      id: item.id,
      session_id: item.session_id,
      embedding: this.parseVector(item.embedding),
      embedding_type: item.embedding_type,
      created_at: item.created_at,
    }));
  }

  /**
   * Semantic search across session embeddings
   * Returns sessions ordered by similarity to query embedding
   */
  async semanticSearch(
    queryEmbedding: number[],
    limit: number = 10,
    embeddingType: 'transcript' | 'summary' = 'summary',
  ): Promise<Array<{ session: Session; similarity: number }>> {
    if (queryEmbedding.length !== 1536) {
      throw new Error(
        `Invalid embedding dimension: expected 1536, got ${queryEmbedding.length}`,
      );
    }

    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Use pgvector cosine similarity search
    const { data, error } = await this.supabase.rpc('match_session_embeddings', {
      query_embedding: vectorString,
      match_threshold: 0.5,
      match_count: limit,
      embedding_type: embeddingType,
    });

    if (error) {
      // If function doesn't exist, fall back to manual query
      this.logger.warn(
        `Semantic search function not found, using fallback: ${error.message}`,
      );
      return this.fallbackSemanticSearch(
        queryEmbedding,
        limit,
        embeddingType,
      );
    }

    // Fetch sessions for matched embeddings
    const sessionIds = data.map((item: any) => item.session_id);
    if (sessionIds.length === 0) {
      return [];
    }

    const { data: sessions, error: sessionsError } = await this.supabase
      .from('sessions')
      .select('*')
      .in('id', sessionIds);

    if (sessionsError) {
      this.logger.error(
        `Failed to fetch sessions for search: ${sessionsError.message}`,
      );
      throw new Error(
        `Failed to fetch sessions for search: ${sessionsError.message}`,
      );
    }

    // Map results with similarity scores
    return data.map((item: any) => {
      const session = sessions.find((s) => s.id === item.session_id);
      return {
        session: session ? this.mapSession(session) : null,
        similarity: item.similarity,
      };
    }).filter((item: any) => item.session !== null) as Array<{
      session: Session;
      similarity: number;
    }>;
  }

  /**
   * Fallback semantic search using manual cosine similarity calculation
   */
  private async fallbackSemanticSearch(
    queryEmbedding: number[],
    limit: number,
    embeddingType: 'transcript' | 'summary',
  ): Promise<Array<{ session: Session; similarity: number }>> {
    // Get all embeddings of the specified type
    const { data: embeddings, error } = await this.supabase
      .from('session_embeddings')
      .select('*')
      .eq('embedding_type', embeddingType);

    if (error) {
      this.logger.error(`Failed to fetch embeddings: ${error.message}`);
      throw new Error(`Failed to fetch embeddings: ${error.message}`);
    }

    // Calculate cosine similarity for each embedding
    const similarities = embeddings.map((emb) => {
      const embVector = this.parseVector(emb.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, embVector);
      return {
        session_id: emb.session_id,
        similarity,
      };
    });

    // Sort by similarity and get top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, limit);

    // Fetch sessions
    const sessionIds = topResults.map((r) => r.session_id);
    const { data: sessions } = await this.supabase
      .from('sessions')
      .select('*')
      .in('id', sessionIds);

    // Map results
    return topResults.map((result) => {
      const session = sessions?.find((s) => s.id === result.session_id);
      return {
        session: session ? this.mapSession(session) : null,
        similarity: result.similarity,
      };
    }).filter((item) => item.session !== null) as Array<{
      session: Session;
      similarity: number;
    }>;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Parse vector string from PostgreSQL to number array
   */
  private parseVector(vector: any): number[] {
    if (Array.isArray(vector)) {
      return vector;
    }
    if (typeof vector === 'string') {
      // Remove brackets and split by comma
      const cleaned = vector.replace(/[\[\]]/g, '');
      return cleaned.split(',').map((v) => parseFloat(v.trim()));
    }
    throw new Error(`Invalid vector format: ${typeof vector}`);
  }

  /**
   * Map database row to Session entity
   */
  private mapSession(data: any): Session {
    return {
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      transcript: data.transcript,
      summary: data.summary,
      status: data.status,
      speakers: Array.isArray(data.speakers) ? data.speakers : [],
      metadata: data.metadata || {},
    };
  }
}
