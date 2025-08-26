---
description: "Create a new counsel workflow with appropriate mode"
argument-hint: "[mode] [brief description]"
---

You are initiating a new Counsel Framework workflow. Parse the arguments from $ARGUMENTS as:
1. **Mode**: The first word should be one of: `feature`, `script`, `debug`, `review`, or `vibe`
2. **Description**: The rest of the arguments form a brief description

If mode is missing or invalid, show available modes and ask which one to use.

## Step 1: Parse and Validate Mode

Validate the mode is one of the supported types. If not, present:

```
═══════════════════════════════════════════════════════════════
                    COUNSEL MODES AVAILABLE
═══════════════════════════════════════════════════════════════

• feature - Full development lifecycle for new features
• script - Quick automation scripts and utilities  
• debug - Systematic debugging of issues
• review - Code review, architecture review, or reviewing counsel work
• vibe - Flexible, exploratory work

Please specify mode: /counsel-create [mode] [description]
═══════════════════════════════════════════════════════════════
```

## Step 1.5: Check for Similar Work (CLI Integration)

**IMPORTANT**: Before suggesting a name, use the Counsel CLI to check for similar existing work:

```bash
counsel search "<user's description>"
```

If similar work is found with >80% similarity:
```
⚠️ Found similar existing counsel work:
  • [name]: [similarity]% match
  
Would you like to:
1. View the existing work (counsel status [name])
2. Continue with creating new work
3. Choose a different description
```

## Step 2: Suggest Name Based on Description

Based on the description and mode, suggest an appropriate name:

**Naming Conventions:**
- **feature**: kebab-case, feature-focused (e.g., "dark-mode-settings", "user-authentication")
- **script**: kebab-case, action-oriented (e.g., "db-backup", "log-analyzer")
- **debug**: kebab-case, issue-description (e.g., "slow-page-load", "auth-error-500")
- **review**: kebab-case, review-target (e.g., "pr-auth-feature", "feature-dark-mode", "security-audit")
- **vibe**: kebab-case, topic-summary (e.g., "api-refactor", "performance-exploration")

Present the suggestion:

```
═══════════════════════════════════════════════════════════════
            COUNSEL INITIATION - [MODE] MODE
═══════════════════════════════════════════════════════════════

Description: [user's description]
Suggested Name: [proposed-name]

This will create: .[mode]s/[proposed-name]/

Is this name good, or would you prefer a different one?
═══════════════════════════════════════════════════════════════
```

## Step 3: Create Directory Structure

Once the user approves or provides an alternative name, create the appropriate directory:
- `.features/[name]/` for feature mode
- `.scripts/[name]/` for script mode
- `.debug/[name]/` for debug mode
- `.review/[name]/` for review mode
- `.vibe/[name]/` for vibe mode

## Step 4: Provide Mode-Specific Next Steps

### Feature Mode
```
═══════════════════════════════════════════════════════════════
                 FEATURE MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: .features/[name]/

The Counsel Framework will guide you through:
1. Requirements gathering
2. Technical discovery
3. Implementation planning
4. Phased development

Next step: Let's define the requirements
Run: /counsel-requirements [name]

💡 CLI Tips:
  • Check status anytime: counsel status [name]
  • Find similar features: counsel search "[topic]"
  • List all features: counsel list --mode feature
  • Add to index: counsel add feature [name]

Ready to begin?
═══════════════════════════════════════════════════════════════
```

### Script Mode
```
═══════════════════════════════════════════════════════════════
                  SCRIPT MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: .scripts/[name]/

Let me help you define this script. I'll need to understand:
- What problem does it solve?
- What inputs/parameters does it need?
- What should it output?
- Any specific technologies or constraints?

Tell me about the script's purpose:
```

Then create `purpose.md` with the user's responses and begin implementation.

### Debug Mode
```
═══════════════════════════════════════════════════════════════
                  DEBUG MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: .debug/[name]/

Let's systematically debug this issue. First, I need to understand:
- What symptoms are you seeing?
- When did this start happening?
- Can you reproduce it consistently?
- Any error messages or logs?

Describe the issue:
```

Then create `issue.md` with the problem description and begin investigation.

### Review Mode
```
═══════════════════════════════════════════════════════════════
                  REVIEW MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: .review/[name]/

What would you like to review?

1. Existing Counsel work:
   - Feature in .features/
   - Script in .scripts/
   - Debug solution in .debug/
   
2. External code/system:
   - Pull request
   - Architecture/design
   - Security audit
   - Existing codebase
   - Performance analysis

Please specify what to review:
- For counsel work: "feature:name" or "script:name"
- For external: describe what needs reviewing
```

Then create `scope.md` with review criteria and begin systematic review.

### Vibe Mode
```
═══════════════════════════════════════════════════════════════
                   VIBE MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: .vibe/[name]/

Session initialized.

Where should we start?
```

For vibe mode, keep it light and conversational. Create `context.md` as work progresses to document what's being explored.

## Special Handling

### Existing Directory Check
Before creating a directory, check if it already exists. If it does:

```
⚠️ A [mode] with name "[name]" already exists.

Would you like to:
1. Continue working on the existing [name]
2. Choose a different name
3. View the current status of [name]

What would you prefer?
```

### Mode-Specific Files

Create initial files based on mode:

**Feature Mode**: No initial files (will be created by subsequent commands)

**Script Mode**: Create `purpose.md` after gathering requirements

**Debug Mode**: Create `issue.md` with initial problem description

**Review Mode**: Create `scope.md` with review criteria and target

**Vibe Mode**: Create lightweight `context.md` to track exploration

## Remember

- Keep the tone appropriate to the mode (formal for features, casual for open)
- Guide users to the next logical step for their chosen mode
- For vibe mode especially, maintain flexibility and avoid over-structuring
- Document decisions and progress appropriately for each mode type