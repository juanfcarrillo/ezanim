import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateVideoRequestUseCase } from '@application/use-cases/create-video-request.use-case';
import { GetVideoRequestUseCase } from '@application/use-cases/get-video-request.use-case';
import { GetVideoUseCase } from '@application/use-cases/get-video.use-case';
import { QueueService } from '@infrastructure/queue/queue.service';

@Controller('poc')
export class PocController {
  constructor(
    private readonly createVideoRequestUseCase: CreateVideoRequestUseCase,
    private readonly getVideoRequestUseCase: GetVideoRequestUseCase,
    private readonly getVideoUseCase: GetVideoUseCase,
    private readonly queueService: QueueService,
  ) {}

  @Post('test-video')
  async testVideoCreation(@Body() body: { prompt?: string }) {
    const prompt = body.prompt || 'Create an animated video explaining photosynthesis';

    console.log('='.repeat(60));
    console.log('🎬 PROOF OF CONCEPT - Starting Video Creation Test');
    console.log('='.repeat(60));
    console.log('Prompt:', prompt);
    console.log('');

    // Create video request
    const videoRequestId = await this.createVideoRequestUseCase.execute(prompt);

    console.log('✅ Video request created:', videoRequestId);
    console.log('');
    console.log('📝 You can track the progress using:');
    console.log(`   GET /poc/status/${videoRequestId}`);
    console.log(`   GET /poc/video/${videoRequestId}`);
    console.log('');

    return {
      success: true,
      videoRequestId,
      message: 'Video rendering started. Check status endpoint for progress.',
      endpoints: {
        status: `/poc/status/${videoRequestId}`,
        video: `/poc/video/${videoRequestId}`,
        jobStatus: `/poc/job-status/${videoRequestId}`,
      },
    };
  }

  @Get('status/:id')
  async getStatus(@Param('id') id: string) {
    try {
      const videoRequest = await this.getVideoRequestUseCase.execute(id);

      return {
        success: true,
        videoRequest,
        statusInfo: this.getStatusInfo(videoRequest.status),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('video/:videoRequestId')
  async getVideo(@Param('videoRequestId') videoRequestId: string) {
    try {
      const video = await this.getVideoUseCase.execute(videoRequestId);

      return {
        success: true,
        video,
        message: 'Video is ready! You can download it from the URL.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        hint: 'Video might still be rendering. Check status endpoint first.',
      };
    }
  }

  @Get('job-status/:videoRequestId')
  async getJobStatus(@Param('videoRequestId') videoRequestId: string) {
    // This would require storing job IDs, for now return a message
    return {
      message: 'Job status tracking not implemented in POC',
      hint: 'Use /poc/status/:id to check video request status',
    };
  }

  @Get('test-info')
  testInfo() {
    return {
      title: '🎬 Ezanim POC - Video Rendering Test',
      description: 'This endpoint tests the complete video rendering pipeline',
      pipeline: [
        '1. Prompt Refinement Agent - Improves user prompt',
        '2. Element Creation Agent - Generates HTML/CSS elements',
        '3. Animation Configuration Agent - Configures anime.js animations',
        '4. HTML Template Generator - Creates complete HTML page',
        '5. Puppeteer Service - Captures frames from browser',
        '6. FFmpeg Service - Encodes frames into MP4 video',
        '7. R2 Storage Service - Uploads video to Cloudflare R2',
      ],
      usage: {
        startTest: 'POST /poc/test-video with body: { "prompt": "your prompt here" }',
        checkStatus: 'GET /poc/status/:videoRequestId',
        getVideo: 'GET /poc/video/:videoRequestId',
      },
      requirements: [
        '✅ Redis must be running (for BullMQ queue)',
        '✅ FFmpeg must be installed on system',
        '⚠️  R2 credentials optional (will use mock mode)',
        '⚠️  Chrome/Chromium installed (Puppeteer will download if needed)',
      ],
      note: 'This POC uses mock AI agents. Real implementation would use OpenAI/Anthropic API.',
    };
  }

  private getStatusInfo(status: string): string {
    const statusMap = {
      PENDING: '⏳ Waiting in queue...',
      REFINING_PROMPT: '🤖 AI is refining your prompt...',
      CREATING_ELEMENTS: '🎨 AI is creating visual elements...',
      ANIMATING: '✨ AI is configuring animations...',
      RENDERING: '🎬 Rendering video (capturing frames & encoding)...',
      COMPLETED: '✅ Video is ready!',
      FAILED: '❌ Something went wrong',
    };

    return statusMap[status] || status;
  }
}
