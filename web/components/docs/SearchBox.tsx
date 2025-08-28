import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { SearchResult } from '../../lib/docs-types';
import { 
  documentationSearch, 
  debounce, 
  highlightSearchTerms, 
  searchResultNavigator,
  searchKeyboardHandler
} from '../../lib/search-utils';

interface SearchBoxProps {
  onResultSelect: (result: SearchResult, searchQuery?: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({ 
  onResultSelect, 
  placeholder = "Search documentation...",
  className = ""
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search function with analytics
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      setIsLoading(true);
      
      if (searchQuery.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const searchResults = documentationSearch.search(searchQuery, 8);
        setResults(searchResults);
        
        // Record search analytics
        searchResultNavigator.recordSearch(searchQuery, searchResults.length);
        
        // Get suggestions for partial queries
        if (searchQuery.length >= 1) {
          const searchSuggestions = documentationSearch.getSuggestions(searchQuery, 5);
          setSuggestions(searchSuggestions);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Get related terms for better search experience
  const getRelatedTerms = useCallback((searchQuery: string) => {
    if (searchQuery.length >= 3) {
      return documentationSearch.getRelatedTerms(searchQuery, 3);
    }
    return [];
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setShowSuggestions(value.length > 0 && value.length < 3);
    
    // Perform debounced search
    debouncedSearch(value);
    setIsOpen(value.length > 0);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    debouncedSearch(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle suggestions navigation
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
      return;
    }

    // Handle search results navigation
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        // Allow tab to close search and move to next element
        setIsOpen(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    // Record analytics
    searchResultNavigator.recordSelection(query, result.id);
    
    // Call parent handler with search query for proper highlighting
    onResultSelect(result, query);
    
    // Clear search state
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setIsOpen(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setIsOpen(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Setup global keyboard shortcuts
  useEffect(() => {
    searchKeyboardHandler.setSearchBoxRef(inputRef);
    document.addEventListener('keydown', searchKeyboardHandler.handleGlobalKeydown);
    
    return () => {
      document.removeEventListener('keydown', searchKeyboardHandler.handleGlobalKeydown);
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative w-full max-w-md ${className}`} ref={resultsRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          aria-label="Search documentation"

          aria-haspopup="listbox"
          aria-describedby="search-shortcut"
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear button and loading indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={clearSearch}
              className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="hidden sm:block text-xs text-gray-400 font-mono">⌘K</div>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div id="search-shortcut" className="sr-only">
        Press Ctrl+K or Cmd+K to focus search
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Suggestions
            </div>
            <ul role="listbox" className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  role="option"
                  data-index={index}
                  aria-selected={index === selectedIndex}
                  className={`px-4 py-2 cursor-pointer transition-colors text-sm ${
                    index === selectedIndex 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {suggestion}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && !showSuggestions && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <ul role="listbox" className="py-1">
            {results.map((result, index) => (
              <li
                key={result.id}
                role="option"
                data-index={index}
                aria-selected={index === selectedIndex}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                  index === selectedIndex 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleResultSelect(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {result.section}
                    </div>
                    <div 
                      className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerms(result.content, query.split(/\s+/))
                      }}
                    />
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Related terms */}
          {query.length >= 3 && (
            <div className="border-t border-gray-200 dark:border-gray-600 p-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Related terms:
              </div>
              <div className="flex flex-wrap gap-1">
                {getRelatedTerms(query).map(term => (
                  <button
                    key={term}
                    onClick={() => handleSuggestionSelect(term)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && !showSuggestions && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            No results found for &quot;{query}&quot;
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Try different keywords or check spelling
          </div>
        </div>
      )}
    </div>
  );
}