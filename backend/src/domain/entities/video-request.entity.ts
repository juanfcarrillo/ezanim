export class VideoRequest {
  constructor(
    public readonly id: string,
    public readonly userPrompt: string,
    public readonly refinedPrompt: string | null,
    public readonly status: VideoRequestStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(userPrompt: string): VideoRequest {
    return new VideoRequest(
      crypto.randomUUID(),
      userPrompt,
      null,
      VideoRequestStatus.PENDING,
      new Date(),
      new Date(),
    );
  }

  updateStatus(status: VideoRequestStatus): VideoRequest {
    return new VideoRequest(
      this.id,
      this.userPrompt,
      this.refinedPrompt,
      status,
      this.createdAt,
      new Date(),
    );
  }

  updateRefinedPrompt(refinedPrompt: string): VideoRequest {
    return new VideoRequest(
      this.id,
      this.userPrompt,
      refinedPrompt,
      this.status,
      this.createdAt,
      new Date(),
    );
  }
}

export enum VideoRequestStatus {
  PENDING = 'PENDING',
  REFINING_PROMPT = 'REFINING_PROMPT',
  CREATING_ELEMENTS = 'CREATING_ELEMENTS',
  ANIMATING = 'ANIMATING',
  RENDERING = 'RENDERING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
