# Counsel Framework

A comprehensive framework for structured development workflows, combining AI-assisted slash commands with a powerful CLI for project management and knowledge extraction.

## 🎯 Overview

The Counsel Framework provides:
- **Structured workflows** for features, scripts, debugging, reviews, and exploratory work
- **AI-powered slash commands** for Claude and Cursor IDE with guided workflows
- **CLI tool** for programmatic access and automation
- **Semantic search** via ChromaDB integration
- **Linear integration** for ticket management
- **Knowledge extraction** from completed work

### Supported AI Assistants
- **Claude**: Full support via slash commands in `.claude/commands/`
- **Cursor IDE**: Beta support via commands in `.cursor/commands/`

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

## 📋 Requirements

- Node.js 16 or higher
- npm 7 or higher  
- Python 3.8 or higher (for ChromaDB)
- macOS, Linux, or Windows

## 🚀 Quick Start

### 1. Install the Framework

```bash
# Clone the repository
git clone https://github.com/ammon-nakosi/counsel-framework.git
cd counsel-framework

# Install dependencies
npm install

# Run the setup script (creates directories, installs ChromaDB in venv)
npm run setup
```

The setup script will:
- Create `~/.counsel` directories
- Set up a Python virtual environment at `~/.counsel/venv`
- Install ChromaDB in the virtual environment (no system packages affected)
- Copy/update slash commands to `~/.claude/commands/` (if Claude is installed)
- Copy/update commands to `~/.cursor/commands/` (if Cursor IDE is installed)
- Create ChromaDB startup scripts

### 2. Make CLI Available Globally

```bash
npm link  # Makes 'counsel' command available globally
```

### 3. Initialize Your Configuration

```bash
counsel init
```

This will prompt for:
- Email address
- Linear API key (optional)
- ChromaDB settings (optional)
- Pattern extraction preferences

### 4. Start ChromaDB (Optional)

```bash
counsel chromadb start
```

ChromaDB runs in a Python virtual environment, keeping your system Python clean.

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
# Create new feature work (via slash command in Claude or Cursor)
/counsel-create feature "add user authentication"

# Check status
counsel status user-authentication

# Search for patterns
counsel search "authentication patterns"

# List all features
counsel list --mode feature
```

### Using Commands in AI Assistants

**In Claude:**
- Type `/` in any Claude session
- Select a counsel command from the dropdown
- Commands are fully supported

**In Cursor IDE (Beta):**
- Open the chat/composer in Cursor
- Type `/` to see available commands
- Select a counsel command
- Note: Cursor commands are in beta, syntax may evolve

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
├── venv/                   # Python virtual environment for ChromaDB
├── chromadb/               # ChromaDB data storage
├── bin/                    # Executable scripts
├── features/               # Feature development work
├── scripts/                # Automation scripts
├── debug/                  # Debug sessions
├── review/                 # Review sessions
├── vibe/                   # Exploratory work
├── archive/                # Archived work
└── knowledge/              # Extracted patterns
```

## 🤝 Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ammon-nakosi/counsel-framework.git
cd counsel-framework

# Install dependencies and run setup
npm install
npm run setup

# Build the CLI
cd cli
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