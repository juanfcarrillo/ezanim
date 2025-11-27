import { Injectable } from '@nestjs/common';
import {
  AnimationElement,
  ElementType,
} from '@domain/entities/animation-element.entity';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface ElementGenerationResult {
  elements: AnimationElement[];
  sceneDescription: string;
}

@Injectable()
export class ElementCreationAgent {
  private aiProvider: AIProvider | null = null;

  constructor() {
    this.aiProvider = AIProviderFactory.createFromEnv();

    if (this.aiProvider) {
      console.log(
        `[ElementCreationAgent] Initialized with ${this.aiProvider.getProviderName()} - ${this.aiProvider.getModelName()}`,
      );
    } else {
      console.warn(
        '[ElementCreationAgent] No AI provider configured, using mock mode',
      );
    }
  }

  async createElements(
    videoRequestId: string,
    refinedPrompt: string,
  ): Promise<ElementGenerationResult> {
    console.log('[ElementCreationAgent] Creating elements for:', refinedPrompt);

    // If no AI provider, use mock data
    if (!this.aiProvider) {
      return this.getMockElements(videoRequestId);
    }

    try {
      const prompt = `You are an expert at creating visual elements for cinematic educational videos.

The video should explain: "${refinedPrompt}"

Create 4-8 visual elements for this video. Design them for a cinematic, professional animation with theatrical presentation.

Element types:
- TEXT: Titles, subtitles, explanations (use different sizes for hierarchy)
- SHAPE: Geometric shapes, icons (use divs with background, border-radius, etc.)
- HTML: Font Awesome icons or custom HTML

Guidelines:
- Use absolute positioning with percentages
- Create visual hierarchy (large title, medium subtitles, small details)
- Use colors from palette: #0984e3 (primary blue), #00b894 (success green), #e17055 (warm orange), #d63031 (alert red), #636e72 (grey)
- Position elements strategically across the stage (not all centered)
- Include Font Awesome icons: <i class="fas fa-icon-name"></i>
- Add container divs for grouping related elements

Respond ONLY with valid JSON:
{
  "elements": [
    {
      "type": "TEXT",
      "content": "Main Title",
      "styles": {
        "fontSize": "64px",
        "fontWeight": "bold",
        "color": "#dfe6e9",
        "position": "absolute",
        "top": "15%",
        "left": "50%",
        "transform": "translateX(-50%)",
        "textAlign": "center",
        "textTransform": "uppercase",
        "letterSpacing": "3px",
        "textShadow": "0 4px 10px rgba(0,0,0,0.3)",
        "width": "80%",
        "zIndex": "10"
      },
      "order": 0
    },
    {
      "type": "HTML",
      "content": "<i class='fas fa-lightbulb'></i>",
      "styles": {
        "fontSize": "80px",
        "color": "#e17055",
        "position": "absolute",
        "top": "40%",
        "left": "30%",
        "opacity": "0",
        "textShadow": "0 0 20px rgba(225,112,85,0.5)",
        "zIndex": "5"
      },
      "order": 1
    }
  ],
  "sceneDescription": "Brief description of the visual scene"
}`;

      const text = await this.aiProvider.generateContent(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(
          '[ElementCreationAgent] Failed to parse AI response, using mock',
        );
        return this.getMockElements(videoRequestId);
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        elements: Array<{
          type: string;
          content: string;
          styles: Record<string, string>;
          order: number;
        }>;
        sceneDescription: string;
      };
      const elements: AnimationElement[] = [];

      for (const elem of parsed.elements) {
        const elementType =
          elem.type === 'SHAPE' ? ElementType.SHAPE : ElementType.TEXT;
        elements.push(
          AnimationElement.create(
            videoRequestId,
            elementType,
            elem.content,
            elem.styles,
            elem.order,
          ),
        );
      }

      return {
        elements,
        sceneDescription: parsed.sceneDescription,
      };
    } catch (error) {
      console.error('[ElementCreationAgent] AI API error:', error);
      return this.getMockElements(videoRequestId);
    }
  }

  private getMockElements(videoRequestId: string): ElementGenerationResult {
    const elements: AnimationElement[] = [];

    // Main title
    elements.push(
      AnimationElement.create(
        videoRequestId,
        ElementType.TEXT,
        'Understanding the Concept',
        {
          fontSize: '64px',
          fontWeight: 'bold',
          color: '#dfe6e9',
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          width: '80%',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          textShadow: '0 4px 10px rgba(0,0,0,0.3)',
          zIndex: '20',
          opacity: '0',
        },
        0,
      ),
    );

    // Subtitle 1
    elements.push(
      AnimationElement.create(
        videoRequestId,
        ElementType.TEXT,
        'The Problem: Complexity everywhere',
        {
          fontSize: '28px',
          fontWeight: '300',
          color: '#dfe6e9',
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.3)',
          padding: '15px 30px',
          borderRadius: '50px',
          opacity: '0',
          zIndex: '15',
        },
        1,
      ),
    );

    // Icon 1 - Lightbulb
    elements.push(
      AnimationElement.create(
        videoRequestId,
        ElementType.HTML,
        '<i class="fas fa-lightbulb"></i>',
        {
          fontSize: '80px',
          color: '#e17055',
          position: 'absolute',
          top: '45%',
          left: '25%',
          opacity: '0',
          textShadow: '0 0 20px rgba(225,112,85,0.5)',
          zIndex: '10',
        },
        2,
      ),
    );

    // Shape 1 - Circle
    elements.push(
      AnimationElement.create(
        videoRequestId,
        ElementType.SHAPE,
        '',
        {
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: '#0984e3',
          position: 'absolute',
          top: '45%',
          right: '25%',
          opacity: '0',
          boxShadow: '0 10px 30px rgba(9,132,227,0.4)',
          zIndex: '10',
        },
        3,
      ),
    );

    // Icon 2 - Check mark
    elements.push(
      AnimationElement.create(
        videoRequestId,
        ElementType.HTML,
        '<i class="fas fa-check-circle"></i>',
        {
          fontSize: '60px',
          color: '#00b894',
          position: 'absolute',
          top: '47%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: '0',
          textShadow: '0 0 20px rgba(0,184,148,0.5)',
          zIndex: '25',
        },
        4,
      ),
    );

    // Subtitle 2
    elements.push(
      AnimationElement.create(
        videoRequestId,
        ElementType.TEXT,
        'The Solution: A simple, elegant approach',
        {
          fontSize: '28px',
          fontWeight: '300',
          color: '#dfe6e9',
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.3)',
          padding: '15px 30px',
          borderRadius: '50px',
          opacity: '0',
          zIndex: '15',
        },
        5,
      ),
    );

    return {
      elements,
      sceneDescription:
        'A cinematic, professional educational video with dramatic reveals and smooth transitions',
    };
  }
}
