# Counsel Agent Strategy Guide

## Overview

This guide helps agents understand when and how to strategically use the Counsel CLI alongside slash commands to provide optimal assistance to users.

## Key Principle: CLI vs Slash Commands

**CLI (`counsel`)**: For data retrieval, searching, and querying existing work
**Slash Commands (`/counsel-*`)**: For interactive workflows and creating new work

## Automatic CLI Usage Patterns

### 1. Before Starting New Work

**Always check for similar existing work:**
```bash
counsel search "<user's description>"
```

**Why**: Prevents duplicate work and allows reuse of patterns/solutions

**Example**:
```
User: "I need to implement user authentication"
Agent: [Runs: counsel search "user authentication"]
       [Finds similar work]
       "I found existing counsel work on authentication. Let me review it first..."
```

### 2. At Session Start

**Get context on active work:**
```bash
counsel list --recent --status in-progress
```

**Why**: Helps agent understand what's currently being worked on

### 3. When User Mentions a Feature/Task Name

**Immediately check status:**
```bash
counsel status <name>
```

**Why**: Provides instant context about the work's current state

### 4. When User Asks "What Should I Work On?"

**Check Linear tickets and counsel work:**
```bash
counsel linear        # Get Linear tickets
counsel list --status planned --recent  # Get planned counsel work
```

## Strategic CLI Usage in Slash Commands

### In `/counsel-create`

Before creating new work:
1. Run `counsel search "<description>"` to find similar work
2. If high similarity (>80%) found, suggest continuing existing work instead
3. Show user the similar work and ask for confirmation

### In `/counsel-status`

Can augment with:
```bash
counsel status <name> --json
```
Then perform deeper codebase verification on top of the CLI data

### In `/counsel-resume`

Start with:
```bash
counsel status <name>
counsel list --mode <mode> --recent
```
To quickly understand the work context before loading documents

## Decision Tree for Agents

```
User Request
    ↓
Is it about existing work?
    YES → Use CLI for quick retrieval
          → counsel status, counsel search
    NO ↓
    
Is it about creating new work?
    YES → Check for similar first (counsel search)
          → Then use /counsel-create slash command
    NO ↓
    
Is it about finding/listing work?
    YES → Use CLI exclusively
          → counsel list, counsel search
    NO ↓
    
Is it about understanding patterns?
    YES → Use counsel search to find similar implementations
```

## Proactive CLI Usage

Agents should proactively use CLI commands without being asked when:

1. **User mentions a feature name** → Run `counsel status <name>`
2. **User says "continue working on..."** → Run `counsel status` to get context
3. **User asks about similar work** → Run `counsel search`
4. **Starting any implementation** → Run `counsel search` for patterns
5. **User seems unsure what to work on** → Run `counsel list --recent`

## CLI Command Reference

### Quick Information Retrieval
```bash
counsel status <name>           # Get full status of specific work
counsel list                    # List all counsel work
counsel list --mode feature     # List only features
counsel list --status in-progress  # List active work
counsel list --recent           # Sort by recently updated
```

### Semantic Search
```bash
counsel search "authentication" # Search all counsel work
counsel search "bug fix" --mode debug  # Search only debug work
counsel search "react component" --limit 20  # Get more results
```

### Linear Integration
```bash
counsel linear                  # List your Linear tickets
counsel linear --urgent         # High priority tickets only
counsel linear --team           # Team tickets
```

### Index Management
```bash
counsel add <mode> <name>       # Add existing work to index
```

## Integration Tips

### Show CLI Hints in Responses

When appropriate, show users CLI commands they can run themselves:

```
"I've updated the status of your feature. You can check it anytime with:
  counsel status dark-mode
  
Or see all your features with:
  counsel list --mode feature"
```

### Batch CLI Operations

When you need multiple pieces of information, run CLI commands in parallel:
```bash
# Run these simultaneously
counsel status feature-x
counsel search "similar to feature-x"
counsel linear --search "feature-x"
```

### Use JSON Output for Processing

When you need to process results:
```bash
counsel status <name> --json    # Get structured data
counsel list --json              # Process programmatically
```

## Common Scenarios

### Scenario 1: User Returns After Break
```bash
counsel list --recent --status in-progress  # What was I working on?
counsel linear --urgent                     # Any urgent tickets?
```

### Scenario 2: Starting Implementation
```bash
counsel search "component library"          # Find similar work
counsel status current-feature               # Get current context
```

### Scenario 3: Debugging Issue
```bash
counsel search "similar error" --mode debug # Find similar debug sessions
counsel list --mode debug --recent          # Recent debug work
```

## What NOT to Do

1. **Don't use CLI to create new work** - Use `/counsel-create` instead
2. **Don't use CLI for complex multi-step workflows** - Use slash commands
3. **Don't wait for user to ask** - Proactively use CLI for context
4. **Don't show raw JSON to users** - Format the output nicely

## Summary

The CLI is your tool for:
- Quick information retrieval
- Pattern discovery
- Context gathering
- Work discovery

Use it liberally and proactively to provide better, more informed assistance to users.