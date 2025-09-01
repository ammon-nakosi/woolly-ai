---
description: "Add structured update to counsel project context"
argument-hint: "[optional user guidance]"
---

You are updating the context for a counsel project with a structured progress update. This replaces the practice of creating arbitrary files for documentation.

## Required Workflow

### Step 1: Determine Project Name
**You MUST identify the specific counsel project name explicitly**. Do not assume or auto-detect.

If unclear from conversation context:
```
I need to update the project context. Which counsel project should I update?

Available options:
- If this is part of ongoing work, specify the project name
- Use `counsel list` to see all available projects
- Provide the exact project name (e.g., "user-authentication", "debug-removal")
```

### Step 2: Read Current Context  
**ALWAYS read the existing context before adding updates**:

```bash
counsel status <project-name>
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
counsel context add <project-name> \
  --executed "what was accomplished/executed" \
  --findings "key discoveries or results" \
  --followup "next steps or follow-up plan"
```

**Requirements:**
- **All 3 fields MANDATORY** - command will fail if any missing or empty
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

### --followup (Next steps)
- Remaining work or tasks
- Next phase of implementation
- Testing or validation needed
- Decisions to be made

**Examples:**
- "Begin Phase 4: web interface testing and validation" 
- "Test CLI functionality with new context management system"
- "Update agent instructions to prevent arbitrary file creation"

## Error Handling

If the CLI command fails:
1. **Show the exact error message** to the user
2. **Explain what went wrong** (missing project, empty fields, etc.)
3. **Provide guidance** on how to fix the issue
4. **DO NOT** create alternative files or workarounds

Common errors:
- `Project 'name' not found` → Check project exists with `counsel list`
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

This systematic approach ensures predictable, structured documentation of all counsel project progress while giving users control through optional guidance.