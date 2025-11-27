import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VideoRenderJobData } from './video-render.processor';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('video-render') private videoRenderQueue: Queue) {}

  async addVideoRenderJob(data: VideoRenderJobData): Promise<string> {
    const job = await this.videoRenderQueue.add('render', data);
    return job.id as string;
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.videoRenderQueue.getJob(jobId);
    if (!job) {
      return null;
    }
    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
    };
  }
}
