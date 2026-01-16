# Therapy Session Processing Application

A web application that allows therapists to upload audio recordings of therapy sessions, automatically transcribe them, identify speakers, generate summaries, and create vector embeddings for semantic search.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Data Model](#data-model)
- [Processing Pipeline](#processing-pipeline)
- [Assumptions and Tradeoffs](#assumptions-and-tradeoffs)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

## High-Level Architecture

The application follows a **monorepo structure** with a clear separation between frontend and backend:

```
Hashthink-Assessment/
├── therapy-frontend/     # Next.js frontend application
├── therapy-backend/      # NestJS backend API
└── README.md            # This file
```

### Architecture Overview

```
┌─────────────────┐
│   Frontend      │  Next.js + React + Tailwind CSS
│  (Port 3000)    │  - Audio upload UI
└────────┬────────┘  - Session list display
         │            - Real-time status updates
         │ HTTP/REST
         ▼
┌─────────────────┐
│    Backend      │  NestJS (Node.js)
│  (Port 3001)    │  - REST API endpoints
└────────┬────────┘  - File upload handling
         │            - Processing orchestration
         │
         ├──────────► OpenAI API
         │            - Whisper (transcription)
         │            - GPT-4o-mini (summarization)
         │            - text-embedding-3-small (vectors)
         │
         └──────────► Supabase (PostgreSQL)
                      - Session storage
                      - Vector embeddings (pgvector)
```

### Key Components

**Frontend:**

- **Audio Upload**: Drag-and-drop interface using `react-dropzone`
- **Session Management**: List view with expandable cards
- **Real-time Updates**: Polling mechanism for processing status
- **UI Components**: Reusable components with Tailwind CSS

**Backend:**

- **Sessions Module**: Orchestrates the entire processing pipeline
- **Transcription Module**: Handles audio-to-text conversion
- **Summarization Module**: Generates session summaries
- **Vectorization Module**: Creates embeddings for semantic search
- **Database Module**: Manages Supabase interactions
- **File Upload Module**: Handles file validation and temporary storage

## Data Model

### Database Schema

The application uses **Supabase (PostgreSQL)** with the **pgvector** extension for vector storage.

#### `sessions` Table

Stores therapy session metadata and processed content:

| Column       | Type      | Description                                                                                         |
| ------------ | --------- | --------------------------------------------------------------------------------------------------- |
| `id`         | UUID      | Primary key, auto-generated                                                                         |
| `created_at` | TIMESTAMP | Session creation timestamp                                                                          |
| `updated_at` | TIMESTAMP | Last update timestamp (auto-updated)                                                                |
| `transcript` | TEXT      | Full transcription with speaker labels                                                              |
| `summary`    | TEXT      | AI-generated session summary                                                                        |
| `status`     | TEXT      | Processing status: `uploading`, `transcribing`, `summarizing`, `vectorizing`, `completed`, `failed` |
| `speakers`   | JSONB     | Array of identified speaker names                                                                   |
| `metadata`   | JSONB     | Additional metadata (file info, processing times, etc.)                                             |

**Indexes:**

- `idx_sessions_created_at`: For chronological sorting
- `idx_sessions_status`: For filtering by status

#### `session_embeddings` Table

Stores vector embeddings for semantic search:

| Column           | Type         | Description                                         |
| ---------------- | ------------ | --------------------------------------------------- |
| `id`             | UUID         | Primary key                                         |
| `session_id`     | UUID         | Foreign key to `sessions.id`                        |
| `embedding`      | vector(1536) | Vector embedding (text-embedding-3-small dimension) |
| `embedding_type` | TEXT         | Either `'transcript'` or `'summary'`                |
| `created_at`     | TIMESTAMP    | Embedding creation timestamp                        |

**Indexes:**

- `idx_session_embeddings_session_id`: For session lookups
- `idx_session_embeddings_type`: For filtering by type
- `idx_session_embeddings_vector`: IVFFlat index for cosine similarity search

### Data Flow

1. **Upload**: Audio file → Backend (in-memory storage) → Database (session record created)
2. **Processing**: Session record → Processing pipeline → Database updates
3. **Storage**: Transcript, summary, and embeddings stored in respective tables
4. **Retrieval**: Frontend queries sessions → Displays formatted data

## Processing Pipeline

The application processes audio files through a sequential pipeline:

### 1. Transcription

**Service**: `TranscriptionService`  
**API**: OpenAI Whisper (`whisper-1`)  
**Process**:

1. Audio file retrieved from temporary storage
2. Sent to OpenAI Whisper API with `verbose_json` format
3. Raw transcript extracted from response
4. **Speaker Identification**:
   - Pattern matching for explicit speaker labels
   - If none found, defaults to "Speaker 1" and "Speaker 2"
5. **Transcript Formatting**:
   - Splits transcript into sentences
   - Groups 1-2 sentences per speaker turn
   - Attributes turns to speakers in rotation
   - Formats as: `Speaker 1: [text]\n\nSpeaker 2: [text]`
6. Formatted transcript stored in database

**Output**: Formatted transcript with speaker labels, speaker array, duration, language

### 2. Summarization

**Service**: `SummarizationService`  
**API**: OpenAI GPT (`gpt-4o-mini`)  
**Process**:

1. Receives formatted transcript (with speaker labels)
2. Builds therapy-specific prompt:
   - System message: Professional therapy analyst persona
   - User message: Transcript with instructions for concise summary
3. Calls OpenAI Chat Completions API
4. Extracts summary from response
5. Stores summary in database

**Prompt Strategy**:

- Focuses on key insights, progress, and actionable items
- Maintains confidentiality and professionalism
- Temperature: 0.3 (for consistency)
- Max tokens: 1000

**Output**: Textual summary of the session

### 3. Vectorization

**Service**: `VectorizationService`  
**API**: OpenAI Embeddings (`text-embedding-3-small`)  
**Process**:

1. Generates embeddings for both transcript and summary
2. **Text Truncation**: Limits to 25,000 characters (API safety limit)
3. Creates two embeddings per session:
   - `embedding_type: 'transcript'`
   - `embedding_type: 'summary'`
4. Stores embeddings in `session_embeddings` table
5. Updates session status to `completed`

**Vector Details**:

- Dimensions: 1536 (text-embedding-3-small)
- Storage: PostgreSQL `vector` type via pgvector extension
- Index: IVFFlat for efficient cosine similarity search

**Output**: Two 1536-dimensional vectors per session

### 4. Semantic Search

**Service**: `SessionsService` (via `DatabaseService`)  
**Endpoint**: `POST /api/sessions/search`  
**Process**:

1. User submits a text query (e.g., "patient discussing anxiety about work")
2. **Query Vectorization**:
   - Query text is converted to a 1536-dimensional embedding using `text-embedding-3-small`
   - Same model used for session embeddings ensures compatibility
3. **Similarity Search**:
   - Two methods available (automatic fallback):
     - **Primary Method (RPC)**: Uses PostgreSQL function `match_session_embeddings` with pgvector index
       - Leverages IVFFlat index for fast approximate nearest neighbor search
       - Calculates cosine similarity using optimized database operations
       - Returns results above similarity threshold (0.3 = 30%)
     - **Fallback Method (Manual)**: JavaScript-based calculation when RPC unavailable
       - Fetches all embeddings of specified type
       - Calculates cosine similarity for each embedding in application code
       - Filters and sorts results in memory
4. **Result Formatting**:
   - Returns sessions ordered by similarity score (highest first)
   - Includes similarity score (0.0 to 1.0) for each result
   - Supports searching by `'transcript'` or `'summary'` embedding types

**Search Parameters**:

- `query`: Search text (3-500 characters, required)
- `limit`: Maximum results to return (1-50, default: 10)
- `embeddingType`: Search `'transcript'` or `'summary'` embeddings (default: `'summary'`)

**Current Implementation**: The backend API supports searching by both `'transcript'` and `'summary'` embedding types. Currently, the frontend UI searches only by `'summary'` embeddings by default. The `'transcript'` option is available via the API but not exposed in the UI at this time.

**Performance**:

- **RPC Method**: Fast, uses database index, minimal network transfer (~10KB)
- **Manual Method**: Slower, processes all embeddings, higher network transfer (~15MB+)
- Similarity threshold: 0.3 (30%) - only results above this threshold are returned

**Output**: Array of sessions with similarity scores, ordered by relevance

### Processing Status Flow

```
uploading → transcribing → summarizing → vectorizing → completed
                                                          ↓
                                                       failed (on error)
```

## Assumptions and Tradeoffs

### Assumptions

1. **Speaker Identification**:

   - Assumes 2-person conversations (therapist + client)
   - Uses heuristic-based attribution (sentence grouping, question detection)
   - No true speaker diarization (OpenAI Whisper doesn't provide this)

2. **File Storage**:

   - Audio files stored in-memory during processing only
   - Files cleaned up after processing completes
   - No persistent file storage (not required per constraints)

3. **Processing**:

   - Synchronous processing pipeline (not background jobs)
   - Client receives immediate response, processing continues asynchronously
   - Status updates via polling (every 3 seconds)

4. **Scalability**:

   - Single-instance deployment assumed
   - No distributed processing or queue system
   - Suitable for small-to-medium scale usage

5. **Security**:
   - No authentication/authorization (out of scope)
   - CORS configured for development
   - Environment variables for sensitive data

### Tradeoffs

1. **Speaker Attribution Accuracy**:

   - **Tradeoff**: Heuristic-based approach vs. true speaker diarization
   - **Reason**: OpenAI Whisper doesn't provide speaker diarization; would require additional service (e.g., AssemblyAI, Deepgram)
   - **Impact**: Speaker labels are approximate but functional for display

2. **In-Memory File Storage**:

   - **Tradeoff**: Temporary storage vs. persistent object storage
   - **Reason**: Simplicity, no additional infrastructure needed
   - **Impact**: Files lost on server restart; acceptable for assessment scope

3. **Synchronous Processing**:

   - **Tradeoff**: Immediate response vs. background job queue
   - **Reason**: Simpler implementation, no additional infrastructure
   - **Impact**: Processing happens in request context; acceptable for small scale

4. **Polling vs. WebSockets**:

   - **Tradeoff**: HTTP polling vs. real-time WebSocket updates
   - **Reason**: Simpler implementation, no additional infrastructure
   - **Impact**: Slight delay in status updates (3 seconds); acceptable for assessment

5. **Vector Storage**:

   - **Tradeoff**: pgvector in PostgreSQL vs. dedicated vector database
   - **Reason**: Single database, simpler architecture
   - **Impact**: Good performance for small-to-medium scale; may need optimization for large scale

6. **Transcript Formatting**:
   - **Tradeoff**: Server-side formatting vs. client-side formatting
   - **Reason**: Consistent display across clients, single source of truth
   - **Impact**: Slightly larger database storage; better for consistency

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key

### Environment Setup

**Backend** (`therapy-backend/.env`):

```env
# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_SUMMARY_MODEL=gpt-4o-mini

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=104857600  # 100MB
ALLOWED_MIME_TYPES=audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/webm
```

**Frontend** (`therapy-frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Database Setup

1. Create a Supabase project
2. Run the SQL schema from `therapy-backend/database/schema.sql` in Supabase SQL Editor
3. Verify tables and pgvector extension are created

### Installation

**Backend**:

```bash
cd therapy-backend
npm install
npm run start:dev
```

**Frontend**:

```bash
cd therapy-frontend
npm install
npm run dev
```

### Usage

1. Open `http://localhost:3000` in your browser
2. Upload an audio file (MP3, WAV, M4A, or WebM)
3. Watch the processing status update automatically
4. View transcript and summary when processing completes

## Project Structure

```
therapy-backend/
├── src/
│   ├── config/              # Configuration management
│   ├── database/            # Supabase integration
│   ├── file-upload/         # File handling & validation
│   ├── sessions/            # Main orchestration module
│   ├── transcription/       # Whisper integration
│   ├── summarization/       # GPT summarization
│   └── vectorization/       # Embedding generation
├── database/
│   ├── schema.sql           # Database schema
│   └── README.md            # Database setup guide
└── package.json

therapy-frontend/
├── app/                     # Next.js app directory
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── layout/              # Layout components
│   ├── sessions/            # Session-related components
│   └── ui/                  # Reusable UI components
├── hooks/                   # React hooks
│   └── useSessions.ts      # Data fetching hook
├── lib/                     # Utilities
│   ├── api.ts              # API client
│   ├── config.ts           # Configuration
│   └── types.ts            # TypeScript types
└── package.json
```

## Technologies Used

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Axios, React-Dropzone
- **Backend**: NestJS 11, TypeScript, Multer, class-validator
- **Database**: Supabase (PostgreSQL), pgvector
- **AI/ML**: OpenAI Whisper, OpenAI GPT-4o-mini, OpenAI Embeddings

## Future Enhancements

- True speaker diarization (AssemblyAI, Deepgram)
- Background job queue (Bull, BullMQ)
- Persistent file storage (S3, Supabase Storage)
- WebSocket for real-time updates
- Semantic search UI
- Chunking strategy for large transcripts
- Authentication and authorization
- Multi-tenant support
