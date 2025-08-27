import Fuse from 'fuse.js';
import { 
  SearchIndex, 
  SearchableSection, 
  SearchableCommand, 
  SearchableExample,
  DocSection,

  SearchResult
} from './docs-types';
import { docsContent, cliCommands, slashCommands, counselModes, integrations } from './docs-content';

// Extract text content from React nodes or strings
function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  
  // Handle React elements by extracting text from props and children
  if (content && typeof content === 'object') {
    if (content.props) {
      let text = '';
      
      // Extract text from children
      if (content.props.children) {
        if (Array.isArray(content.props.children)) {
          text += content.props.children.map(extractTextContent).join(' ');
        } else {
          text += extractTextContent(content.props.children);
        }
      }
      
      // Extract text from common props that might contain text
      ['title', 'alt', 'label', 'placeholder'].forEach(prop => {
        if (content.props[prop]) {
          text += ' ' + content.props[prop];
        }
      });
      
      return text.trim();
    }
  }
  
  return content?.toString() || '';
}

// Extract keywords from content with improved algorithm
function extractKeywords(content: string, title?: string): string[] {
  const text = `${title || ''} ${content}`.toLowerCase();
  
  // Remove code blocks and special characters, split into words
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
    .replace(/`[^`]*`/g, ' ') // Remove inline code
    .replace(/[^\w\s-]/g, ' ') // Keep hyphens for compound words
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleanText.split(/\s+/).filter(word => word.length > 2);
  
  // Enhanced stop words list
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
    'this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'what', 'your', 'when', 'than', 'them', 'many', 'some', 'very', 'into', 'just', 'only', 'over', 'also', 'back', 'after', 'first', 'well', 'work', 'life', 'where', 'right', 'think', 'should', 'these', 'people', 'take', 'year', 'good', 'make', 'most', 'know', 'come', 'through', 'want', 'look', 'need', 'give', 'different', 'following', 'without', 'under', 'while', 'might', 'still', 'before', 'great', 'little', 'own', 'around', 'another', 'between', 'during', 'against', 'being', 'does', 'doing', 'here', 'off', 'again', 'because', 'both', 'important', 'until', 'children', 'side', 'feet', 'car', 'mile', 'night', 'walk'
  ]);
  
  // Filter out stop words and short words, remove duplicates
  const keywords = [...new Set(words.filter(word => 
    !stopWords.has(word) && 
    word.length > 2 && 
    !/^\d+$/.test(word) // Remove pure numbers
  ))];
  
  // Add technical terms and compound words
  const technicalTerms = extractTechnicalTerms(content);
  
  return [...keywords, ...technicalTerms];
}

// Extract technical terms and compound words
function extractTechnicalTerms(content: string): string[] {
  const terms: string[] = [];
  
  // Extract camelCase and PascalCase words
  const camelCaseRegex = /\b[a-z]+[A-Z][a-zA-Z]*\b/g;
  const camelCaseMatches = content.match(camelCaseRegex) || [];
  terms.push(...camelCaseMatches.map(term => term.toLowerCase()));
  
  // Extract kebab-case and snake_case
  const kebabSnakeRegex = /\b[a-z]+[-_][a-z][-_a-z]*\b/g;
  const kebabSnakeMatches = content.match(kebabSnakeRegex) || [];
  terms.push(...kebabSnakeMatches);
  
  // Extract file extensions and technical patterns
  const technicalPatterns = [
    /\b\w+\.(js|ts|jsx|tsx|json|md|yml|yaml|toml|env)\b/g, // File extensions
    /\b[A-Z]{2,}\b/g, // Acronyms (API, CLI, etc.)
    /\b\w*[Aa]uth\w*\b/g, // Authentication related
    /\b\w*[Dd]atabase?\w*\b/g, // Database related
    /\b\w*[Ss]erver?\w*\b/g, // Server related
  ];
  
  technicalPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    terms.push(...matches.map(term => term.toLowerCase()));
  });
  
  return [...new Set(terms)];
}

// Build comprehensive search index from all documentation content
export function buildSearchIndex(): SearchIndex {
  const index: SearchIndex = {
    sections: [],
    commands: [],
    examples: []
  };

  // Process documentation sections with enhanced content extraction
  function processSections(sections: DocSection[]) {
    sections.forEach(section => {
      const path = `#${section.id}`;
      const content = extractTextContent(section.content);
      
      // Create searchable section with enhanced metadata
      const searchableSection: SearchableSection = {
        id: section.id,
        title: section.title,
        content: content,
        keywords: extractKeywords(content, section.title),
        type: section.level === 1 ? 'section' : 'subsection',
        path: path
      };
      
      index.sections.push(searchableSection);

      // Process subsections recursively
      if (section.subsections) {
        processSections(section.subsections);
      }
    });
  }

  processSections(docsContent.sections);

  // Process Counsel modes as searchable content
  counselModes.forEach(mode => {
    const modeContent = `
      ${mode.description} ${mode.purpose}
      ${mode.useCases.join(' ')}
      ${mode.workflow.map(step => `${step.title} ${step.description}`).join(' ')}
      ${mode.directoryStructure.join(' ')}
    `;
    
    index.sections.push({
      id: `mode-${mode.id}`,
      title: `${mode.name} (${mode.id} mode)`,
      content: modeContent,
      keywords: extractKeywords(modeContent, mode.name),
      type: 'subsection',
      path: `#${mode.id}-mode`
    });
  });

  // Process integrations as searchable content
  integrations.forEach(integration => {
    const integrationContent = `
      ${integration.description}
      ${integration.features.join(' ')}
      ${integration.setupSteps.map(step => `${step.title} ${step.description}`).join(' ')}
      ${integration.troubleshooting.map(item => `${item.issue} ${item.solution}`).join(' ')}
    `;
    
    index.sections.push({
      id: `integration-${integration.id}`,
      title: `${integration.name} Integration`,
      content: integrationContent,
      keywords: extractKeywords(integrationContent, integration.name),
      type: 'subsection',
      path: `#${integration.id}-integration`
    });
  });

  // Process CLI and slash commands with enhanced metadata
  [...cliCommands, ...slashCommands].forEach(command => {
    const exampleText = command.examples.map(ex => `${ex.command} ${ex.description} ${ex.output || ''}`).join(' ');
    const optionsText = command.options?.map(opt => `${opt.name} ${opt.description} ${opt.type || ''}`).join(' ') || '';
    const relatedText = command.relatedCommands?.join(' ') || '';
    const fullContent = `${command.description} ${command.syntax} ${exampleText} ${optionsText} ${relatedText}`;

    const commandId = `command-${command.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    
    index.commands.push({
      id: commandId,
      name: command.name,
      type: command.type,
      description: command.description,
      syntax: command.syntax,
      keywords: extractKeywords(fullContent, command.name),
      path: `#${command.type === 'cli' ? 'cli-reference' : 'slash-commands'}`
    });

    // Add examples as searchable items with better context
    command.examples.forEach((example, exampleIndex) => {
      const exampleId = `example-${commandId}-${exampleIndex}`;
      const exampleContent = `${example.command} ${example.description} ${example.output || ''}`;
      
      index.examples.push({
        id: exampleId,
        title: `${command.name} Example: ${example.description}`,
        description: example.description,
        code: example.command,
        language: command.type === 'cli' ? 'bash' : 'text',
        keywords: extractKeywords(exampleContent, `${command.name} example`),
        path: `#${command.type === 'cli' ? 'cli-reference' : 'slash-commands'}`
      });
    });
  });

  // Add content chunking for better search results
  index.sections = chunkLargeContent(index.sections);

  return index;
}

