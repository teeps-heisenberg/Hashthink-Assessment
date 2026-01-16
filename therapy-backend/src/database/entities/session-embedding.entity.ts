export type EmbeddingType = 'transcript' | 'summary';

export interface SessionEmbedding {
  id: string;
  session_id: string;
  embedding: number[]; // Vector as array of numbers
  embedding_type: EmbeddingType;
  created_at: string;
}

export interface CreateSessionEmbeddingDto {
  session_id: string;
  embedding: number[];
  embedding_type: EmbeddingType;
}
