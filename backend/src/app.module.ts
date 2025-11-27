import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { VideoRequestController } from './presentation/controllers/video-request.controller';
import { VideoController } from './presentation/controllers/video.controller';
import { CreateVideoRequestUseCase } from './application/use-cases/create-video-request.use-case';
import { GetVideoRequestUseCase } from './application/use-cases/get-video-request.use-case';
import { GetVideoUseCase } from './application/use-cases/get-video.use-case';
import { InMemoryVideoRequestRepository } from './infrastructure/repositories/in-memory-video-request.repository';
import { InMemoryAnimationElementRepository } from './infrastructure/repositories/in-memory-animation-element.repository';
import { InMemoryVideoRepository } from './infrastructure/repositories/in-memory-video.repository';
import { PuppeteerService } from './infrastructure/puppeteer/puppeteer.service';
import { FFmpegService } from './infrastructure/ffmpeg/ffmpeg.service';
import { R2StorageService } from './infrastructure/storage/r2-storage.service';
import { QueueService } from './infrastructure/queue/queue.service';
import { VideoRenderProcessor } from './infrastructure/queue/video-render.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'video-render',
    }),
  ],
  controllers: [VideoRequestController, VideoController],
  providers: [
    // Use Cases
    CreateVideoRequestUseCase,
    GetVideoRequestUseCase,
    GetVideoUseCase,
    // Repositories
    InMemoryVideoRequestRepository,
    InMemoryAnimationElementRepository,
    InMemoryVideoRepository,
    // Services
    PuppeteerService,
    FFmpegService,
    R2StorageService,
    QueueService,
    // Processors
    VideoRenderProcessor,
  ],
})
export class AppModule {}
