# Woolly Agent Strategy Guide

## Overview

This guide helps agents understand when and how to strategically use the Woolly CLI alongside slash commands to provide optimal assistance to users.

## Key Principle: CLI vs Slash Commands

**CLI (`woolly`)**: For data retrieval, searching, and querying existing work
**Slash Commands (`/woolly-*`)**: For interactive workflows and creating new work

## Automatic CLI Usage Patterns

### 1. Before Starting New Work

**Always check for similar existing work:**
```bash
woolly search "<user's description>"
```

**Why**: Prevents duplicate work and allows reuse of patterns/solutions

**Example**:
```
User: "I need to code user authentication"
Agent: [Runs: woolly search "user authentication"]
       [Finds similar work]
       "I found existing woolly work on authentication. Let me review it first..."
```

### 2. At Session Start

**Get context on active work:**
```bash
woolly list --recent --status in-progress
```

**Why**: Helps agent understand what's currently being worked on

### 3. When User Mentions a Feature/Task Name

**Immediately check status:**
```bash
woolly status <name>
```

**Why**: Provides instant context about the work's current state

### 4. When User Asks "What Should I Work On?"

**Check Linear tickets and woolly work:**
```bash
woolly linear        # Get Linear tickets
woolly list --status planned --recent  # Get planned woolly work
```

## Strategic CLI Usage in Slash Commands

### In `/woolly-create`

Before creating new work:
1. Run `woolly search "<description>"` to find similar work
2. If high similarity (>80%) found, suggest continuing existing work instead
3. Show user the similar work and ask for confirmation

### In `/woolly-status`

Can augment with:
```bash
woolly status <name> --json
```
Then perform deeper codebase verification on top of the CLI data

### In `/woolly-reload`

Start with:
```bash
woolly status <name>
woolly list --mode <mode> --recent
```
To quickly understand the work context before loading documents

## Decision Tree for Agents

```
User Request
    ↓
Is it about existing work?
    YES → Use CLI for quick retrieval
          → woolly status, woolly search
    NO ↓
    
Is it about creating new work?
    YES → Check for similar first (woolly search)
          → Then use /woolly-create slash command
    NO ↓
    
Is it about finding/listing work?
    YES → Use CLI exclusively
          → woolly list, woolly search
    NO ↓
    
Is it about understanding patterns?
    YES → Use woolly search to find similar implementations
```

## Proactive CLI Usage

Agents should proactively use CLI commands without being asked when:

1. **User mentions a feature name** → Run `woolly status <name>`
2. **User says "continue working on..."** → Run `woolly status` to get context
3. **User asks about similar work** → Run `woolly search`
4. **Starting any implementation** → Run `woolly search` for patterns
5. **User seems unsure what to work on** → Run `woolly list --recent`

## CLI Command Reference

### Quick Information Retrieval
```bash
woolly status <name>           # Get full status of specific work
woolly list                    # List all woolly work
woolly list --mode feature     # List only features
woolly list --status in-progress  # List active work
woolly list --recent           # Sort by recently updated
```

### Semantic Search
```bash
woolly search "authentication" # Search all woolly work
woolly search "bug fix" --mode debug  # Search only debug work
woolly search "react component" --limit 20  # Get more results
```

### Linear Integration
```bash
woolly linear                  # List your Linear tickets
woolly linear --urgent         # High priority tickets only
woolly linear --team           # Team tickets
```

### Index Management
```bash
woolly add <mode> <name>       # Add existing work to index
```

## Integration Tips

### Show CLI Hints in Responses

When appropriate, show users CLI commands they can run themselves:

```
"I've updated the status of your feature. You can check it anytime with:
  woolly status dark-mode
  
Or see all your features with:
  woolly list --mode feature"
```

### Batch CLI Operations

When you need multiple pieces of information, run CLI commands in parallel:
```bash
# Run these simultaneously
woolly status feature-x
woolly search "similar to feature-x"
woolly linear --search "feature-x"
```

### Use JSON Output for Processing

When you need to process results:
```bash
woolly status <name> --json    # Get structured data
woolly list --json              # Process programmatically
```

## Common Scenarios

### Scenario 1: User Returns After Break
```bash
woolly list --recent --status in-progress  # What was I working on?
woolly linear --urgent                     # Any urgent tickets?
```

### Scenario 2: Starting Implementation
```bash
woolly search "component library"          # Find similar work
woolly status current-feature               # Get current context
```

### Scenario 3: Debugging Issue
```bash
woolly search "similar error" --mode debug # Find similar debug sessions
woolly list --mode debug --recent          # Recent debug work
```

## What NOT to Do

1. **Don't use CLI to create new work** - Use `/woolly-create` instead
2. **Don't use CLI for complex multi-step workflows** - Use slash commands
3. **Don't wait for user to ask** - Proactively use CLI for context
4. **Don't show raw JSON to users** - Format the output nicely

## Summary

The CLI is your tool for:
- Quick information retrieval
- Pattern scope
- Context gathering
- Work scope

Use it liberally and proactively to provide better, more informed assistance to users.