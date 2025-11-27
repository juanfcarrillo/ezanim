import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface VideoAnimationResult {
  htmlContent: string;
  duration: number;
  description: string;
}

@Injectable()
export class VideoAnimationAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();

    if (this.aiProvider) {
      console.log(
        `[VideoAnimationAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn(
        '[VideoAnimationAgent] No AI provider configured, using mock mode',
      );
    }
  }

  async generateVideoAnimation(
    userPrompt: string,
  ): Promise<VideoAnimationResult> {
    console.log('[VideoAnimationAgent] Generating animation for:', userPrompt);

    if (!this.aiProvider) {
      return this.getMockVideoAnimation(userPrompt);
    }

    try {
      const prompt = `Act as an expert frontend web developer and creative animator.

I want you to create an interactive, educational animation about: "${userPrompt}"

Strict Technical Requirements:

1. Format: A single HTML file containing all necessary CSS and JS.

2. Libraries:
   - Use Anime.js (v3.2.1 via CDN) for all animations: https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js
   - Use FontAwesome (v6.4.0 via CDN) for icons: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css

3. Visual Structure (Full Screen):
   - The animation should cover the entire viewport (100vw x 100vh) with no borders or containers
   - Dark background that fills the screen
   - All animated elements should be positioned absolutely within the full screen space
   - Optionally include subtitle text that appears/disappears during the animation
   - NO video player controls, NO progress bar, NO buttons - just the pure animation

4. Animation Style:
   - Use anime.timeline() to sequence the entire story
   - Dynamic Entrances: Elements should NOT just fade in. Make them fall from the top with a bounce effect (easing: 'easeOutBounce') or slide in dynamically to create a fun, "physics-based" feel
   - Micro-interactions: Use anime.stagger to animate groups of elements (e.g., if there are multiple items, do not drop them all at once; drop them with a slight delay between each)
   - Colors: Use CSS variables (:root) for a coherent, vibrant color palette on a dark background
   - Total duration: 10-15 seconds

5. Animation Script (The Scenes):
   - Scene 1 (The Setup/Problem): Introduce the topic with a title and initial elements falling/sliding in
   - Scene 2 (The Action/Process): Show the main concept with interactive elements, shapes, and icons
   - Scene 3 (The Conclusion): Wrap up with a summary or call to action
   - Each scene should have subtitle text that explains what's happening

6. Code Logic:
   - Create the anime.js timeline and expose it globally as window.tl for external control
   - Set autoplay to false on the timeline (it will be controlled externally)
   - The timeline should contain all animations sequenced properly
   - The code must be complete, copy-pasteable, and runnable
   - Body should have margin: 0 and overflow: hidden to ensure full screen coverage

7. Style Guidelines:
   - Full screen (100vw x 100vh) with no margins or padding on body
   - Professional shadows and glowing effects on elements
   - Designed for 1920x1080 viewport but should fill whatever space is given
   - Body should have overflow: hidden to prevent scrollbars

8. CRITICAL: DO NOT include ANY comments in the HTML, CSS, or JavaScript code. No HTML comments (<!-- -->), no CSS comments (/* */), and no JavaScript comments (// or /* */). The code must be clean and comment-free.

Respond ONLY with valid JSON in this format:
{
  "html": "<!DOCTYPE html><html>...</html>",
  "duration": 12,
  "description": "Brief description of what the animation shows"
}

IMPORTANT: The HTML must be a complete, valid, single-file HTML document with all CSS in <style> tags and all JavaScript in <script> tags. Make sure to escape all quotes properly in the JSON.`;

      const text = await this.aiProvider.generateContent(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(
          '[VideoAnimationAgent] Failed to parse AI response, using mock',
        );
        return this.getMockVideoAnimation(userPrompt);
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        html: string;
        duration: number;
        description: string;
      };

      return {
        htmlContent: parsed.html,
        duration: parsed.duration,
        description: parsed.description,
      };
    } catch (error) {
      console.error('[VideoAnimationAgent] AI API error:', error);
      return this.getMockVideoAnimation(userPrompt);
    }
  }

  private getMockVideoAnimation(userPrompt: string): VideoAnimationResult {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Educational Animation: ${userPrompt}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg-dark: #1a1a2e;
      --bg-medium: #16213e;
      --bg-light: #0f3460;
      --primary: #0984e3;
      --success: #00b894;
      --warning: #e17055;
      --danger: #d63031;
      --text-light: #dfe6e9;
      --text-muted: #b2bec3;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-medium) 50%, var(--bg-light) 100%);
      color: var(--text-light);
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }

    .element {
      position: absolute;
      opacity: 0;
    }

    .title-main {
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 72px;
      font-weight: bold;
      text-align: center;
      width: 90%;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
      color: var(--text-light);
    }

    .subtitle-text {
      position: absolute;
      bottom: 15%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 32px;
      font-weight: 300;
      text-align: center;
      background: rgba(0, 0, 0, 0.5);
      padding: 20px 40px;
      border-radius: 60px;
      color: var(--text-light);
      opacity: 0;
      backdrop-filter: blur(10px);
    }

    .icon-element {
      font-size: 80px;
      filter: drop-shadow(0 0 20px currentColor);
    }

    .icon-left {
      top: 45%;
      left: 25%;
      color: var(--warning);
    }

    .icon-right {
      top: 45%;
      right: 25%;
      color: var(--primary);
    }

    .icon-center {
      top: 47%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--success);
      font-size: 90px;
    }

    .shape-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--primary);
      top: 50%;
      left: 30%;
      box-shadow: 0 10px 30px rgba(9, 132, 227, 0.4);
    }

    .shape-square {
      width: 100px;
      height: 100px;
      border-radius: 20px;
      background: var(--warning);
      top: 50%;
      right: 30%;
      box-shadow: 0 10px 30px rgba(225, 112, 85, 0.4);
    }
  </style>
</head>
<body>
  <div class="element title-main">Understanding ${userPrompt}</div>
  <div class="subtitle-text">Let's explore this concept together</div>
  <div class="element icon-element icon-left"><i class="fas fa-lightbulb"></i></div>
  <div class="element shape-circle"></div>
  <div class="element icon-element icon-center"><i class="fas fa-check-circle"></i></div>
  <div class="element shape-square"></div>
  <div class="element icon-element icon-right"><i class="fas fa-rocket"></i></div>

  <script src="https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js"></script>
  <script>
    const totalDuration = 15000;

    window.tl = anime.timeline({
      autoplay: false,
      duration: totalDuration,
      easing: 'linear'
    });

    window.tl.add({
      targets: '.title-main',
      opacity: [0, 1],
      translateY: [-100, 0],
      scale: [0.8, 1],
      duration: 1200,
      easing: 'easeOutExpo'
    }, 0);

    window.tl.add({
      targets: '.subtitle-text',
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuad'
    }, 500);

    window.tl.add({
      targets: '.icon-left',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['-180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 3000);

    window.tl.add({
      targets: '.shape-circle',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 3500);

    window.tl.add({
      targets: '.icon-right',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 4000);

    window.tl.add({
      targets: '.subtitle-text',
      opacity: 0,
      duration: 400,
      easing: 'easeOutQuad'
    }, 4500);

    window.tl.add({
      targets: '.shape-square',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['-180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 4500);

    window.tl.add({
      targets: '.icon-center',
      opacity: [0, 1],
      scale: [0, 1.3, 1],
      duration: 1200,
      easing: 'spring(1, 80, 10, 0)'
    }, 7000);

    window.tl.add({
      targets: '.subtitle-text',
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad'
    }, 7500);

    window.tl.add({
      targets: '.icon-center',
      scale: [1, 1.1, 1],
      duration: 1000,
      loop: 3,
      easing: 'easeInOutQuad'
    }, 10000);
  </script>
</body>
</html>`;

    return {
      htmlContent,
      duration: 15,
      description: `Full-screen educational animation explaining ${userPrompt} with dynamic elements and bounce effects.`,
    };
  }
}
