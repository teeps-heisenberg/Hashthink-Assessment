/**
 * Result from transcription process
 */
export interface TranscriptionResult {
  transcript: string;
  speakers: string[];
  duration?: number;
  language?: string;
}

/**
 * Speaker identification result
 */
export interface SpeakerIdentification {
  speakerId: string;
  label: string;
  segments?: SpeakerSegment[];
}

/**
 * A segment of speech attributed to a speaker
 */
export interface SpeakerSegment {
  speakerId: string;
  startTime?: number;
  endTime?: number;
  text: string;
}

/**
 * Processing status for transcription
 */
export interface TranscriptionStatus {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}
