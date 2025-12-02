import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { GenerateScriptAndAudioUseCase } from '../../application/use-cases/generate-script-and-audio.use-case';
import { GenerateVideoFromScriptUseCase } from '../../application/use-cases/generate-video-from-script.use-case';
import * as fs from 'fs';
import * as path from 'path';

export interface VideoCreationJobData {
  requestId: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

@Processor('video-creation')
export class VideoCreationProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoCreationProcessor.name);

  constructor(
    private readonly generateScriptAndAudioUseCase: GenerateScriptAndAudioUseCase,
    private readonly generateVideoFromScriptUseCase: GenerateVideoFromScriptUseCase,
  ) {
    super();
  }

  async process(job: Job<VideoCreationJobData>): Promise<void> {
    const { requestId, prompt, aspectRatio } = job.data;
    this.logger.log(
      `Processing video creation job ${job.id} for request ${requestId}`,
    );

    try {
      // 1. Phase 1: Generate Script, Audio, and Transcription
      this.logger.log(`[Phase 1] Generating script and audio for: ${prompt}`);
      const phase1Result =
        await this.generateScriptAndAudioUseCase.execute(prompt);

      // Save audio to temp file
      const audioDir = path.join(
        process.env.VIDEO_OUTPUT_DIR || '/tmp/ezanim',
        'audio',
      );
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const audioPath = path.join(audioDir, `${requestId}.mp3`);
      fs.writeFileSync(audioPath, phase1Result.audioBuffer);

      this.logger.log(`[Phase 1] Audio saved to: ${audioPath}`);

      // Calculate duration
      const duration =
        phase1Result.words.length > 0
          ? phase1Result.words[phase1Result.words.length - 1].end + 2
          : 20; // Default fallback

      // 2. Phase 2: Generate Video HTML and Prepare for Render
      this.logger.log(`[Phase 2] Generating video HTML...`);
      await this.generateVideoFromScriptUseCase.execute({
        requestId,
        initialRequest: prompt,
        script: phase1Result.script,
        audioPath,
        vtt: phase1Result.vtt,
        duration,
        aspectRatio,
      });

      this.logger.log(
        `[VideoCreationProcessor] Job ${job.id} completed successfully`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[VideoCreationProcessor] Job ${job.id} failed`,
        err.stack,
      );
      throw error;
    }
  }
}
