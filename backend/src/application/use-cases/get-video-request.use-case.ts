import { Injectable } from '@nestjs/common';

@Injectable()
export class GetVideoRequestUseCase {
  constructor() {
    // TODO: Inject repositories
  }

  async execute(videoRequestId: string): Promise<any> {
    // TODO: Implement use case logic
    // 1. Find VideoRequest by id
    // 2. Return VideoRequestResponseDto
    throw new Error('Not implemented');
  }
}
