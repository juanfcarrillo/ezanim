import { Injectable } from '@nestjs/common';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { AIProvider } from './providers/ai-provider.interface';
import { VectorStoreService } from './vector-store/vector-store.service';

@Injectable()
export class AssetRetrievalAgent {
  private aiProvider: AIProvider | null = null;

  constructor(private vectorStoreService: VectorStoreService) {
    this.aiProvider = AIProviderFactory.createFromEnv({
      modelEnvVar: 'RAG_AGENT_MODEL',
    });
  }

  async retrieveAssets(query: string, color?: string): Promise<string[]> {
    console.log(`[AssetRetrievalAgent] Retrieving assets for: "${query}"`);

    try {
      // 1. Search Vector Store directly with text
      // We let ChromaDB handle the embedding generation to ensure it matches
      // the dimensions of the stored vectors (likely 384 dims from all-MiniLM-L6-v2)
      const results = await this.vectorStoreService.searchSimilar(query, 1);

      if (!results || results.length === 0) {
        console.warn(`[AssetRetrievalAgent] No assets found for: "${query}"`);
        return [];
      }

      // 2. Process Results
      const assets = results.map((metadata) => {
        let svg = metadata.svgContent as string;

        if (color && svg) {
          // Inject color style
          if (svg.includes('style="')) {
            svg = svg.replace('style="', `style="color: ${color}; `);
          } else {
            svg = svg.replace('<svg', `<svg style="color: ${color}"`);
          }
          svg = svg.replace('\\', '');
        }
        return svg;
      });

      return assets;
    } catch (error) {
      console.error('[AssetRetrievalAgent] Error retrieving assets:', error);
      // Return empty array instead of failing, so the video creator can fallback to something else if needed
      return [];
    }
  }
}
