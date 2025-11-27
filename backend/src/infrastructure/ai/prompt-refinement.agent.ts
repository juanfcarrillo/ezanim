import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface RefinedPrompt {
  original: string;
  refined: string;
  keyPoints: string[];
  suggestedDuration: number; // in seconds
}

@Injectable()
export class PromptRefinementAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();
    
    if (this.aiProvider) {
      console.log(
        `[PromptRefinementAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn('[PromptRefinementAgent] No AI provider configured, using mock mode');
    }
  }

  async refinePrompt(userPrompt: string): Promise<RefinedPrompt> {
    console.log('[PromptRefinementAgent] Refining prompt:', userPrompt);

    // If no AI provider, use mock data
    if (!this.aiProvider) {
      return this.getMockRefinedPrompt(userPrompt);
    }

    try {
      const prompt = `You are an expert at creating educational video content. 
      
The user wants to create an explanatory video about: "${userPrompt}"

Your task is to:
1. Refine and expand the prompt to be more clear and detailed
2. Identify 3-5 key points that should be covered
3. Suggest an appropriate video duration in seconds (between 10-30 seconds)

Respond ONLY with a valid JSON object in this exact format:
{
  "refined": "detailed explanation text",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "suggestedDuration": 15
}`;

      const text = await this.aiProvider.generateContent(prompt);
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[PromptRefinementAgent] Failed to parse AI response, using mock');
        return this.getMockRefinedPrompt(userPrompt);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        original: userPrompt,
        refined: parsed.refined,
        keyPoints: parsed.keyPoints,
        suggestedDuration: parsed.suggestedDuration,
      };
    } catch (error) {
      console.error('[PromptRefinementAgent] AI API error:', error);
      return this.getMockRefinedPrompt(userPrompt);
    }
  }

  private getMockRefinedPrompt(userPrompt: string): RefinedPrompt {
    return {
      original: userPrompt,
      refined: `Detailed explanation: ${userPrompt}. This will be presented with clear visual elements and smooth animations to enhance understanding.`,
      keyPoints: [
        'Main concept introduction',
        'Step-by-step breakdown',
        'Visual examples',
        'Summary and conclusion',
      ],
      suggestedDuration: 15,
    };
  }
}
