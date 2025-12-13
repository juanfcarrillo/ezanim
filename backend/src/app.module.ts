import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { VideoRequestController } from './presentation/controllers/video-request.controller';
import { VideoController } from './presentation/controllers/video.controller';
import { PocController } from './presentation/controllers/poc.controller';
import { FilesController } from './presentation/controllers/files.controller';
import { GenerateAnimationHtmlUseCase } from './application/use-cases/generate-animation-html.use-case';
import { RenderVideoUseCase } from './application/use-cases/render-video.use-case';
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
import { VideoCreationProcessor } from './infrastructure/queue/video-creation.processor';
import { VideoCreatorAgent } from './infrastructure/ai/video-creator.agent';
import { AnimationReviewAgent } from './infrastructure/ai/animation-review.agent';
import { QualityAssuranceAgent } from './infrastructure/ai/quality-assurance.agent';
import { ScriptGenerationAgent } from './infrastructure/ai/script-generation.agent';
import { ElevenLabsService } from './infrastructure/elevenlabs/elevenlabs.service';
import { TranscriptionService } from './infrastructure/transcription/transcription.service';
import { GenerateScriptAndAudioUseCase } from './application/use-cases/generate-script-and-audio.use-case';
import { GenerateVideoFromScriptUseCase } from './application/use-cases/generate-video-from-script.use-case';
import { RefineAnimationHtmlUseCase } from './application/use-cases/refine-animation-html.use-case';
import { VectorStoreService } from './infrastructure/ai/vector-store/vector-store.service';
import { AssetRetrievalAgent } from './infrastructure/ai/asset-retrieval.agent';

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
    BullModule.registerQueue({
      name: 'video-creation',
    }),
  ],
  controllers: [VideoRequestController, VideoController, PocController, FilesController],
  providers: [
    // Use Cases
    GenerateAnimationHtmlUseCase,
    RenderVideoUseCase,
    GetVideoRequestUseCase,
    GetVideoUseCase,
    GenerateScriptAndAudioUseCase,
    GenerateVideoFromScriptUseCase,
    RefineAnimationHtmlUseCase,
    // Repositories
    InMemoryVideoRequestRepository,
    InMemoryAnimationElementRepository,
    InMemoryVideoRepository,
    // Services
    PuppeteerService,
    FFmpegService,
    R2StorageService,
    QueueService,
    ElevenLabsService,
    TranscriptionService,
    VectorStoreService,
    // AI Agent
    VideoCreatorAgent,
    AnimationReviewAgent,
    QualityAssuranceAgent,
    ScriptGenerationAgent,
    AssetRetrievalAgent,
    // Processors
    VideoRenderProcessor,
    VideoCreationProcessor,
  ],
})
export class AppModule {}
