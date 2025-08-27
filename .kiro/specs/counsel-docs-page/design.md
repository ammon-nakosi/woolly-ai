# Design Document

## Overview

The Counsel Framework documentation page will be a new route (`/docs`) within the existing Next.js visualizer application. The page will serve as the primary reference for understanding and using the Counsel Framework, featuring clear navigation, responsive design, and interactive elements to enhance the user experience.

The design extends the existing visualizer infrastructure by adding a dedicated documentation route and reusable components, while maintaining consistency with the current project list interface and leveraging the already-configured Tailwind CSS and TypeScript setup.

## Architecture

### Technology Stack

- **Frontend Framework**: Existing Next.js 15.5.1 with React 19.1.0 visualizer app
- **Styling**: Tailwind CSS 4.0 for responsive, utility-first styling (already configured)
- **TypeScript**: Full type safety throughout the application (already configured)
- **Deployment**: Extends existing visualizer deployment
- **Navigation**: Client-side routing with smooth scrolling and anchor links

### Application Structure (Additions to Existing Visualizer)

```
visualizer/
├── app/
│   ├── docs/
│   │   └── page.tsx                 # NEW: Main documentation page
│   ├── layout.tsx                   # EXISTING: Root layout (may need nav updates)
│   ├── page.tsx                     # EXISTING: Project list page
│   └── globals.css                  # EXISTING: Global styles
├── components/                      # NEW: Component directory
│   ├── docs/
│   │   ├── DocSection.tsx           # Reusable section component
│   │   ├── CodeBlock.tsx            # Syntax-highlighted code blocks
│   │   ├── NavigationSidebar.tsx    # Sticky navigation sidebar
│   │   ├── TableOfContents.tsx      # Auto-generated TOC
│   │   └── SearchBox.tsx            # In-page search functionality
│   └── ui/
│       ├── Badge.tsx                # Mode badges and status indicators
│       └── Button.tsx               # Consistent button styling
├── lib/
│   ├── counsel-reader.ts            # EXISTING: Counsel data reading
│   ├── docs-content.ts              # NEW: Structured documentation content
│   └── search-utils.ts              # NEW: Client-side search functionality
└── public/
    └── docs/                        # NEW: Documentation assets
        └── images/                  # Documentation images and diagrams
```

### Design System

