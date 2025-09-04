# Claude Integration Guide

> Make Claude understand "woolly" mentions naturally without explicit commands.

## Quick Setup (Automatic)

Run the setup script after installing Woolly Framework:
```bash
npm run setup
```

This automatically configures Claude to be woolly-aware.

## Manual Setup

If automatic setup didn't work or you want to configure manually:

### Step 1: Locate Your CLAUDE.md

Claude looks for configuration in this order:
1. `.claude/CLAUDE.md` (project-specific)
2. `~/.claude/CLAUDE.md` (user-global)

### Step 2: Add Import Statement

Add this line to your CLAUDE.md file:

```markdown
# Import Woolly Framework awareness
import: ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md
```

Or if you prefer inline, add this section:

```markdown
## Woolly Framework Awareness
When users mention "woolly" in any form, they're referring to the Woolly Framework.
See ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md for pattern recognition.
```

### Step 3: Verify Setup

Test by saying to Claude:
- "woolly log this works"
- "woolly status"
- "let's woolly this feature"

Claude should understand these naturally without requiring slash commands.

## What This Enables

Once configured, Claude will:

### 1. Understand Natural Language
- ✅ "woolly log we fixed the bug" → Adds to current work's notes
- ✅ "woolly track this issue" → Creates debug work
- ✅ "woolly remember this pattern" → Saves to knowledge base

### 2. Maintain Context
- Tracks currently active woolly work
- Remembers recent woolly mentions
- Associates logs with correct work

### 3. Proactive Suggestions
- Suggests woolly for complex tasks
- Recommends appropriate modes
- Offers to create structured work

## Advanced Configuration

### Project-Specific Awareness
For project-specific woolly patterns, create `.claude/WOOLLY-PROJECT.md`:

```markdown
# Project-Specific Woolly Patterns

This project uses woolly with these conventions:
- Features always use prefix: "proj-"
- Debug work includes ticket numbers
- Reviews follow PR naming

import: ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md
```

### Team Sharing
Share woolly awareness across your team:

1. Add to your project's `.claude/CLAUDE.md`:
```markdown
import: ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md
import: ./.claude/TEAM-WOOLLY.md
```

2. Create `.claude/TEAM-WOOLLY.md` with team conventions
3. Commit to version control

## Updating

When Woolly Framework updates:
```bash
woolly awareness update
```

Or manually:
```bash
npm update woolly-framework
npm run setup
```

Updates are automatic if you use the import method.

## Troubleshooting

### Claude doesn't recognize "woolly"
1. Check import statement is present:
```bash
cat ~/.claude/CLAUDE.md | grep woolly
```

2. Verify awareness file exists:
```bash
ls ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md
```

3. Run setup again:
```bash
woolly awareness setup
```

### Import not working
If imports aren't supported in your Claude version, copy content directly:
```bash
cat ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md >> ~/.claude/CLAUDE.md
```

### Checking Status
```bash
woolly awareness status

# Output:
✅ Claude configuration found
✅ Import statement present
✅ Awareness file up to date (v1.0.0)
```

## How It Works

1. **Pattern Recognition**: Claude learns to recognize "woolly" patterns
2. **Intent Detection**: Understands what action user wants
3. **Context Tracking**: Maintains awareness of active work
4. **Natural Responses**: Responds conversationally, not mechanically

## Example Interactions

### Before Integration
```
User: Track this bug in woolly
Claude: I don't understand. Did you mean to use a slash command?
```

### After Integration
```
User: Track this bug in woolly
Claude: Creating debug work for this bug.
        Created: ~/.woolly/debugs/[bug-name]/
        What symptoms are you seeing?
```

### Natural Logging
```
User: woolly log we need to refactor the auth module
Claude: Added to 'user-authentication' feature notes:
        - Need to refactor the auth module
        
        Current phase: 2 (Implementation)
```

### Proactive Suggestions
```
User: I'm starting work on a complex API integration
Claude: This sounds like a substantial feature. Would you like to woolly this?
        I can help structure it into phases for systematic development.
```

## Best Practices

1. **Let Claude be proactive** - It will suggest woolly when appropriate
2. **Use natural language** - No need for exact syntax
3. **Trust context tracking** - Claude maintains session awareness
4. **Update regularly** - Keep awareness document current

## Support

- Check status: `woolly awareness status`
- Update: `woolly awareness update`
- Reinstall: `npm run setup`
- Manual docs: See `/docs/WOOLLY-AWARENESS.md`

---

*Claude integration makes woolly feel native to your conversation, not like external commands.*