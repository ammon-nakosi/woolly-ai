import { search as vectorSearch } from '../services/chromadb-client';
import { keywordSearchService, KeywordSearchResult } from './keyword-search';
import { fuzzySearchService, FuzzySearchResult } from './fuzzy-search';
import { CounselMode } from '../types';

export interface HybridSearchResult {
  id: string;
  title: string;
  content: string;
  mode: CounselMode;
  name: string;
  fileName: string;
  filePath: string;
  score: number;
  engines: string[];
  snippet?: string;
  matches?: string[];
}

export interface SearchEngineStatus {
  vector: { available: boolean; error?: string };
  keyword: { available: boolean; error?: string };
  fuzzy: { available: boolean; error?: string };
}

export class HybridSearchOrchestrator {
  private readonly defaultWeights = {
    vector: 0.5,
    keyword: 0.3,
    fuzzy: 0.2
  };

  /**
   * Main hybrid search method with graceful fallbacks
   */
  async search(
    query: string, 
    options: {
      limit?: number;
      mode?: CounselMode;
      threshold?: number;
    } = {}
  ): Promise<{ results: HybridSearchResult[]; status: SearchEngineStatus }> {
    const limit = options.limit || 10;
    const status: SearchEngineStatus = {
      vector: { available: false },
      keyword: { available: false },
      fuzzy: { available: false }
    };

    const allResults: Array<{ result: HybridSearchResult; engine: string; originalScore: number }> = [];

    // Try vector search (may fail silently)
    try {
      const vectorResults = await this.tryVectorSearch(query, options);
      if (vectorResults.length > 0) {
        status.vector.available = true;
        allResults.push(...vectorResults.map(r => ({ 
          result: r, 
          engine: 'vector',
          originalScore: r.score 
        })));
      }
    } catch (error) {
      status.vector.available = false;
      status.vector.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Try keyword search (should always work if documents exist)
    try {
      const keywordResults = await this.tryKeywordSearch(query, limit);
      if (keywordResults.length > 0) {
        status.keyword.available = true;
        allResults.push(...keywordResults.map(r => ({ 
          result: r, 
          engine: 'keyword',
          originalScore: r.score 
        })));
      }
    } catch (error) {
      status.keyword.available = false;
      status.keyword.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Try fuzzy search (should always work if documents exist)
    try {
      const fuzzyResults = await this.tryFuzzySearch(query, limit);
      if (fuzzyResults.length > 0) {
        status.fuzzy.available = true;
        allResults.push(...fuzzyResults.map(r => ({ 
          result: r, 
          engine: 'fuzzy',
          originalScore: r.score 
        })));
      }
    } catch (error) {
      status.fuzzy.available = false;
      status.fuzzy.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Combine and deduplicate results
    const combinedResults = this.combineResults(allResults, status);
    
    return {
      results: combinedResults.slice(0, limit),
      status
    };
  }

  /**
   * Try vector search (ChromaDB) - may fail
   */
  private async tryVectorSearch(
    query: string, 
    options: { mode?: CounselMode; threshold?: number }
  ): Promise<HybridSearchResult[]> {
    const results = await vectorSearch(query, {
      type: 'documents',
      mode: options.mode,
      limit: 20,
      threshold: options.threshold
    });

    return results.map(result => ({
      id: result.id,
      title: result.metadata?.name || 'Untitled',
      content: result.document || '',
      mode: result.metadata?.counselMode as CounselMode,
      name: result.metadata?.counselWork || '',
      fileName: result.metadata?.fileName || '',
      filePath: result.metadata?.filePath || '',
      score: result.similarity,
      engines: ['vector'],
      snippet: this.createSnippet(result.document || '', query)
    }));
  }

  /**
   * Try keyword search (FlexSearch) - should always work
   */
  private async tryKeywordSearch(query: string, limit: number): Promise<HybridSearchResult[]> {
    const results = await keywordSearchService.search(query, limit);

    return results.map(result => ({
      id: result.id,
      title: result.document.title,
      content: result.document.content,
      mode: result.document.mode,
      name: result.document.name,
      fileName: result.document.fileName,
      filePath: result.document.filePath,
      score: result.score,
      engines: ['keyword'],
      snippet: this.createSnippet(result.document.content, query),
      matches: result.matches
    }));
  }

  /**
   * Try fuzzy search (Fuse.js) - should always work
   */
  private async tryFuzzySearch(query: string, limit: number): Promise<HybridSearchResult[]> {
    const results = await fuzzySearchService.search(query, limit);

    return results.map(result => ({
      id: result.id,
      title: result.document.title,
      content: result.document.content,
      mode: result.document.mode,
      name: result.document.name,
      fileName: result.document.fileName,
      filePath: result.document.filePath,
      score: result.score,
      engines: ['fuzzy'],
      snippet: fuzzySearchService.getContextualSnippet(result.document.content, query)
    }));
  }

  /**
   * Combine results from multiple engines and deduplicate
   */
  private combineResults(
    allResults: Array<{ result: HybridSearchResult; engine: string; originalScore: number }>,
    status: SearchEngineStatus
  ): HybridSearchResult[] {
    // Calculate dynamic weights based on available engines
    const weights = this.calculateWeights(status);
    
    // Group results by document ID
    const groupedResults = new Map<string, Array<{ result: HybridSearchResult; engine: string; originalScore: number }>>();
    
    allResults.forEach(item => {
      const id = item.result.id;
      if (!groupedResults.has(id)) {
        groupedResults.set(id, []);
      }
      groupedResults.get(id)!.push(item);
    });

    // Combine scores for each document
    const finalResults: HybridSearchResult[] = [];
    
    groupedResults.forEach((items, id) => {
      let combinedScore = 0;
      const engines: string[] = [];
      let bestResult: HybridSearchResult = items[0].result;
      
      // Calculate weighted average score
      items.forEach(item => {
        const weight = weights[item.engine as keyof typeof weights];
        combinedScore += item.originalScore * weight;
        engines.push(item.engine);
        
        // Use the result with the highest individual score as base
        if (item.originalScore > bestResult.score) {
          bestResult = item.result;
        }
      });
      
      // Create combined result
      finalResults.push({
        ...bestResult,
        score: combinedScore,
        engines: [...new Set(engines)] // Remove duplicates
      });
    });

    // Sort by combined score
    return finalResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate dynamic weights based on engine availability
   */
  private calculateWeights(status: SearchEngineStatus): Record<string, number> {
    const availableEngines = [
      status.vector.available ? 'vector' : null,
      status.keyword.available ? 'keyword' : null,
      status.fuzzy.available ? 'fuzzy' : null
    ].filter(Boolean);

    if (availableEngines.length === 3) {
      // All engines available - use default weights
      return this.defaultWeights;
    } else if (availableEngines.length === 2) {
      // Two engines available - redistribute weights
      if (!status.vector.available) {
        return { vector: 0, keyword: 0.6, fuzzy: 0.4 };
      } else if (!status.keyword.available) {
        return { vector: 0.7, keyword: 0, fuzzy: 0.3 };
      } else {
        return { vector: 0.7, keyword: 0, fuzzy: 0.3 };
      }
    } else if (availableEngines.length === 1) {
      // Only one engine available - give it full weight
      if (status.vector.available) {
        return { vector: 1.0, keyword: 0, fuzzy: 0 };
      } else if (status.keyword.available) {
        return { vector: 0, keyword: 1.0, fuzzy: 0 };
      } else {
        return { vector: 0, keyword: 0, fuzzy: 1.0 };
      }
    }

    // No engines available
    return { vector: 0, keyword: 0, fuzzy: 0 };
  }

  /**
   * Create a content snippet around the query terms
   */
  private createSnippet(content: string, query: string, maxLength: number = 200): string {
    const words = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    // Find first occurrence of any query word
    let bestPosition = 0;
    for (const word of words) {
      const position = contentLower.indexOf(word);
      if (position !== -1) {
        bestPosition = position;
        break;
      }
    }
    
    // Extract snippet around the position
    const start = Math.max(0, bestPosition - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);
    let snippet = content.substring(start, end).trim();
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * Initialize all search engines
   */
  async initialize(): Promise<void> {
    const promises = [
      keywordSearchService.initializeIndex().catch(e => console.warn('Keyword search init failed:', e)),
      fuzzySearchService.initializeIndex().catch(e => console.warn('Fuzzy search init failed:', e))
    ];

    await Promise.allSettled(promises);
  }

  /**
   * Get status of all search engines
   */
  async getEngineStatus(): Promise<SearchEngineStatus> {
    const [vectorAvailable, keywordAvailable, fuzzyAvailable] = await Promise.allSettled([
      this.isVectorSearchAvailable(),
      keywordSearchService.isAvailable(),
      fuzzySearchService.isAvailable()
    ]);

    return {
      vector: { 
        available: vectorAvailable.status === 'fulfilled' && vectorAvailable.value,
        error: vectorAvailable.status === 'rejected' ? vectorAvailable.reason : undefined
      },
      keyword: { 
        available: keywordAvailable.status === 'fulfilled' && keywordAvailable.value,
        error: keywordAvailable.status === 'rejected' ? keywordAvailable.reason : undefined
      },
      fuzzy: { 
        available: fuzzyAvailable.status === 'fulfilled' && fuzzyAvailable.value,
        error: fuzzyAvailable.status === 'rejected' ? fuzzyAvailable.reason : undefined
      }
    };
  }

  /**
   * Check if vector search (ChromaDB) is available
   */
  private async isVectorSearchAvailable(): Promise<boolean> {
    try {
      // Try a simple health check - this might need to be adjusted based on your ChromaDB client
      const { healthCheck } = await import('../services/chromadb-client');
      return await healthCheck();
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const hybridSearchOrchestrator = new HybridSearchOrchestrator();