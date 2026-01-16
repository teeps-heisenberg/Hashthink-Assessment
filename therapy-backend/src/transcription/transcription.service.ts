import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AppConfig } from '../config/config.interface';
import { DatabaseService } from '../database/database.service';
import { FileStorageService } from '../file-upload/file-storage.service';
import { TranscriptionResult } from './dto/transcription.dto';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly openai: OpenAI;
  private readonly whisperModel: string;

  constructor(
    private configService: ConfigService<AppConfig>,
    private databaseService: DatabaseService,
    private fileStorageService: FileStorageService,
  ) {
    const openaiConfig = this.configService.get('openai', { infer: true })!;
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
    });
    this.whisperModel = openaiConfig.whisperModel;
    this.logger.log(`TranscriptionService initialized with model: ${this.whisperModel}`);
  }

  /**
   * Transcribe audio file for a session
   */
  async transcribeAudio(sessionId: string): Promise<TranscriptionResult> {
    this.logger.log(`Starting transcription for session: ${sessionId}`);

    // Get file from storage
    const file = this.fileStorageService.createFileForApi(sessionId);
    if (!file) {
      throw new Error(`Audio file not found for session: ${sessionId}`);
    }

    try {
      // Call OpenAI Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: this.whisperModel,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      const transcript = response.text;
      const language = response.language;
      const duration = response.duration;

      // Identify speakers from transcript
      const speakers = this.identifySpeakers(transcript);

      this.logger.log(
        `Transcription completed for session ${sessionId}: ${transcript.length} chars, ${speakers.length} speakers`,
      );

      return {
        transcript,
        speakers,
        duration,
        language,
      };
    } catch (error) {
      this.logger.error(
        `Transcription failed for session ${sessionId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Identify speakers from transcript text
   * Basic implementation using pattern matching
   */
  identifySpeakers(transcript: string): string[] {
    const speakers = new Set<string>();

    // Common speaker patterns in therapy sessions
    const patterns = [
      /\b(Therapist|Counselor|Doctor|Dr\.)\s*:/gi,
      /\b(Patient|Client)\s*:/gi,
      /\b(Speaker\s*\d+)\s*:/gi,
      /\b(Person\s*[A-Z])\s*:/gi,
      /^\s*([A-Z][a-z]+)\s*:/gm,
    ];

    for (const pattern of patterns) {
      const matches = transcript.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          speakers.add(match[1].trim());
        }
      }
    }

    // If no speakers found, assume two-person conversation
    if (speakers.size === 0) {
      speakers.add('Speaker 1');
      speakers.add('Speaker 2');
    }

    return Array.from(speakers);
  }

  /**
   * Format transcript with speaker labels
   * Splits transcript into conversation turns and attributes them to speakers
   */
  formatTranscriptWithSpeakers(transcript: string, speakers: string[]): string {
    // Handle edge cases
    if (!transcript || transcript.trim().length === 0) {
      return '';
    }

    if (speakers.length < 2) {
      // Single speaker or no speakers - return as-is
      return transcript;
    }

    // Split transcript into sentences using punctuation
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = transcript.match(sentenceRegex);

    if (!sentences || sentences.length === 0) {
      // No sentence boundaries found - return with first speaker label
      return `${speakers[0]}: ${transcript.trim()}`;
    }

    const formattedTurns: string[] = [];
    let currentSpeakerIndex = 0;
    let currentTurn = '';
    let sentenceCount = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      currentTurn += (currentTurn ? ' ' : '') + sentence;
      sentenceCount++;

      // Determine if we should change speakers
      const isQuestion = sentence.endsWith('?');
      const isLongSentence = sentence.length > 100;
      const reachedTurnLimit = sentenceCount >= 2;

      // Change speaker after questions, long sentences, or every 2 sentences
      if (isQuestion || isLongSentence || reachedTurnLimit || i === sentences.length - 1) {
        if (currentTurn.trim()) {
          const speaker = speakers[currentSpeakerIndex % speakers.length];
          formattedTurns.push(`${speaker}: ${currentTurn.trim()}`);
          
          // Move to next speaker (except for final sentence if it's just completing current turn)
          if (i < sentences.length - 1) {
            currentSpeakerIndex++;
          }
        }
        currentTurn = '';
        sentenceCount = 0;
      }
    }

    // Handle any remaining content
    if (currentTurn.trim()) {
      const speaker = speakers[currentSpeakerIndex % speakers.length];
      formattedTurns.push(`${speaker}: ${currentTurn.trim()}`);
    }

    // Join turns with double newlines for readability
    const formatted = formattedTurns.join('\n\n');
    
    this.logger.log(
      `Formatted transcript: ${sentences.length} sentences into ${formattedTurns.length} speaker turns`,
    );

    return formatted;
  }

  /**
   * Process a session: transcribe and update database
   */
  async processSession(sessionId: string): Promise<void> {
    this.logger.log(`Processing transcription for session: ${sessionId}`);

    try {
      // Update status to transcribing
      await this.databaseService.updateSessionStatus(sessionId, 'transcribing');

      // Perform transcription
      const result = await this.transcribeAudio(sessionId);

      // Format transcript with speaker labels
      const formattedTranscript = this.formatTranscriptWithSpeakers(
        result.transcript,
        result.speakers,
      );

      this.logger.log(
        `Formatted transcript for session ${sessionId}: ${formattedTranscript.length} chars`,
      );

      // Update session with formatted transcript and speakers
      await this.databaseService.updateSession(sessionId, {
        transcript: formattedTranscript,
        speakers: result.speakers,
        status: 'summarizing',
        metadata: {
          transcriptionDuration: result.duration,
          transcriptionLanguage: result.language,
          rawTranscriptLength: result.transcript.length,
        },
      });

      this.logger.log(`Transcription processing completed for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Transcription processing failed for session ${sessionId}: ${error}`,
      );

      // Update status to failed
      await this.databaseService.updateSessionStatus(sessionId, 'failed');
      throw error;
    }
  }
}
