# Introduction to Woolly

Woolly is a structured development framework that brings order and intelligence to your coding workflow. It combines AI-powered slash commands with a CLI tool to help you manage features, scripts, debugging sessions, and exploratory work - all while maintaining a searchable knowledge base of your development history.

## What is Woolly?

Woolly provides a systematic approach to software development through:

- **Structured workflows** that guide you through each type of development task
- **AI-assisted commands** that work directly in Claude and Cursor IDE
- **Semantic search** across all your past work and decisions
- **Automatic documentation** that captures your development journey

Think of Woolly as your development memory and workflow assistant combined - it remembers what you've built, why you built it, and helps you apply those learnings to new challenges.

## Core Concepts

Woolly is built around six foundational concepts that work together to create an intelligent development companion:

### 1. AI-Native Workflow Intelligence

Woolly understands natural language and automatically determines the right approach for your work:

```
"Let's add user authentication" → Feature Agent
"This API is slow" → Debug Agent  
"I want to explore GraphQL" → Vibe Agent
"Counsel this database issue" → Auto-assigns the right agent
```

No need to memorize commands - just describe what you want to accomplish, and Woolly guides you through the optimal workflow.

### 2. Contextual Memory System

Every piece of work maintains rich, structured context that builds over time:

- **Objective**: What you're trying to accomplish
- **Background**: Why it matters and current state
- **Approach**: How you're tackling the problem
- **Progress Updates**: What you've executed, found, and what's next
- **Success Criteria**: How you'll know it's complete

This context persists across sessions, letting you pick up exactly where you left off - even months later.

### 3. Semantic Knowledge Graph

Woolly uses ChromaDB to create connections between all your work:

```bash
counsel search "authentication patterns"     # Finds related auth work
counsel search "component architecture"      # Discovers design patterns
counsel search "performance issues"         # Surfaces similar bugs
```

It understands meaning, not just keywords - finding relevant solutions even when they use different terminology.

### 4. Multi-AI Integration

Woolly works natively across AI assistants:

- **Claude**: Full slash command integration via `~/.claude/commands/`
- **Cursor IDE**: Project-level commands with live codebase context
- **CLI**: Direct terminal access for scripting and automation

The same work context flows seamlessly between all AI interactions.

### 5. Adaptive Learning System

Woolly learns from your patterns and preferences:

- **Rule Extraction**: Identifies your coding patterns and preferences
- **Pattern Library**: Builds reusable solutions from successful work
- **Smart Suggestions**: Recommends approaches based on past success
- **Context Awareness**: Understands your project-specific needs

### 6. Project-Agnostic Intelligence

Your Woolly knowledge lives at the user level (`~/.counsel/`), providing:

- **Cross-Project Insights**: Solutions from Project A help with Project B
- **Career-Long Memory**: Never lose a solution or architectural decision
- **Team Knowledge**: Share patterns and learnings across team members
- **Institutional Knowledge**: Build company-wide development intelligence

### Specialized AI Agents

Woolly automatically activates the right AI agent for your work. Each agent is trained on specific workflows and has deep expertise in its domain:

| Agent | Expertise | When Activated | Key Strengths |
|-------|-----------|----------------|---------------|
| **Feature Agent** | End-to-end feature development | "Add...", "Build...", "Implement..." | Specs gathering, technical scoping, phased planning |
| **Script Agent** | Production automation | "Create a script...", "Automate..." | Logging patterns, error handling, dry-run modes |
| **Debug Agent** | Systematic problem-solving | "Fix...", "This is broken...", Error reports | Issue reproduction, root cause analysis, verification |
| **Review Agent** | Code & architecture analysis | "Review...", "Audit...", "Analyze..." | Quality assessment, security review, recommendations |
| **Vibe Agent** | Creative exploration | "Explore...", "Research...", "Try..." | Open-ended discovery, prototyping, learning |

Each agent maintains its own context, patterns, and learned behaviors while sharing knowledge through the central Woolly system.

### The Woolly Workflow

Instead of rigid steps, Woolly adapts to natural conversation:

