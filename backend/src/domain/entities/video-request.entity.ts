import * as crypto from 'crypto';

export class VideoRequest {
  constructor(
    public readonly id: string,
    public readonly userPrompt: string,
    public readonly refinedPrompt: string | null,
    public readonly htmlContent: string | null,
    public readonly audioPath: string | null,
    public readonly duration: number | null,
    public readonly status: VideoRequestStatus,
    public readonly aspectRatio: '16:9' | '9:16' | '1:1',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(userPrompt: string, aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'): VideoRequest {
    return new VideoRequest(
      crypto.randomUUID(),
      userPrompt,
      null,
      null,
      null,
      null,
      VideoRequestStatus.PENDING,
      aspectRatio,
      new Date(),
      new Date(),
    );
  }

  updateStatus(status: VideoRequestStatus): VideoRequest {
    return new VideoRequest(
      this.id,
      this.userPrompt,
      this.refinedPrompt,
      this.htmlContent,
      this.audioPath,
      this.duration,
      status,
      this.aspectRatio,
      this.createdAt,
      new Date(),
    );
  }

  updateRefinedPrompt(refinedPrompt: string): VideoRequest {
    return new VideoRequest(
      this.id,
      this.userPrompt,
      refinedPrompt,
      this.htmlContent,
      this.audioPath,
      this.duration,
      this.status,
      this.aspectRatio,
      this.createdAt,
      new Date(),
    );
  }

  updateHtmlContent(htmlContent: string): VideoRequest {
    return new VideoRequest(
      this.id,
      this.userPrompt,
      this.refinedPrompt,
      htmlContent,
      this.audioPath,
      this.duration,
      this.status,
      this.aspectRatio,
      this.createdAt,
      new Date(),
    );
  }

  updateAudioAndDuration(audioPath: string, duration: number): VideoRequest {
    return new VideoRequest(
      this.id,
      this.userPrompt,
      this.refinedPrompt,
      this.htmlContent,
      audioPath,
      duration,
      this.status,
      this.aspectRatio,
      this.createdAt,
      new Date(),
    );
  }
}

export enum VideoRequestStatus {
  PENDING = 'PENDING',
  GENERATING_HTML = 'GENERATING_HTML',
  PREVIEW_READY = 'PREVIEW_READY',
  RENDERING = 'RENDERING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
