import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateVideoRequestDto } from '@application/dtos/create-video-request.dto';
import { VideoRequestResponseDto } from '@application/dtos/video-request-response.dto';
import { GenerateAnimationHtmlUseCase } from '@application/use-cases/generate-animation-html.use-case';
import { RenderVideoUseCase } from '@application/use-cases/render-video.use-case';
import { GetVideoRequestUseCase } from '@application/use-cases/get-video-request.use-case';
import { RefineAnimationHtmlUseCase } from '@application/use-cases/refine-animation-html.use-case';
import { InMemoryVideoRequestRepository } from '../../infrastructure/repositories/in-memory-video-request.repository';
import {
  VideoRequest,
  VideoRequestStatus,
} from '../../domain/entities/video-request.entity';
import * as crypto from 'crypto';

@Controller('video-requests')
export class VideoRequestController {
  constructor(
    private readonly generateAnimationHtmlUseCase: GenerateAnimationHtmlUseCase,
    private readonly renderVideoUseCase: RenderVideoUseCase,
    private readonly getVideoRequestUseCase: GetVideoRequestUseCase,
    private readonly refineAnimationHtmlUseCase: RefineAnimationHtmlUseCase,
    private readonly videoRequestRepo: InMemoryVideoRequestRepository,
    @InjectQueue('video-creation') private readonly videoCreationQueue: Queue,
  ) {}

  @Post('refine')
  async refine(@Body() body: { requestId: string; critique: string }) {
    const videoRequest = await this.videoRequestRepo.findById(body.requestId);
    if (!videoRequest) {
      throw new NotFoundException('Video request not found');
    }

    if (!videoRequest.htmlContent) {
      throw new BadRequestException('No HTML content to refine');
    }

    const refinedHtml = await this.refineAnimationHtmlUseCase.execute(
      videoRequest.htmlContent,
      body.critique,
    );

    const updatedRequest = videoRequest.updateHtmlContent(refinedHtml);
    await this.videoRequestRepo.save(updatedRequest);

    return { htmlContent: refinedHtml };
  }

  @Post('create-full')
  async createFullVideo(
    @Body()
    body: {
      prompt: string;
      aspectRatio?: '16:9' | '9:16' | '1:1';
    },
  ) {
    console.log(
      `[VideoRequestController] Starting full video creation for: "${body.prompt}" with aspect ratio: ${body.aspectRatio || '16:9'}`,
    );

    const requestId = crypto.randomUUID();
    const aspectRatio = body.aspectRatio || '16:9';

    // 1. Create initial VideoRequest record
    const videoRequest = new VideoRequest(
      requestId,
      body.prompt,
      null, // refinedPrompt
      null, // htmlContent
      null, // htmlVersionId
      null, // audioPath
      0, // duration
      VideoRequestStatus.PENDING,
      aspectRatio,
      new Date(),
      new Date(),
    );
    await this.videoRequestRepo.save(videoRequest);

    // 2. Add job to queue
    await this.videoCreationQueue.add('create-video', {
      requestId,
      prompt: body.prompt,
      aspectRatio,
    });

    console.log(
      `[VideoRequestController] Job added to queue for request: ${requestId}`,
    );

    return {
      success: true,
      requestId,
      message: 'Video creation started in background',
    };
  }

  @Post('generate')
  async generate(
    @Body(new ValidationPipe()) dto: CreateVideoRequestDto,
  ): Promise<{
    id: string;
    htmlContent: string;
    duration: number;
    description: string;
  }> {
    return await this.generateAnimationHtmlUseCase.execute(dto.userPrompt);
  }

  @Post(':id/render')
  async render(
    @Param('id') id: string,
    @Body() body: { htmlContent: string; duration: number },
  ): Promise<{ message: string }> {
    await this.renderVideoUseCase.execute(id, body.htmlContent, body.duration);
    return { message: 'Video rendering started' };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<VideoRequestResponseDto> {
    return await this.getVideoRequestUseCase.execute(id);
  }
}
