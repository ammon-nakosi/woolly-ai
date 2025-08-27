# ChromaDB Integration Design for Counsel Framework

## Overview

This document outlines the design for integrating ChromaDB as the semantic search and knowledge management layer for the Counsel Framework. ChromaDB will enable intelligent search, knowledge discovery, and pattern recognition across all counsel work.

## Goals

1. **Semantic Search**: Enable natural language search across all counsel work
2. **Knowledge Discovery**: Find similar problems, solutions, and patterns
3. **Context Awareness**: Provide relevant context from past work during new development
4. **Learning Capture**: Index learnings and patterns for future reference
5. **Cross-Project Intelligence**: Share knowledge across different projects

## Architecture

### Collections Design

We'll use four main collections to organize different types of data:

#### 1. `counsel_items` Collection
Primary collection for tracking all counsel work items.

**Documents**: Brief description/summary of each counsel item
**Metadata**:
```typescript
{
  id: string;              // UUID
  type: 'counsel_item';
  mode: 'feature' | 'script' | 'debug' | 'review' | 'vibe';
  name: string;            // e.g., "user-authentication"
  path: string;            // File system path
  project: {
    name: string;
    path: string;
    gitRemote?: string;
  };
  status: 'planned' | 'in-progress' | 'completed' | 'abandoned';
  phase?: number;          // For features
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  created: string;         // ISO timestamp
  updated: string;
  lastWorked: string;
  completedAt?: string;
}
```

#### 2. `counsel_documents` Collection
Indexes the actual content of markdown documents for deep search.

**Documents**: Full markdown content (chunked if needed)
**Metadata**:
```typescript
{
  id: string;              // UUID
  type: 'document';
  itemId: string;          // Reference to counsel_items
  mode: string;
  name: string;            // Item name
  documentType: 'requirements' | 'discovery' | 'plan' | 'implementation' | 
                'status' | 'notes' | 'issue' | 'findings';
  fileName: string;        // e.g., "requirements.md"
  path: string;            // Full file path
  phase?: number;          // If applicable
  chunkIndex?: number;     // For large documents
  totalChunks?: number;
  created: string;
  updated: string;
}
```

#### 3. `counsel_code` Collection
Indexes code implementations and changes.

**Documents**: Code snippets, diffs, or implementations
**Metadata**:
```typescript
{
  id: string;
  type: 'code';
  itemId: string;          // Reference to counsel_items
  mode: string;
  name: string;
  language: string;        // Programming language
  fileType: string;        // File extension
  filePath?: string;       // Original file path
  operation: 'created' | 'modified' | 'deleted';
  phase?: number;
  taskId?: string;         // Reference to specific task
  description: string;     // What this code does
  dependencies?: string[]; // External dependencies used
  created: string;
}
```

#### 4. `counsel_knowledge` Collection
Captures reusable knowledge, patterns, and learnings.

**Documents**: Knowledge description or pattern explanation
**Metadata**:
```typescript
{
  id: string;
  type: 'knowledge';
  knowledgeType: 'pattern' | 'solution' | 'gotcha' | 'best-practice' | 
                 'anti-pattern' | 'learning';
  sourceItemId?: string;   // Which counsel item this came from
  title: string;
  category: string;        // e.g., "authentication", "performance"
  tags: string[];
  technologies?: string[]; // Related technologies
  problemSpace?: string;   // Problem it solves
  applicability: 'specific' | 'general';
  confidence: 'low' | 'medium' | 'high';
  usage: number;           // Times referenced
  created: string;
  verified: boolean;       // Has been verified as correct
}
```

### Embedding Strategy

#### Model Selection
- **Default**: Use ChromaDB's default sentence-transformers model (all-MiniLM-L6-v2)
- **Enhanced Option**: Support OpenAI embeddings for better semantic understanding
- **Configuration**: Allow users to choose embedding model via config

#### Document Processing
1. **Smart Chunking**: Break large documents into semantic chunks (max ~1000 tokens)
2. **Context Preservation**: Include document context in each chunk
3. **Hierarchical Indexing**: Index at multiple levels (full doc, sections, paragraphs)

### Search Capabilities

#### 1. Multi-Modal Search
```typescript
interface SearchOptions {
  query: string;
  mode?: CounselMode | 'all';
  type?: 'items' | 'documents' | 'code' | 'knowledge' | 'all';
  project?: string;
  status?: string[];
  dateRange?: { from: Date; to: Date };
  limit?: number;
  threshold?: number;
  includeArchived?: boolean;
}
```

#### 2. Smart Query Enhancement
- Expand queries with synonyms
- Detect intent (searching for problem vs solution)
- Context-aware search based on current work

#### 3. Relevance Scoring
- Combine semantic similarity with metadata matching
- Boost recent and frequently accessed items
- Consider project and mode context

## Implementation Plan

