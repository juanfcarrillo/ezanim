import { Injectable } from '@nestjs/common';
import { VideoRequest } from '@domain/entities/video-request.entity';
import { InMemoryVideoRequestRepository } from '@infrastructure/repositories/in-memory-video-request.repository';
import { QueueService } from '@infrastructure/queue/queue.service';

@Injectable()
export class CreateVideoRequestUseCase {
  constructor(
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute(userPrompt: string): Promise<string> {
    // 1. Create VideoRequest entity
    const videoRequest = VideoRequest.create(userPrompt);

    // 2. Save to repository
    await this.videoRequestRepo.save(videoRequest);

    // 3. Add job to queue for processing
    await this.queueService.addVideoRenderJob({
      videoRequestId: videoRequest.id,
      userPrompt: userPrompt,
    });

    console.log('[CreateVideoRequestUseCase] Created video request:', videoRequest.id);

    // 4. Return videoRequestId
    return videoRequest.id;
  }
}
