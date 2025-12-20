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
      
      let searchQuery = query;
      if (this.aiProvider) {
        try {
          // Optimización: extraer keywords para mejor búsqueda RAG
          const refined = await this.aiProvider.generateContent(
            `Extract 3-5 keywords for searching illustrations about: "${query}". 
             Return only comma-separated keywords, nothing else.`,
          );
          searchQuery = refined.replace(/\n/g, ' ').trim();
          console.log(`[AssetRetrievalAgent] Refined search query: "${searchQuery}"`);
        } catch (e) {
          console.warn('[AssetRetrievalAgent] Failed to refine query, using original');
        }
      }

      const results = await this.vectorStoreService.searchSimilar(searchQuery, 3);

      if (!results || results.length === 0) {
        console.warn(`[AssetRetrievalAgent] No assets found for: "${query}"`);
        return [];
      }

      console.log(`[AssetRetrievalAgent] Found ${results.length} assets`);

      const assets: string[] = [];

      for (const metadata of results) {
        let svg = metadata.svgContent as string;
        if (!svg || !svg.includes('<svg')) continue;

        // Limpiar caracteres de escape
        svg = svg.replace(/\\\\/g, '').replace(/\\"/g, '"').replace(/\\n/g, '');

        // Aplicar color si se proporciona
        if (color) {
          if (svg.includes('style="')) {
            svg = svg.replace('style="', `style="color: ${color}; `);
          } else {
            svg = svg.replace('<svg', `<svg style="color: ${color}"`);
          }
        }

        assets.push(svg);
      }

      console.log(`[AssetRetrievalAgent] Returning ${assets.length} assets`);
      return assets;
    } catch (error) {
      console.error('[AssetRetrievalAgent] Error retrieving assets:', error);
      return [];
    }
  }
}
