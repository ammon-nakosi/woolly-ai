# Woolly Memory Management Architecture

## Overview

The Woolly Memory Management system provides a three-tier memory architecture that seamlessly integrates with AI assistants (Claude, Cursor) to maintain context and knowledge across different scopes and lifecycles. The system leverages modern memory management practices from 2025, including semantic search, vector embeddings, and the Model Context Protocol (MCP).

## Memory Tiers

### 1. Session Memory (Ephemeral)
**Lifetime**: Active woolly session only  
**Scope**: Current work context  
**Storage**: Temporary injection into AI context files  
**Purpose**: Immediate working memory for active tasks

- Automatically captures insights during woolly work
- Injects relevant context into `.claude/CLAUDE.md` or `.cursorrules`
- Clears when session closes or work completes
- Includes recent commands, decisions, and discoveries

### 2. Repository Memory (Project-Persistent)
**Lifetime**: Project/repository lifecycle  
**Scope**: Repository-specific patterns and knowledge  
**Storage**: `.woolly/memory/repo-memory.json`  
**Purpose**: Project-specific patterns, conventions, and learnings

- Stores project conventions and patterns
- Maintains technical decisions and architecture notes
- Includes dependency information and gotchas
- Persists across sessions within the same repository

### 3. User Memory (Global-Persistent)
**Lifetime**: Permanent until explicitly removed  
**Scope**: User-wide preferences and knowledge  
**Storage**: `~/.woolly/memory/user-memory.json`  
**Purpose**: Personal preferences, recurring patterns, and global knowledge

- User preferences and coding style
- Commonly used patterns and solutions
- Personal shortcuts and workflows
- Cross-project learnings and insights

## Memory Types

### Semantic Memory
- Facts, concepts, and general knowledge
- Project documentation and API references
- Technical patterns and best practices

### Episodic Memory
- Specific events and experiences
- Past debugging sessions and solutions
- Implementation histories and outcomes

### Procedural Memory
- Workflow patterns and automation scripts
- Common command sequences
- Problem-solving strategies

## Architecture Components

### Memory Manager Service
```typescript
interface MemoryManager {
  // Core operations
  store(memory: Memory): Promise<void>
  retrieve(query: string, scope: MemoryScope): Promise<Memory[]>
  update(id: string, updates: Partial<Memory>): Promise<void>
  delete(id: string): Promise<void>
  
  // Lifecycle management
  initializeSession(workContext: WorkContext): Promise<void>
  finalizeSession(): Promise<void>
  consolidateMemories(): Promise<void>
  
  // AI integration
  injectToContext(scope: MemoryScope): Promise<void>
  extractFromContext(): Promise<Memory[]>
}
```

### Memory Data Structure
```typescript
interface Memory {
  id: string
  type: 'semantic' | 'episodic' | 'procedural'
  scope: 'session' | 'repo' | 'user'
  content: {
    title: string
    description: string
    value: any
    metadata?: Record<string, any>
  }
  embedding?: number[]  // Vector embedding for semantic search
  relations?: string[]  // Related memory IDs
  usage: {
    count: number
    lastAccessed: string
    confidence: number  // 0-1 relevance score
  }
  lifecycle: {
    created: string
    updated: string
    expires?: string  // For session memories
    ttl?: number     // Time to live in seconds
  }
}
```

## Integration Points

### 1. AI Context Injection
The system dynamically injects relevant memories into AI context files:

**Claude Integration** (`.claude/CLAUDE.md`):
```markdown
# Active Woolly Memories

## Session Context
[Dynamically injected session memories]

## Repository Knowledge
import: .woolly/memory/repo-context.md

## User Preferences
import: ~/.woolly/memory/user-context.md
```

**Cursor Integration** (`.cursorrules`):
```markdown
# Woolly Memory Context

## Current Session
[Active session memories and decisions]

## Project Patterns
@.woolly/memory/repo-patterns.md

## Personal Preferences
@~/.woolly/memory/user-preferences.md
```

