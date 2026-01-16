import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AppConfig } from '../config/config.interface';
import { DatabaseService } from '../database/database.service';
import { SummaryResult } from './dto/summarization.dto';

@Injectable()
export class SummarizationService {
  private readonly logger = new Logger(SummarizationService.name);
  private readonly openai: OpenAI;
  private readonly summaryModel: string;

  constructor(
    private configService: ConfigService<AppConfig>,
    private databaseService: DatabaseService,
  ) {
    const openaiConfig = this.configService.get('openai', { infer: true })!;
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
    });
    this.summaryModel = openaiConfig.summaryModel;
    this.logger.log(`SummarizationService initialized with model: ${this.summaryModel}`);
  }

  /**
   * Generate summary for a transcript
   */
  async summarizeTranscript(transcript: string): Promise<SummaryResult> {
    this.logger.log(`Starting summarization for transcript of ${transcript.length} chars`);

    const prompt = this.buildSummaryPrompt(transcript);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.summaryModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional therapy session analyst. Your task is to provide concise, 
helpful summaries of therapy sessions while maintaining confidentiality and professionalism.
Focus on key insights, progress, and actionable items.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const summary = response.choices[0]?.message?.content || '';
      const wordCount = summary.split(/\s+/).length;

      this.logger.log(`Summarization completed: ${wordCount} words`);

      return {
        summary: summary.trim(),
        wordCount,
      };
    } catch (error) {
      this.logger.error(`Summarization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Build the prompt for summarization
   */
  private buildSummaryPrompt(transcript: string): string {
    return `Please summarize the following therapy session transcript in 2-3 paragraphs. Focus on:

1. Key topics discussed during the session
2. Main concerns or issues raised by the client
3. Progress or insights mentioned
4. Any action items or next steps discussed

Keep the summary professional, objective, and helpful for future reference.

Transcript:
---
${transcript}
---

Summary:`;
  }

  /**
   * Process a session: summarize and update database
   */
  async processSession(sessionId: string): Promise<void> {
    this.logger.log(`Processing summarization for session: ${sessionId}`);

    try {
      // Get session from database
      const session = await this.databaseService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (!session.transcript) {
        throw new Error(`No transcript available for session: ${sessionId}`);
      }

      // Update status to summarizing (if not already)
      if (session.status !== 'summarizing') {
        await this.databaseService.updateSessionStatus(sessionId, 'summarizing');
      }

      // Perform summarization
      const result = await this.summarizeTranscript(session.transcript);

      // Update session with summary
      await this.databaseService.updateSession(sessionId, {
        summary: result.summary,
        status: 'vectorizing',
      });

      this.logger.log(`Summarization processing completed for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Summarization processing failed for session ${sessionId}: ${error}`,
      );

      // Update status to failed
      await this.databaseService.updateSessionStatus(sessionId, 'failed');
      throw error;
    }
  }
}
