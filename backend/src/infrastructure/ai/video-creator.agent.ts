import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { AssetRetrievalAgent } from './asset-retrieval.agent';
import { parse, stringify, INode } from 'svgson';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoCreationResult {
  html: string;
  criticalTimestamps: number[];
}

@Injectable()
export class VideoCreatorAgent {
  private aiProvider: AIProvider | null = null;

  constructor(private assetRetrievalAgent: AssetRetrievalAgent) {
    this.aiProvider = AIProviderFactory.createFromEnv({
      modelEnvVar: 'VIDEO_CREATOR_MODEL',
    });

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
    aspectRatio: AspectRatio = '16:9',
  ): Promise<VideoCreationResult> {
    console.log(
      `[VideoCreatorAgent] Creating video for prompt: "${userPrompt}" with aspect ratio: ${aspectRatio}`,
    );

    if (!this.aiProvider) {
      throw new Error('No AI provider configured');
    }

    // Retrieve assets
    let assetsContext = '';

    try {
      let query = userPrompt;
      if (vtt) {
        query = vtt
          .replace(/WEBVTT/g, '')
          .replace(
            /(\d{2}:)?\d{2}:\d{2}\.\d{3} --> (\d{2}:)?\d{2}:\d{2}\.\d{3}/g,
            '',
          )
          .replace(/\n+/g, ' ')
          .trim();
        if (!query) query = userPrompt;
      }

      const assets = await this.assetRetrievalAgent.retrieveAssets(query);

      if (assets.length > 0) {
        const maxWidth = this.getMaxSvgWidth(aspectRatio);
        
        // Convert SVGs to JSON using svgson
        const svgJsonAssets = await Promise.all(
          assets.map(async (svg, i) => {
            try {
              const parsed = await parse(svg);
              return {
                id: `asset-${i + 1}`,
                json: parsed,
                originalSvg: svg,
              };
            } catch (e) {
              console.warn(`[VideoCreatorAgent] Failed to parse SVG ${i + 1}:`, e);
              return null;
            }
          })
        );

        const validAssets = svgJsonAssets.filter((a) => a !== null);

        if (validAssets.length > 0) {
          assetsContext = `
## SVG ASSETS (JSON FORMAT)

You have ${validAssets.length} SVG assets in JSON format. To use them:
1. Convert the JSON back to SVG string using the structure
2. Wrap in a container div with class "svg-asset"

Max width for this aspect ratio: ${maxWidth}px

ASSETS:
${validAssets.map((asset) => `
### Asset ${asset.id}
\`\`\`json
${JSON.stringify(asset.json, null, 2)}
\`\`\`

Original SVG (for reference):
\`\`\`html
<div id="${asset.id}" class="svg-asset">
${asset.originalSvg}
</div>
\`\`\`
`).join('\n')}

USAGE:
- Use the original SVG wrapped in div with id and class as shown
- Animate with: anime({ targets: '#asset-1', opacity: [0,1], duration: 800 })
`;
          console.log(`[VideoCreatorAgent] Injected ${validAssets.length} assets as JSON into prompt`);
        }
      }
    } catch (e) {
      console.warn('[VideoCreatorAgent] Failed to retrieve assets:', e);
    }

    try {
      const timingContext = vtt
        ? `\nTIMING (VTT): Use these timestamps with anime.timeline offset.\n"${vtt}"\n`
        : '';

      const scalingInstruction = aspectRatio === '9:16'
        ? '\nCRITICAL: This is VERTICAL video. All text must be LARGE (2rem+ body, 3.5rem+ headings). Stack elements vertically.'
        : aspectRatio === '1:1'
        ? '\nThis is SQUARE video. Text: 1.5rem body, 2.5rem headings. Center everything.'
        : '';

      const systemPrompt = `Create an HTML animation about: "${userPrompt}"
${timingContext}
${assetsContext}

## REQUIREMENTS

Single HTML file with Anime.js 3.2.1 (CDN), FontAwesome 6.4.0, Google Fonts (Poppins, Roboto).

Aspect ratio: ${aspectRatio}${scalingInstruction}

## MANDATORY CSS

\`\`\`css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Poppins', sans-serif;
  background: #1a1a2e;
}

#stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.svg-asset {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: \${maxWidth}px;
  width: 80%;
  opacity: 0;
}

.svg-asset svg {
  width: 100%;
  height: auto;
}

.subtitle {
  position: fixed;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  padding: 0.5rem 1rem;
  background: rgba(0,0,0,0.7);
  border-radius: 8px;
  color: white;
  max-width: 90%;
}
\`\`\`

## STRUCTURE

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <!-- CRITICAL_TIMESTAMPS: [0, 2000, 5000] -->
  <style>/* CSS */</style>
</head>
<body>
  <div id="stage"><!-- content --></div>
  <script>
    const tl = anime.timeline({ autoplay: false });
    // animations
    window.tl = tl;
  </script>
</body>
</html>
\`\`\`

## RULES
- NO play buttons or click-to-start overlays
- Visual hook in first 3 seconds
- Expose timeline as window.tl (autoplay: false)

Return ONLY the HTML code.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      let html = response.trim();
      if (html.startsWith('```html')) {
        html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      } else if (html.startsWith('```')) {
        html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const timestampMatch = html.match(/<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/);
      let criticalTimestamps: number[] = [0, duration * 1000];
      if (timestampMatch) {
        try {
          criticalTimestamps = JSON.parse(timestampMatch[1]);
        } catch (e) {
          console.warn('[VideoCreatorAgent] Failed to parse timestamps:', e);
        }
      }

      return { html: html.trim(), criticalTimestamps };
    } catch (error) {
      console.error('[VideoCreatorAgent] AI API error:', error);
      throw error;
    }
  }

  private getMaxSvgWidth(aspectRatio: AspectRatio): number {
    switch (aspectRatio) {
      case '9:16': return 280;
      case '1:1': return 350;
      case '16:9':
      default: return 450;
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
      const systemPrompt = `Fix these issues in the animation:
"${critique}"

Keep working code intact. Output single HTML file with Anime.js.
Preserve <!-- CRITICAL_TIMESTAMPS: [...] --> comment.

Current HTML:
${currentHtml.substring(0, 50000)}

Return ONLY the corrected HTML.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      let html = response.trim();
      const codeBlockMatch = html.match(/```html([\s\S]*?)```/);
      if (codeBlockMatch) {
        html = codeBlockMatch[1];
      }

      const timestampMatch = html.match(/<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/);
      let criticalTimestamps: number[] = [];
      if (timestampMatch) {
        try {
          criticalTimestamps = JSON.parse(timestampMatch[1]);
        } catch (e) {}
      } else {
        const oldMatch = currentHtml.match(/<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/);
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
