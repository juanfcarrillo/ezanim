import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
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
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[GeminiProvider] Error generating content:', error);
      throw error;
    }
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  getModelName(): string {
    return this.modelName;
  }
}
