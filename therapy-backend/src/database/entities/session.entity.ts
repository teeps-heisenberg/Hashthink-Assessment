export type SessionStatus =
  | 'uploading'
  | 'transcribing'
  | 'summarizing'
  | 'vectorizing'
  | 'completed'
  | 'failed';

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  transcript: string | null;
  summary: string | null;
  status: SessionStatus;
  speakers: string[];
  metadata: Record<string, any>;
}

export interface CreateSessionDto {
  status?: SessionStatus;
  metadata?: Record<string, any>;
}

export interface UpdateSessionDto {
  transcript?: string;
  summary?: string;
  status?: SessionStatus;
  speakers?: string[];
  metadata?: Record<string, any>;
}
