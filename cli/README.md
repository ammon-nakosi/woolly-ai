# Woolly CLI

A TypeScript CLI tool for managing the Woolly Framework - a structured approach for organized development work.

## Overview

Woolly CLI provides programmatic access to woolly work items, enabling both humans and AI agents to:
- Query and search woolly work across projects
- Check implementation status
- Integrate with Linear for ticket management  
- Extract patterns and knowledge from completed work

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd woolly-cli

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Link globally (optional)
npm link
```

## Configuration

Initialize your configuration:

```bash
woolly init
```

This will prompt you for:
- Your email address
- Linear API key (optional)
- ChromaDB settings (optional)
- Pattern extraction preferences

Configuration is stored at `~/.woolly/config.json`.

## Usage

### Core Commands

```bash
# Initialize configuration
woolly init

# Add existing woolly work to the index
woolly add <mode> <name> -d "description"

# List all woolly work
woolly list
woolly list --mode feature
woolly list --status in-progress
woolly list --local  # List from filesystem instead of ChromaDB

# Get detailed status
woolly status <name>

# Search woolly work (semantic search)
woolly search "authentication patterns"
woolly search "bug fix" --mode debug

# Linear integration
woolly linear              # List your tickets
woolly linear --urgent     # High priority only
woolly linear --team       # Team tickets
```

### Woolly Modes

The CLI supports five woolly modes:
- `feature` - Full feature development lifecycle
- `script` - Automation scripts and utilities
- `debug` - Systematic debugging sessions
- `review` - Code/architecture reviews
- `vibe` - Exploratory work

## Architecture

### Storage Structure

All woolly work is stored at the user level in `~/.woolly/`:
```
~/.woolly/
├── config.json
├── features/
├── scripts/
├── debug/
├── review/
├── vibe/
├── archive/
└── knowledge/
```

### Integration Points

- **ChromaDB**: Semantic search and pattern matching (optional)
- **Linear**: Ticket management and synchronization
- **Git**: Project context detection

## Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run tests (when available)
npm test
```

## CLI vs Slash Commands

This CLI is designed to work alongside Woolly Framework slash commands:

- **CLI**: For data retrieval, searching, and automation
- **Slash Commands**: For interactive, guided workflows in Claude sessions

See [WOOLLY-AGENT-STRATEGY.md](../../WOOLLY-AGENT-STRATEGY.md) for detailed usage guidelines.

## Current Status

### Implemented ✅
- Configuration management (`woolly init`)
- Add work to index (`woolly add`)
- List woolly work (`woolly list`)
- Status checking (`woolly status`)
- Search functionality (`woolly search`)
- Linear ticket listing (`woolly linear`)

### In Progress 🚧
- Full ChromaDB integration
- Linear ticket creation/updates
- Pattern extraction
- Knowledge export/import

## Contributing

This is part of the Woolly Framework ecosystem. Contributions should maintain:
- Functional programming patterns (no unnecessary classes)
- TypeScript type safety
- Clear separation between CLI and slash commands

## License

MIT