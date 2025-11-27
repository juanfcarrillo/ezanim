import { Video } from '../entities/video.entity';

export interface IVideoRepository {
  save(video: Video): Promise<Video>;
  findById(id: string): Promise<Video | null>;
  findByVideoRequestId(videoRequestId: string): Promise<Video | null>;
  delete(id: string): Promise<void>;
}
