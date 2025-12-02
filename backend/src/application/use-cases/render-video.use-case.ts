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

    if (
      videoRequest.status !== VideoRequestStatus.PREVIEW_READY &&
      videoRequest.status !== VideoRequestStatus.QA_COMPLETED
    ) {
      throw new Error(
        `VideoRequest ${videoRequestId} is not ready for rendering`,
      );
    }

    console.log('[RenderVideoUseCase] Queueing render job:', videoRequestId);

    // Calculate dimensions based on aspect ratio
    let width = 1920;
    let height = 1080;

    if (videoRequest.aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (videoRequest.aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    await this.queueService.addVideoRenderJob({
      videoRequestId,
      htmlContent,
      duration,
      audioPath,
      configuration: {
        width,
        height,
        fps: 60,
      },
    });
  }
}
