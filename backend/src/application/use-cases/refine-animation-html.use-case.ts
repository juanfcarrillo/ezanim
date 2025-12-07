import { Injectable } from '@nestjs/common';
import { VideoCreatorAgent } from '../../infrastructure/ai/video-creator.agent';

@Injectable()
export class RefineAnimationHtmlUseCase {
  constructor(private readonly videoCreatorAgent: VideoCreatorAgent) {}

  async execute(currentHtml: string, critique: string): Promise<string> {
    const result = await this.videoCreatorAgent.refineVideo(
      currentHtml,
      critique,
    );
    return result.html;
  }
}
