import FlexSearch from 'flexsearch';
import { CounselDocument, FileBasedDocumentParser } from './file-search';

export interface KeywordSearchResult {
  id: string;
  score: number;
  document: CounselDocument;
  matches: string[];
}

export class KeywordSearchService {
  private index: FlexSearch.Document<CounselDocument>;
  private documents: Map<string, CounselDocument>;
  private parser: FileBasedDocumentParser;
  private lastIndexed: Date | null;

  constructor() {
    this.documents = new Map();
    this.parser = new FileBasedDocumentParser();
    this.lastIndexed = null;
    
    // Configure FlexSearch for optimal keyword matching
    this.index = new FlexSearch.Document<CounselDocument>({
      document: {
        id: 'id',
        index: ['title', 'content', 'keywords', 'fileName']
      }
    });
  }

  /**
   * Initialize or refresh the keyword index
   */
  async initializeIndex(): Promise<void> {
    try {
      // Check if woolly directory exists
      const exists = await this.parser.counselDirectoryExists();
      if (!exists) {
        console.log('Woolly directory not found, keyword search unavailable');
        return;
      }

      const documents = await this.parser.parseAllDocuments();
      
      // Clear existing index
      this.documents.clear();
      
      // Add documents to FlexSearch
      for (const doc of documents) {
        this.index.add(doc);
        this.documents.set(doc.id, doc);
      }
      
      this.lastIndexed = new Date();
      console.log(`Indexed ${documents.length} documents for keyword search`);
    } catch (error) {
      console.error('Failed to initialize keyword search index:', error);
      throw error;
    }
  }

  /**
   * Search for documents using keyword matching
   */
  async search(query: string, limit: number = 10): Promise<KeywordSearchResult[]> {
    if (!this.lastIndexed) {
      await this.initializeIndex();
    }

    try {
      // Search using FlexSearch
      const searchResults = this.index.search(query, { limit: limit * 2 }); // Get more results for better ranking
      
      const results: KeywordSearchResult[] = [];
      
      // FlexSearch returns results grouped by field
      const allIds = new Set<string>();
      const idScores = new Map<string, number>();
      
      // Collect all unique document IDs and calculate scores
      searchResults.forEach(result => {
        if (Array.isArray(result.result)) {
          result.result.forEach(id => {
            allIds.add(id as string);
            // Higher score for more matches
            const currentScore = idScores.get(id as string) || 0;
            idScores.set(id as string, currentScore + 1);
          });
        }
      });
      
      // Convert to result objects with documents
      for (const id of allIds) {
        const document = this.documents.get(id);
        if (document) {
          const score = this.calculateRelevanceScore(query, document);
          const matches = this.findMatches(query, document);
          
          results.push({
            id,
            score,
            document,
            matches
          });
        }
      }
      
      // Sort by relevance score and limit
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
    } catch (error) {
      console.error('Keyword search failed:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score based on query matches
   */
  private calculateRelevanceScore(query: string, document: CounselDocument): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;
    
    // Title matches (highest weight)
    const titleLower = document.title.toLowerCase();
    queryWords.forEach(word => {
      if (titleLower.includes(word)) {
        score += 3;
      }
    });
    
    // Filename matches
    const fileNameLower = document.fileName.toLowerCase();
    queryWords.forEach(word => {
      if (fileNameLower.includes(word)) {
        score += 2;
      }
    });
    
    // Keyword matches
    const keywordsLower = document.keywords.map(k => k.toLowerCase());
    queryWords.forEach(word => {
      if (keywordsLower.some(keyword => keyword.includes(word))) {
        score += 2;
      }
    });
    
    // Content matches (lower weight but more comprehensive)
    const contentLower = document.content.toLowerCase();
    queryWords.forEach(word => {
      const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += Math.min(matches * 0.5, 2); // Cap content matches to avoid overwhelming
    });
    
    // Normalize score to 0-1 range
    return Math.min(score / 10, 1);
  }

  /**
   * Find matching terms in the document
   */
  private findMatches(query: string, document: CounselDocument): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const matches: string[] = [];
    
    queryWords.forEach(word => {
      if (document.title.toLowerCase().includes(word)) {
        matches.push(`title:${word}`);
      }
      if (document.fileName.toLowerCase().includes(word)) {
        matches.push(`filename:${word}`);
      }
      if (document.keywords.some(k => k.toLowerCase().includes(word))) {
        matches.push(`keyword:${word}`);
      }
      if (document.content.toLowerCase().includes(word)) {
        matches.push(`content:${word}`);
      }
    });
    
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Update index with new or modified documents
   */
  async updateIndex(since?: Date): Promise<void> {
    try {
      const sinceDate = since || this.lastIndexed || new Date(0);
      const modifiedDocs = await this.parser.getModifiedDocuments(sinceDate);
      
      for (const doc of modifiedDocs) {
        // Remove old version if it exists
        if (this.documents.has(doc.id)) {
          this.index.remove(doc.id);
        }
        
        // Add updated version
        this.index.add(doc);
        this.documents.set(doc.id, doc);
      }
      
      if (modifiedDocs.length > 0) {
        console.log(`Updated ${modifiedDocs.length} documents in keyword search index`);
      }
      
      this.lastIndexed = new Date();
    } catch (error) {
      console.error('Failed to update keyword search index:', error);
    }
  }

  /**
   * Get index statistics
   */
  getStats(): { totalDocuments: number; lastIndexed: Date | null } {
    return {
      totalDocuments: this.documents.size,
      lastIndexed: this.lastIndexed
    };
  }

  /**
   * Check if the search service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const exists = await this.parser.counselDirectoryExists();
      return exists && this.documents.size > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const keywordSearchService = new KeywordSearchService();