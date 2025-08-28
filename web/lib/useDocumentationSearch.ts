import { useState, useEffect, useCallback } from 'react';
import { SearchResult } from './docs-types';
import { searchResultNavigator, searchKeyboardHandler } from './search-utils';

export interface UseDocumentationSearchReturn {
  // Search state
  isSearchActive: boolean;
  currentSearchTerms: string[];
  
  // Navigation methods
  handleSearchResultSelect: (result: SearchResult, searchQuery?: string) => void;
  clearSearchHighlights: () => void;
  navigateToSection: (sectionId: string, highlight?: boolean) => void;
  
  // Analytics
  getSearchAnalytics: () => ReturnType<typeof searchResultNavigator.getSearchAnalytics>;
  
  // Keyboard shortcuts
  enableKeyboardShortcuts: () => void;
  disableKeyboardShortcuts: () => void;
}

export function useDocumentationSearch(): UseDocumentationSearchReturn {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentSearchTerms, setCurrentSearchTerms] = useState<string[]>([]);

  // Handle search result selection with navigation and highlighting
  const handleSearchResultSelect = useCallback((result: SearchResult, searchQuery?: string) => {
    const searchTerms = searchQuery 
      ? searchQuery.split(/\s+/).filter(term => term.length > 1)
      : [];
    
    setCurrentSearchTerms(searchTerms);
    setIsSearchActive(true);
    
    // Navigate to the result with highlighting
    searchResultNavigator.scrollToResult(result.id, searchTerms);
    
    // Auto-clear highlights after 10 seconds
    setTimeout(() => {
      setIsSearchActive(false);
      setCurrentSearchTerms([]);
    }, 10000);
  }, []);

  // Clear search highlights manually
  const clearSearchHighlights = useCallback(() => {
    searchResultNavigator.clearHighlights();
    setIsSearchActive(false);
    setCurrentSearchTerms([]);
  }, []);

  // Navigate to a specific section
  const navigateToSection = useCallback((sectionId: string, highlight = true) => {
    if (highlight) {
      setIsSearchActive(true);
      searchResultNavigator.scrollToResult(sectionId, []);
      
      // Auto-clear highlight after 3 seconds for manual navigation
      setTimeout(() => {
        setIsSearchActive(false);
      }, 3000);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  // Get search analytics
  const getSearchAnalytics = useCallback(() => {
    return searchResultNavigator.getSearchAnalytics();
  }, []);

  // Enable/disable keyboard shortcuts
  const enableKeyboardShortcuts = useCallback(() => {
    searchKeyboardHandler.enable();
  }, []);

  const disableKeyboardShortcuts = useCallback(() => {
    searchKeyboardHandler.disable();
  }, []);

  // Clear highlights when component unmounts or page changes
  useEffect(() => {
    return () => {
      searchResultNavigator.clearHighlights();
    };
  }, []);

  // Listen for escape key to clear highlights
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchActive) {
        clearSearchHighlights();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSearchActive, clearSearchHighlights]);

  return {
    isSearchActive,
    currentSearchTerms,
    handleSearchResultSelect,
    clearSearchHighlights,
    navigateToSection,
    getSearchAnalytics,
    enableKeyboardShortcuts,
    disableKeyboardShortcuts
  };
}

// Hook for search analytics dashboard
export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState(searchResultNavigator.getSearchAnalytics());

  const refreshAnalytics = useCallback(() => {
    setAnalytics(searchResultNavigator.getSearchAnalytics());
  }, []);

  // Refresh analytics every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshAnalytics, 30000);
    return () => clearInterval(interval);
  }, [refreshAnalytics]);

  return {
    analytics,
    refreshAnalytics,
    popularTerms: searchResultNavigator.getPopularTerms()
  };
}

// Hook for managing search keyboard shortcuts in different contexts
export function useSearchKeyboardShortcuts(enabled = true) {
  useEffect(() => {
    if (enabled) {
      searchKeyboardHandler.enable();
    } else {
      searchKeyboardHandler.disable();
    }

    return () => {
      searchKeyboardHandler.enable(); // Re-enable on cleanup
    };
  }, [enabled]);

  return {
    enable: searchKeyboardHandler.enable,
    disable: searchKeyboardHandler.disable
  };
}