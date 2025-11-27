import { VideoRequestStatus } from '@domain/entities/video-request.entity';

export class VideoRequestResponseDto {
  id: string;
  userPrompt: string;
  refinedPrompt: string | null;
  status: VideoRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
