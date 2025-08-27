// Main exports for documentation system
export * from './docs-types';
export * from './docs-content';
export * from './search-utils';

// Re-export key items for convenience
export { 
  docsContent,
  counselModes,
  cliCommands,
  slashCommands,
  integrations,
  getNavigationItems,
  getSectionById,
  getAllSections
} from './docs-content';

export {
  buildSearchIndex,
  DocumentationSearch,
  documentationSearch,
  highlightSearchTerms,
  debounce
} from './search-utils';

export type {
  DocContent,
  DocSection,
  NavigationItem,
  SearchResult,
  SearchIndex,
  Command,
  CounselMode,
  Integration
} from './docs-types';