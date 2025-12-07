export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
}

export interface AIProvider {
  generateContent(prompt: string, imagePaths?: string[]): Promise<string>;
  getProviderName(): string;
  getModelName(): string;
}
