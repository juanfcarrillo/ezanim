import { Injectable } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string, modelName?: string) {
    this.apiKey = apiKey;
    this.modelName = modelName || 'gpt-4o-mini';
    console.log(`[OpenAIProvider] Initialized with model: ${this.modelName}`);
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  getModelName(): string {
    return this.modelName;
  }
}
