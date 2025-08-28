---
description: "Create a new counsel workflow with appropriate mode"
argument-hint: "[mode] [brief description]"
---

You are initiating a new Counsel Framework workflow. Parse the arguments from $ARGUMENTS as:
1. **Mode**: The first word should be one of: `feature`, `script`, `debug`, `review`, `vibe`, or `prompt`
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
• prompt - AI prompt engineering and optimization

Please specify mode: /counsel-create [mode] [description]
═══════════════════════════════════════════════════════════════
```

## Step 2: Suggest Name Based on Description

Based on the description and mode, suggest an appropriate name:

**Naming Conventions:**
- **feature**: kebab-case, feature-focused (e.g., "dark-mode-settings", "user-authentication")
- **script**: kebab-case, action-oriented (e.g., "db-backup", "log-analyzer")
- **debug**: kebab-case, issue-description (e.g., "slow-page-load", "auth-error-500")
- **review**: kebab-case, review-target (e.g., "pr-auth-feature", "feature-dark-mode", "security-audit")
- **vibe**: kebab-case, topic-summary (e.g., "api-refactor", "performance-exploration")
- **prompt**: kebab-case, prompt-purpose (e.g., "code-reviewer", "test-generator", "doc-writer")

### For Vibe Mode
**Skip the name confirmation entirely**. Just auto-generate a name and proceed directly:

```
═══════════════════════════════════════════════════════════════
                   VIBE MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: ~/.counsel/vibes/[auto-generated-name]/

Session initialized.

Where should we start?
```

### For Other Modes
Present the suggestion and ask for confirmation:

```
═══════════════════════════════════════════════════════════════
            COUNSEL INITIATION - [MODE] MODE
═══════════════════════════════════════════════════════════════

Description: [user's description]
Suggested Name: [proposed-name]

This will create: ~/.counsel/[mode]s/[proposed-name]/

Is this name good, or would you prefer a different one?
═══════════════════════════════════════════════════════════════
```

## Step 2.5: Check for Similar Work (CLI Integration)

**After the name is confirmed (or auto-generated for vibe)**, use the Counsel CLI to check for similar existing work:

```bash
counsel search "[name] [description]"
```

If similar work is found with >80% similarity:
```
⚠️ Found similar existing counsel work:
  • [name]: [similarity]% match
  
Would you like to:
1. View the existing work (counsel status [name])
2. Continue with creating new work
3. Choose a different name
```

**Note**: For vibe mode, if similar work is found, just mention it briefly and continue unless the similarity is >90%.

## Step 3: Create Directory Structure

Once the user approves or provides an alternative name, create the appropriate directory:
- `~/.counsel/features/[name]/` for feature mode
- `~/.counsel/scripts/[name]/` for script mode
- `~/.counsel/debugs/[name]/` for debug mode
- `~/.counsel/reviews/[name]/` for review mode
- `~/.counsel/vibes/[name]/` for vibe mode
- `~/.counsel/prompts/[name]/` for prompt mode

## Step 4: Provide Mode-Specific Next Steps

### Feature Mode
```
═══════════════════════════════════════════════════════════════
                 FEATURE MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: ~/.counsel/features/[name]/

The Counsel Framework will guide you through:
1. Requirements gathering
2. Technical discovery
3. Implementation planning
4. Phased development

Next step: Let's define the requirements
Run: /counsel-feature-requirements [name]

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

Created: ~/.counsel/scripts/[name]/

Let me help you define this script. I'll need to understand:
- What problem does it solve?
- What inputs/parameters does it need?
- What should it output?
- Any specific technologies or constraints?

Tell me about the script's purpose:
```

Then create `purpose.md` with the user's responses.

**Before implementing, consider asking 2-3 relevant architecture questions:**

- **Decomposition**: If fetching + processing large data: "Would you prefer this as two separate scripts (one to fetch data, another to process it) for better caching and re-runs?"
- **Idempotency**: If resource-intensive operations: "Should the script check if items are already processed? This adds overhead but makes re-runs safer."
- **Caching**: If external API calls: "Should API responses be cached locally to speed up debugging and re-runs?"
- **Checkpoints**: If >1000 items: "Should the script save progress checkpoints to resume from failures?"
- **Output Format**: If generating results: "What format: JSON (programmatic), CSV (spreadsheets), or both?"
- **Concurrency**: If high-volume and order-independent: "Run in parallel for speed (may hit rate limits) or sequential for safety?"

Ask only the most relevant questions. Don't ask about dry-run mode, limits, or batching - these are always included.
Document decisions briefly in the script header comments.

Then begin implementation.

**IMPORTANT**: Follow production script guidelines for all scripts:
- **Prioritize readability**: Use clear variable names, add section comments, break complex logic into functions
- Scripts are read more often than written - optimize for understanding
- See `docs/SCRIPT-MODE-GUIDELINES.md` for required patterns and best practices
- Use production templates from `/templates/script-logging/`:
  - `production-script-template.ts` for TypeScript/Node.js scripts
  - `production-script-template.sh` for shell scripts
- All scripts MUST include: dry-run mode, limits, batching, progress tracking, and outcomes
- **Logs MUST be saved to**: `~/.counsel/scripts/{script-name}/logs/` (NOT the current directory)
- **Outcomes MUST be saved to**: `~/.counsel/scripts/{script-name}/outcomes/`
- Copy the logging utility or include inline logging code that uses the correct paths
- Default to dry-run mode for safety (require `--live` flag for actual execution)
- Testing progression: dry-run with small limit → dry-run with larger limit → live with small limit → full production

### Debug Mode
```
═══════════════════════════════════════════════════════════════
                  DEBUG MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: ~/.counsel/debugs/[name]/

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

Created: ~/.counsel/reviews/[name]/

What would you like to review?

1. Existing Counsel work:
   - Feature in ~/.counsel/features/
   - Script in ~/.counsel/scripts/
   - Debug solution in ~/.counsel/debugs/
   
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
Since vibe mode auto-generates the name, the flow is streamlined. After creating the directory, immediately show:

```
═══════════════════════════════════════════════════════════════
                   VIBE MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: ~/.counsel/vibes/[auto-generated-name]/

Session initialized.

Where should we start?
```

**Vibe mode file management:**
- Create `context.md` ONCE at initialization with:
  - What the user wants to explore/accomplish
  - Initial research findings or insights
  - Potential approaches to investigate
- Create `sessions/session-[timestamp].md` for tracking significant outcomes
- Only update session file for major milestones, not routine conversation
- Context is the "what and why", session is the "what happened"

### Prompt Mode
```
═══════════════════════════════════════════════════════════════
                  PROMPT MODE INITIALIZED
═══════════════════════════════════════════════════════════════

Created: ~/.counsel/prompts/[name]/

Let's create your AI prompt. What should this prompt do?

Describe the task or behavior you want the AI to perform:
```

Then immediately create the initial `prompt.md` file with the user's description and begin iterating on the prompt content. Focus on crafting effective prompt text rather than documentation.

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

**Prompt Mode**: Create `prompt.md` directly with the prompt content

## Remember

- Keep the tone appropriate to the mode (formal for features, casual for open)
- Guide users to the next logical step for their chosen mode
- For vibe mode especially, maintain flexibility and avoid over-structuring
- Document decisions and progress appropriately for each mode type