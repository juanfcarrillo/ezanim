import { Injectable } from '@nestjs/common';
import { IVideoRepository } from '@domain/repositories/video.repository.interface';
import { Video } from '@domain/entities/video.entity';

@Injectable()
export class InMemoryVideoRepository implements IVideoRepository {
  private videos: Map<string, Video> = new Map();

  async save(video: Video): Promise<Video> {
    this.videos.set(video.id, video);
    return video;
  }

  async findById(id: string): Promise<Video | null> {
    return this.videos.get(id) || null;
  }

  async findByVideoRequestId(videoRequestId: string): Promise<Video | null> {
    return (
      Array.from(this.videos.values()).find((video) => video.videoRequestId === videoRequestId) ||
      null
    );
  }

  async delete(id: string): Promise<void> {
    this.videos.delete(id);
  }
}