### Phase 1: Core Infrastructure
1. Install and configure ChromaDB client
2. Implement connection management with retry logic
3. Create collection initialization
4. Add health check and status endpoints

### Phase 2: Indexing Pipeline
1. Implement document processors for each file type
2. Create smart chunking algorithm
3. Build incremental indexing system
4. Add batch indexing for existing counsel work

### Phase 3: Search Features
1. Implement basic semantic search
2. Add metadata filtering
3. Create relevance ranking
4. Build query suggestion system

### Phase 4: Knowledge Management
1. Implement pattern extraction
2. Create knowledge verification workflow
3. Build cross-reference system
4. Add learning capture from completed work

### Phase 5: Advanced Features
1. Implement similarity clustering
2. Add trend detection
3. Create recommendation engine
4. Build context-aware assistance

## Usage Examples

### Indexing a New Feature
```typescript
// When creating a new feature
await counselIndex.addItem({
  mode: 'feature',
  name: 'user-authentication',
  description: 'Implement user authentication with JWT',
  project: 'my-app',
  priority: 'high'
});

// Index requirements document
await counselIndex.addDocument({
  itemId: itemId,
  documentType: 'requirements',
  content: requirementsMarkdown,
  fileName: 'requirements.md'
});
```

### Searching for Similar Work
```typescript
// Find similar features
const similar = await counselSearch.findSimilar({
  query: "implement authentication with social login",
  type: 'items',
  mode: 'feature',
  limit: 5
});

// Search for code patterns
const patterns = await counselSearch.findPatterns({
  query: "JWT token validation",
  type: 'code',
  language: 'typescript'
});
```

### Extracting Knowledge
```typescript
// After completing a feature
await counselKnowledge.extract({
  itemId: featureId,
  type: 'pattern',
  title: 'JWT Refresh Token Strategy',
  description: 'Secure implementation of refresh tokens...',
  tags: ['authentication', 'security', 'jwt']
});
```

## Configuration

### Environment Variables
```bash
# ChromaDB Configuration
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_PERSIST_DIR=~/.counsel/chromadb

# Embedding Configuration
EMBEDDING_MODEL=default  # or 'openai'
OPENAI_API_KEY=sk-...    # If using OpenAI embeddings

# Search Configuration
DEFAULT_SEARCH_LIMIT=10
DEFAULT_SIMILARITY_THRESHOLD=0.7
```

### Config File (~/.counsel/chromadb.config.json)
```json
{
  "connection": {
    "host": "localhost",
    "port": 8000,
    "persistDirectory": "~/.counsel/chromadb"
  },
  "embedding": {
    "model": "default",
    "chunkSize": 1000,
    "chunkOverlap": 100
  },
  "search": {
    "defaultLimit": 10,
    "similarityThreshold": 0.7,
    "boostRecent": true,
    "boostSameProject": true
  },
  "indexing": {
    "batchSize": 100,
    "autoIndex": true,
    "indexOnSave": true
  }
}
```

## Migration Strategy

### From Stub to Real Implementation
1. **Backward Compatibility**: Maintain existing API surface
2. **Gradual Rollout**: Use feature flags for new functionality
3. **Data Migration**: Script to index existing counsel work
4. **Fallback Logic**: Graceful degradation if ChromaDB unavailable

### Initial Data Population
```bash
# Index all existing counsel work
counsel index --all

# Index specific mode
counsel index --mode feature

# Index specific project
counsel index --project my-app
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Only initialize ChromaDB when needed
2. **Connection Pooling**: Reuse connections
3. **Batch Operations**: Group indexing operations
4. **Caching**: Cache frequently accessed embeddings
5. **Async Processing**: Non-blocking indexing

### Scalability
1. **Persistent Storage**: Use disk-based persistence for large datasets
2. **Distributed Setup**: Support ChromaDB server mode for teams
3. **Incremental Updates**: Only index changes
4. **Cleanup**: Regular cleanup of orphaned embeddings

## Security Considerations

1. **API Key Management**: Secure storage of OpenAI/other API keys
2. **Access Control**: Project-based access restrictions
3. **Data Privacy**: Option to exclude sensitive data from indexing
4. **Encryption**: Support for encrypted storage
5. **Audit Logging**: Track all search and access patterns

## Success Metrics

1. **Search Accuracy**: >80% relevant results in top 5
2. **Response Time**: <500ms for searches
3. **Index Coverage**: >95% of counsel work indexed
4. **Knowledge Reuse**: 30% reduction in solving similar problems
5. **User Satisfaction**: Positive feedback on search relevance

## Future Enhancements

1. **Multi-Language Support**: Index and search in multiple languages
2. **Visual Search**: Search through diagrams and screenshots
3. **AI Suggestions**: Proactive suggestions during development
4. **Team Collaboration**: Shared knowledge base across teams
5. **Analytics Dashboard**: Insights into knowledge usage patterns