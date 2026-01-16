/**
 * Result from vectorization process
 */
export interface VectorizationResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

/**
 * Session vectorization result with both embeddings
 */
export interface SessionVectorizationResult {
  sessionId: string;
  transcriptEmbedding?: VectorizationResult;
  summaryEmbedding?: VectorizationResult;
}

/**
 * Processing status for vectorization
 */
export interface VectorizationStatus {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcriptVectorized: boolean;
  summaryVectorized: boolean;
  error?: string;
}
