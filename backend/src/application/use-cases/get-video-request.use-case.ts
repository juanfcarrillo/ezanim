import { Injectable } from '@nestjs/common';
import { InMemoryVideoRequestRepository } from '@infrastructure/repositories/in-memory-video-request.repository';
import { VideoRequestResponseDto } from '../dtos/video-request-response.dto';

@Injectable()
export class GetVideoRequestUseCase {
  constructor(
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
  ) {}

  async execute(videoRequestId: string): Promise<VideoRequestResponseDto> {
    // 1. Find VideoRequest by id
    const videoRequest = await this.videoRequestRepo.findById(videoRequestId);

    if (!videoRequest) {
      throw new Error(`VideoRequest ${videoRequestId} not found`);
    }

    // 2. Return VideoRequestResponseDto
    return {
      id: videoRequest.id,
      userPrompt: videoRequest.userPrompt,
      refinedPrompt: videoRequest.refinedPrompt,
      htmlContent: videoRequest.htmlContent,
      audioPath: videoRequest.audioPath,
      duration: videoRequest.duration,
      status: videoRequest.status,
      createdAt: videoRequest.createdAt,
      updatedAt: videoRequest.updatedAt,
    };
  }
}
