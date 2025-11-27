import { Injectable } from '@nestjs/common';
import { VideoRequest } from '@domain/entities/video-request.entity';
import { InMemoryVideoRequestRepository } from '@infrastructure/repositories/in-memory-video-request.repository';
import { VideoAnimationAgent } from '@infrastructure/ai/video-animation.agent';
import { VideoRequestStatus } from '@domain/entities/video-request.entity';

@Injectable()
export class GenerateAnimationHtmlUseCase {
  constructor(
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
    private readonly videoAnimationAgent: VideoAnimationAgent,
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

    const animationResult =
      await this.videoAnimationAgent.generateVideoAnimation(userPrompt);

    let updatedRequest = videoRequest.updateRefinedPrompt(
      animationResult.description,
    );
    updatedRequest = updatedRequest.updateStatus(
      VideoRequestStatus.PREVIEW_READY,
    );

    await this.videoRequestRepo.update(updatedRequest);

    console.log(
      '[GenerateAnimationHtmlUseCase] HTML generated:',
      videoRequest.id,
    );

    return {
      id: videoRequest.id,
      htmlContent: animationResult.htmlContent,
      duration: animationResult.duration,
      description: animationResult.description,
    };
  }
}