**Color Palette:**
- Primary: Blue (#3B82F6) for links and primary actions
- Mode Colors: 
  - Feature: Blue (#3B82F6)
  - Script: Green (#10B981)
  - Debug: Red (#EF4444)
  - Review: Purple (#8B5CF6)
  - Vibe: Yellow (#F59E0B)
- Neutral: Gray scale for text and backgrounds
- Success: Green for positive states
- Warning: Orange for cautions

**Typography:**
- Headings: Inter font family, bold weights
- Body: Inter font family, regular weight
- Code: JetBrains Mono for code blocks and inline code

**Spacing:**
- Consistent 8px grid system
- Generous whitespace for readability
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

## Components and Interfaces

### Core Components

#### 1. DocSection Component
```typescript
interface DocSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}
```

Reusable section component with:
- Automatic anchor link generation
- Consistent spacing and typography
- Responsive heading sizes
- Optional custom styling

#### 2. CodeBlock Component
```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}
```

Features:
- Syntax highlighting for multiple languages
- Copy-to-clipboard functionality
- Optional line numbers and highlighting
- Responsive overflow handling

#### 3. NavigationSidebar Component
```typescript
interface NavigationItem {
  id: string;
  title: string;
  level: number;
  children?: NavigationItem[];
}

interface NavigationSidebarProps {
  items: NavigationItem[];
  activeSection: string;
}
```

Features:
- Auto-generated from page headings
- Sticky positioning on desktop
- Collapsible mobile menu
- Active section highlighting
- Smooth scroll to sections

#### 4. SearchBox Component
```typescript
interface SearchResult {
  id: string;
  title: string;
  content: string;
  section: string;
  score: number;
}

interface SearchBoxProps {
  onResultSelect: (result: SearchResult) => void;
}
```

Features:
- Real-time search as user types
- Fuzzy matching algorithm
- Keyboard navigation (arrow keys, enter)
- Search result highlighting
- Mobile-optimized interface

**Search Implementation Details:**

The search will be entirely client-side using a pre-built search index:

1. **Search Index Creation**: At build time, all documentation content is processed to create a searchable index containing:
   - Section titles and IDs
   - Text content broken into searchable chunks
   - Command names and descriptions
   - Code examples and their contexts
   - Keywords and tags

2. **Search Algorithm**: Uses Fuse.js or similar fuzzy search library for:
   - Typo tolerance (handles misspellings)
   - Partial matching (finds "auth" in "authentication")
   - Weighted scoring (titles score higher than content)
   - Multi-field search (searches titles, content, and commands simultaneously)

3. **Search Index Structure**:
```typescript
interface SearchIndex {
  sections: SearchableSection[];
  commands: SearchableCommand[];
  examples: SearchableExample[];
}

interface SearchableSection {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  type: 'section' | 'subsection';
  path: string; // anchor link
}
```

4. **Performance**: 
   - Index loaded once on page mount
   - Debounced search (300ms delay) to avoid excessive computation
   - Results limited to top 10 matches
   - Instant highlighting and navigation

### Data Models

#### Documentation Content Structure
```typescript
interface DocContent {
  sections: DocSection[];
  metadata: {
    title: string;
    description: string;
    lastUpdated: string;
    version: string;
  };
}

interface DocSection {
  id: string;
  title: string;
  level: number;
  content: string | React.ReactNode;
  subsections?: DocSection[];
}
```

#### Command Reference Structure
```typescript
interface Command {
  name: string;
  type: 'cli' | 'slash';
  description: string;
  syntax: string;
  examples: CommandExample[];
  options?: CommandOption[];
  relatedCommands?: string[];
}

interface CommandExample {
  command: string;
  description: string;
  output?: string;
}
```

## Data Models

### Content Organization

The documentation content will be organized into the following main sections:

1. **Overview** - Framework introduction and key concepts
2. **Getting Started** - Installation and setup instructions
3. **Counsel Modes** - Detailed explanation of each mode
4. **CLI Reference** - Complete command documentation
5. **Slash Commands** - Interactive workflow commands
6. **Integrations** - ChromaDB, Linear, and Git setup
7. **Architecture** - System design and philosophy
8. **Examples** - Practical workflows and use cases
9. **Development** - Contributing and extending the framework
10. **Troubleshooting** - Common issues and solutions

### Content Management

Content will be structured as TypeScript objects for:
- Type safety and IDE support
- Easy maintenance and updates
- Consistent formatting
- Reusable components

Example structure:
```typescript
export const docsContent: DocContent = {
  metadata: {
    title: "Counsel Framework Documentation",
    description: "Comprehensive guide to the Counsel Framework",
    lastUpdated: "2025-01-26",
    version: "1.0.0"
  },
  sections: [
    {
      id: "overview",
      title: "Overview",
      level: 1,
      content: OverviewSection,
      subsections: [
        {
          id: "what-is-counsel",
          title: "What is Counsel?",
          level: 2,
          content: "..."
        }
      ]
    }
  ]
};
```

## Search Implementation

### Search Architecture

The documentation search will be implemented as a client-side solution for optimal performance and user experience:

**Search Index Generation (Build Time):**
```typescript
// lib/search-index-builder.ts
export function buildSearchIndex(docsContent: DocContent): SearchIndex {
  const index: SearchIndex = {
    sections: [],
    commands: [],
    examples: []
  };
  
  // Process each section recursively
  docsContent.sections.forEach(section => {
    index.sections.push({
      id: section.id,
      title: section.title,
      content: extractTextContent(section.content),
      keywords: extractKeywords(section.content),
      type: section.level === 1 ? 'section' : 'subsection',
      path: `#${section.id}`
    });
  });
  
  return index;
}
```

**Search Component Implementation:**
```typescript
// components/docs/SearchBox.tsx
export function SearchBox({ onResultSelect }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const fuse = useMemo(() => new Fuse(searchIndex, {
    keys: ['title', 'content', 'keywords'],
    threshold: 0.3, // Fuzzy matching tolerance
    includeScore: true,
    minMatchCharLength: 2
  }), []);
  
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      
      const searchResults = fuse.search(searchQuery, { limit: 10 });
      setResults(searchResults.map(result => ({
        ...result.item,
        score: result.score || 0
      })));
    }, 300),
    [fuse]
  );
  
  // Handle search input and keyboard navigation
}
```

**Search Features:**
- **Instant Results**: No network requests, all searching happens client-side
- **Fuzzy Matching**: Handles typos and partial matches
- **Contextual Results**: Shows surrounding content for better context
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select
- **Mobile Optimized**: Touch-friendly interface with proper focus management
- **Accessibility**: Screen reader announcements for result updates

**Search Index Content:**
- All section titles and content
- CLI command names, descriptions, and examples
- Slash command names and purposes
- Code examples with context
- Integration setup instructions
- Troubleshooting solutions

## Error Handling

### Client-Side Error Boundaries
- React Error Boundaries to catch and display user-friendly error messages
- Graceful degradation for missing content or failed searches
- Fallback content for network issues

### Search Error Handling
- Handle empty search results with helpful suggestions
- Provide feedback for search queries that are too short
- Graceful handling of search index loading failures

### Navigation Error Handling
- Fallback for invalid anchor links
- Smooth handling of missing sections
- Mobile navigation state management

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Search functionality testing with mock data
- Navigation behavior testing
- Responsive design testing

### Integration Testing
- End-to-end user flows with Playwright
- Cross-browser compatibility testing
- Mobile device testing
- Performance testing with Lighthouse

### Content Testing
- Automated link checking
- Code example validation
- Content freshness monitoring
- Accessibility compliance testing

### Test Coverage Goals
- 90%+ component test coverage
- All user interaction flows covered
- Performance benchmarks established
- Accessibility standards met (WCAG 2.1 AA)

## Performance Considerations

### Optimization Strategies
- Static site generation for fast initial load
- Code splitting for large documentation sections
- Image optimization with Next.js Image component
- Lazy loading for non-critical content

### Bundle Size Management
- Tree shaking for unused code elimination
- Dynamic imports for search functionality
- Minimal external dependencies
- Efficient CSS with Tailwind purging

### Search Performance
- Client-side search index for instant results (no server requests)
- Pre-built search index loaded once at page initialization
- Debounced search input (300ms) to reduce computation
- Efficient fuzzy matching with Fuse.js library
- Search result caching for repeated queries
- Lazy loading of search functionality to reduce initial bundle size

### Mobile Performance
- Responsive images with appropriate sizing
- Touch-optimized navigation
- Reduced motion for accessibility
- Efficient scroll handling

## Accessibility Features

### Keyboard Navigation
- Full keyboard accessibility for all interactive elements
- Skip links for main content areas
- Focus management for search and navigation
- Logical tab order throughout the page

### Screen Reader Support
- Semantic HTML structure with proper headings
- ARIA labels for complex interactions
- Alt text for all images and diagrams
- Screen reader announcements for dynamic content

### Visual Accessibility
- High contrast color combinations
- Scalable text up to 200% zoom
- Clear focus indicators
- Reduced motion options

### Content Accessibility
- Plain language explanations
- Consistent terminology throughout
- Clear section headings and structure
- Multiple ways to find information (navigation, search, TOC)

## Responsive Design

### Breakpoint Strategy
- Mobile-first design approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Fluid typography and spacing
- Flexible grid layouts

### Mobile Optimizations
- Collapsible navigation menu
- Touch-friendly button sizes (44px minimum)
- Optimized code block scrolling
- Simplified search interface

### Desktop Enhancements
- Sticky sidebar navigation
- Multi-column layouts where appropriate
- Hover states for interactive elements
- Keyboard shortcuts for power users

### Content Adaptation
- Responsive tables with horizontal scrolling
- Adaptive image sizing
- Flexible code block presentation
- Context-aware navigation

## SEO and Discoverability

### Meta Tags and Structure
- Comprehensive meta descriptions
- Open Graph tags for social sharing
- Structured data markup
- Canonical URLs for content sections

### Content Optimization
- Descriptive headings and subheadings
- Internal linking between related sections
- Keyword-rich but natural content
- Regular content updates and freshness

### Technical SEO
- Fast loading times (< 3 seconds)
- Mobile-friendly design
- Clean URL structure
- XML sitemap generation

This design provides a solid foundation for creating a comprehensive, user-friendly documentation page that effectively showcases all aspects of the Counsel Framework while maintaining excellent performance and accessibility standards.