// Chunk large content sections for better search granularity
function chunkLargeContent(sections: SearchableSection[]): SearchableSection[] {
  const chunkedSections: SearchableSection[] = [];
  
  sections.forEach(section => {
    if (section.content.length > 1000) {
      // Split large content into smaller chunks
      const sentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const chunkSize = Math.ceil(sentences.length / 3); // Create ~3 chunks
      
      for (let i = 0; i < sentences.length; i += chunkSize) {
        const chunkSentences = sentences.slice(i, i + chunkSize);
        const chunkContent = chunkSentences.join('. ').trim();
        
        if (chunkContent.length > 50) { // Only create chunk if it has meaningful content
          chunkedSections.push({
            ...section,
            id: `${section.id}-chunk-${Math.floor(i / chunkSize)}`,
            content: chunkContent,
            keywords: extractKeywords(chunkContent, section.title),
            type: 'subsection'
          });
        }
      }
    } else {
      chunkedSections.push(section);
    }
  });
  
  return chunkedSections;
}

// Enhanced search functionality with Fuse.js
export class DocumentationSearch {
  private index: SearchIndex;
  private sectionsFuse: Fuse<SearchableSection>;
  private commandsFuse: Fuse<SearchableCommand>;
  private examplesFuse: Fuse<SearchableExample>;
  
