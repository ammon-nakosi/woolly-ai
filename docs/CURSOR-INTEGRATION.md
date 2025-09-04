# Cursor Integration Guide

> Make Cursor AI understand "woolly" mentions naturally in your development workflow.

## Quick Setup

### For Your Project
```bash
# In your project directory
woolly cursor init        # Installs woolly commands
woolly cursor awareness   # Adds woolly awareness
```

This configures Cursor to understand woolly in your project.

## Manual Setup

### Method 1: Project Rules (Recommended)

Create `.cursorrules` in your project root:

```markdown
# Woolly Framework Awareness

When users mention "woolly" in any form, they're referring to the Woolly Framework
for managing development work. Understand these patterns:

- "woolly log [anything]" = Add note to current woolly work
- "woolly track [issue]" = Create debug work  
- "woolly this" = Create appropriate work based on context
- "woolly status" = Check current work status

Reference: @~/.woolly/ai-awareness/WOOLLY-AWARENESS.md for full patterns.

Always maintain awareness of active woolly work in the session.
```

### Method 2: Project Commands + Rules

1. Install woolly commands:
```bash
woolly cursor init
```

2. Create `.cursor/rules/woolly.md`:
```markdown
# Woolly Context

import: ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md

Recognize "woolly" mentions and use installed commands in .cursor/commands/
```

### Method 3: Global Settings (If Supported)

Add to Cursor's global AI settings/rules:
```
~/.cursor/global-rules.md
```

*Note: Check your Cursor version for global rules support*

## What This Enables

### Natural Language Understanding
```
You: woolly log fixed the memory leak
Cursor: Added to 'performance-optimization' debug notes:
        - Fixed the memory leak
```

### Proactive Suggestions
```
You: Starting a complex refactor of the API layer
Cursor: Would you like to woolly this as a feature? 
        I can help structure it into phases.
```

### Context Awareness
```
You: [working on auth feature]
You: woolly note OAuth is complete
Cursor: Added to 'user-authentication' feature:
        - OAuth implementation complete
        Phase 2: 4/5 tasks done
```

## Cursor-Specific Features

### 1. File Context
Cursor can use open file context to determine woolly mode:
- Editing test files → Suggests debug mode
- Creating new features → Suggests feature mode
- Reviewing PRs → Suggests review mode

### 2. Inline Suggestions
Cursor can suggest woolly actions in comments:
```javascript
// TODO: Complex refactor needed
// Cursor: This looks like a good candidate for woolly feature work

function needsRefactor() {
  // woolly log: identified performance bottleneck here
}
```

### 3. Terminal Integration
When using Cursor's terminal:
```bash
# Cursor understands woolly CLI commands
woolly status
woolly search "auth"
```

## Project Configuration

### For Teams
Share woolly configuration with your team:

1. Create `.cursor/woolly-config.json`:
```json
{
  "counselAware": true,
  "defaultMode": "feature",
  "projectPrefix": "PROJ",
  "autoSuggest": true
}
```

2. Add to `.cursorrules`:
```markdown
# Team Woolly Standards
@.cursor/woolly-config.json

Use project prefix "PROJ" for all woolly work.
Suggest woolly for tasks > 2 hours.
```

3. Commit both files to version control

## Updating

### Check for Updates
```bash
woolly cursor status

# Output:
Cursor Integration: v1.0.0
Commands: Installed (11 commands)
Awareness: Configured
Updates: Available (v1.1.0)
```

### Update Commands and Awareness
```bash
woolly cursor update
```

## Troubleshooting

### Cursor Doesn't Recognize "woolly"

1. Verify rules file exists:
```bash
cat .cursorrules | grep woolly
```

2. Check commands installation:
```bash
ls .cursor/commands/woolly-*.md
```

3. Reinstall:
```bash
woolly cursor init
woolly cursor awareness
```

### Rules Not Loading

Cursor loads rules from (in order):
1. `.cursorrules` (project root)
2. `.cursor/rules/*.md` (project)
3. Parent directories (up to home)

Ensure your rules are in one of these locations.

### Testing Awareness

Test these phrases with Cursor:
- "woolly log this works"
- "let's woolly this bug"
- "add to woolly notes"

## Advanced Usage

### Custom Patterns
Add project-specific patterns to `.cursorrules`:

```markdown
# Project Woolly Patterns

- "woolly sprint [name]" = Create feature with sprint prefix
- "woolly hotfix" = Create urgent debug work
- "woolly review PR" = Create review for current PR
```

### IDE Actions
Configure Cursor to trigger woolly on IDE events:

```json
// .cursor/triggers.json
{
  "onPROpen": "woolly review PR",
  "onBranchCreate": "suggest woolly feature",
  "onTestFail": "suggest woolly debug"
}
```

### Workspace Integration
For monorepos, configure per-workspace:

```
workspace/
├── package-a/
│   └── .cursorrules  # Package A woolly rules
├── package-b/
│   └── .cursorrules  # Package B woolly rules
└── .cursorrules      # Workspace-wide rules
```

## Best Practices

1. **Project-Level Config** - Keep woolly config with your code
2. **Team Standards** - Share woolly patterns via version control
3. **Natural Language** - Let Cursor understand context
4. **Regular Updates** - Keep commands and awareness current

## Examples in Practice

### Natural Logging
```
You: woolly remember we chose PostgreSQL over MySQL
Cursor: Added to knowledge base:
        - Database decision: PostgreSQL chosen over MySQL
        Saved to: ~/.woolly/knowledge/database-decisions.md
```

### Quick Creation
```
You: woolly this auth bug
Cursor: Creating debug work for auth bug...
        Created: ~/.woolly/debugs/auth-bug/
        
        What error are you seeing?
```

### Status Checking
```
You: what's in woolly?
Cursor: Recent woolly work:
        • user-auth (feature) - Phase 2 in progress
        • api-error (debug) - Investigating
        • pr-123 (review) - Completed
        
        Use 'woolly status [name]' for details.
```

## Support

- Documentation: `/docs/WOOLLY-AWARENESS.md`
- Update: `woolly cursor update`
- Status: `woolly cursor status`
- Support: `woolly cursor help`

---

*Cursor integration makes woolly feel like a native part of your IDE workflow.*