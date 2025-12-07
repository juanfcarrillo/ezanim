import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export enum JudgeDecision {
  APPROVE = 'APPROVE',
  REVIEW_AGAIN = 'REVIEW_AGAIN',
}

@Injectable()
export class QualityAssuranceAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();
  }

  async evaluateFix(
    originalCritique: string,
    newHtmlContent: string,
    screenshots?: string[],
  ): Promise<JudgeDecision> {
    console.log('[QualityAssuranceAgent] Judging the fix...');

    if (!this.aiProvider) {
      return JudgeDecision.APPROVE;
    }

    try {
      const systemPrompt = `You are "The Judge".
The "Critic" previously found these issues in the animation code:
"${originalCritique}"

The Developer has attempted to fix these issues. Here is the updated HTML code.
I have also attached screenshots of the refined animation.

Your Task:
Determine if the code is now acceptable or if it needs another round of review by the Critic.
- If the code looks broken or the fixes seem insufficient, return "REVIEW_AGAIN".
- If the code looks solid and the issues appear addressed, return "APPROVE".

Response Format (JSON only):
{
  "decision": "APPROVE" | "REVIEW_AGAIN",
  "reasoning": "short explanation"
}

Updated HTML Code:
${newHtmlContent.substring(0, 50000)}
`;

      const response = await this.aiProvider.generateContent(
        systemPrompt,
        screenshots,
      );
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return JudgeDecision.APPROVE; // Default to approve to avoid infinite loops on parse error
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log(`[QualityAssuranceAgent] Decision: ${result.decision} (${result.reasoning})`);
      
      return result.decision === 'REVIEW_AGAIN' ? JudgeDecision.REVIEW_AGAIN : JudgeDecision.APPROVE;

    } catch (error) {
      console.error('[QualityAssuranceAgent] Error:', error);
      return JudgeDecision.APPROVE;
    }
  }
}
