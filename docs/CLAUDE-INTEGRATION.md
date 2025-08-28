# Claude Integration Guide

> Make Claude understand "counsel" mentions naturally without explicit commands.

## Quick Setup (Automatic)

Run the setup script after installing Counsel Framework:
```bash
npm run setup
```

This automatically configures Claude to be counsel-aware.

## Manual Setup

If automatic setup didn't work or you want to configure manually:

### Step 1: Locate Your CLAUDE.md

Claude looks for configuration in this order:
1. `.claude/CLAUDE.md` (project-specific)
2. `~/.claude/CLAUDE.md` (user-global)

### Step 2: Add Import Statement

Add this line to your CLAUDE.md file:

```markdown
# Import Counsel Framework awareness
import: ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md
```

Or if you prefer inline, add this section:

```markdown
## Counsel Framework Awareness
When users mention "counsel" in any form, they're referring to the Counsel Framework.
See ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md for pattern recognition.
```

### Step 3: Verify Setup

Test by saying to Claude:
- "counsel log this works"
- "counsel status"
- "let's counsel this feature"

Claude should understand these naturally without requiring slash commands.

## What This Enables

Once configured, Claude will:

### 1. Understand Natural Language
- ✅ "counsel log we fixed the bug" → Adds to current work's notes
- ✅ "counsel track this issue" → Creates debug work
- ✅ "counsel remember this pattern" → Saves to knowledge base

### 2. Maintain Context
- Tracks currently active counsel work
- Remembers recent counsel mentions
- Associates logs with correct work

### 3. Proactive Suggestions
- Suggests counsel for complex tasks
- Recommends appropriate modes
- Offers to create structured work

## Advanced Configuration

### Project-Specific Awareness
For project-specific counsel patterns, create `.claude/COUNSEL-PROJECT.md`:

```markdown
# Project-Specific Counsel Patterns

This project uses counsel with these conventions:
- Features always use prefix: "proj-"
- Debug work includes ticket numbers
- Reviews follow PR naming

import: ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md
```

### Team Sharing
Share counsel awareness across your team:

1. Add to your project's `.claude/CLAUDE.md`:
```markdown
import: ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md
import: ./.claude/TEAM-COUNSEL.md
```

2. Create `.claude/TEAM-COUNSEL.md` with team conventions
3. Commit to version control

## Updating

When Counsel Framework updates:
```bash
counsel awareness update
```

Or manually:
```bash
npm update counsel-framework
npm run setup
```

Updates are automatic if you use the import method.

## Troubleshooting

### Claude doesn't recognize "counsel"
1. Check import statement is present:
```bash
cat ~/.claude/CLAUDE.md | grep counsel
```

2. Verify awareness file exists:
```bash
ls ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md
```

3. Run setup again:
```bash
counsel awareness setup
```

### Import not working
If imports aren't supported in your Claude version, copy content directly:
```bash
cat ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md >> ~/.claude/CLAUDE.md
```

### Checking Status
```bash
counsel awareness status

# Output:
✅ Claude configuration found
✅ Import statement present
✅ Awareness file up to date (v1.0.0)
```

## How It Works

1. **Pattern Recognition**: Claude learns to recognize "counsel" patterns
2. **Intent Detection**: Understands what action user wants
3. **Context Tracking**: Maintains awareness of active work
4. **Natural Responses**: Responds conversationally, not mechanically

## Example Interactions

### Before Integration
```
User: Track this bug in counsel
Claude: I don't understand. Did you mean to use a slash command?
```

### After Integration
```
User: Track this bug in counsel
Claude: Creating debug work for this bug.
        Created: ~/.counsel/debugs/[bug-name]/
        What symptoms are you seeing?
```

### Natural Logging
```
User: counsel log we need to refactor the auth module
Claude: Added to 'user-authentication' feature notes:
        - Need to refactor the auth module
        
        Current phase: 2 (Implementation)
```

### Proactive Suggestions
```
User: I'm starting work on a complex API integration
Claude: This sounds like a substantial feature. Would you like to counsel this?
        I can help structure it into phases for systematic development.
```

## Best Practices

1. **Let Claude be proactive** - It will suggest counsel when appropriate
2. **Use natural language** - No need for exact syntax
3. **Trust context tracking** - Claude maintains session awareness
4. **Update regularly** - Keep awareness document current

## Support

- Check status: `counsel awareness status`
- Update: `counsel awareness update`
- Reinstall: `npm run setup`
- Manual docs: See `/docs/COUNSEL-AWARENESS.md`

---

*Claude integration makes counsel feel native to your conversation, not like external commands.*