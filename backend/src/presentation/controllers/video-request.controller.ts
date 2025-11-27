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

@Controller('video-requests')
export class VideoRequestController {
  constructor(
    private readonly generateAnimationHtmlUseCase: GenerateAnimationHtmlUseCase,
    private readonly renderVideoUseCase: RenderVideoUseCase,
    private readonly getVideoRequestUseCase: GetVideoRequestUseCase,
    private readonly generateScriptAndAudioUseCase: GenerateScriptAndAudioUseCase,
  ) {}

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
