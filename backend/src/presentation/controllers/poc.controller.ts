import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { GenerateAnimationHtmlUseCase } from '@application/use-cases/generate-animation-html.use-case';
import { RenderVideoUseCase } from '@application/use-cases/render-video.use-case';
import { GetVideoRequestUseCase } from '@application/use-cases/get-video-request.use-case';
import { GetVideoUseCase } from '@application/use-cases/get-video.use-case';
import { GenerateVideoFromScriptUseCase } from '@application/use-cases/generate-video-from-script.use-case';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Controller('poc')
export class PocController {
  constructor(
    private readonly generateAnimationHtmlUseCase: GenerateAnimationHtmlUseCase,
    private readonly renderVideoUseCase: RenderVideoUseCase,
    private readonly getVideoRequestUseCase: GetVideoRequestUseCase,
    private readonly getVideoUseCase: GetVideoUseCase,
    private readonly generateVideoFromScriptUseCase: GenerateVideoFromScriptUseCase,
  ) {}

  @Post('test-script-video')
  async testScriptVideo(
    @Body()
    body: {
      prompt: string;
      script: string;
      vtt: string;
      duration?: number;
      audioPath?: string;
      aspectRatio?: '16:9' | '9:16' | '1:1';
    },
  ) {
    const requestId = uuidv4();
    console.log('='.repeat(60));
    console.log('🎬 POC - Starting Script-to-Video Test');
    console.log('='.repeat(60));
    console.log('Request ID:', requestId);
    console.log('Prompt:', body.prompt);

    // Estimate duration from script length if not provided (rough approx)
    // or default to 20s
    const duration = body.duration || 20;

    await this.generateVideoFromScriptUseCase.execute({
      requestId,
      initialRequest: body.prompt,
      script: body.script,
      vtt: body.vtt,
      audioPath: body.audioPath || '/tmp/ezanim/mock-audio.mp3', // Use provided path or default
      duration,
      aspectRatio: body.aspectRatio || '16:9',
    });

    return {
      success: true,
      requestId,
      message:
        'Video generation from script started. HTML will be ready for preview soon.',
      endpoints: {
        status: `/poc/status/${requestId}`,
        preview: `/poc/preview/${requestId}`,
        render: `/poc/render/${requestId}`,
      },
    };
  }

  @Get('preview/:requestId')
  async previewHtml(@Param('requestId') requestId: string) {
    try {
      const videoRequest = await this.getVideoRequestUseCase.execute(requestId);

      if (!videoRequest.htmlContent) {
        return `<html><body><h1>Preview not ready</h1><p>Status: ${videoRequest.status}</p></body></html>`;
      }

      return videoRequest.htmlContent;
    } catch (error: any) {
      return `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`;
    }
  }

  @Get('audio/:requestId')
  async getAudio(@Param('requestId') requestId: string, @Res() res: Response) {
    try {
      const videoRequest = await this.getVideoRequestUseCase.execute(requestId);

      if (!videoRequest.audioPath) {
        return res.status(404).json({ error: 'Audio not found' });
      }

      // Check if file exists
      if (!fs.existsSync(videoRequest.audioPath)) {
        return res.status(404).json({ error: 'Audio file not found on disk' });
      }

      // Serve the audio file
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.sendFile(videoRequest.audioPath);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  @Post('render/:requestId')
  async triggerRender(@Param('requestId') requestId: string) {
    try {
      const videoRequest = await this.getVideoRequestUseCase.execute(requestId);

      if (!videoRequest.htmlContent) {
        return { success: false, message: 'HTML content not generated yet.' };
      }

      console.log(`[PocController] Triggering render for ${requestId}`);

      await this.renderVideoUseCase.execute(
        requestId,
        videoRequest.htmlContent,
        videoRequest.duration || 15,
        videoRequest.audioPath || undefined,
      );

      return {
        success: true,
        message: 'Rendering started',
        statusEndpoint: `/poc/status/${requestId}`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @Post('test-video')
  async testVideoCreation(@Body() body: { prompt?: string }) {
    const prompt =
      body.prompt || 'Create an animated video explaining photosynthesis';

    console.log('='.repeat(60));
    console.log('🎬 PROOF OF CONCEPT - Starting Video Creation Test');
    console.log('='.repeat(60));
    console.log('Prompt:', prompt);
    console.log('');

    const result = await this.generateAnimationHtmlUseCase.execute(prompt);

    console.log('✅ HTML generated:', result.id);
    console.log('');
    console.log('🎬 Auto-rendering video...');

    await this.renderVideoUseCase.execute(
      result.id,
      result.htmlContent,
      result.duration,
    );

    console.log('✅ Video rendering started');
    console.log('');
    console.log('📝 You can track the progress using:');
    console.log(`   GET /poc/status/${result.id}`);
    console.log(`   GET /poc/video/${result.id}`);
    console.log('');

    return {
      success: true,
      videoRequestId: result.id,
      message: 'Video rendering started. Check status endpoint for progress.',
      endpoints: {
        status: `/poc/status/${result.id}`,
        video: `/poc/video/${result.id}`,
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
    } catch (error: any) {
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
    } catch (error: any) {
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
      videoRequestId,
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
        startTest:
          'POST /poc/test-video with body: { "prompt": "your prompt here" }',
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
    const statusMap: Record<string, string> = {
      PENDING: '⏳ Waiting...',
      GENERATING_HTML: '🤖 AI is generating animation HTML...',
      PREVIEW_READY: '👀 Preview ready for review',
      QA_COMPLETED: '✨ QA Cycle Completed (Judge Approved)',
      RENDERING: '🎬 Rendering video (capturing frames & encoding)...',
      COMPLETED: '✅ Video is ready!',
      FAILED: '❌ Something went wrong',
    };

    return statusMap[status] || status;
  }
}