### 2. Search Integration
Memories enhance search results with contextual relevance:
- Search results prioritized by memory associations
- Similar memories suggested alongside search results
- Memory-based filtering and ranking

### 3. Automatic Capture Points
The system automatically captures memories at key events:
- After completing woolly work phases
- When marking tasks as done
- During retrospectives and reviews
- When patterns are identified in search results

## Memory Operations

### Adding Memories
```bash
# Manual memory addition
woolly memory add "Use semantic chunking for large documents" --scope repo --type semantic

# Automatic capture from search
woolly search "authentication" --save-insights
# → Automatically saves strong patterns as session memories

# From retrospective
woolly close feature-auth --retrospective
# → Extracts learnings to appropriate memory scopes
```

### Retrieving Memories
```bash
# List all memories
woolly memory list

# Filter by scope
woolly memory list --scope session
woolly memory list --scope repo
woolly memory list --scope user

# Search memories
woolly memory search "testing patterns"

# Show memory details
woolly memory show <memory-id>
```

### Managing Memories
```bash
# Update memory
woolly memory update <memory-id> --description "Updated description"

# Promote memory scope
woolly memory promote <memory-id> --to repo  # session → repo
woolly memory promote <memory-id> --to user  # repo → user

# Delete memory
woolly memory delete <memory-id>

# Clear scope
woolly memory clear --scope session
```

## Lifecycle Management

### Session Lifecycle
1. **Session Start**: Initialize session memory context
2. **Active Work**: Capture decisions and insights
3. **Context Updates**: Dynamically update AI context files
4. **Session End**: Consolidate valuable memories
5. **Cleanup**: Remove session-specific injections

### Memory Consolidation
The system intelligently consolidates memories:
- Merges similar memories to reduce redundancy
- Promotes valuable session memories to repo/user scope
- Archives stale memories after inactivity
- Maintains optimal memory pool size

## Implementation Strategy

### Phase 1: Core Memory Service
- Memory data structures and storage
- Basic CRUD operations
- Simple file-based persistence

### Phase 2: AI Integration
- Dynamic context injection for Claude/Cursor
- Context file management
- Import/include statement handling

### Phase 3: Semantic Search
- Vector embeddings using ChromaDB
- Similarity-based retrieval
- Memory relationship mapping

### Phase 4: Intelligent Features
- Automatic memory capture
- Pattern recognition from search
- Memory consolidation algorithms
- Relevance scoring and ranking

## Configuration

```json
{
  "memory": {
    "enabled": true,
    "autoCapture": {
      "fromSearch": true,
      "fromCompletion": true,
      "fromRetrospective": true,
      "confidenceThreshold": 0.7
    },
    "consolidation": {
      "enabled": true,
      "interval": "daily",
      "similarityThreshold": 0.85
    },
    "limits": {
      "sessionMemories": 50,
      "repoMemories": 200,
      "userMemories": 500
    },
    "integration": {
      "claude": {
        "enabled": true,
        "injectionMode": "import"  // "import" | "inline" | "both"
      },
      "cursor": {
        "enabled": true,
        "injectionMode": "reference"  // "reference" | "inline" | "both"
      }
    }
  }
}
```

## Benefits

1. **Contextual Continuity**: Maintains context across sessions and projects
2. **Learning Amplification**: Captures and reuses successful patterns
3. **Reduced Repetition**: Remembers preferences and decisions
4. **Enhanced Search**: Provides memory-aware search results
5. **Seamless Integration**: Works naturally with existing AI tools
6. **Progressive Enhancement**: Memories improve over time with usage

## Future Enhancements

- **Graph-based memory relationships**: Connect related memories in a knowledge graph
- **Team memory sharing**: Share repository memories with team members
- **Memory templates**: Pre-defined memory structures for common patterns
- **AI-powered extraction**: Use LLMs to automatically extract high-value memories
- **Cross-tool synchronization**: Sync memories between different AI assistants
- **Memory versioning**: Track changes to memories over time