export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
}

export interface AIProvider {
  generateContent(prompt: string): Promise<string>;
  getProviderName(): string;
  getModelName(): string;
}