  constructor() {
    this.index = buildSearchIndex();
    this.initializeFuseInstances();
  }

  private initializeFuseInstances() {
    // Configure Fuse.js options for optimal search experience
    const fuseOptions = {
      includeScore: true,
      includeMatches: true,
      threshold: 0.4, // Lower = more strict matching
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true
    };

    // Sections search configuration
    this.sectionsFuse = new Fuse(this.index.sections, {
      ...fuseOptions,
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'keywords', weight: 0.3 }
      ]
    });

    // Commands search configuration
    this.commandsFuse = new Fuse(this.index.commands, {
      ...fuseOptions,
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'description', weight: 0.3 },
        { name: 'syntax', weight: 0.1 },
        { name: 'keywords', weight: 0.1 }
      ]
    });

    // Examples search configuration
    this.examplesFuse = new Fuse(this.index.examples, {
      ...fuseOptions,
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.3 },
        { name: 'code', weight: 0.2 },
        { name: 'keywords', weight: 0.2 }
      ]
    });
  }

  // Main search method with Fuse.js integration
  search(query: string, limit = 10): SearchResult[] {
    if (query.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];

    // Search sections
    const sectionResults = this.sectionsFuse.search(query, { limit: Math.ceil(limit * 0.6) });
    sectionResults.forEach(result => {
      if (result.score !== undefined && result.score < 0.8) { // Only include good matches
        results.push({
          id: result.item.id,
          title: result.item.title,
          content: this.getContextualContent(result.item.content, query),
          section: result.item.type === 'section' ? result.item.title : 'Documentation',
          score: 1 - result.score // Invert score (higher is better)
        });
      }
    });

    // Search commands
    const commandResults = this.commandsFuse.search(query, { limit: Math.ceil(limit * 0.3) });
    commandResults.forEach(result => {
      if (result.score !== undefined && result.score < 0.8) {
        results.push({
          id: result.item.id,
          title: result.item.name,
          content: `${result.item.description} - ${result.item.syntax}`,
          section: result.item.type === 'cli' ? 'CLI Commands' : 'Slash Commands',
          score: (1 - result.score) * 1.1 // Boost command results slightly
        });
      }
    });

    // Search examples
    const exampleResults = this.examplesFuse.search(query, { limit: Math.ceil(limit * 0.2) });
    exampleResults.forEach(result => {
      if (result.score !== undefined && result.score < 0.8) {
        results.push({
          id: result.item.id,
          title: result.item.title,
          content: `${result.item.description} - ${result.item.code}`,
          section: 'Examples',
          score: (1 - result.score) * 0.9 // Slightly lower priority for examples
        });
      }
    });

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get contextual content snippet around search terms
  private getContextualContent(content: string, query: string, maxLength = 200): string {
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

  // Get search suggestions with improved algorithm
  getSuggestions(partialQuery: string, limit = 5): string[] {
    if (partialQuery.length < 1) return [];
    
    const suggestions = new Set<string>();
    const queryLower = partialQuery.toLowerCase();
    
    // Get suggestions from section titles
    this.index.sections.forEach(section => {
      const titleLower = section.title.toLowerCase();
      if (titleLower.includes(queryLower)) {
        suggestions.add(section.title);
      }
      
      // Add partial matches from title words
      const titleWords = section.title.split(/\s+/);
      titleWords.forEach(word => {
        if (word.toLowerCase().startsWith(queryLower) && word.length > queryLower.length) {
          suggestions.add(word);
        }
      });
    });
    
    // Get suggestions from command names
    this.index.commands.forEach(command => {
      if (command.name.toLowerCase().includes(queryLower)) {
        suggestions.add(command.name);
      }
    });
    
    // Get suggestions from keywords
    this.index.sections.forEach(section => {
      section.keywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(queryLower) && keyword.length > queryLower.length) {
          suggestions.add(keyword);
        }
      });
    });
    
    return Array.from(suggestions)
      .sort((a, b) => a.length - b.length) // Prefer shorter suggestions
      .slice(0, limit);
  }

  // Get related search terms
  getRelatedTerms(query: string, limit = 3): string[] {
    const results = this.search(query, 5);
    const relatedTerms = new Set<string>();
    
    results.forEach(result => {
      // Extract keywords from search results
      const item = this.findItemById(result.id);
      if (item && 'keywords' in item) {
        item.keywords.forEach(keyword => {
          if (keyword.toLowerCase() !== query.toLowerCase() && keyword.length > 3) {
            relatedTerms.add(keyword);
          }
        });
      }
    });
    
    return Array.from(relatedTerms).slice(0, limit);
  }

  // Find item by ID across all indexes
  private findItemById(id: string): SearchableSection | SearchableCommand | SearchableExample | null {
    let item = this.index.sections.find(s => s.id === id);
    if (item) return item;
    
    item = this.index.commands.find(c => c.id === id);
    if (item) return item;
    
    item = this.index.examples.find(e => e.id === id);
    if (item) return item;
    
    return null;
  }

  // Get search analytics data
  getSearchStats(): {
    totalSections: number;
    totalCommands: number;
    totalExamples: number;
    totalKeywords: number;
  } {
    const allKeywords = new Set<string>();
    
    this.index.sections.forEach(s => s.keywords.forEach(k => allKeywords.add(k)));
    this.index.commands.forEach(c => c.keywords.forEach(k => allKeywords.add(k)));
    this.index.examples.forEach(e => e.keywords.forEach(k => allKeywords.add(k)));
    
    return {
      totalSections: this.index.sections.length,
      totalCommands: this.index.commands.length,
      totalExamples: this.index.examples.length,
      totalKeywords: allKeywords.size
    };
  }
}

