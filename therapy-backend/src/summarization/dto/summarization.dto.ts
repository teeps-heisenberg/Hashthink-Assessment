/**
 * Result from summarization process
 */
export interface SummaryResult {
  summary: string;
  keyTopics?: string[];
  wordCount: number;
}

/**
 * Processing status for summarization
 */
export interface SummarizationStatus {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}
