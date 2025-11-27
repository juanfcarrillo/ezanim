import { Controller, Post, Get, Body, Param, ValidationPipe } from '@nestjs/common';
import { CreateVideoRequestDto } from '@application/dtos/create-video-request.dto';
import { VideoRequestResponseDto } from '@application/dtos/video-request-response.dto';
import { CreateVideoRequestUseCase } from '@application/use-cases/create-video-request.use-case';
import { GetVideoRequestUseCase } from '@application/use-cases/get-video-request.use-case';

@Controller('video-requests')
export class VideoRequestController {
  constructor(
    private readonly createVideoRequestUseCase: CreateVideoRequestUseCase,
    private readonly getVideoRequestUseCase: GetVideoRequestUseCase,
  ) {}

  @Post()
  async create(
    @Body(new ValidationPipe()) dto: CreateVideoRequestDto,
  ): Promise<{ id: string }> {
    const id = await this.createVideoRequestUseCase.execute(dto.userPrompt);
    return { id };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<VideoRequestResponseDto> {
    return await this.getVideoRequestUseCase.execute(id);
  }
}