// Utility function to highlight search terms in text
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}

// Debounce utility for search input
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Search result navigation utilities
export class SearchResultNavigator {
  private static instance: SearchResultNavigator;
  private currentHighlights: Element[] = [];
  private searchAnalytics: {
    queries: string[];
    results: { query: string; resultCount: number; timestamp: number }[];
    selections: { query: string; resultId: string; timestamp: number }[];
  } = {
    queries: [],
    results: [],
    selections: []
  };

  static getInstance(): SearchResultNavigator {
    if (!SearchResultNavigator.instance) {
      SearchResultNavigator.instance = new SearchResultNavigator();
    }
    return SearchResultNavigator.instance;
  }

  // Smooth scroll to search result with highlighting
  scrollToResult(resultId: string, searchTerms: string[] = []): void {
    const targetElement = document.getElementById(resultId);
    if (!targetElement) {
      // Try to find element by data attributes or class names
      const alternativeElement = document.querySelector(`[data-section-id="${resultId}"]`) ||
                                document.querySelector(`[data-id="${resultId}"]`) ||
                                document.querySelector(`.${resultId}`);
      
      if (alternativeElement) {
        this.performScroll(alternativeElement as HTMLElement, searchTerms);
      } else {
        console.warn(`Element with ID "${resultId}" not found`);
      }
      return;
    }

    this.performScroll(targetElement, searchTerms);
  }

