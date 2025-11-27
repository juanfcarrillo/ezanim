import { Injectable } from '@nestjs/common';

@Injectable()
export class GetVideoUseCase {
  constructor() {
    // TODO: Inject repositories
  }

  async execute(videoRequestId: string): Promise<any> {
    // TODO: Implement use case logic
    // 1. Find Video by videoRequestId
    // 2. Return VideoResponseDto
    throw new Error('Not implemented');
  }
}
