import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateVideoRequestUseCase {
  constructor() {
    // TODO: Inject dependencies (repositories, queue service)
  }

  async execute(userPrompt: string): Promise<string> {
    // TODO: Implement use case logic
    // 1. Create VideoRequest entity
    // 2. Save to repository
    // 3. Add job to queue for processing
    // 4. Return videoRequestId
    throw new Error('Not implemented');
  }
}
