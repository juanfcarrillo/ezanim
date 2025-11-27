import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TranscriptionResult {
  text: string;
  vtt: string;
  words: Array<{ word: string; start: number; end: number }>;
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface VerboseTranscription {
  text: string;
  words?: WhisperWord[];
}

@Injectable()
export class TranscriptionService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<TranscriptionResult> {
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);

    try {
      fs.writeFileSync(tempFilePath, audioBuffer);

      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      const responseData = response as unknown as VerboseTranscription;
      const words: WhisperWord[] = responseData.words || [];
      const vtt = this.generateVtt(words);

      return {
        text: response.text,
        vtt,
        words: words.map((w) => ({
          word: w.word,
          start: w.start,
          end: w.end,
        })),
      };
    } catch (error) {
      // Try to clean up if error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  private generateVtt(
    words: Array<{ word: string; start: number; end: number }>,
  ): string {
    let vtt = 'WEBVTT\n\n';

    // Group words into lines (simple approach: ~10 words or by pauses)
    // For now, let's just output word-level VTT or small chunks.
    // Stable-ts often outputs word-level or segment-level.
    // Let's do a simple segmentation based on gaps or length.

    // Actually, for animation, word-level VTT is very useful.
    // Let's create a VTT where each cue is a word (or small group).

    words.forEach((word, index) => {
      const start = this.formatTime(word.start);
      const end = this.formatTime(word.end);
      vtt += `${index + 1}\n${start} --> ${end}\n${word.word}\n\n`;
    });

    return vtt;
  }

  private formatTime(seconds: number): string {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const timeStr = date.toISOString().substr(11, 12); // HH:mm:ss.mmm
    return timeStr;
  }
}
