import { Injectable } from '@nestjs/common';
import { VideoCreatorAgent } from '../../infrastructure/ai/video-creator.agent';
import { RenderVideoUseCase } from './render-video.use-case';
import { InMemoryVideoRequestRepository } from '../../infrastructure/repositories/in-memory-video-request.repository';
import { VideoRequest, VideoRequestStatus } from '../../domain/entities/video-request.entity';

export interface GenerateVideoFromScriptInput {
  requestId: string;
  initialRequest: string;
  script: string;
  audioPath: string;
  vtt: string;
  duration: number;
}

@Injectable()
export class GenerateVideoFromScriptUseCase {
  constructor(
    private videoCreatorAgent: VideoCreatorAgent,
    private renderVideoUseCase: RenderVideoUseCase,
    private videoRequestRepo: InMemoryVideoRequestRepository,
  ) {}

  async execute(input: GenerateVideoFromScriptInput): Promise<void> {
    const { requestId, initialRequest, duration, audioPath, vtt } = input;

    console.log(`[GenerateVideoFromScriptUseCase] Starting Phase 2 for ${requestId}`);

    // 1. Create or Get VideoRequest
    let videoRequest = await this.videoRequestRepo.findById(requestId);
    if (!videoRequest) {
      videoRequest = new VideoRequest(
        requestId,
        initialRequest,
        null,
        null, // htmlContent
        audioPath,
        duration,
        VideoRequestStatus.PENDING,
        new Date(),
        new Date(),
      );
      await this.videoRequestRepo.save(videoRequest);
    } else {
      // Update existing request with new details
      videoRequest = videoRequest.updateAudioAndDuration(audioPath, duration);
      await this.videoRequestRepo.update(videoRequest);
    }

    // 2. Generate Video HTML using Single Agent
    console.log('[GenerateVideoFromScriptUseCase] Generating video HTML with VideoCreatorAgent...');
    // We pass VTT instead of script now, as requested
    const htmlContent = await this.videoCreatorAgent.createVideo(initialRequest, duration, vtt);

    // 3. Update VideoRequest with HTML and set to PREVIEW_READY
    videoRequest = videoRequest.updateHtmlContent(htmlContent);
    videoRequest = videoRequest.updateStatus(VideoRequestStatus.PREVIEW_READY);
    await this.videoRequestRepo.update(videoRequest);

    console.log(
      `[GenerateVideoFromScriptUseCase] HTML generated and saved for ${requestId}. Ready for preview.`,
    );
    
    // NOTE: Rendering is now triggered manually after preview approval
    /*
    // 4. Trigger Rendering
    console.log('[GenerateVideoFromScriptUseCase] Triggering render...');
    await this.renderVideoUseCase.execute(
      requestId,
      htmlContent,
      duration,
      audioPath,
    );
    */

    console.log(
      `[GenerateVideoFromScriptUseCase] Phase 2 initiated for ${requestId}`,
    );
  }
}
