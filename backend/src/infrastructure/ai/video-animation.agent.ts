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

3. Visual Structure (Video Player Style):
   - Create a main container that looks like a modern video player (rounded corners, soft shadow, dark mode aesthetic)
   - UI: It must have a control bar at the bottom with:
     * A Play/Pause button (toggles icon between fa-play and fa-pause)
     * A progress bar that fills up as the animation plays
     * A time indicator (e.g., 00:00 / 00:15)
   - Stage: A central area (div.stage-center) where the action happens, using absolute positioning for elements
   - Subtitles: A section at the bottom to display explanatory text that changes per scene

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
   - Ensure the Play/Pause button controls the timeline (tl.play(), tl.pause())
   - Synchronize the progress bar width with the timeline's progress
   - Update time indicator based on timeline progress
   - The code must be complete, copy-pasteable, and runnable

7. Style Guidelines:
   - Professional shadows and rounded corners
   - Responsive design that looks good in a 1920x1080 viewport

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
      background: var(--bg-dark);
      color: var(--text-light);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .video-player {
      width: 100%;
      max-width: 1200px;
      background: var(--bg-medium);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .stage-center {
      position: relative;
      width: 100%;
      height: 600px;
      background: linear-gradient(135deg, var(--bg-medium) 0%, var(--bg-light) 100%);
      overflow: hidden;
    }

    .subtitle-area {
      padding: 20px;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .subtitle-text {
      font-size: 20px;
      font-weight: 300;
      color: var(--text-light);
      opacity: 0;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.4);
    }

    .play-btn {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: var(--primary);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .play-btn:hover {
      background: #0769c5;
      transform: scale(1.05);
    }

    .progress-container {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
    }

    .progress-bar {
      height: 100%;
      width: 0%;
      background: var(--primary);
      border-radius: 4px;
      transition: width 0.1s linear;
    }

    .time-display {
      font-size: 14px;
      color: var(--text-muted);
      font-family: monospace;
      min-width: 100px;
    }

    /* Animation Elements */
    .element {
      position: absolute;
      opacity: 0;
    }

    .title-main {
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 64px;
      font-weight: bold;
      text-align: center;
      width: 80%;
      text-transform: uppercase;
      letter-spacing: 3px;
      text-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
      color: var(--text-light);
    }

    .subtitle-element {
      bottom: 35%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 28px;
      font-weight: 300;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
      padding: 15px 30px;
      border-radius: 50px;
      color: var(--text-light);
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
  <div class="video-player">
    <div class="stage-center">
      <div class="element title-main">Understanding ${userPrompt}</div>
      <div class="element subtitle-element">The Problem: Breaking it down</div>
      <div class="element icon-element icon-left"><i class="fas fa-lightbulb"></i></div>
      <div class="element shape-circle"></div>
      <div class="element icon-element icon-center"><i class="fas fa-check-circle"></i></div>
      <div class="element shape-square"></div>
      <div class="element icon-element icon-right"><i class="fas fa-rocket"></i></div>
    </div>
    
    <div class="subtitle-area">
      <div class="subtitle-text">Welcome to this explanation</div>
    </div>
    
    <div class="controls">
      <button class="play-btn" id="playBtn">
        <i class="fas fa-play"></i>
      </button>
      <div class="progress-container" id="progressContainer">
        <div class="progress-bar" id="progressBar"></div>
      </div>
      <div class="time-display">
        <span id="currentTime">00:00</span> / <span id="totalTime">00:15</span>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js"></script>
  <script>
    const playBtn = document.getElementById('playBtn');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const currentTimeEl = document.getElementById('currentTime');
    const subtitleText = document.querySelector('.subtitle-text');
    const subtitleElement = document.querySelector('.subtitle-element');

    let isPlaying = false;
    const totalDuration = 15000; // 15 seconds

    // Create timeline
    const tl = anime.timeline({
      autoplay: false,
      duration: totalDuration,
      easing: 'linear',
      update: (anim) => {
        const progress = (anim.currentTime / totalDuration) * 100;
        progressBar.style.width = progress + '%';
        
        const seconds = Math.floor(anim.currentTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        currentTimeEl.textContent = \`\${String(minutes).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
      },
      complete: () => {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    // Scene 1: Title entrance (0-2s)
    tl.add({
      targets: '.title-main',
      opacity: [0, 1],
      translateY: [-100, 0],
      scale: [0.8, 1],
      duration: 1200,
      easing: 'easeOutExpo',
      begin: () => {
        subtitleText.textContent = 'Let\\'s explore this concept together';
        anime({
          targets: subtitleText,
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutQuad'
        });
      }
    }, 0);

    // Scene 1: Problem subtitle (2-3s)
    tl.add({
      targets: '.subtitle-element',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutQuad',
      begin: () => {
        anime({
          targets: subtitleText,
          opacity: 0,
          duration: 300,
          complete: () => {
            subtitleText.textContent = 'Understanding the core problem';
            anime({
              targets: subtitleText,
              opacity: 1,
              duration: 300
            });
          }
        });
      }
    }, 2000);

    // Scene 2: Icons and shapes fall in (3-7s)
    tl.add({
      targets: '.icon-left',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['-180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 3000);

    tl.add({
      targets: '.shape-circle',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 3500);

    tl.add({
      targets: '.icon-right',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce',
      begin: () => {
        anime({
          targets: subtitleText,
          opacity: 0,
          duration: 300,
          complete: () => {
            subtitleText.textContent = 'Exploring different approaches';
            anime({
              targets: subtitleText,
              opacity: 1,
              duration: 300
            });
          }
        });
      }
    }, 4000);

    tl.add({
      targets: '.shape-square',
      opacity: [0, 1],
      translateY: [-500, 0],
      rotate: ['-180deg', '0deg'],
      duration: 1500,
      easing: 'easeOutBounce'
    }, 4500);

    // Scene 2: Hide problem subtitle
    tl.add({
      targets: '.subtitle-element',
      opacity: 0,
      duration: 600
    }, 6000);

    // Update subtitle text after it fades
    tl.add({
      duration: 1,
      begin: () => {
        subtitleElement.textContent = 'The Solution: A clear path forward';
      }
    }, 6600);

    // Scene 2: Show solution subtitle
    tl.add({
      targets: '.subtitle-element',
      opacity: 1,
      duration: 600
    }, 6700);

    // Scene 3: Success icon (8-10s)
    tl.add({
      targets: '.icon-center',
      opacity: [0, 1],
      scale: [0, 1.3, 1],
      duration: 1200,
      easing: 'spring(1, 80, 10, 0)',
      begin: () => {
        anime({
          targets: subtitleText,
          opacity: 0,
          duration: 300,
          complete: () => {
            subtitleText.textContent = 'Success! Everything comes together';
            anime({
              targets: subtitleText,
              opacity: 1,
              duration: 300
            });
          }
        });
      }
    }, 8000);

    // Scene 3: Pulse effect on success (10-15s)
    tl.add({
      targets: '.icon-center',
      scale: [1, 1.1, 1],
      duration: 1000,
      loop: 3,
      easing: 'easeInOutQuad'
    }, 10000);

    // Play/Pause button
    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        tl.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      } else {
        tl.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }
      isPlaying = !isPlaying;
    });

    // Progress bar click
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * totalDuration;
      tl.seek(newTime);
    });
  </script>
</body>
</html>`;

    return {
      htmlContent,
      duration: 15,
      description: `Interactive educational animation explaining ${userPrompt} with dynamic elements, bounce effects, and a video player interface.`,
    };
  }
}