```
You: "I need to add user authentication to my app"

Woolly: [Searches past auth work] 
        [Creates feature context]
        "I found similar auth patterns you've used. 
         Let's start by understanding your requirements..."

You: "The login form keeps crashing on mobile"

Woolly: [Activates Debug Agent]
        [Looks for similar mobile issues]
        "Let's systematically reproduce this. 
         I see you've solved similar mobile bugs before..."
```

The workflow emerges from conversation, not commands.

## Getting Started

### Quick Setup (5 minutes)

1. **Install Woolly**
   ```bash
   git clone https://github.com/yourusername/woolly.git
   cd woolly && npm install && npm run setup
   npm link
   ```

2. **Initialize Configuration**
   ```bash
   counsel init
   ```

3. **Start ChromaDB** (for search)
   ```bash
   counsel chromadb start
   ```

4. **Create Your First Work**
   
   In Claude or Cursor, type:
   ```
   /counsel-create feature "user profile page"
   ```

### Your First Feature

Let's walk through creating a feature with Woolly:

```bash
# 1. Start in Claude/Cursor
/counsel-create feature "add dark mode toggle"

# 2. Woolly activates the Feature Agent and creates structure
~/.counsel/features/dark-mode-toggle/

# 3. The Feature Agent guides you through its specialized workflow
/counsel-feature-specs dark-mode-toggle
# Define what the feature should do

/counsel-feature-scope dark-mode-toggle  
# Determine technical requirements

/counsel-feature-plan dark-mode-toggle
# Create implementation phases

/counsel-feature-code dark-mode-toggle
# Build with progress tracking
```

Throughout this process, Woolly:
- Maintains context between commands
- Tracks what's completed vs planned
- Documents decisions automatically
- Makes everything searchable for future reference

## Key Features

### AI Integration
Woolly works seamlessly with:
- **Claude** - Full support via global commands
- **Cursor IDE** - Project-level command integration
- **Any IDE** - CLI access from terminal

### Status Tracking
Real-time visibility into your progress:
```bash
counsel status dark-mode-toggle
```

Shows:
- Current phase and progress
- Completed vs pending tasks
- Implementation notes
- Related commits and PRs

### Knowledge Extraction
Woolly learns from your completed work:
```bash
counsel extract --mode feature
```

Automatically identifies:
- Successful patterns
- Common solutions
- Architecture decisions
- Testing strategies

### Git Integration
Optional version control for your Woolly work:
```bash
counsel git init
counsel git sync
```

Benefits:
- Backup to GitHub/GitLab
- Sync across machines
- Team collaboration
- Full history tracking

## Why Woolly?

### For Individual Developers

- **Never lose context** - Pick up where you left off, even weeks later
- **Learn from yourself** - Search your past solutions instantly  
- **Systematic approach** - Proven workflows for every type of task
- **AI assistance** - Intelligent help that understands your project

### For Teams

- **Shared knowledge** - Team members can search each other's work
- **Consistent workflows** - Everyone follows the same proven patterns
- **Onboarding** - New developers can search past decisions
- **Documentation** - Automatic capture of implementation details

## Common Use Cases

### Building a New Feature
```bash
/counsel-create feature "payment integration"
```
The Feature Agent guides you through specifications, scoping, planning, and implementation with phase-by-phase tracking.

### Creating a Migration Script
```bash
/counsel-create script "migrate-user-data"
```
The Script Agent ensures proper logging, error handling, dry-run mode, and progress tracking.

### Debugging Production Issues
```bash
/counsel-create debug "high-memory-usage"
```
The Debug Agent systematically reproduces, investigates, diagnoses, and verifies the fix.

### Exploring New Technology
```bash
/counsel-create vibe "evaluate-graphql"
```
The Vibe Agent researches, prototypes, and documents findings without rigid structure.

## Next Steps

1. **Install Woolly** and run through the 5-minute setup
2. **Try your first feature** with `/counsel-create feature`
3. **Search existing patterns** with `counsel search`
4. **Join the community** for tips and best practices

Woolly transforms chaotic development into organized, searchable, reusable knowledge. Every line of code you write becomes part of your growing development intelligence.

---

Ready to bring structure to your development workflow? [Get Started →](../README.md#quick-start)