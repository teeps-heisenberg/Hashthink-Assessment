-- Therapy Session Processing Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Sessions table: Stores therapy session metadata, transcripts, and summaries
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transcript TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'transcribing', 'summarizing', 'vectorizing', 'completed', 'failed')),
  speakers JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Session embeddings table: Stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS session_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL, -- Dimension for text-embedding-3-small
  embedding_type TEXT NOT NULL DEFAULT 'transcript' CHECK (embedding_type IN ('transcript', 'summary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for session_embeddings table
CREATE INDEX IF NOT EXISTS idx_session_embeddings_session_id ON session_embeddings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_type ON session_embeddings(embedding_type);

-- Vector similarity search index (IVFFlat for cosine similarity)
-- Note: This index requires at least some data to be effective
-- You may need to create this after inserting some embeddings
CREATE INDEX IF NOT EXISTS idx_session_embeddings_vector ON session_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to store session embedding (helper for vector insertion)
CREATE OR REPLACE FUNCTION store_session_embedding(
  p_session_id uuid,
  p_embedding float[],
  p_embedding_type text DEFAULT 'transcript'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_vector vector(1536);
BEGIN
  -- Convert array to vector
  v_vector := p_embedding::vector(1536);
  
  -- Insert embedding
  INSERT INTO session_embeddings (session_id, embedding, embedding_type)
  VALUES (p_session_id, v_vector, p_embedding_type)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Optional: Function for semantic search (more efficient than fallback)
-- This function performs cosine similarity search using pgvector
CREATE OR REPLACE FUNCTION match_session_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  embedding_type text DEFAULT 'summary'
)
RETURNS TABLE (
  session_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.session_id,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM session_embeddings se
  WHERE se.embedding_type = match_session_embeddings.embedding_type
    AND 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant necessary permissions (adjust as needed for your Supabase setup)
-- These are typically handled by Supabase automatically, but included for reference
