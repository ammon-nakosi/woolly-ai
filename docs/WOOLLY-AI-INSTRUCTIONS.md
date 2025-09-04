# Woolly Framework AI Instructions

> Concise guidance for AI assistants on using the Woolly Framework effectively.

## Natural Language Pattern Recognition

### Creating New Work
Recognize these patterns for starting new woolly work:
- `woolly this` → Determine appropriate mode from context
- `woolly track [issue]` → Create debug work  
- `woolly feature [description]` → Create feature work
- `woolly script [purpose]` → Create script work
- `woolly review [target]` → Create review work
- `let's woolly [something]` → Create appropriate work type

**Action**: Use `/woolly-create [mode] [description]` → Full workflow: `commands/woolly-create.md`

### Progress Documentation
Recognize these patterns for documenting work progress:
- `woolly log [anything]` → Add structured update to context
- `woolly note [anything]` → Document progress update
- `woolly remember [anything]` → Add findings to context
- `add to woolly` → Update project context
- `document this progress` → Create context update

**Action**: Use `/woolly-context-update` with structured format → Details: `commands/woolly-context-update.md`

### Status and Management
Recognize these patterns for querying woolly work:
- `woolly status` → Show current work status
- `what's in woolly?` → List recent work  
- `woolly search [term]` → Search all woolly work
- `show woolly work` → List current work

**Action**: Use CLI commands or `/woolly-status` → Details: `commands/woolly-status.md`

### Project Closure
Recognize these patterns for closing woolly work:
- `close this woolly session` → Use `/woolly-close`
- `close the woolly project` → Use `/woolly-close`
- `wrap up this woolly work` → Use `/woolly-close`
- `we're done with this woolly` → Use `/woolly-close`

**Action**: Use `/woolly-close` (3-step workflow: session update → finalize → user insights) → Full process: `commands/woolly-close.md`

## Command Reference

### Core Commands
- **`/woolly-create`** - Start new work (feature/script/vibe) → `commands/woolly-create.md`
- **`/woolly-reload`** - Load context for existing work → `commands/woolly-reload.md`  
- **`/woolly-context-update`** - Add structured progress update → `commands/woolly-context-update.md`
- **`/woolly-close`** - Proper 3-step closing workflow → `commands/woolly-close.md`

### Mode-Specific Commands  
- **`/woolly-feature`** - Feature development phases (specs/scope/plan/code) → `commands/woolly-feature.md`
- **`/woolly-prompt`** - Prompt engineering workflow → `commands/woolly-prompt.md`

### Status Commands
- **`/woolly-status`** - Full status with validation → `commands/woolly-status.md`
- **`/woolly-status-light`** - Quick status from JSON only
- **`/woolly-status-update`** - Sync status with reality → `commands/woolly-status-update.md`
- **`/woolly-list`** - List all woolly work → `commands/woolly-list.md`

### CLI Commands
```bash
woolly status [name]          # Get detailed status
woolly search "[query]"       # Semantic search
woolly list --recent          # List recent work  
woolly context add [name] --executed "..." --findings "..." --followup "..."  # Add context update
woolly finalize [name]        # Finalize project (use /woolly-close instead)
woolly session "[message]"    # Update session notes
```

## File Management Rules

### Context Documentation
**ALWAYS use structured context updates instead of creating arbitrary files:**

✅ **Correct Approach:**
- Use `/woolly-context-update` for all progress documentation
- Read existing context before adding updates  
- Follow 3-field structure: executed/findings/followup
- All updates append to existing context.md file

❌ **NEVER Create These Files:**
- `completion-summary.md`, `analysis.md`, `removal-plan.md`
- `session-[timestamp].md` (except for full session exports)
- `progress-notes.md`, `update.md`, `findings.md`
- Any arbitrary documentation files

### Session Files
**Session files are ONLY for full session exports** (like Claude Code's session export):
- Not for routine progress updates
- Not for documenting work findings  
- Not for milestone tracking
- Use `/woolly-context-update` instead

### Mode-Specific Files
**Only create files specified in mode documentation:**
- **Feature**: `context.md` (other files created by specific commands)
- **Script**: `context.md` + `purpose.md`
- **Vibe**: `context.md` only
- **Prompt**: `context.md` + `prompt.md`

**All other documentation goes through context updates.**

## Mode Selection Guide

**When user mentions woolly work, detect appropriate mode:**

- **Feature Mode**: New functionality, enhancements, complex features
  - Directory: `~/.woolly/features/[name]/`
  - Files: `context.md`, `specs.md`, `scope_*.md`, `plan-*.md`

- **Script Mode**: Automation, utilities, data processing
  - Directory: `~/.woolly/scripts/[name]/`  
  - Files: `context.md`, `purpose.md`, `script.*`, `usage.md`

- **Debug Mode**: Bug fixes, performance issues, error tracking
  - Directory: `~/.woolly/debugs/[name]/`
  - Files: `context.md`, `issue.md`, `reproduction.md`, `investigation.md`

- **Review Mode**: Code review, PR review, architecture review
  - Directory: `~/.woolly/reviews/[name]/`
  - Files: `context.md`, `scope.md`, `findings.md`, `recommendations.md`

- **Vibe Mode**: Exploration, research, learning, refactoring
  - Directory: `~/.woolly/vibes/[name]/`
  - Files: `context.md`, `notes.md`, `decisions.md`

- **Prompt Mode**: AI prompt engineering and optimization
  - Directory: `~/.woolly/prompts/[name]/`
  - Files: `context.md`, `prompt.md`, `test-cases.md`, `results.md`

## Context Integration

### Universal Context.md
**Every woolly project now has a context.md file** with standard sections:
- **Objective**: What we're trying to accomplish
- **Background**: Why this matters, current state
- **Approach**: How we plan to tackle this
- **Key Areas/Components**: Main focus areas
- **Current Status**: Progress and next steps
- **Success Criteria**: How we know it's complete

### Session Management
- Maintain awareness of **currently active woolly work**
- Track **recent woolly mentions** in session
- Use `woolly session "[update]" --work [name] --mode [mode]` for documentation

## Key Behaviors

### DO:
- Recognize "woolly" in any case (Woolly, WOOLLY, woolly)
- Infer mode from context when not specified
- Maintain session awareness of active work
- Always read context.md first when loading work
- Use proper 3-step closing workflow via `/woolly-close`
- Reference command files for detailed workflows

### DON'T:
- Require exact command syntax for natural language requests
- Duplicate workflow details that exist in command files
- Jump to `woolly finalize` without proper closing workflow
- Create duplicate work without checking existing
- Lose track of active woolly context

## Response Templates

### Starting New Work
```
Creating [mode] work: [suggested-name]
→ Full setup process: commands/woolly-create.md

What would you like to focus on first?
```

### Logging to Active Work
```
Added to [work-name] notes:
- [timestamp]: [what was logged]

Current status: [brief status if relevant]
```

### No Active Work
```
No active woolly work detected. Would you like to:
1. Create new woolly work for this
2. Resume existing work  
3. Search existing work

Which would you prefer?
```

---

**Framework Version**: 2.1.0  
**Instructions Version**: 1.0.0  
**Last Updated**: 2024-12-28

*This document provides AI assistants with concise behavioral guidance for the Woolly Framework. Detailed workflows are maintained in individual command files.*