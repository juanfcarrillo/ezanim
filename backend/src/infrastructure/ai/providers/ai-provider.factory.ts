import { Injectable } from '@nestjs/common';
import { AIProvider, AIProviderConfig } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';

@Injectable()
export class AIProviderFactory {
  static create(config: AIProviderConfig): AIProvider {
    switch (config.provider) {
      case 'gemini':
        return new GeminiProvider(config.apiKey, config.model);
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.model);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.model);
      default:
        throw new Error(`Unknown AI provider`);
    }
  }

  static createFromEnv(options?: { modelEnvVar?: string }): AIProvider | null {
    const provider = (process.env.AI_PROVIDER ||
      'gemini') as AIProviderConfig['provider'];

    let apiKey: string | undefined;
    let model: string | undefined;

    switch (provider) {
      case 'gemini':
        apiKey = process.env.GEMINI_API_KEY;
        model =
          (options?.modelEnvVar && process.env[options.modelEnvVar]) ||
          process.env.GEMINI_MODEL;
        break;
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        model =
          (options?.modelEnvVar && process.env[options.modelEnvVar]) ||
          process.env.OPENAI_MODEL;
        break;
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY;
        model =
          (options?.modelEnvVar && process.env[options.modelEnvVar]) ||
          process.env.ANTHROPIC_MODEL;
        break;
    }

    if (!apiKey) {
      console.warn(
        `[AIProviderFactory] No API key found for provider: ${provider}`,
      );
      return null;
    }

    return AIProviderFactory.create({ provider, apiKey, model });
  }
}
