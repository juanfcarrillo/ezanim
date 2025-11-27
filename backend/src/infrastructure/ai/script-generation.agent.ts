import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface GeneratedScript {
  script: string;
  estimatedDuration: number;
}

@Injectable()
export class ScriptGenerationAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();

    if (this.aiProvider) {
      console.log(
        `[ScriptGenerationAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn(
        '[ScriptGenerationAgent] No AI provider configured, using mock mode',
      );
    }
  }

  async generateScript(topic: string): Promise<GeneratedScript> {
    console.log('[ScriptGenerationAgent] Generating script for:', topic);

    if (!this.aiProvider) {
      return this.getMockScript(topic);
    }

    try {
      const prompt = `You are an expert scriptwriter for short explanatory videos.
The user wants a script about: "${topic}"

Your task is to write a natural-sounding script for a voiceover.
CRITICAL: You MUST use ElevenLabs SSML tags to control the pacing and delivery.
Follow these best practices:
1. Use <break time="x.xs" /> for natural pauses (e.g., <break time="0.5s" /> after sentences, <break time="1.0s" /> between sections).
2. Do NOT use too many breaks or it will sound unnatural.
3. Keep the script concise and engaging.
4. The script should be suitable for a 15-30 second video unless the topic requires more.

Respond ONLY with a valid JSON object in this exact format:
{
  "script": "The full script text with SSML tags...",
  "estimatedDuration": 20
}`;

      const text = await this.aiProvider.generateContent(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(
          '[ScriptGenerationAgent] Failed to parse AI response, using mock',
        );
        return this.getMockScript(topic);
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        script: string;
        estimatedDuration: number;
      };

      return {
        script: parsed.script,
        estimatedDuration: parsed.estimatedDuration,
      };
    } catch (error) {
      console.error('[ScriptGenerationAgent] AI API error:', error);
      return this.getMockScript(topic);
    }
  }

  private getMockScript(topic: string): GeneratedScript {
    return {
      script: `Welcome to this video about ${topic}. <break time="0.5s" /> Let's dive in. <break time="1.0s" /> That's all for now.`,
      estimatedDuration: 10,
    };
  }
}
