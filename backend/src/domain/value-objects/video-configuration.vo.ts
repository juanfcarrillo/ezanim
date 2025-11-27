export class VideoConfiguration {
  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly fps: number,
    public readonly duration: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.width <= 0 || this.height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }
    if (this.fps <= 0 || this.fps > 120) {
      throw new Error('FPS must be between 1 and 120');
    }
    if (this.duration <= 0) {
      throw new Error('Duration must be a positive number');
    }
  }

  static default(): VideoConfiguration {
    return new VideoConfiguration(1920, 1080, 60, 10);
  }
}
