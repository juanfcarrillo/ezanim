export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
}

export interface AIProvider {
  generateContent(prompt: string, imagePaths?: string[]): Promise<string>;
  generateEmbedding?(text: string): Promise<number[]>;
  getProviderName(): string;
  getModelName(): string;
}
