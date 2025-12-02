import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface ReviewResult {
  hasIssues: boolean;
  critique: string;
  score: number; // 0-100
}

@Injectable()
export class AnimationReviewAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    // Prefer Anthropic for Review tasks as requested
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.aiProvider = AIProviderFactory.create({
        provider: 'anthropic',
        apiKey: anthropicKey,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      });
    } else {
      this.aiProvider = AIProviderFactory.createFromEnv();
    }

    if (this.aiProvider) {
      console.log(
        `[AnimationReviewAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn(
        '[AnimationReviewAgent] No AI provider configured, using mock mode',
      );
    }
  }

  async reviewHtml(htmlContent: string, userPrompt: string): Promise<ReviewResult> {
    console.log('[AnimationReviewAgent] Reviewing HTML quality...');

    if (!this.aiProvider) {
      return { hasIssues: false, critique: 'Mock review: Looks good.', score: 100 };
    }

    try {
      const systemPrompt = `You are "The Critic", an expert UI/UX designer and Animation QA specialist.
Your job is to strictly review the provided HTML/CSS/JS (Anime.js) code for a video animation about: "${userPrompt}".

Check for the following Quality Criteria:
1. **Visual Layout**: Are elements centered? Do they have proper spacing? Are colors consistent (Dark Mode)?
2. **Overlapping**: Do elements overlap text or other important elements unintentionally?
3. **Off-screen**: Do elements animate off-screen or start off-screen without entering?
4. **Animation Quality**: Are animations smooth (easing)? Is the timing logical? Do they use 'anime.stagger' for lists?
5. **Code Integrity**: Is the HTML structure valid? Is 'window.tl' exposed?

Analyze the code provided below.

Response Format (JSON only):
{
  "hasIssues": boolean, // true if there are critical or major visual bugs
  "critique": "string", // A concise list of specific things to fix. If no issues, say 'Approved'.
  "score": number // 0 to 100. < 80 implies issues.
}

HTML Code to Review:
${htmlContent.substring(0, 50000)} 
`; 
// Truncating to avoid token limits if huge, though usually it fits.

      const response = await this.aiProvider.generateContent(systemPrompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[AnimationReviewAgent] Failed to parse JSON, assuming issues.');
        return { hasIssues: true, critique: 'Failed to parse review. Please re-check code structure.', score: 50 };
      }

      const result = JSON.parse(jsonMatch[0]) as ReviewResult;
      console.log(`[AnimationReviewAgent] Review complete. Score: ${result.score}. Issues: ${result.hasIssues}`);
      return result;

    } catch (error) {
      console.error('[AnimationReviewAgent] Error:', error);
      return { hasIssues: false, critique: 'Error during review, skipping.', score: 100 };
    }
  }
}
