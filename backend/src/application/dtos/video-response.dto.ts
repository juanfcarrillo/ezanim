export class VideoResponseDto {
  id: string;
  videoRequestId: string;
  url: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  createdAt: Date;
}
