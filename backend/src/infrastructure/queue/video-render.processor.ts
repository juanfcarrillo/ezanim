import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InMemoryVideoRequestRepository } from '../repositories/in-memory-video-request.repository';
import { InMemoryVideoRepository } from '../repositories/in-memory-video.repository';
import { VideoAnimationAgent } from '../ai/video-animation.agent';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { FFmpegService } from '../ffmpeg/ffmpeg.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { VideoRequestStatus } from '@domain/entities/video-request.entity';
import { Video } from '@domain/entities/video.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface VideoRenderJobData {
  videoRequestId: string;
  userPrompt: string;
  configuration?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
  };
}

@Processor('video-render')
export class VideoRenderProcessor extends WorkerHost {
  constructor(
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
    private readonly videoRepo: InMemoryVideoRepository,
    private readonly videoAnimationAgent: VideoAnimationAgent,
    private readonly puppeteerService: PuppeteerService,
    private readonly ffmpegService: FFmpegService,
    private readonly storageService: R2StorageService,
  ) {
    super();
  }

  async process(job: Job<VideoRenderJobData>): Promise<void> {
    const { videoRequestId, userPrompt, configuration } = job.data;

    console.log(
      `[VideoRenderProcessor] Starting job for request: ${videoRequestId}`,
    );

    try {
      // Get video request
      let videoRequest = await this.videoRequestRepo.findById(videoRequestId);
      if (!videoRequest) {
        throw new Error(`VideoRequest ${videoRequestId} not found`);
      }

      // Stage 1: Generate Complete Video Animation
      await job.updateProgress(20);
      videoRequest = videoRequest.updateStatus(
        VideoRequestStatus.REFINING_PROMPT,
      );
      await this.videoRequestRepo.update(videoRequest);

      console.log('[Stage 1] Generating complete video animation with AI...');
      const animationResult =
        await this.videoAnimationAgent.generateVideoAnimation(userPrompt);

      videoRequest = videoRequest.updateRefinedPrompt(
        animationResult.description,
      );
      await this.videoRequestRepo.update(videoRequest);

      // Stage 2: Rendering
      await job.updateProgress(50);
      videoRequest = videoRequest.updateStatus(VideoRequestStatus.RENDERING);
      await this.videoRequestRepo.update(videoRequest);

      const config = configuration || {
        width: parseInt(process.env.VIDEO_WIDTH || '1920'),
        height: parseInt(process.env.VIDEO_HEIGHT || '1080'),
        fps: parseInt(process.env.VIDEO_FPS || '60'),
        duration: animationResult.duration,
      };

      console.log('[Stage 2] Using generated HTML...');
      const html = animationResult.htmlContent;

      // Save HTML for debugging
      const debugDir = path.join(
        process.env.VIDEO_OUTPUT_DIR || '/tmp/ezanim',
        'debug',
      );
      await fs.mkdir(debugDir, { recursive: true });
      const htmlPath = path.join(debugDir, `${videoRequestId}.html`);
      await fs.writeFile(htmlPath, html, 'utf-8');
      console.log(`[Stage 2] HTML saved for debugging: ${htmlPath}`);

      console.log('[Stage 2] Rendering frames with Puppeteer...');
      await job.updateProgress(60);
      const framePaths = await this.puppeteerService.renderFrames({
        html,
        ...config,
      });

      console.log('[Stage 2] Encoding video with FFmpeg...');
      await job.updateProgress(75);
      const outputDir = path.join(
        process.env.VIDEO_OUTPUT_DIR || '/tmp/ezanim',
        'videos',
      );
      await fs.mkdir(outputDir, { recursive: true });
      const videoPath = path.join(outputDir, `${videoRequestId}.mp4`);

      await this.ffmpegService.encodeVideo({
        framePaths,
        outputPath: videoPath,
        fps: config.fps,
        width: config.width,
        height: config.height,
      });

      console.log('[Stage 2] Uploading to R2...');
      await job.updateProgress(90);
      const s3Key = `videos/${videoRequestId}.mp4`;
      await this.storageService.uploadVideo(videoPath, s3Key);
      const videoUrl = await this.storageService.getPublicUrl(s3Key);

      // Create Video entity
      const video = Video.create(
        videoRequestId,
        videoUrl,
        s3Key,
        config.duration,
        config.width,
        config.height,
        config.fps,
      );
      await this.videoRepo.save(video);

      // Cleanup
      console.log('[Stage 2] Cleaning up temporary files...');
      await this.puppeteerService.cleanup(framePaths);
      await fs.unlink(videoPath).catch(() => {});

      // Mark as completed
      await job.updateProgress(100);
      videoRequest = videoRequest.updateStatus(VideoRequestStatus.COMPLETED);
      await this.videoRequestRepo.update(videoRequest);

      console.log(
        `[VideoRenderProcessor] Job completed successfully: ${videoRequestId}`,
      );
    } catch (error) {
      console.error('[VideoRenderProcessor] Job failed:', error);

      // Mark as failed
      const videoRequest = await this.videoRequestRepo.findById(videoRequestId);
      if (videoRequest) {
        const failedRequest = videoRequest.updateStatus(
          VideoRequestStatus.FAILED,
        );
        await this.videoRequestRepo.update(failedRequest);
      }

      throw error;
    }
  }
}
