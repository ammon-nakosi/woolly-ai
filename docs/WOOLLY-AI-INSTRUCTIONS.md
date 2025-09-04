# Counsel Framework AI Instructions

> Concise guidance for AI assistants on using the Counsel Framework effectively.

## Natural Language Pattern Recognition

### Creating New Work
Recognize these patterns for starting new counsel work:
- `counsel this` → Determine appropriate mode from context
- `counsel track [issue]` → Create debug work  
- `counsel feature [description]` → Create feature work
- `counsel script [purpose]` → Create script work
- `counsel review [target]` → Create review work
- `let's counsel [something]` → Create appropriate work type

**Action**: Use `/counsel-create [mode] [description]` → Full workflow: `commands/counsel-create.md`

### Progress Documentation
Recognize these patterns for documenting work progress:
- `counsel log [anything]` → Add structured update to context
- `counsel note [anything]` → Document progress update
- `counsel remember [anything]` → Add findings to context
- `add to counsel` → Update project context
- `document this progress` → Create context update

**Action**: Use `/counsel-context-update` with structured format → Details: `commands/counsel-context-update.md`

### Status and Management
Recognize these patterns for querying counsel work:
- `counsel status` → Show current work status
- `what's in counsel?` → List recent work  
- `counsel search [term]` → Search all counsel work
- `show counsel work` → List current work

**Action**: Use CLI commands or `/counsel-status` → Details: `commands/counsel-status.md`

### Project Closure
Recognize these patterns for closing counsel work:
- `close this counsel session` → Use `/counsel-close`
- `close the counsel project` → Use `/counsel-close`
- `wrap up this counsel work` → Use `/counsel-close`
- `we're done with this counsel` → Use `/counsel-close`

**Action**: Use `/counsel-close` (3-step workflow: session update → finalize → user insights) → Full process: `commands/counsel-close.md`

## Command Reference

### Core Commands
- **`/counsel-create`** - Start new work (feature/script/vibe) → `commands/counsel-create.md`
- **`/counsel-reload`** - Load context for existing work → `commands/counsel-reload.md`  
- **`/counsel-context-update`** - Add structured progress update → `commands/counsel-context-update.md`
- **`/counsel-close`** - Proper 3-step closing workflow → `commands/counsel-close.md`

### Mode-Specific Commands  
- **`/counsel-feature`** - Feature development phases (specs/scope/plan/code) → `commands/counsel-feature.md`
- **`/counsel-prompt`** - Prompt engineering workflow → `commands/counsel-prompt.md`

### Status Commands
- **`/counsel-status`** - Full status with validation → `commands/counsel-status.md`
- **`/counsel-status-light`** - Quick status from JSON only
- **`/counsel-status-update`** - Sync status with reality → `commands/counsel-status-update.md`
- **`/counsel-list`** - List all counsel work → `commands/counsel-list.md`

### CLI Commands
```bash
counsel status [name]          # Get detailed status
counsel search "[query]"       # Semantic search
counsel list --recent          # List recent work  
counsel context add [name] --executed "..." --findings "..." --followup "..."  # Add context update
counsel finalize [name]        # Finalize project (use /counsel-close instead)
counsel session "[message]"    # Update session notes
```

## File Management Rules

### Context Documentation
**ALWAYS use structured context updates instead of creating arbitrary files:**

✅ **Correct Approach:**
- Use `/counsel-context-update` for all progress documentation
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
- Use `/counsel-context-update` instead

### Mode-Specific Files
**Only create files specified in mode documentation:**
- **Feature**: `context.md` (other files created by specific commands)
- **Script**: `context.md` + `purpose.md`
- **Vibe**: `context.md` only
- **Prompt**: `context.md` + `prompt.md`

**All other documentation goes through context updates.**

## Mode Selection Guide

**When user mentions counsel work, detect appropriate mode:**

- **Feature Mode**: New functionality, enhancements, complex features
  - Directory: `~/.counsel/features/[name]/`
  - Files: `context.md`, `specs.md`, `scope_*.md`, `plan-*.md`

- **Script Mode**: Automation, utilities, data processing
  - Directory: `~/.counsel/scripts/[name]/`  
  - Files: `context.md`, `purpose.md`, `script.*`, `usage.md`

- **Debug Mode**: Bug fixes, performance issues, error tracking
  - Directory: `~/.counsel/debugs/[name]/`
  - Files: `context.md`, `issue.md`, `reproduction.md`, `investigation.md`

- **Review Mode**: Code review, PR review, architecture review
  - Directory: `~/.counsel/reviews/[name]/`
  - Files: `context.md`, `scope.md`, `findings.md`, `recommendations.md`

- **Vibe Mode**: Exploration, research, learning, refactoring
  - Directory: `~/.counsel/vibes/[name]/`
  - Files: `context.md`, `notes.md`, `decisions.md`

- **Prompt Mode**: AI prompt engineering and optimization
  - Directory: `~/.counsel/prompts/[name]/`
  - Files: `context.md`, `prompt.md`, `test-cases.md`, `results.md`

## Context Integration

### Universal Context.md
**Every counsel project now has a context.md file** with standard sections:
- **Objective**: What we're trying to accomplish
- **Background**: Why this matters, current state
- **Approach**: How we plan to tackle this
- **Key Areas/Components**: Main focus areas
- **Current Status**: Progress and next steps
- **Success Criteria**: How we know it's complete

### Session Management
- Maintain awareness of **currently active counsel work**
- Track **recent counsel mentions** in session
- Use `counsel session "[update]" --work [name] --mode [mode]` for documentation

## Key Behaviors

### DO:
- Recognize "counsel" in any case (Counsel, COUNSEL, counsel)
- Infer mode from context when not specified
- Maintain session awareness of active work
- Always read context.md first when loading work
- Use proper 3-step closing workflow via `/counsel-close`
- Reference command files for detailed workflows

### DON'T:
- Require exact command syntax for natural language requests
- Duplicate workflow details that exist in command files
- Jump to `counsel finalize` without proper closing workflow
- Create duplicate work without checking existing
- Lose track of active counsel context

## Response Templates

### Starting New Work
```
Creating [mode] work: [suggested-name]
→ Full setup process: commands/counsel-create.md

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
No active counsel work detected. Would you like to:
1. Create new counsel work for this
2. Resume existing work  
3. Search existing work

Which would you prefer?
```

---

**Framework Version**: 2.1.0  
**Instructions Version**: 1.0.0  
**Last Updated**: 2024-12-28

*This document provides AI assistants with concise behavioral guidance for the Counsel Framework. Detailed workflows are maintained in individual command files.*