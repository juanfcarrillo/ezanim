import { Injectable } from '@nestjs/common';
import { InMemoryVideoRepository } from '@infrastructure/repositories/in-memory-video.repository';
import { VideoResponseDto } from '../dtos/video-response.dto';

@Injectable()
export class GetVideoUseCase {
  constructor(private readonly videoRepo: InMemoryVideoRepository) {}

  async execute(videoRequestId: string): Promise<VideoResponseDto> {
    // 1. Find Video by videoRequestId
    const video = await this.videoRepo.findByVideoRequestId(videoRequestId);

    if (!video) {
      throw new Error(`Video for request ${videoRequestId} not found`);
    }

    // 2. Return VideoResponseDto
    return {
      id: video.id,
      videoRequestId: video.videoRequestId,
      url: video.url,
      duration: video.duration,
      width: video.width,
      height: video.height,
      fps: video.fps,
      createdAt: video.createdAt,
    };
  }
}
