import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;
  private ai: GoogleGenAI;

  constructor(apiKey: string, modelName?: string) {
    this.modelName = modelName || 'gemini-2.0-flash-exp';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    this.ai = new GoogleGenAI({ apiKey });
    console.log(`[GeminiProvider] Initialized with model: ${this.modelName}`);
  }

  async generateContent(prompt: string): Promise<string> {
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const result = await this.ai.models.generateContent({
      model: this.modelName,
      contents,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    if (!result.text) {
      throw new Error('AI response is empty');
    }

    return result.text;

    // const result = await this.model.generateContent(prompt);
    // const response = await result.response;
    // return response.text();
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  getModelName(): string {
    return this.modelName;
  }
}
