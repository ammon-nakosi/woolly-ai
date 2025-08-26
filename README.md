# Counsel Framework

A comprehensive framework for structured development workflows, combining AI-assisted slash commands with a powerful CLI for project management and knowledge extraction.

## 🎯 Overview

The Counsel Framework provides:
- **Structured workflows** for features, scripts, debugging, reviews, and exploratory work
- **AI-powered slash commands** for Claude sessions with guided workflows
- **CLI tool** for programmatic access and automation
- **Semantic search** via ChromaDB integration
- **Linear integration** for ticket management
- **Knowledge extraction** from completed work

## 🏗️ Architecture

```
counsel-framework/
├── cli/                    # TypeScript CLI implementation
├── commands/               # Slash commands for Claude
├── docs/                   # Framework documentation
│   ├── COUNSEL-FRAMEWORK.md       # Complete framework guide
│   └── COUNSEL-AGENT-STRATEGY.md  # Agent usage patterns
└── examples/               # Example counsel work
```

## 🚀 Quick Start

### 1. Install the CLI

```bash
cd cli
npm install
npm run build
npm link  # Makes 'counsel' command available globally
```

### 2. Initialize Configuration

```bash
counsel init
```

This will prompt for:
- Email address
- Linear API key (optional)
- ChromaDB settings (optional)
- Pattern extraction preferences

### 3. Set Up Slash Commands

Copy the slash commands to your Claude commands directory:
```bash
cp commands/*.md ~/.claude/commands/
```

## 📚 Core Concepts

### Counsel Modes

The framework supports five distinct modes:

| Mode | Purpose | Use Case |
|------|---------|----------|
| **feature** | Full development lifecycle | New features, major enhancements |
| **script** | Automation and utilities | CLI tools, data processing |
| **debug** | Systematic debugging | Bug fixes, performance issues |
| **review** | Code/architecture review | PRs, security audits |
| **vibe** | Exploratory work | Research, prototyping |

### Workflow Example

```bash
# Create new feature work (via slash command in Claude)
/counsel-create feature "add user authentication"

# Check status
counsel status user-authentication

# Search for patterns
counsel search "authentication patterns"

# List all features
counsel list --mode feature
```

## 🔧 CLI Commands

### Core Commands
- `counsel init` - Initialize configuration
- `counsel add <mode> <name>` - Add existing work to index
- `counsel list` - List counsel work
- `counsel status <name>` - Get detailed status
- `counsel search <query>` - Semantic search

### Linear Integration
- `counsel linear` - List your tickets
- `counsel linear --urgent` - High priority tickets
- `counsel linear --team` - Team tickets

## 📖 Documentation

- [COUNSEL-FRAMEWORK.md](docs/COUNSEL-FRAMEWORK.md) - Complete framework guide
- [COUNSEL-AGENT-STRATEGY.md](docs/COUNSEL-AGENT-STRATEGY.md) - When/how agents use CLI vs slash commands
- [CLI README](cli/README.md) - Detailed CLI documentation

## 🔌 Integrations

### ChromaDB
- Semantic search across all counsel work
- Pattern matching and knowledge extraction
- Similar work detection

### Linear
- Import tickets as counsel work
- Sync status updates
- Create tickets from counsel work

### Git
- Automatic project detection
- Commit integration
- PR association

## 🗂️ Storage Structure

All counsel work is stored at `~/.counsel/`:

```
~/.counsel/
├── config.json             # User configuration
├── features/               # Feature development work
├── scripts/               # Automation scripts
├── debug/                 # Debug sessions
├── review/                # Review sessions
├── vibe/                  # Exploratory work
├── archive/               # Archived work
└── knowledge/             # Extracted patterns
```

## 🤝 Contributing

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd counsel-framework

# Install CLI dependencies
cd cli
npm install
npm run build

# Run in development
npm run dev
```

### Key Principles
- Functional programming (avoid unnecessary classes)
- TypeScript for type safety
- Clear separation: slash commands for interaction, CLI for automation
- User-level storage for cross-project access

## 📊 Status Tracking

The framework uses a sophisticated status tracking system:

```json
{
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase Title",
      "status": "doing",
      "checklist": [
        {
          "id": "phase1-001",
          "description": "Task description",
          "status": "done"
        }
      ]
    }
  ]
}
```

## 🎨 Philosophy

The Counsel Framework emphasizes:
- **Phased Development** - Break work into manageable phases
- **Deep Discovery** - Thorough investigation before implementation
- **Status Tracking** - Real-time visibility into progress
- **Simplicity** - Elegant solutions over complex engineering
- **Verification** - Continuous validation of implementation

## 📝 License

MIT

## 🔗 Links

- [Linear API Documentation](https://developers.linear.app)
- [ChromaDB Documentation](https://docs.trychroma.com)
- [Claude Commands Documentation](https://claude.ai/docs/commands)

---

Built with ❤️ for systematic, AI-assisted development workflows