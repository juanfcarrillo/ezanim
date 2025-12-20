import { Injectable } from '@nestjs/common';
import { AIProvider } from './providers/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { AssetRetrievalAgent } from './asset-retrieval.agent';
import { parse, INode } from 'svgson';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoCreationResult {
  html: string;
  criticalTimestamps: number[];
}

type SvgMeta = {
  widthPx?: number;
  heightPx?: number;
  viewBox?: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  intrinsicAspect?: number;
};

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
      console.warn('[VideoCreatorAgent] No AI provider configured, using mock mode');
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

    let assetsContext = '';
    const maxWidth = this.getMaxSvgWidth(aspectRatio);

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
        const enrichedAssets = await Promise.all(
          assets.map(async (svg, i) => {
            try {
              const root = await parse(svg);
              const meta = this.extractSvgMeta(root);

              return {
                id: `asset-${i + 1}`,
                meta,
                originalSvg: svg,
              };
            } catch (e) {
              console.warn(`[VideoCreatorAgent] Failed to parse SVG ${i + 1}:`, e);
              return null;
            }
          }),
        );

        const validAssets = enrichedAssets.filter(
          (a): a is NonNullable<typeof a> => a !== null,
        );

        if (validAssets.length > 0) {
          assetsContext = `
## SVG ASSETS (USE ORIGINAL SVG + DIMENSIONS)

You have ${validAssets.length} SVG assets. Each includes extracted sizing metadata.
Max recommended width for this aspect ratio: ${maxWidth}px

ASSETS:
${validAssets
  .map(
    (asset) => `
### ${asset.id}

Metadata (use for layout):
\`\`\`json
${JSON.stringify(asset.meta, null, 2)}
\`\`\`

SVG (use exactly this in HTML; do NOT remove viewBox):
\`\`\`html
<div id="${asset.id}" class="svg-asset">
${asset.originalSvg}
</div>
\`\`\`
`,
  )
  .join('\n')}

RULES:
- Prefer sizing the container (.svg-asset) via CSS width/max-width.
- Let the inner <svg> be width:100%; height:auto; (keep aspect ratio via viewBox).
- Animate the wrapper div (opacity/transform) or inner svg parts if needed.
`;
          console.log(
            `[VideoCreatorAgent] Injected ${validAssets.length} assets with metadata into prompt`,
          );
        }
      }
    } catch (e) {
      console.warn('[VideoCreatorAgent] Failed to retrieve assets:', e);
    }

    try {
      const timingContext = vtt
        ? `\nTIMING (VTT): Use these timestamps with anime.timeline offset.\n"${vtt}"\n`
        : '';

      const scalingInstruction =
        aspectRatio === '9:16'
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

/* IMPORTANT: do NOT animate .svg-wrap. It provides centering. */
.svg-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

/* Animate this node instead */
.svg-anim {
  width: min(${maxWidth}px, 92vw);
  opacity: 0;
}

.svg-anim svg {
  width: 100%;
  height: auto;
  max-height: 78vh;
  display: block;
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

## STRUCTURE RULE (MANDATORY)
When inserting SVG assets, always use:
\`\`\`html
<div id="asset-1" class="svg-wrap">
  <div class="svg-anim">
    <!-- inline SVG goes here -->
  </div>
</div>
\`\`\`

Animation rule:
- Anime.js targets MUST be ".svg-anim" (or children), never ".svg-wrap".
## JAVASCRIPT RULES (MANDATORY)
1. Create a master timeline: \`var tl = anime.timeline({ autoplay: true });\`
2. YOU MUST EXPOSE THE TIMELINE GLOBALLY: \`window.tl = tl;\`
   (The renderer looks for window.tl to control playback. If missing, video generation fails.)
Return ONLY the HTML code.`;

      const response = await this.aiProvider.generateContent(systemPrompt);

      let html = response.trim();
      if (html.startsWith('```html')) {
        html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      } else if (html.startsWith('```')) {
        html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const timestampMatch = html.match(
        /<!-- CRITICAL_TIMESTAMPS: (\[.*?\]) -->/,
      );
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
    // Valores pensados para que el SVG pueda verse "hero" en 1080p/1920p
    switch (aspectRatio) {
      case '9:16':
        return 900; // antes 280 (demasiado pequeño)
      case '1:1':
        return 900; // antes 350
      case '16:9':
      default:
        return 1200; // antes 450
    }
  }

  private extractSvgMeta(root: INode): SvgMeta {
    const attrs = (root?.attributes ?? {}) as Record<string, string | undefined>;

    const widthPx = this.parseSvgLengthToPx(attrs.width);
    const heightPx = this.parseSvgLengthToPx(attrs.height);
    const viewBox = attrs.viewBox;

    const vb = this.parseViewBox(viewBox);
    const intrinsicWidth = vb?.w;
    const intrinsicHeight = vb?.h;

    const intrinsicAspect =
      intrinsicWidth && intrinsicHeight && intrinsicHeight !== 0
        ? intrinsicWidth / intrinsicHeight
        : undefined;

    return { widthPx, heightPx, viewBox, intrinsicWidth, intrinsicHeight, intrinsicAspect };
  }

  private parseSvgLengthToPx(value?: string): number | undefined {
    if (!value) return undefined;
    const v = value.trim().toLowerCase();

    // "800" or "800px"
    const m = v.match(/^([0-9.]+)\s*(px)?$/);
    if (m) return Number(m[1]);

    return undefined;
  }

  private parseViewBox(
    viewBox?: string,
  ): { x: number; y: number; w: number; h: number } | undefined {
    if (!viewBox) return undefined;

    const parts = viewBox
      .trim()
      .split(/[,\s]+/g)
      .filter(Boolean)
      .map((p) => Number(p));

    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return undefined;

    const [x, y, w, h] = parts;
    if (w <= 0 || h <= 0) return undefined;

    return { x, y, w, h };
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
ENSURE window.tl IS EXPOSED (window.tl = tl).

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
