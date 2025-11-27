import { Injectable } from '@nestjs/common';
import { IVideoRequestRepository } from '@domain/repositories/video-request.repository.interface';
import { VideoRequest } from '@domain/entities/video-request.entity';

@Injectable()
export class InMemoryVideoRequestRepository implements IVideoRequestRepository {
  private videoRequests: Map<string, VideoRequest> = new Map();

  async save(videoRequest: VideoRequest): Promise<VideoRequest> {
    this.videoRequests.set(videoRequest.id, videoRequest);
    return videoRequest;
  }

  async findById(id: string): Promise<VideoRequest | null> {
    return this.videoRequests.get(id) || null;
  }

  async update(videoRequest: VideoRequest): Promise<VideoRequest> {
    this.videoRequests.set(videoRequest.id, videoRequest);
    return videoRequest;
  }

  async delete(id: string): Promise<void> {
    this.videoRequests.delete(id);
  }
}
