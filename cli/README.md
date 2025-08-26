# Counsel CLI

A TypeScript CLI tool for managing the Counsel Framework - a structured approach for organized development work.

## Overview

Counsel CLI provides programmatic access to counsel work items, enabling both humans and AI agents to:
- Query and search counsel work across projects
- Check implementation status
- Integrate with Linear for ticket management  
- Extract patterns and knowledge from completed work

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd counsel-cli

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
counsel init
```

This will prompt you for:
- Your email address
- Linear API key (optional)
- ChromaDB settings (optional)
- Pattern extraction preferences

Configuration is stored at `~/.counsel/config.json`.

## Usage

### Core Commands

```bash
# Initialize configuration
counsel init

# Add existing counsel work to the index
counsel add <mode> <name> -d "description"

# List all counsel work
counsel list
counsel list --mode feature
counsel list --status in-progress
counsel list --local  # List from filesystem instead of ChromaDB

# Get detailed status
counsel status <name>

# Search counsel work (semantic search)
counsel search "authentication patterns"
counsel search "bug fix" --mode debug

# Linear integration
counsel linear              # List your tickets
counsel linear --urgent     # High priority only
counsel linear --team       # Team tickets
```

### Counsel Modes

The CLI supports five counsel modes:
- `feature` - Full feature development lifecycle
- `script` - Automation scripts and utilities
- `debug` - Systematic debugging sessions
- `review` - Code/architecture reviews
- `vibe` - Exploratory work

## Architecture

### Storage Structure

All counsel work is stored at the user level in `~/.counsel/`:
```
~/.counsel/
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

This CLI is designed to work alongside Counsel Framework slash commands:

- **CLI**: For data retrieval, searching, and automation
- **Slash Commands**: For interactive, guided workflows in Claude sessions

See [COUNSEL-AGENT-STRATEGY.md](../../COUNSEL-AGENT-STRATEGY.md) for detailed usage guidelines.

## Current Status

### Implemented ✅
- Configuration management (`counsel init`)
- Add work to index (`counsel add`)
- List counsel work (`counsel list`)
- Status checking (`counsel status`)
- Search functionality (`counsel search`)
- Linear ticket listing (`counsel linear`)

### In Progress 🚧
- Full ChromaDB integration
- Linear ticket creation/updates
- Pattern extraction
- Knowledge export/import

## Contributing

This is part of the Counsel Framework ecosystem. Contributions should maintain:
- Functional programming patterns (no unnecessary classes)
- TypeScript type safety
- Clear separation between CLI and slash commands

## License

MIT