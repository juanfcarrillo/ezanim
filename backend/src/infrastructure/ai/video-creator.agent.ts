import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

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
  ): Promise<string> {
    console.log(`[VideoCreatorAgent] Creating video for prompt: "${userPrompt}" with aspect ratio: ${aspectRatio}`);

    if (!this.aiProvider) {
      throw new Error('No AI provider configured');
    }

    try {
      const timingContext = vtt
        ? `\nContext - Timing (VTT):\nUse these timestamps to synchronize the animation events exactly with the voiceover. The VTT file contains the start and end times for each spoken segment. You MUST use these times to schedule your animations using the 'offset' parameter in anime.timeline().add().\n\nVTT Content:\n"${vtt}"\n`
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
- The layout must be optimized for a **${aspectRatio}** aspect ratio.
- No visible video player controls (play button, progress bar, etc.) should be rendered.
- CRITICAL: Do NOT include any "Click to Start", "Play", or "Start Learning" overlays, buttons, or splash screens. The video should be purely the animation content visible from the start.
- Stage: The entire body is the stage. Use absolute positioning for elements relative to the viewport.
- Subtitles: A clean, cinematic subtitle overlay at the bottom center, with a semi-transparent background for readability. Use 'Roboto' font.
- Typography: Use 'Poppins' for headings and 'Roboto' for body text.

Animation Style:

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

The code must be complete, copy-pasteable, and runnable. Return ONLY the HTML code, no markdown code blocks.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      // Clean up response if it contains markdown code blocks
      let html = response.trim();
      if (html.startsWith('```html')) {
        html = html.replace(/^```html/, '').replace(/```$/, '');
      } else if (html.startsWith('```')) {
        html = html.replace(/^```/, '').replace(/```$/, '');
      }

      return html.trim();
    } catch (error) {
      console.error('[VideoCreatorAgent] AI API error:', error);
      throw error;
    }
  }

  async refineVideo(currentHtml: string, critique: string): Promise<string> {
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

Current HTML Code:
${currentHtml.substring(0, 50000)}

Return ONLY the corrected HTML code.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      let html = response.trim();
      if (html.startsWith('```html')) {
        html = html.replace(/^```html/, '').replace(/```$/, '');
      } else if (html.startsWith('```')) {
        html = html.replace(/^```/, '').replace(/```$/, '');
      }

      return html.trim();
    } catch (error) {
      console.error('[VideoCreatorAgent] Error refining video:', error);
      throw error;
    }
  }

  private getMockHtml(
    topic: string,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-dark: #1e272e;
            --primary: #0984e3;
            --text: #dfe6e9;
        }
        body { margin: 0; overflow: hidden; width: 100vw; height: 100vh; background: var(--bg-dark); font-family: sans-serif; color: var(--text); display: flex; justify-content: center; align-items: center; }
        .element { font-size: 4rem; position: absolute; opacity: 0; }
        .info { position: absolute; bottom: 20px; right: 20px; font-size: 1rem; opacity: 0.5; }
    </style>
</head>
<body>
    <div class="element el-1">MOCK MODE</div>
    <div class="element el-2" style="top: 60%">${topic}</div>
    <div class="info">Aspect Ratio: ${aspectRatio}</div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script>
        window.tl = anime.timeline({
            easing: 'easeOutExpo',
            duration: 10000,
            autoplay: false
        });

        window.tl.add({
            targets: '.el-1',
            translateY: [-100, 0],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutBounce'
        })
        .add({
            targets: '.el-2',
            scale: [0, 1],
            opacity: [0, 1],
            duration: 800
        });
    </script>
</body>
</html>`;
  }
}
