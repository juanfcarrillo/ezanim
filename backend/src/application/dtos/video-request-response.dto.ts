import { VideoRequestStatus } from '@domain/entities/video-request.entity';

export class VideoRequestResponseDto {
  id: string;
  userPrompt: string;
  refinedPrompt: string | null;
  htmlContent?: string | null;
  audioPath?: string | null;
  duration?: number | null;
  status: VideoRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
