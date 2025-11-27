import { Injectable } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey: string, modelName?: string) {
    this.apiKey = apiKey;
    this.modelName = modelName || 'claude-3-5-sonnet-20241022';
    console.log(`[AnthropicProvider] Initialized with model: ${this.modelName}`);
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  getProviderName(): string {
    return 'Anthropic Claude';
  }

  getModelName(): string {
    return this.modelName;
  }
}
