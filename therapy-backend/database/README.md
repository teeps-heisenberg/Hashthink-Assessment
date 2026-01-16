# Database Setup Instructions

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase project URL and API keys (already configured in `.env`)

## Setup Steps

### 1. Run the SQL Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `schema.sql`
4. Paste and execute the SQL script
5. Verify that the following were created:
   - `sessions` table
   - `session_embeddings` table
   - `vector` extension enabled
   - Indexes created
   - Functions created (`match_session_embeddings`, `store_session_embedding`)

### 2. Verify Tables

Run this query in the SQL Editor to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sessions', 'session_embeddings');
```

### 3. Verify pgvector Extension

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 4. Test the Setup

The database module will automatically connect when the NestJS application starts. Check the logs for:

```
[DatabaseService] Supabase client initialized
```

## Schema Overview

### Sessions Table

Stores therapy session data:
- `id`: Unique identifier (UUID)
- `created_at`: Timestamp when session was created
- `updated_at`: Timestamp when session was last updated
- `transcript`: Full transcription text (nullable)
- `summary`: Session summary (nullable)
- `status`: Current processing status
- `speakers`: Array of speaker identifiers (JSONB)
- `metadata`: Additional metadata (JSONB)

### Session Embeddings Table

Stores vector embeddings for semantic search:
- `id`: Unique identifier (UUID)
- `session_id`: Foreign key to sessions table
- `embedding`: Vector embedding (1536 dimensions)
- `embedding_type`: Type of embedding ('transcript' or 'summary')
- `created_at`: Timestamp when embedding was created

## Notes

- The `vector` extension must be enabled before creating the `session_embeddings` table
- Vector similarity search uses cosine similarity
- The IVFFlat index is created for efficient similarity searches
- All timestamps are stored in UTC

## Troubleshooting

### Error: "extension vector does not exist"
- Make sure you've run the `CREATE EXTENSION IF NOT EXISTS vector;` command
- Check that your Supabase project supports pgvector (most do by default)

### Error: "relation does not exist"
- Verify the SQL script ran successfully
- Check that you're using the correct schema (usually 'public')

### Vector insertion fails
- Ensure the embedding array has exactly 1536 dimensions
- Check that the vector string format is correct: `[1,2,3,...]`
