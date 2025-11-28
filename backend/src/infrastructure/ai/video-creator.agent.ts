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
  ): Promise<string> {
    console.log('[VideoCreatorAgent] Creating video for prompt:', userPrompt);

    if (!this.aiProvider) {
      return this.getMockHtml(userPrompt);
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
- Illustrations: Use inline SVGs for main visuals.

Visual Structure (Video Player Style):
- Create a main container that looks like a modern video player (rounded corners, soft shadow, dark mode aesthetic).
- UI: It must have a control bar at the bottom with: A Play/Pause button (toggles icon), a progress bar that fills up as the animation plays, and a time indicator (e.g., 00:00 / 00:${duration}).
- Stage: A central area (div.stage-center) where the action happens, using absolute positioning for elements.
- Subtitles: A section at the bottom to display explanatory text that changes per scene.

Animation Style:
- Use anime.timeline() to sequence the entire story.
- Dynamic Entrances: Elements should not just fade in. Make them fall from the top with a bounce effect (easing: 'easeOutBounce') or slide in dynamically to create a fun, "physics-based" feel.
- Micro-interactions: Use anime.stagger to animate groups of elements (e.g., if there are multiple items, do not drop them all at once; drop them with a slight delay between each).
- Colors: Use CSS variables (:root) for a coherent, vibrant color palette on a dark background.

Animation Script (The Scenes):
- Scene 1 (The Setup/Problem): Describe what elements fall in and what the initial state is.
- Scene 2 (The Action/Process): Describe how the elements interact or transform.
- Scene 3 (The Conclusion): Describe the final state or resolution.

Code Logic:
- Ensure the Play/Pause button controls the timeline (tl.play(), tl.pause()).
- Synchronize the progress bar width with the timeline's progress.
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
      return this.getMockHtml(userPrompt);
    }
  }

  async refineVideo(
    currentHtml: string,
    critique: string,
  ): Promise<string> {
    console.log('[VideoCreatorAgent] Refining video based on critique...');

    if (!this.aiProvider) {
      return currentHtml;
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
      return currentHtml;
    }
  }

  private getMockHtml(topic: string): string {
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
            --stage-bg: #2d3436;
            --primary: #0984e3;
            --accent: #00b894;
            --text: #dfe6e9;
        }
        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg-dark); font-family: sans-serif; color: var(--text); }
        .video-player { position: relative; width: 1920px; height: 1080px; background: var(--stage-bg); overflow: hidden; }
        .stage-center { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
        .element { font-size: 4rem; position: absolute; opacity: 0; }
        .controls { position: absolute; bottom: 0; width: 100%; height: 60px; background: rgba(0,0,0,0.7); display: flex; align-items: center; padding: 0 20px; }
        .progress-container { flex: 1; height: 5px; background: rgba(255,255,255,0.2); margin: 0 15px; cursor: pointer; }
        .progress-bar { width: 0%; height: 100%; background: var(--primary); }
        button { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    </style>
</head>
<body>
    <div class="video-player">
        <div class="stage-center">
            <div class="element el-1">MOCK MODE</div>
            <div class="element el-2" style="top: 60%">${topic}</div>
        </div>
        <div class="controls">
            <button id="play"><i class="fas fa-play"></i></button>
            <div class="progress-container"><div class="progress-bar"></div></div>
            <div id="time">00:00 / 00:10</div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script>
        const progressBar = document.querySelector('.progress-bar');
        const timeDisplay = document.getElementById('time');
        const playBtn = document.getElementById('play');
        const icon = playBtn.querySelector('i');

        window.tl = anime.timeline({
            easing: 'easeOutExpo',
            duration: 10000,
            autoplay: false,
            update: (anim) => {
                progressBar.style.width = anim.progress + '%';
                timeDisplay.innerText = \`00:\${Math.floor(anim.currentTime/1000).toString().padStart(2,'0')} / 00:10\`;
            },
            complete: () => {
                icon.className = 'fas fa-rotate-right';
            }
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

        playBtn.onclick = () => {
            if (window.tl.paused) { window.tl.play(); icon.className = 'fas fa-pause'; }
            else { window.tl.pause(); icon.className = 'fas fa-play'; }
        };
    </script>
</body>
</html>`;
  }
}
