# Counsel Framework

A comprehensive framework for structured development workflows, combining AI-assisted slash commands with a powerful CLI for project management and knowledge extraction.

## 🎯 Overview

The Counsel Framework provides:
- **Structured workflows** for features, scripts, debugging, reviews, and exploratory work
- **AI-powered slash commands** for Claude and Cursor IDE with guided workflows
- **CLI tool** for programmatic access and automation
- **Git integration** for backup and sync across machines
- **Semantic search** via ChromaDB integration
- **Linear integration** for ticket management
- **Knowledge extraction** from completed work

### Supported AI Assistants
- **Claude**: Full support via global slash commands in `~/.claude/commands/`
- **Cursor IDE**: Beta support via project-level commands in `.cursor/commands/`

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
- Create ChromaDB startup scripts
- Note: Cursor commands are installed per-project (see below)

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

### 5. Set Up Git Backup/Sync (Optional but Recommended)

Enable version control and sync across machines:

```bash
# During initial setup
counsel init  # Will prompt about git initialization

# Or manually later
counsel git init
counsel git remote git@github.com:yourusername/counsel-backup.git

# Sync your work
counsel git sync
```

Your counsel work in `~/.counsel/` can now be:
- Backed up to GitHub/GitLab/etc
- Synced across multiple machines
- Versioned with full history
- Shared with team members (optional)

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
1. Initialize commands in your project:
   ```bash
   counsel cursor init
   ```
2. Restart Cursor IDE
3. Open the chat/composer (Cmd/Ctrl + L)
4. Type `/` to see available commands
5. To update commands: `counsel cursor update`

Note: Cursor requires project-level commands (stored in `.cursor/commands/`)

## 🔧 CLI Commands

### Core Commands
- `counsel init` - Initialize configuration (includes optional git setup)
- `counsel add <mode> <name>` - Add existing work to index
- `counsel list` - List counsel work
- `counsel status <name>` - Get detailed status
- `counsel search <query>` - Semantic search

### Git Integration (New!)
- `counsel git init` - Initialize git repository for counsel work
- `counsel git status` - Show git status of counsel work
- `counsel git sync` - Pull and push changes (backup/sync)
- `counsel git remote <url>` - Configure remote repository

### Cursor IDE Integration
- `counsel cursor init` - Install Counsel commands in current project
- `counsel cursor update` - Update commands to latest version

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
├── .git/                   # Git repository (if initialized)
├── .gitignore              # Controls what gets synced
├── config.json             # User configuration
├── venv/                   # Python virtual environment (not synced)
├── chromadb/               # ChromaDB data (not synced)
├── bin/                    # Executable scripts
├── features/               # Feature work (synced)
├── scripts/                # Automation scripts (synced)
├── debug/                  # Debug sessions (synced)
├── review/                 # Review sessions (synced)
├── vibe/                   # Exploratory work (synced)
├── archive/                # Archived work (synced)
└── knowledge/              # Extracted patterns (synced)
```

**Git Sync:** By default, your counsel work (features, scripts, etc.) is synced while large/regenerable files (venv, chromadb) are excluded.

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