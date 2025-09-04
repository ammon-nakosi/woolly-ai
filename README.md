# Woolly AI

A comprehensive framework for structured development workflows, combining AI-assisted slash commands with a powerful CLI for project management and knowledge extraction.

## 🎯 Overview

The Woolly Framework provides:
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
woolly-framework/
├── cli/                    # TypeScript CLI implementation
├── commands/               # Slash commands for Claude
├── docs/                   # Framework documentation
│   ├── WOOLLY-FRAMEWORK.md       # Complete framework guide
│   └── WOOLLY-AGENT-STRATEGY.md  # Agent usage patterns
└── examples/               # Example woolly work
```

## 📋 Requirements

- Node.js 16 or higher
- npm 7 or higher  
- Python 3.8 or higher (for ChromaDB)
- macOS, Linux, or Windows

## 🚀 Quick Start

### ⚡ 5-Minute Setup

**New to Woolly?** Get search working in under 5 minutes:

```bash
# 1. Install & Setup
git clone https://github.com/ammon-nakosi/woolly-framework.git
cd woolly-framework && npm install && npm run setup

# 2. Make CLI available
npm link

# 3. Configure
woolly init

# 4. Start ChromaDB (choose one method)
woolly chromadb start        # Docker (recommended)
# OR
./cli/scripts/start-chromadb.sh  # Shell script

# 5. Verify everything works
woolly chromadb health

# 6. Start using it!
woolly index --all
woolly search "your query here"
```

**Having issues?** Run `woolly chromadb health` for diagnosis and troubleshooting.

### 1. Install the Framework

```bash
# Clone the repository
git clone https://github.com/ammon-nakosi/woolly-framework.git
cd woolly-framework

# Install dependencies
npm install

# Run the setup script (creates directories, installs ChromaDB in venv)
npm run setup
```

The setup script will:
- Create `~/.woolly` directories
- Set up a Python virtual environment at `~/.woolly/venv`
- Install ChromaDB in the virtual environment (no system packages affected)
- Copy/update slash commands to `~/.claude/commands/` (if Claude is installed)
- Create ChromaDB startup scripts
- Note: Cursor commands are installed per-project (see below)

### 2. Make CLI Available Globally

```bash
npm link  # Makes 'woolly' command available globally
```

### 3. Initialize Your Configuration

```bash
woolly init
```

This will prompt for:
- Email address
- Linear API key (optional)
- ChromaDB settings (optional)
- Pattern extraction preferences

### 4. Start ChromaDB (Optional but Recommended)

ChromaDB enables semantic search across all your woolly work. Start it using Docker:

```bash
# Using the provided script
./cli/scripts/start-chromadb.sh

# Or manually with Docker
docker run -d \
  --name chromadb \
  -p 8444:8000 \
  -v ~/.woolly/chromadb:/chroma/chroma \
  chromadb/chroma:latest
```

Once ChromaDB is running, index your existing woolly work:

```bash
# Index all woolly work
woolly index --all

# Index specific mode
woolly index --mode feature

# Index specific work
woolly index --name user-auth
```

#### 🔧 ChromaDB Troubleshooting

**Connection Issues?**
```bash
woolly chromadb health  # Diagnose problems
```

**Common Issues:**
- **Port conflicts**: ChromaDB uses port 8444. Check nothing else is using it.
- **Docker not running**: Ensure Docker Desktop is started before running commands.
- **Python venv issues**: Try running setup again: `npm run setup`

**Alternative Setup (No Docker)**:
```bash
# Use Python virtual environment instead
source ~/.woolly/venv/bin/activate  # Linux/Mac
# or
~\.woolly\venv\Scripts\activate     # Windows

python ~/.woolly/bin/chromadb-server.py
```

### 5. Set Up Git Backup/Sync (Optional but Recommended)

Enable version control and sync across machines:

```bash
# During initial setup
woolly init  # Will prompt about git initialization

# Or manually later
woolly git init
woolly git remote git@github.com:yourusername/woolly-backup.git

# Sync your work
woolly git sync
```

Your woolly work in `~/.woolly/` can now be:
- Backed up to GitHub/GitLab/etc
- Synced across multiple machines
- Versioned with full history
- Shared with team members (optional)

## 📚 Core Concepts

### Woolly Modes

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
/woolly-create feature "add user authentication"

# Check status
woolly status user-authentication

# Search for patterns
woolly search "authentication patterns"

# List all features
woolly list --mode feature
```

### Using Commands in AI Assistants

**In Claude:**
- Type `/` in any Claude session
- Select a woolly command from the dropdown
- Commands are fully supported

**In Cursor IDE (Beta):**
1. Initialize commands in your project:
   ```bash
   woolly cursor init
   ```
2. Restart Cursor IDE
3. Open the chat/composer (Cmd/Ctrl + L)
4. Type `/` to see available commands
5. To update commands: `woolly cursor update`

Note: Cursor requires project-level commands (stored in `.cursor/commands/`)

## 🔧 CLI Commands

### Core Commands
- `woolly init` - Initialize configuration (includes optional git setup)
- `woolly add <mode> <name>` - Add existing work to index
- `woolly list` - List woolly work
- `woolly status <name>` - Get detailed status
- `woolly search <query>` - Semantic search

### Git Integration (New!)
- `woolly git init` - Initialize git repository for woolly work
- `woolly git status` - Show git status of woolly work
- `woolly git sync` - Pull and push changes (backup/sync)
- `woolly git remote <url>` - Configure remote repository

### Cursor IDE Integration
- `woolly cursor init` - Install Woolly commands in current project
- `woolly cursor update` - Update commands to latest version

### Linear Integration
- `woolly linear` - List your tickets
- `woolly linear --urgent` - High priority tickets
- `woolly linear --team` - Team tickets

## 📖 Documentation

- [WOOLLY-FRAMEWORK.md](docs/WOOLLY-FRAMEWORK.md) - Complete framework guide
- [WOOLLY-AGENT-STRATEGY.md](docs/WOOLLY-AGENT-STRATEGY.md) - When/how agents use CLI vs slash commands
- [CLI README](cli/README.md) - Detailed CLI documentation

## 🔌 Integrations

### ChromaDB
- Semantic search across all woolly work
- Pattern matching and knowledge extraction
- Similar work detection

### Linear
- Import tickets as woolly work
- Sync status updates
- Create tickets from woolly work

### Git
- Automatic project detection
- Commit integration
- PR association

## 🗂️ Storage Structure

All woolly work is stored at `~/.woolly/`:

```
~/.woolly/
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

**Git Sync:** By default, your woolly work (features, scripts, etc.) is synced while large/regenerable files (venv, chromadb) are excluded.

## 🤝 Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ammon-nakosi/woolly-framework.git
cd woolly-framework

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

The Woolly Framework emphasizes:
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
