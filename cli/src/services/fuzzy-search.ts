import Fuse, { FuseResultMatch } from 'fuse.js';
import { CounselDocument, FileBasedDocumentParser } from './file-search';

export interface FuzzySearchResult {
  id: string;
  score: number;
  document: CounselDocument;
  matches: FuseResultMatch[];
}

export class FuzzySearchService {
  private fuse: Fuse<CounselDocument> | null;
  private documents: CounselDocument[];
  private parser: FileBasedDocumentParser;
  private lastIndexed: Date | null;

  constructor() {
    this.fuse = null;
    this.documents = [];
    this.parser = new FileBasedDocumentParser();
    this.lastIndexed = null;
  }

  /**
   * Initialize or refresh the fuzzy search index
   */
  async initializeIndex(): Promise<void> {
    try {
      // Check if counsel directory exists
      const exists = await this.parser.counselDirectoryExists();
      if (!exists) {
        console.log('Counsel directory not found, fuzzy search unavailable');
        return;
      }

      this.documents = await this.parser.parseAllDocuments();
      
      // Configure Fuse.js for optimal fuzzy matching (adapted from web component)
      const fuseOptions = {
        includeScore: true,
        includeMatches: true,
        threshold: 0.4, // Lower = more strict matching
        location: 0,
        distance: 100,
        minMatchCharLength: 2,
        shouldSort: true,
        findAllMatches: true,
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'content', weight: 0.3 },
          { name: 'keywords', weight: 0.2 },
          { name: 'fileName', weight: 0.1 }
        ]
      };
      
      this.fuse = new Fuse(this.documents, fuseOptions);
      this.lastIndexed = new Date();
      
      console.log(`Indexed ${this.documents.length} documents for fuzzy search`);
    } catch (error) {
      console.error('Failed to initialize fuzzy search index:', error);
      throw error;
    }
  }

  /**
   * Search for documents using fuzzy matching
   */
  async search(query: string, limit: number = 10): Promise<FuzzySearchResult[]> {
    if (!this.fuse) {
      await this.initializeIndex();
    }

    if (!this.fuse) {
      return [];
    }

    try {
      const fuseResults = this.fuse.search(query, { limit });
      
      const results: FuzzySearchResult[] = fuseResults
        .filter(result => result.score !== undefined && result.score < 0.8) // Only good matches
        .map(result => ({
          id: result.item.id,
          score: 1 - (result.score || 0), // Convert Fuse score to 0-1 (higher = better)
          document: result.item,
          matches: [...(result.matches || [])] // Convert readonly to mutable array
        }));
      
      return results;
    } catch (error) {
      console.error('Fuzzy search failed:', error);
      return [];
    }
  }

  /**
   * Get contextual content snippet around search terms (adapted from web component)
   */
  getContextualSnippet(content: string, query: string, maxLength: number = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    // Find the best match position
    let bestPosition = 0;
    let bestScore = 0;
    
    queryWords.forEach(word => {
      const position = contentLower.indexOf(word);
      if (position !== -1) {
        const score = queryWords.filter(w => 
          contentLower.substring(Math.max(0, position - 50), position + 50).includes(w)
        ).length;
        
        if (score > bestScore) {
          bestScore = score;
          bestPosition = position;
        }
      }
    });
    
    // Extract context around the best match
    const start = Math.max(0, bestPosition - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);
    let snippet = content.substring(start, end);
    
    // Clean up the snippet
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet.trim();
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    if (!this.fuse || partialQuery.length < 1) {
      return [];
    }

    const suggestions = new Set<string>();
    const queryLower = partialQuery.toLowerCase();
    
    // Get suggestions from document titles
    this.documents.forEach(doc => {
      const titleLower = doc.title.toLowerCase();
      if (titleLower.includes(queryLower)) {
        suggestions.add(doc.title);
      }
      
      // Add partial matches from title words
      const titleWords = doc.title.split(/\s+/);
      titleWords.forEach(word => {
        if (word.toLowerCase().startsWith(queryLower) && word.length > queryLower.length) {
          suggestions.add(word);
        }
      });
    });
    
    // Get suggestions from keywords
    this.documents.forEach(doc => {
      doc.keywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(queryLower) && keyword.length > queryLower.length) {
          suggestions.add(keyword);
        }
      });
    });
    
    return Array.from(suggestions)
      .sort((a, b) => a.length - b.length) // Prefer shorter suggestions
      .slice(0, limit);
  }

  /**
   * Update index with new or modified documents
   */
  async updateIndex(since?: Date): Promise<void> {
    try {
      // For simplicity, just rebuild the entire index for now
      // In a more sophisticated implementation, we could do incremental updates
      await this.initializeIndex();
    } catch (error) {
      console.error('Failed to update fuzzy search index:', error);
    }
  }

  /**
   * Get related terms from search results
   */
  getRelatedTerms(query: string, limit: number = 3): string[] {
    if (!this.fuse) {
      return [];
    }

    const results = this.fuse.search(query, { limit: 5 });
    const relatedTerms = new Set<string>();
    
    results.forEach(result => {
      // Extract keywords from search results
      result.item.keywords.forEach(keyword => {
        if (keyword.toLowerCase() !== query.toLowerCase() && keyword.length > 3) {
          relatedTerms.add(keyword);
        }
      });
    });
    
    return Array.from(relatedTerms).slice(0, limit);
  }

  /**
   * Get index statistics
   */
  getStats(): { totalDocuments: number; lastIndexed: Date | null } {
    return {
      totalDocuments: this.documents.length,
      lastIndexed: this.lastIndexed
    };
  }

  /**
   * Check if the search service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const exists = await this.parser.counselDirectoryExists();
      return exists && this.documents.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Highlight search terms in text (for display purposes)
   */
  highlightMatches(text: string, matches: FuseResultMatch[]): string {
    if (!matches.length) return text;
    
    let highlightedText = text;
    
    // Simple highlighting - in a real implementation you might want more sophisticated highlighting
    matches.forEach(match => {
      if (match.value) {
        const regex = new RegExp(`(${this.escapeRegExp(match.value)})`, 'gi');
        highlightedText = highlightedText.replace(regex, '**$1**');
      }
    });
    
    return highlightedText;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton instance
export const fuzzySearchService = new FuzzySearchService();