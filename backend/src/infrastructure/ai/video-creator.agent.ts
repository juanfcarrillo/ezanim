import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface VideoCreationResult {
  html: string;
  criticalTimestamps: number[];
}

@Injectable()
export class VideoCreatorAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();

    if (this.aiProvider) {
      console.log(
        `[VideoCreatorAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn(
        '[VideoCreatorAgent] No AI provider configured, using mock mode',
      );
    }
  }

  async createVideo(
    userPrompt: string,
    duration: number = 15,
    vtt?: string,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  ): Promise<VideoCreationResult> {
    console.log(
      `[VideoCreatorAgent] Creating video for prompt: "${userPrompt}" with aspect ratio: ${aspectRatio}`,
    );

    if (!this.aiProvider) {
      throw new Error('No AI provider configured');
    }

    try {
      const timingContext = vtt
        ? `\nContext - Timing (VTT):\nUse these timestamps to synchronize the animation events exactly with the voiceover. The VTT file contains the start and end times for each spoken segment. You MUST use these times to schedule your animations using the 'offset' parameter in anime.timeline().add().\n\nVTT Content:\n"${vtt}"\n`
        : '';

      const scalingInstruction =
        aspectRatio === '9:16'
          ? '\n- CRITICAL FOR 9:16: Since this is a vertical video, all elements (text, icons, SVGs) must be SCALED UP significantly (2x-3x larger than desktop) to be legible on mobile screens. Use large font sizes (e.g., 3rem+ for headings) and fill the width of the screen.'
          : '';

      const systemPrompt = `Act as an expert frontend web developer and creative animator.

I want you to create an interactive, educational animation about: "${userPrompt}".
${timingContext}
Strict Technical Requirements:

Format: A single HTML file containing all necessary CSS and JS.

Libraries:
- Use Anime.js (v3.2.1 via CDN) for all animations.
- Use FontAwesome (v6.4.0 via CDN) for icons.
- Use Google Fonts: Import 'Poppins' (weights 400, 600, 800) and 'Roboto' (400, 500) for professional typography.
- Illustrations: Use detailed, multi-colored inline SVGs for main visuals. Avoid simple geometric shapes unless abstract.

Visual Structure (Full Screen Cinematic):
- The animation must occupy the entire viewport (100vw, 100vh).
- The layout must be optimized for a **${aspectRatio}** aspect ratio.${scalingInstruction}
- No visible video player controls (play button, progress bar, etc.) should be rendered.
- CRITICAL: Do NOT include any "Click to Start", "Play", or "Start Learning" overlays, buttons, or splash screens. The video should be purely the animation content visible from the start.
- Stage: The entire body is the stage. Use absolute positioning for elements relative to the viewport.
- Subtitles: A clean, cinematic subtitle overlay at the bottom center, with a semi-transparent background for readability. Use 'Roboto' font.
- Typography: Use 'Poppins' for headings and 'Roboto' for body text.

Animation Style & Visual Hooks (CRITICAL):

The first 3-5 seconds are the most important. You MUST include a "Visual Hook" at the very beginning (0ms - 3000ms) to captivate the viewer.
Implement one or more of these specific hook techniques:
- Explosive Transitions: Elements bursting into the scene or defying gravity.
- Kinetic Typography: Text that animates dynamically (whooshes, explosions) to emphasize the topic.
- Morphing Reveals: Mundane objects morphing into fantastical ones.
- Scale Shocks: Dramatic zooms from micro to macro views.
- Loop Teases: Hypnotic 1-2 second loops before the main narrative.

General Animation Guidelines:
- Use anime.timeline() to sequence the entire story.
- Easing: Use 'easeOutExpo' for snappy entrances and 'easeInOutQuad' for smooth transitions. Avoid excessive bouncing unless playful.
- Dynamic Entrances: Elements should slide in, scale up, or morph.
- Micro-interactions: Use anime.stagger(100) to animate groups of elements (e.g., lists, particles) for a premium feel.
- Colors: Use a professional color palette (e.g., Deep Blue & Vibrant Orange, or Dark Mode with Neon accents). Use CSS variables.

Animation Script (The Scenes):
- Scene 1 (The Setup/Problem): Describe what elements fall in and what the initial state is.
- Scene 2 (The Action/Process): Describe how the elements interact or transform.
- Scene 3 (The Conclusion): Describe the final state or resolution.

Code Logic:
- Expose the timeline globally as 'window.tl' so it can be controlled externally.
- IMPORTANT: Do NOT auto-play the timeline. It should wait for user interaction or external control.
- CRITICAL: You MUST include a comment in the <head> section with a list of critical timestamps (in milliseconds) for the animation.
  Format: <!-- CRITICAL_TIMESTAMPS: [0, 1500, 3000, 5000] -->
  These timestamps should correspond to:
  1. The start (0ms).
  2. Key scene transitions.
  3. Major element entrances/exits.
  4. The final state.

The code must be complete, copy-pasteable, and runnable. Return ONLY the HTML code, no markdown code blocks.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      // Clean up response if it contains markdown code blocks
      let html = response.trim();
      if (html.startsWith('```html')) {
        html = html.replace(/^```html/, '').replace(/```$/, '');
      } else if (html.startsWith('```')) {
        html = html.replace(/^```/, '').replace(/```$/, '');
      }

      // Parse timestamps
      const timestampMatch = html.match(
        /<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/,
      );
      let criticalTimestamps: number[] = [0, duration * 1000]; // Default fallback
      if (timestampMatch) {
        try {
          criticalTimestamps = JSON.parse(timestampMatch[1]);
        } catch (e) {
          console.warn(
            '[VideoCreatorAgent] Failed to parse critical timestamps:',
            e,
          );
        }
      }

      return { html: html.trim(), criticalTimestamps };
    } catch (error) {
      console.error('[VideoCreatorAgent] AI API error:', error);
      throw error;
    }
  }

  async refineVideo(
    currentHtml: string,
    critique: string,
  ): Promise<VideoCreationResult> {
    console.log('[VideoCreatorAgent] Refining video based on critique...');

    if (!this.aiProvider) {
      throw new Error('No AI provider configured');
    }

    try {
      const systemPrompt = `You are the same expert frontend developer.
You previously generated an animation, but "The Critic" found some issues.

Critique to Address:
"${critique}"

Your Task:
- Fix the issues mentioned in the critique.
- Keep the rest of the code intact if it works well.
- Ensure the final output is still a single, valid HTML file with Anime.js.
- Ensure the <!-- CRITICAL_TIMESTAMPS: [...] --> comment is preserved or updated if the timing changes.

Current HTML Code:
${currentHtml.substring(0, 50000)}

Return ONLY the corrected HTML code. Do not include any conversational text or explanations.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      let html = response.trim();

      // Extract HTML from code block if present, handling text before/after
      const codeBlockMatch = html.match(/```html([\s\S]*?)```/);
      if (codeBlockMatch) {
        html = codeBlockMatch[1];
      } else {
        const genericMatch = html.match(/```([\s\S]*?)```/);
        if (genericMatch) {
          html = genericMatch[1];
        }
      }

      // Parse timestamps
      const timestampMatch = html.match(
        /<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/,
      );
      let criticalTimestamps: number[] = [];
      if (timestampMatch) {
        try {
          criticalTimestamps = JSON.parse(timestampMatch[1]);
        } catch (e) {
          console.warn(
            '[VideoCreatorAgent] Failed to parse critical timestamps:',
            e,
          );
        }
      } else {
        // Try to find them in the previous HTML if not present in new one (though LLM should include it)
        const oldMatch = currentHtml.match(
          /<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/,
        );
        if (oldMatch) {
          try {
            criticalTimestamps = JSON.parse(oldMatch[1]);
          } catch (e) {}
        }
      }

      return { html: html.trim(), criticalTimestamps };
    } catch (error) {
      console.error('[VideoCreatorAgent] Error refining video:', error);
      throw error;
    }
  }
}
