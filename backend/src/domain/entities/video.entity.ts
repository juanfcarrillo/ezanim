export class Video {
  constructor(
    public readonly id: string,
    public readonly videoRequestId: string,
    public readonly url: string,
    public readonly s3Key: string,
    public readonly duration: number,
    public readonly width: number,
    public readonly height: number,
    public readonly fps: number,
    public readonly createdAt: Date,
  ) {}

  static create(
    videoRequestId: string,
    url: string,
    s3Key: string,
    duration: number,
    width: number,
    height: number,
    fps: number,
  ): Video {
    return new Video(
      crypto.randomUUID(),
      videoRequestId,
      url,
      s3Key,
      duration,
      width,
      height,
      fps,
      new Date(),
    );
  }
}
