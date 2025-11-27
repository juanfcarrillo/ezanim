import { VideoRequest } from '../entities/video-request.entity';

export interface IVideoRequestRepository {
  save(videoRequest: VideoRequest): Promise<VideoRequest>;
  findById(id: string): Promise<VideoRequest | null>;
  update(videoRequest: VideoRequest): Promise<VideoRequest>;
  delete(id: string): Promise<void>;
}
