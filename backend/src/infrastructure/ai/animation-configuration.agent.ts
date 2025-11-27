import { Injectable } from '@nestjs/common';
import {
  AnimationElement,
  AnimationConfig,
} from '@domain/entities/animation-element.entity';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface AnimationResult {
  elements: AnimationElement[];
  totalDuration: number;
}

@Injectable()
export class AnimationConfigurationAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();

    if (this.aiProvider) {
      console.log(
        `[AnimationConfigurationAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn(
        '[AnimationConfigurationAgent] No AI provider configured, using mock mode',
      );
    }
  }

  async configureAnimations(
    elements: AnimationElement[],
  ): Promise<AnimationResult> {
    console.log(
      '[AnimationConfigurationAgent] Configuring animations for',
      elements.length,
      'elements',
    );

    // If no AI provider, use mock animations
    if (!this.aiProvider) {
      return this.getMockAnimations(elements);
    }

    try {
      const elementsInfo = elements.map((el, idx) => ({
        index: idx,
        type: el.type,
        content: el.content ? el.content.substring(0, 50) : '',
        order: el.order,
      }));

      const prompt = `You are an expert at creating cinematic, theatrical animations for educational videos using anime.js timeline.

Given these visual elements: ${JSON.stringify(elementsInfo, null, 2)}

Create a dramatic, engaging animation sequence with these CRITICAL guidelines:

TIMING STRATEGY (CRITICAL - AVOID OVERLAPS):
- Each animation should START AFTER the previous one COMPLETES
- Calculate delay as: previousDelay + previousDuration + pauseTime
- Use pauseTime of 300-800ms between animations for breathing room
- First element: delay = 0
- Second element: delay = 1200 (first duration) + 500 (pause) = 1700
- Third element: delay = 1700 + 800 (second duration) + 500 = 3000
- Total duration should be 10-15 seconds
- DO NOT make delays overlap with previous animation durations!

ANIMATION TECHNIQUES:
- Fade ins: opacity: [0, 1]
- Slides: translateY: [-100, 0] or translateX: [-200, 0]
- Scale: scale: [0, 1] for dramatic reveals
- Rotations: rotate: ['0deg', '360deg'] for emphasis
- Bounces: Use easeOutBounce for playful effects (duration: 1200-1500ms)
- Springs: Use spring(1, 80, 10, 0) for elastic effects (duration: 800-1000ms)

EASING OPTIONS:
- easeOutExpo: smooth, professional (duration: 800-1200ms)
- easeInOutQuad: balanced (duration: 600-1000ms)
- easeOutBounce: playful (duration: 1200-1500ms)
- spring(1, 80, 10, 0): elastic (duration: 800-1000ms)
- linear: for continuous motion (duration: 400-800ms)

EXAMPLE CALCULATION:
Element 0: delay=0, duration=1200
Element 1: delay=1700 (1200+500), duration=800
Element 2: delay=3000 (1700+800+500), duration=1500
Element 3: delay=5000 (3000+1500+500), duration=1000

Respond ONLY with valid JSON:
{
  "animations": [
    {
      "index": 0,
      "duration": 1200,
      "easing": "easeOutExpo",
      "properties": {"opacity": [0, 1], "translateY": [-80, 0], "scale": [0.8, 1]},
      "delay": 0,
      "loop": false
    }
  ],
  "totalDuration": 12
}`;

      const text = await this.aiProvider.generateContent(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(
          '[AnimationConfigurationAgent] Failed to parse AI response, using mock',
        );
        return this.getMockAnimations(elements);
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        animations: Array<{
          index: number;
          duration: number;
          easing: string;
          properties: Record<string, unknown>;
          delay: number;
          loop: boolean;
        }>;
        totalDuration?: number;
      };
      const animatedElements: AnimationElement[] = [];

      for (const anim of parsed.animations) {
        const element = elements[anim.index];
        if (element) {
          const animationConfig: AnimationConfig = {
            targets: `.element-${anim.index}`,
            duration: anim.duration,
            easing: anim.easing,
            properties: anim.properties,
            delay: anim.delay,
            loop: anim.loop,
          };
          animatedElements.push(element.addAnimation(animationConfig));
        }
      }

      // Add any elements without animations
      elements.forEach((el) => {
        if (!animatedElements.find((ae) => ae.id === el.id)) {
          animatedElements.push(el);
        }
      });

      return {
        elements: animatedElements,
        totalDuration: parsed.totalDuration || 10,
      };
    } catch (error) {
      console.error('[AnimationConfigurationAgent] AI API error:', error);
      return this.getMockAnimations(elements);
    }
  }

  private getMockAnimations(elements: AnimationElement[]): AnimationResult {
    // Calculate delays sequentially to avoid overlaps
    let cumulativeTime = 0;
    const pauseBetweenAnimations = 500; // ms between each animation

    const animatedElements = elements.map((element, index) => {
      let animationConfig: AnimationConfig;
      let duration: number;

      switch (element.order) {
        case 0: // Main Title - Dramatic entrance
          duration = 1200;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'easeOutExpo',
            properties: {
              opacity: [0, 1],
              translateY: [-80, 0],
              scale: [0.8, 1],
            },
            delay: cumulativeTime,
          };
          break;

        case 1: // Subtitle 1 - Problem statement
          duration = 800;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'easeOutQuad',
            properties: {
              opacity: [0, 1],
              translateY: [30, 0],
            },
            delay: cumulativeTime,
          };
          break;

        case 2: // Icon/Shape 1 - Left element falls in
          duration = 1500;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'easeOutBounce',
            properties: {
              opacity: [0, 1],
              translateY: [-400, 0],
              rotate: ['-45deg', '0deg'],
            },
            delay: cumulativeTime,
          };
          break;

        case 3: // Shape/Icon 2 - Right element falls in
          duration = 1500;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'easeOutBounce',
            properties: {
              opacity: [0, 1],
              translateY: [-400, 0],
              rotate: ['45deg', '0deg'],
            },
            delay: cumulativeTime,
          };
          break;

        case 4: // Success icon - Dramatic reveal
          duration = 1000;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'spring(1, 80, 10, 0)',
            properties: {
              opacity: [0, 1],
              scale: [0, 1.2, 1],
            },
            delay: cumulativeTime,
          };
          break;

        case 5: // Subtitle 2 - Solution statement
          duration = 800;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'easeOutQuad',
            properties: {
              opacity: [0, 1],
              translateY: [30, 0],
            },
            delay: cumulativeTime,
          };
          break;

        default:
          duration = 1000;
          animationConfig = {
            targets: `.element-${index}`,
            duration,
            easing: 'easeOutExpo',
            properties: {
              opacity: [0, 1],
              translateY: [-50, 0],
            },
            delay: cumulativeTime,
          };
      }

      // Update cumulative time for next animation
      cumulativeTime += duration + pauseBetweenAnimations;

      return element.addAnimation(animationConfig);
    });

    // Calculate total duration based on last animation
    const totalDuration = Math.ceil((cumulativeTime + 1000) / 1000); // Add 1s buffer and convert to seconds

    return {
      elements: animatedElements,
      totalDuration,
    };
  }
}
