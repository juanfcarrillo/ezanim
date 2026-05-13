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
        ? `\nContext - Timing (VTT):\nUse these timestamps to synchronize the animation events exactly with the voiceover. The VTT file contains the start and end times for each spoken segment. You MUST use these times to schedule your animations in the GSAP timeline (e.g. tl.to(..., {..., position: timeInSeconds})).\n\nVTT Content:\n"${vtt}"\n`
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
- Use GSAP (GreenSock) via CDN for all animations (include gsap.min.js and MotionPathPlugin.min.js).
- Use Google Fonts: Import 'Inter' (weights 300, 400, 600) and 'JetBrains Mono' (400) for engineering-grade typography.
- VISUALS: STRICTLY USE INLINE SVGs (\`<svg>\`, \`<path>\`, \`<circle>\`, etc.). Do NOT use standard emojis. We want an ultra-premium, "Vercel / Apple" minimalist architecture aesthetic. 
- You can use motion paths (MotionPathPlugin) to move elements along complex paths.

Visual Structure (Full Screen Cinematic Minimalist):
- The animation must occupy the entire viewport (100vw, 100vh).
- The layout must be optimized for a **\${aspectRatio}** aspect ratio.\${scalingInstruction}
- No visible video player controls.
- CRITICAL: Do NOT include any "Click to Start", "Play", or "Start Learning" overlays, buttons, or splash screens. The video should be purely the animation content visible from the start.
- Stage: Create a global \`<svg>\` that acts as the background/canvas. Implement a very subtle, fine-lined grid background (e.g., stroke="#222" stroke-width="0.5") to simulate an engineering blueprint or canvas.
- Structure: Draw orthogonal lines (circuit-board style) or perfect Bezier curves to connect clean, minimalist nodes (perfect circles or slightly rounded rectangles).
- Subtitles: A sleek, highly legible subtitle overlay at the bottom center, using dark semi-transparent background and 'Inter' font.
- Typography: Use 'Inter' for main headings/text, and 'JetBrains Mono' for labels, IDs, data packets, or "code-like" annotations.

Animation Style & Visual Hooks (CRITICAL):

The first 3-5 seconds are the most important. You MUST include a "Visual Hook" at the very beginning (0ms - 3000ms) to captivate the viewer.
Implement one or more of these specific hook techniques using GSAP:
- SVG Blueprint Drawing: Use \`stroke-dasharray\` and \`stroke-dashoffset\` to precisely draw the architectural lines and nodes.
- Data Pulses: Small glowing dots (\`<circle>\` with filter drop-shadow) traveling along the SVG paths at high speeds to simulate data flow.
- Terminal Typewriter: Text appearing letter by letter rapidly, styled with 'JetBrains Mono'.

General Animation Guidelines:
- Use \`gsap.timeline()\` to sequence the entire story.
- Easing: STRICTLY use 'expo.inOut' or 'power4.inOut' for machine-like precision. Movements should start slow, accelerate rapidly, and brake sharply but smoothly. DO NOT use bouncy easings (no 'back.out' or 'elastic').
- Dynamic Entrances: Elements should draw themselves or slide in with surgical precision.
- Colors: Use an **Ultra-Minimalist Dark Theme**. Deep space/asphalt background (\`#0A0A0A\`), high-contrast white/light gray text, subtle fine grid lines (\`#222\`), and minimal bright accents (cyan, neon green, or white glow) ONLY for active nodes or data pulses. Use CSS variables.

Animation Script (The Scenes):
- Scene 1 (The Architecture/Setup): Describe the grid and base nodes drawing themselves.
- Scene 2 (The Data Flow/Process): Describe the data pulses and connections activating.
- Scene 3 (The System Output/Conclusion): Describe the final stable state of the system.

Code Logic:
- Expose the timeline globally as 'window.tl' so it can be controlled externally. Example: \`window.tl = gsap.timeline({ paused: true });\`
- IMPORTANT: Do NOT auto-play the timeline. It MUST start paused (\`paused: true\`).
- CRITICAL: You MUST include a comment in the <head> section with a list of critical timestamps (in milliseconds) for the animation.
  Format: <!-- CRITICAL_TIMESTAMPS: [0, 1500, 3000, 5000] -->
  These timestamps should correspond to:
  1. The start (0ms).
  2. Key scene transitions.
  3. Major element entrances/exits.
  4. The final state.

The code must be complete, copy-pasteable, and runnable. Return ONLY the HTML code, no markdown code blocks.\`;

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
- Ensure the final output is still a single, valid HTML file with GSAP.
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
