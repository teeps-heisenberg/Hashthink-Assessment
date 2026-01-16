export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface OpenAIConfig {
  apiKey: string;
  whisperModel: string;
  embeddingModel: string;
  summaryModel: string;
}

export interface ServerConfig {
  port: number;
  environment: string;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface CorsConfig {
  frontendUrl: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  openai: OpenAIConfig;
  server: ServerConfig;
  fileUpload: FileUploadConfig;
  cors: CorsConfig;
}
