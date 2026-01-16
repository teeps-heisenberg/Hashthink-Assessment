import { AppConfig } from './config.interface';

export default (): AppConfig => {
  // Validate required environment variables
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FRONTEND_URL',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  // Validate URL formats
  const validateUrl = (url: string, varName: string): void => {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format for ${varName}: ${url}`);
    }
  };

  validateUrl(process.env.SUPABASE_URL!, 'SUPABASE_URL');
  validateUrl(process.env.FRONTEND_URL!, 'FRONTEND_URL');

  // Validate port number
  const port = parseInt(process.env.PORT || '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${process.env.PORT}`);
  }

  // Validate max file size
  const maxFileSize = parseInt(
    process.env.MAX_FILE_SIZE || '104857600',
    10,
  );
  if (isNaN(maxFileSize) || maxFileSize <= 0) {
    throw new Error(`Invalid MAX_FILE_SIZE: ${process.env.MAX_FILE_SIZE}`);
  }

  return {
    database: {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      whisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
      embeddingModel:
        process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      summaryModel: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
    },
    server: {
      port,
      environment: process.env.NODE_ENV || 'development',
    },
    fileUpload: {
      maxFileSize,
      allowedMimeTypes: (
        process.env.ALLOWED_MIME_TYPES ||
        'audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/webm'
      ).split(','),
    },
    cors: {
      frontendUrl: process.env.FRONTEND_URL!,
    },
  };
};
