import { Injectable } from '@nestjs/common';
import { InMemoryVideoRequestRepository } from '@infrastructure/repositories/in-memory-video-request.repository';
import { QueueService } from '@infrastructure/queue/queue.service';
import { VideoRequestStatus } from '@domain/entities/video-request.entity';

@Injectable()
export class RenderVideoUseCase {
  constructor(
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute(
    videoRequestId: string,
    htmlContent: string,
    duration: number,
    audioPath?: string,
  ): Promise<void> {
    const videoRequest = await this.videoRequestRepo.findById(videoRequestId);

    if (!videoRequest) {
      throw new Error(`VideoRequest ${videoRequestId} not found`);
    }

    if (videoRequest.status !== VideoRequestStatus.PREVIEW_READY) {
      throw new Error(
        `VideoRequest ${videoRequestId} is not ready for rendering`,
      );
    }

    console.log('[RenderVideoUseCase] Queueing render job:', videoRequestId);

    await this.queueService.addVideoRenderJob({
      videoRequestId,
      htmlContent,
      duration,
      audioPath,
    });
  }
}