  private performScroll(element: HTMLElement, searchTerms: string[] = []): void {
    // Clear previous highlights
    this.clearHighlights();

    // Smooth scroll to element
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });

    // Add temporary highlight to the target element
    this.addTemporaryHighlight(element);

    // Highlight search terms in the content
    if (searchTerms.length > 0) {
      this.highlightTermsInElement(element, searchTerms);
    }

    // Focus the element for accessibility
    if (element.tabIndex === -1) {
      element.tabIndex = -1;
    }
    element.focus({ preventScroll: true });
  }

  private addTemporaryHighlight(element: HTMLElement): void {
    element.classList.add('search-result-highlight');
    
    // Remove highlight after animation
    setTimeout(() => {
      element.classList.remove('search-result-highlight');
    }, 2000);
  }

  private highlightTermsInElement(element: HTMLElement, searchTerms: string[]): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentElement;
      if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
        return;
      }

      let text = textNode.textContent || '';
      let hasMatch = false;

      searchTerms.forEach(term => {
        const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
        if (regex.test(text)) {
          hasMatch = true;
          text = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
      });

      if (hasMatch) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = text;
        parent.replaceChild(wrapper, textNode);
        this.currentHighlights.push(wrapper);
      }
    });
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Clear all search highlights
  clearHighlights(): void {
    this.currentHighlights.forEach(element => {
      const parent = element.parentElement;
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent || ''), element);
        parent.normalize();
      }
    });
    this.currentHighlights = [];

    // Also clear any existing mark elements
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
      const parent = mark.parentElement;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  }

  // Search analytics methods
  recordSearch(query: string, resultCount: number): void {
    this.searchAnalytics.queries.push(query);
    this.searchAnalytics.results.push({
      query,
      resultCount,
      timestamp: Date.now()
    });

    // Keep only last 100 searches
    if (this.searchAnalytics.queries.length > 100) {
      this.searchAnalytics.queries = this.searchAnalytics.queries.slice(-100);
    }
    if (this.searchAnalytics.results.length > 100) {
      this.searchAnalytics.results = this.searchAnalytics.results.slice(-100);
    }
  }

  recordSelection(query: string, resultId: string): void {
    this.searchAnalytics.selections.push({
      query,
      resultId,
      timestamp: Date.now()
    });

    // Keep only last 100 selections
    if (this.searchAnalytics.selections.length > 100) {
      this.searchAnalytics.selections = this.searchAnalytics.selections.slice(-100);
    }
  }

  getSearchAnalytics(): {
    totalSearches: number;
    averageResultCount: number;
    topQueries: { query: string; count: number }[];
    clickThroughRate: number;
  } {
    const totalSearches = this.searchAnalytics.results.length;
    const averageResultCount = totalSearches > 0 
      ? this.searchAnalytics.results.reduce((sum, r) => sum + r.resultCount, 0) / totalSearches 
      : 0;

    // Calculate top queries
    const queryCount = new Map<string, number>();
    this.searchAnalytics.queries.forEach(query => {
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
    });
    
    const topQueries = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate click-through rate
    const clickThroughRate = totalSearches > 0 
      ? (this.searchAnalytics.selections.length / totalSearches) * 100 
      : 0;

    return {
      totalSearches,
      averageResultCount,
      topQueries,
      clickThroughRate
    };
  }

  // Get popular search terms for ranking improvements
  getPopularTerms(): string[] {
    const termCount = new Map<string, number>();
    
    this.searchAnalytics.queries.forEach(query => {
      const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      terms.forEach(term => {
        termCount.set(term, (termCount.get(term) || 0) + 1);
      });
    });

    return Array.from(termCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term]) => term);
  }
}

// Global keyboard shortcut handler
export class SearchKeyboardHandler {
  private static instance: SearchKeyboardHandler;
  private searchBoxRef: React.RefObject<HTMLInputElement> | null = null;
  private isEnabled = true;

  static getInstance(): SearchKeyboardHandler {
    if (!SearchKeyboardHandler.instance) {
      SearchKeyboardHandler.instance = new SearchKeyboardHandler();
    }
    return SearchKeyboardHandler.instance;
  }

  setSearchBoxRef(ref: React.RefObject<HTMLInputElement>): void {
    this.searchBoxRef = ref;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  handleGlobalKeydown = (event: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    // Ctrl/Cmd + K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.focusSearch();
    }

    // Escape to clear search and blur
    if (event.key === 'Escape' && this.searchBoxRef?.current === document.activeElement) {
      this.clearAndBlurSearch();
    }
  };

  private focusSearch(): void {
    if (this.searchBoxRef?.current) {
      this.searchBoxRef.current.focus();
      this.searchBoxRef.current.select();
    }
  }

  private clearAndBlurSearch(): void {
    if (this.searchBoxRef?.current) {
      this.searchBoxRef.current.value = '';
      this.searchBoxRef.current.blur();
      
      // Trigger change event to clear results
      const event = new Event('input', { bubbles: true });
      this.searchBoxRef.current.dispatchEvent(event);
    }
  }
}

// CSS styles for search highlighting (to be added to global CSS)
export const searchHighlightStyles = `
  .search-result-highlight {
    animation: searchResultPulse 2s ease-in-out;
    background-color: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    padding-left: 1rem;
  }

  .search-highlight {
    background-color: #fef08a;
    color: #92400e;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  @keyframes searchResultPulse {
    0% {
      background-color: rgba(59, 130, 246, 0.2);
      transform: scale(1);
    }
    50% {
      background-color: rgba(59, 130, 246, 0.1);
      transform: scale(1.01);
    }
    100% {
      background-color: rgba(59, 130, 246, 0.05);
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .search-result-highlight {
      animation: none;
    }
  }

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    .search-result-highlight {
      background-color: rgba(59, 130, 246, 0.15);
      border-left-color: #60a5fa;
    }

    .search-highlight {
      background-color: #fbbf24;
      color: #92400e;
    }
  }
`;

// Export singleton instances
export const documentationSearch = new DocumentationSearch();
export const searchResultNavigator = SearchResultNavigator.getInstance();
export const searchKeyboardHandler = SearchKeyboardHandler.getInstance();