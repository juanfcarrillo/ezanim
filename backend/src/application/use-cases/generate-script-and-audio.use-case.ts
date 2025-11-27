import { Injectable } from '@nestjs/common';
import { ScriptGenerationAgent } from '../../infrastructure/ai/script-generation.agent';
import { ElevenLabsService } from '../../infrastructure/elevenlabs/elevenlabs.service';
import { TranscriptionService } from '../../infrastructure/transcription/transcription.service';

export interface GenerateScriptAndAudioResult {
  initialRequest: string;
  script: string;
  audioBuffer: Buffer;
  transcript: string;
  vtt: string;
  words: Array<{ word: string; start: number; end: number }>;
}

@Injectable()
export class GenerateScriptAndAudioUseCase {
  constructor(
    private scriptAgent: ScriptGenerationAgent,
    private elevenLabsService: ElevenLabsService,
    private transcriptionService: TranscriptionService,
  ) {}

  async execute(userRequest: string): Promise<GenerateScriptAndAudioResult> {
    // 1. Generate Script
    const { script } = await this.scriptAgent.generateScript(userRequest);

    // 2. Generate Audio
    const audioBuffer = await this.elevenLabsService.generateAudio(script);

    // 3. Transcribe Audio (Get timestamps)
    const { text, vtt, words } =
      await this.transcriptionService.transcribeAudio(audioBuffer);

    return {
      initialRequest: userRequest,
      script,
      audioBuffer,
      transcript: text,
      vtt,
      words,
    };
  }
}
