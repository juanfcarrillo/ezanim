import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: ChromaClient;
  private collection: Collection;
  private readonly collectionName = 'undraw_svgs';

  constructor() {
    const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
    this.client = new ChromaClient({ path: chromaUrl });
  }

  async onModuleInit() {
    try {
      this.collection = await this.client.getCollection({
        name: this.collectionName,
      });
      console.log(
        `[VectorStoreService] Connected to collection: ${this.collectionName}`,
      );
    } catch (error) {
      console.warn(
        `[VectorStoreService] Failed to connect to collection ${this.collectionName}. Ensure ChromaDB is running and the collection exists.`,
        error,
      );
    }
  }

  async searchSimilar(
    query: string | number[],
    nResults: number = 1,
  ): Promise<any[]> {
    if (!this.collection) {
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
        });
      } catch (e) {
        console.error('[VectorStoreService] Error reconnecting:', e);
        throw new Error('Vector store collection not initialized');
      }
    }

    try {
      const queryObj: any = {
        nResults: nResults,
      };

      if (typeof query === 'string') {
        queryObj.queryTexts = [query];
      } else {
        queryObj.queryEmbeddings = [query];
      }

      const results = await this.collection.query(queryObj);

      // Chroma returns arrays of arrays (batch processing)
      // results.metadatas is (Record<string, any> | null)[][]
      const metadatas = results.metadatas[0];
      return metadatas.filter((m) => m !== null);
    } catch (error) {
      console.error('[VectorStoreService] Error querying vector store:', error);
      throw error;
    }
  }
}
