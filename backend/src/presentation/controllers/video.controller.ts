import { Controller, Get, Param } from '@nestjs/common';
import { VideoResponseDto } from '@application/dtos/video-response.dto';
import { GetVideoUseCase } from '@application/use-cases/get-video.use-case';

@Controller('videos')
export class VideoController {
  constructor(private readonly getVideoUseCase: GetVideoUseCase) {}

  @Get('by-request/:videoRequestId')
  async getByVideoRequestId(
    @Param('videoRequestId') videoRequestId: string,
  ): Promise<VideoResponseDto> {
    return await this.getVideoUseCase.execute(videoRequestId);
  }
}
