# Cursor Integration Guide

> Make Cursor AI understand "counsel" mentions naturally in your development workflow.

## Quick Setup

### For Your Project
```bash
# In your project directory
counsel cursor init        # Installs counsel commands
counsel cursor awareness   # Adds counsel awareness
```

This configures Cursor to understand counsel in your project.

## Manual Setup

### Method 1: Project Rules (Recommended)

Create `.cursorrules` in your project root:

```markdown
# Counsel Framework Awareness

When users mention "counsel" in any form, they're referring to the Counsel Framework
for managing development work. Understand these patterns:

- "counsel log [anything]" = Add note to current counsel work
- "counsel track [issue]" = Create debug work  
- "counsel this" = Create appropriate work based on context
- "counsel status" = Check current work status

Reference: @~/.counsel/ai-awareness/COUNSEL-AWARENESS.md for full patterns.

Always maintain awareness of active counsel work in the session.
```

### Method 2: Project Commands + Rules

1. Install counsel commands:
```bash
counsel cursor init
```

2. Create `.cursor/rules/counsel.md`:
```markdown
# Counsel Context

import: ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md

Recognize "counsel" mentions and use installed commands in .cursor/commands/
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
You: counsel log fixed the memory leak
Cursor: Added to 'performance-optimization' debug notes:
        - Fixed the memory leak
```

### Proactive Suggestions
```
You: Starting a complex refactor of the API layer
Cursor: Would you like to counsel this as a feature? 
        I can help structure it into phases.
```

### Context Awareness
```
You: [working on auth feature]
You: counsel note OAuth is complete
Cursor: Added to 'user-authentication' feature:
        - OAuth implementation complete
        Phase 2: 4/5 tasks done
```

## Cursor-Specific Features

### 1. File Context
Cursor can use open file context to determine counsel mode:
- Editing test files → Suggests debug mode
- Creating new features → Suggests feature mode
- Reviewing PRs → Suggests review mode

### 2. Inline Suggestions
Cursor can suggest counsel actions in comments:
```javascript
// TODO: Complex refactor needed
// Cursor: This looks like a good candidate for counsel feature work

function needsRefactor() {
  // counsel log: identified performance bottleneck here
}
```

### 3. Terminal Integration
When using Cursor's terminal:
```bash
# Cursor understands counsel CLI commands
counsel status
counsel search "auth"
```

## Project Configuration

### For Teams
Share counsel configuration with your team:

1. Create `.cursor/counsel-config.json`:
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
# Team Counsel Standards
@.cursor/counsel-config.json

Use project prefix "PROJ" for all counsel work.
Suggest counsel for tasks > 2 hours.
```

3. Commit both files to version control

## Updating

### Check for Updates
```bash
counsel cursor status

# Output:
Cursor Integration: v1.0.0
Commands: Installed (11 commands)
Awareness: Configured
Updates: Available (v1.1.0)
```

### Update Commands and Awareness
```bash
counsel cursor update
```

## Troubleshooting

### Cursor Doesn't Recognize "counsel"

1. Verify rules file exists:
```bash
cat .cursorrules | grep counsel
```

2. Check commands installation:
```bash
ls .cursor/commands/counsel-*.md
```

3. Reinstall:
```bash
counsel cursor init
counsel cursor awareness
```

### Rules Not Loading

Cursor loads rules from (in order):
1. `.cursorrules` (project root)
2. `.cursor/rules/*.md` (project)
3. Parent directories (up to home)

Ensure your rules are in one of these locations.

### Testing Awareness

Test these phrases with Cursor:
- "counsel log this works"
- "let's counsel this bug"
- "add to counsel notes"

## Advanced Usage

### Custom Patterns
Add project-specific patterns to `.cursorrules`:

```markdown
# Project Counsel Patterns

- "counsel sprint [name]" = Create feature with sprint prefix
- "counsel hotfix" = Create urgent debug work
- "counsel review PR" = Create review for current PR
```

### IDE Actions
Configure Cursor to trigger counsel on IDE events:

```json
// .cursor/triggers.json
{
  "onPROpen": "counsel review PR",
  "onBranchCreate": "suggest counsel feature",
  "onTestFail": "suggest counsel debug"
}
```

### Workspace Integration
For monorepos, configure per-workspace:

```
workspace/
├── package-a/
│   └── .cursorrules  # Package A counsel rules
├── package-b/
│   └── .cursorrules  # Package B counsel rules
└── .cursorrules      # Workspace-wide rules
```

## Best Practices

1. **Project-Level Config** - Keep counsel config with your code
2. **Team Standards** - Share counsel patterns via version control
3. **Natural Language** - Let Cursor understand context
4. **Regular Updates** - Keep commands and awareness current

## Examples in Practice

### Natural Logging
```
You: counsel remember we chose PostgreSQL over MySQL
Cursor: Added to knowledge base:
        - Database decision: PostgreSQL chosen over MySQL
        Saved to: ~/.counsel/knowledge/database-decisions.md
```

### Quick Creation
```
You: counsel this auth bug
Cursor: Creating debug work for auth bug...
        Created: ~/.counsel/debugs/auth-bug/
        
        What error are you seeing?
```

### Status Checking
```
You: what's in counsel?
Cursor: Recent counsel work:
        • user-auth (feature) - Phase 2 in progress
        • api-error (debug) - Investigating
        • pr-123 (review) - Completed
        
        Use 'counsel status [name]' for details.
```

## Support

- Documentation: `/docs/COUNSEL-AWARENESS.md`
- Update: `counsel cursor update`
- Status: `counsel cursor status`
- Support: `counsel cursor help`

---

*Cursor integration makes counsel feel like a native part of your IDE workflow.*