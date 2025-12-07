import { Injectable } from '@nestjs/common';
import { VideoRequest } from '@domain/entities/video-request.entity';
import { InMemoryVideoRequestRepository } from '@infrastructure/repositories/in-memory-video-request.repository';
import { VideoCreatorAgent } from '@infrastructure/ai/video-creator.agent';
import { VideoRequestStatus } from '@domain/entities/video-request.entity';

@Injectable()
export class GenerateAnimationHtmlUseCase {
  constructor(
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
    private readonly videoCreatorAgent: VideoCreatorAgent,
  ) {}

  async execute(userPrompt: string): Promise<{
    id: string;
    htmlContent: string;
    duration: number;
    description: string;
  }> {
    const videoRequest = VideoRequest.create(userPrompt);

    await this.videoRequestRepo.save(videoRequest);

    console.log(
      '[GenerateAnimationHtmlUseCase] Generating HTML for:',
      videoRequest.id,
    );

    const { html: htmlContent } =
      await this.videoCreatorAgent.createVideo(userPrompt);
    const duration = 15; // Default duration

    let updatedRequest = videoRequest.updateRefinedPrompt(userPrompt);
    updatedRequest = updatedRequest.updateHtmlContent(htmlContent);
    updatedRequest = updatedRequest.updateStatus(VideoRequestStatus.PREVIEW_READY);

    await this.videoRequestRepo.update(updatedRequest);

    console.log(
      '[GenerateAnimationHtmlUseCase] HTML generated:',
      videoRequest.id,
    );

    return {
      id: videoRequest.id,
      htmlContent: htmlContent,
      duration: duration,
      description: userPrompt,
    };
  }
}
