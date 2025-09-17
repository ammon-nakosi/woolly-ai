---
description: "Add structured update to woolly project context"
argument-hint: "[optional user guidance]"
---

You are updating the context for a woolly project with a structured progress update. This replaces the practice of creating arbitrary files for documentation.

## Required Workflow

### Step 1: Determine Project Name
**You MUST identify the specific woolly project name explicitly**. Do not assume or auto-detect.

If unclear from conversation context:
```
I need to update the project context. Which woolly project should I update?

Available options:
- If this is part of ongoing work, specify the project name
- Use `woolly list` to see all available projects
- Provide the exact project name (e.g., "user-authentication", "debug-removal")
```

### Step 2: Read Current Context  
**ALWAYS read the existing context before adding updates**:

```bash
woolly status <project-name>
```

Or directly read the context file to understand:
- Current project state and history
- Previous updates and findings  
- What has been accomplished so far
- Outstanding follow-up items

### Step 3: Process User Guidance
Parse the optional user guidance from `$ARGUMENTS`:
- **If user provided input**: Factor their focus/priorities into the update
- **If no input provided**: Focus on your recent work and observations
- **Consider both perspectives**: User priorities + agent observations + context history

### Step 4: Create Structured Update
Execute the CLI command with ALL required fields:

```bash
woolly context add <project-name> \
  --executed "what was accomplished/executed" \
  --findings "key discoveries or results" \
  --followup "next steps or follow-up plan" \
  --agent-issues "issues encountered and solutions (use 'n/a' if none)"
```

**Requirements:**
- **All 4 fields MANDATORY** - command will fail if any missing or empty
- **--agent-issues REQUIRED** - use "n/a" if execution went smoothly
- **Meaningful content** - no placeholder or filler text
- **Specific details** - concrete actions, findings, and plans
- **User guidance integration** - incorporate user input when provided

### Step 5: Confirm Update
After successful execution, briefly confirm:
```
✅ Context updated for '[project-name]'
Added: [brief summary of what was documented]
```

## Field Guidelines

### --executed (What was accomplished)
- Specific actions taken or work completed
- Technical changes made
- Problems solved or tasks finished
- Focus on concrete accomplishments

**Examples:**
- "Removed debug/review modes from type definitions and CLI commands" 
- "Fixed TypeScript compilation errors in 8 CLI files"
- "Updated web interface components to use 4-mode system"

### --findings (Key discoveries)
- Important results or discoveries
- Technical insights gained
- Problems identified or resolved
- Performance metrics or validation results

**Examples:**
- "All build processes now complete successfully with 0 errors"
- "Found 15+ integration points that required coordinated updates"
- "Web interface renders correctly with new 4-mode structure"

### --agent-issues (Agent execution problems and solutions)
**CRITICAL**: This field is MANDATORY. Use "n/a" only if everything went smoothly without any issues.

Document any execution problems:
- **Misunderstandings** - What the agent initially got wrong and why
- **Repeated attempts** - Tasks that required multiple tries or user corrections
- **Tool problems** - Issues with specific tools or commands failing
- **Context confusion** - Missing or unclear information that led to problems
- **Solutions found** - How the issue was ultimately resolved
- **Workarounds used** - Temporary fixes when proper solution wasn't available
- **User frustration** - Note if user had to repeat/clarify multiple times

**Examples:**
- "Initially tried to create files directly instead of using woolly context update - resolved by user reminder"
- "ChromaDB connection failed 3 times - worked around using fuzzy search instead"
- "Misunderstood requirement for all fields - fixed after error clarification"
- "TypeScript errors persisted after fixes - solution: full rebuild after each change"
- "n/a" (when everything worked perfectly first time)

### --followup (Next steps - DETAILED IMPLEMENTATION PLAN)
**CRITICAL**: This field must contain the COMPLETE, ACTIONABLE PLAN that another agent could pick up and execute without additional context.

Include:
- **Specific files to create/modify** with paths
- **Exact implementation steps** in order
- **Key technical details** (function names, data structures, etc.)
- **Testing approach** if applicable
- **Any decisions or constraints** already determined

**Good Example:**
"1. Create cli/src/commands/create.ts with woolly create command that accepts [mode] [name] [description] args and creates ~/.woolly/[mode]s/[name]/ with context.md and metadata.json
2. Create cli/src/commands/worktree.ts with woolly worktree command that runs git worktree add ../[identifier] -b [identifier] and copies .env files
3. Modify commands/woolly-create.md Step 3 to call woolly create instead of mkdir, add worktree detection after Step 3
4. Update commands/woolly-close.md to read metadata.json and prompt for worktree removal if exists
5. Test with all three modes (feature/script/vibe) including worktree creation and cleanup"

**Bad Example:**
"Begin implementation of CLI commands" (too vague)
"Test CLI functionality" (not specific enough)

## Error Handling

If the CLI command fails:
1. **Show the exact error message** to the user
2. **Explain what went wrong** (missing project, empty fields, etc.)
3. **Provide guidance** on how to fix the issue
4. **DO NOT** create alternative files or workarounds

Common errors:
- `Project 'name' not found` → Check project exists with `woolly list`
- `Field '--executed' cannot be empty` → Provide meaningful content for all fields
- `Context file not found` → Project exists but missing context.md file

## Important Rules

### NEVER Do:
- Create arbitrary files (`completion-summary.md`, `analysis.md`, etc.)
- Skip reading the existing context
- Use empty or placeholder text in any field
- Auto-detect or assume project names

### ALWAYS Do:  
- Read context before updating
- Require explicit project name
- Fill all 3 fields with meaningful content
- Use the CLI command exactly as specified
- Consider user guidance when provided

This systematic approach ensures predictable, structured documentation of all woolly project progress while giving users control through optional guidance.