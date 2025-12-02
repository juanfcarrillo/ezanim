import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { CreateVideoRequestDto } from '@application/dtos/create-video-request.dto';
import { VideoRequestResponseDto } from '@application/dtos/video-request-response.dto';
import { GenerateAnimationHtmlUseCase } from '@application/use-cases/generate-animation-html.use-case';
import { RenderVideoUseCase } from '@application/use-cases/render-video.use-case';
import { GetVideoRequestUseCase } from '@application/use-cases/get-video-request.use-case';
import { GenerateScriptAndAudioUseCase } from '@application/use-cases/generate-script-and-audio.use-case';
import { GenerateVideoFromScriptUseCase } from '@application/use-cases/generate-video-from-script.use-case';
import { RefineAnimationHtmlUseCase } from '@application/use-cases/refine-animation-html.use-case';
import { ElevenLabsService } from '../../infrastructure/elevenlabs/elevenlabs.service';
import { TranscriptionService } from '../../infrastructure/transcription/transcription.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Controller('video-requests')
export class VideoRequestController {
  constructor(
    private readonly generateAnimationHtmlUseCase: GenerateAnimationHtmlUseCase,
    private readonly renderVideoUseCase: RenderVideoUseCase,
    private readonly getVideoRequestUseCase: GetVideoRequestUseCase,
    private readonly generateScriptAndAudioUseCase: GenerateScriptAndAudioUseCase,
    private readonly generateVideoFromScriptUseCase: GenerateVideoFromScriptUseCase,
    private readonly refineAnimationHtmlUseCase: RefineAnimationHtmlUseCase,
    private readonly elevenLabsService: ElevenLabsService,
    private readonly transcriptionService: TranscriptionService,
  ) {}

  @Post('refine')
  async refine(@Body() body: { htmlContent: string; critique: string }) {
    const refinedHtml = await this.refineAnimationHtmlUseCase.execute(
      body.htmlContent,
      body.critique,
    );
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

    // 1. Phase 1: Generate Script, Audio, and Transcription
    const phase1Result = await this.generateScriptAndAudioUseCase.execute(
      body.prompt,
    );
    
    // Save audio to temp file
    const audioDir = path.join(
      process.env.VIDEO_OUTPUT_DIR || '/tmp/ezanim',
      'audio',
    );
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const requestId = crypto.randomUUID();
    const audioPath = path.join(audioDir, `${requestId}.mp3`);
    fs.writeFileSync(audioPath, phase1Result.audioBuffer);
    
    console.log(`[VideoRequestController] Audio saved to: ${audioPath}`);

    // Calculate duration
    const duration =
      phase1Result.words.length > 0
        ? phase1Result.words[phase1Result.words.length - 1].end + 2
        : 20; // Default fallback

    // 2. Phase 2: Generate Video HTML and Prepare for Render
    await this.generateVideoFromScriptUseCase.execute({
      requestId,
      initialRequest: body.prompt,
      script: phase1Result.script,
      audioPath,
      vtt: phase1Result.vtt,
      duration,
      aspectRatio: body.aspectRatio || '16:9',
    });

    return {
      success: true,
      requestId,
      message: 'Full video creation pipeline started',
      data: {
        prompt: body.prompt,
        script: phase1Result.script,
        duration,
        audioPath,
        aspectRatio: body.aspectRatio || '16:9',
      },
      endpoints: {
        status: `/poc/status/${requestId}`,
        preview: `/poc/preview/${requestId}`,
        render: `/poc/render/${requestId}`,
      },
    };
  }

  @Post('create-from-mock')
  async createFromMock() {
    // 1. Read Mock File
    const mockFilePath = path.join(
      process.cwd(),
      '../samples/facade-pattern/parametters.txt',
    );
    const content = fs.readFileSync(mockFilePath, 'utf-8');

    // 2. Parse Content
    const requestMatch = content.match(/Request: (.*)/);
    const scriptMatch = content.match(/Elevenlabs script: ([\s\S]*)/);

    if (!requestMatch || !scriptMatch) {
      throw new Error('Invalid mock file format');
    }

    const initialRequest = requestMatch[1].trim();
    const script = scriptMatch[1].trim();

    // 3. Generate Audio
    console.log('Generating audio from mock script...');
    const audioBuffer = await this.elevenLabsService.generateAudio(script);

    // Save audio to temp file for rendering later
    const audioDir = path.join(
      process.env.VIDEO_OUTPUT_DIR || '/tmp/ezanim',
      'audio',
    );
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    const requestId = crypto.randomUUID();
    const audioPath = path.join(audioDir, `${requestId}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);

    // 4. Transcribe
    console.log('Transcribing audio...');
    const { vtt, words } =
      await this.transcriptionService.transcribeAudio(audioBuffer);

    // Calculate duration from words or audio file (approx)
    const duration = words.length > 0 ? words[words.length - 1].end + 2 : 30; // Add buffer

    // 5. Execute Phase 2
    console.log('Executing Phase 2...');
    await this.generateVideoFromScriptUseCase.execute({
      requestId,
      initialRequest,
      script,
      audioPath,
      vtt,
      duration,
      aspectRatio: '16:9',
    });

    return {
      message: 'Video creation started from mock',
      requestId,
      initialRequest,
      script,
    };
  }

  @Post('generate-script-audio')
  async generateScriptAudio(@Body() body: { prompt: string }) {
    return await this.generateScriptAndAudioUseCase.execute(body.prompt);
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
