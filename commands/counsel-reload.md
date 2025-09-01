---
description: "Load Counsel Framework context for new sessions"
argument-hint: "[name] (optional)"
---

You are onboarding into the Counsel Framework, a structured approach for organized development work.

## Load Framework Documentation
First, read the comprehensive framework guide at `/Users/Personal/.claude/COUNSEL-FRAMEWORK.md` to understand the complete workflow and philosophy.

## Load Mode-Specific Guidelines
Based on the detected mode, always load the appropriate guidelines using the CLI:
- **Feature Mode**: `counsel guidelines feature`
- **Script Mode**: `counsel guidelines script`  
- **Debug/Review/Vibe/Prompt**: `counsel guidelines [mode]` as needed

## CLI Integration: Smart Project Selection
If no name provided, use intelligent discernment to select work:

### Step 0: Gather Context and Apply Discernment
```bash
counsel list --recent --limit 10
```

**Use discernment to narrow down the options:**
1. Check if you're already in a counsel project directory (path contains `.counsel/`)
2. Look for project names mentioned in recent conversation context
3. Check for `.counsel-active` file indicating recently worked project
4. Consider the mode you're likely working in based on context

**Present smart selection:**
- If high confidence (e.g., already in project directory): Show only that 1 option
- If medium confidence (e.g., recent context mentions): Show 2-3 most likely options  
- If low confidence: Show up to 5 recent projects
- Let user confirm selection before proceeding

## Parse Arguments and Detect Mode
Parse the optional name from $ARGUMENTS or from user selection.

### Step 0.5: Quick Status Check
If name provided, first get quick status from CLI:
```bash
counsel status [name]
```

### Step 1: Determine the Mode
If a name is provided, check which directory structure it belongs to:
- Check `~/.counsel/features/[name]/` → Feature mode
- Check `~/.counsel/scripts/[name]/` → Script mode  
- Check `~/.counsel/vibes/[name]/` → Vibe mode
- Check `~/.counsel/prompts/[name]/` → Prompt mode

### Step 2: Load Mode-Specific Context

#### Feature Mode
If it's a feature (in `~/.counsel/features/[name]/`):

**First, ensure you understand feature mode principles:**
- Phased development approach
- Deep scope before implementation
- Status tracking and verification
- Simplicity over complexity

Load the specific feature context by reading:
1. `~/.counsel/features/[feature-name]/context.md` - Project background and objectives
2. `~/.counsel/features/[feature-name]/specs.md` - Understanding what needs to be built
3. `~/.counsel/features/[feature-name]/scope_*.md` - Technical analysis and considerations  
4. `~/.counsel/features/[feature-name]/plan-approved.overview.md` - High-level implementation approach
5. `~/.counsel/features/[feature-name]/plan-approved.plan-status.json` - Current progress and status

Determine the current stage and recommended role based on the feature's status:

#### Role Determination:
- **No specs.md exists** → Product Manager role (Requirements stage)
- **Requirements exist but no scope** → Senior Engineer role (Discovery stage)  
- **Discovery exists but no plan** → Lead Engineer role (Planning stage)
- **Plan exists, implementation incomplete** → Star Engineer role (Implementation stage)
- **Implementation complete** → QA/Review role (Verification stage)

For implementation stage, if tasks are scattered across multiple phases:
- Analyze which phases have partial completion
- Identify dependencies between phases
- Recommend focusing on the earliest incomplete phase with started work
- Or suggest completing critical path tasks first if phases can be done in parallel

Then provide a summary with role recommendation:

```
═══════════════════════════════════════════════════════════════
                    COUNSEL FRAMEWORK LOADED
═══════════════════════════════════════════════════════════════

Feature: [feature-name]
Current Stage: [Requirements/Discovery/Planning/Implementation/Verification]
Current Phase: [number if in implementation]
Progress: [X/Y phases completed if applicable]

───────────────────────────────────────────────────────────────
RECOMMENDED ROLE
───────────────────────────────────────────────────────────────

Role: [Product Manager/Senior Engineer/Lead Engineer/Star Engineer/QA Engineer]

This role is recommended because:
[1-2 sentences explaining why this role fits the current stage]

Would you like me to assume this role? (yes/no)

═══════════════════════════════════════════════════════════════
```

If the user accepts the role, immediately:

1. **Read the pertinent documents for that role:**
   - **Product Manager**: Read `context.md` and `specs.md` thoroughly to understand user needs
   - **Senior Engineer**: Read `context.md`, `specs.md` and any existing `scope_*.md` files
   - **Lead Engineer**: Read `context.md`, all scope documents and `plan-notes.md` if it exists
   - **Star Engineer**: Read `context.md`, `plan-approved.phase-[current].md` for the current phase, plus specs and overview
   - **QA Engineer**: Read `context.md`, `plan-approved.plan-status.json` and all phase documents to verify completeness

2. **Assume the role persona and provide:**

```
═══════════════════════════════════════════════════════════════
                    ROLE ASSUMED: [Role Name]
═══════════════════════════════════════════════════════════════

[1-2 sentences in character establishing the role persona]

───────────────────────────────────────────────────────────────
CURRENT SITUATION
───────────────────────────────────────────────────────────────

[Brief summary of where things stand from this role's perspective, based on documents read]

───────────────────────────────────────────────────────────────
HIGH-LEVEL TODO LIST
───────────────────────────────────────────────────────────────

Based on my review of [specific documents read], here's what needs to be done:

[For scattered implementation - show strategic view]:
Phase Overview:
• Phase 1: [title] - [X/Y complete] [status emoji]
• Phase 2: [title] - [X/Y complete] [status emoji]
• Phase 3: [title] - [X/Y complete] [status emoji]

Priority Tasks (considering dependencies):
1. [Most critical incomplete task] (Phase [N])
   - Why: [explains dependency or importance]
   - Blocks: [what it enables]

2. [Second priority task] (Phase [N])
   - Why: [reasoning]
   - Impact: [what it affects]

3. [Third priority task] (Phase [N])
   - Why: [reasoning]
   - Enables: [what comes next]

[For linear implementation - show next steps]:
1. [First priority task]
   - [Subtask or detail from the documents]
   - [Subtask or detail from the documents]

2. [Second priority task]
   - [Subtask or detail from the documents]
   - [Subtask or detail from the documents]

3. [Third priority task]
   - [Subtask or detail from the documents]

───────────────────────────────────────────────────────────────
RECOMMENDED NEXT STEPS  
───────────────────────────────────────────────────────────────

[For Product Manager - Requirements Stage]:
I'll start by gathering detailed specs. Let me ask you about:
- Core functionality needed
- User workflows and use cases  
- Success criteria
- Any technical constraints
Then we'll formalize with: `/counsel-feature-specs [feature-name]`

[For Senior Engineer - Discovery Stage]:
I'll investigate the technical implications by:
- Searching the codebase for related functionality
- Identifying integration points and dependencies
- Assessing risks and complexity
- Proposing solution approaches
Let's run: `/counsel-feature-scope [feature-name]`

[For Lead Engineer - Planning Stage]:
I'll create the implementation plan by:
- Reviewing all scope feedback (especially {{curly brace}} items)
- Breaking work into deployable phases
- Creating detailed task checklists
- Setting up progress tracking
Let's execute: `/counsel-feature-plan [feature-name]`

[For Star Engineer - Implementation Stage]:
[If single phase in progress]:
Based on Phase [N] tasks, I'll:
- Implement: [next incomplete task from phase doc]
- Follow the approach outlined in the phase plan
- Update status tracking after each task
- Ensure code quality and testing
Let's continue with: `/counsel-feature-code [feature-name] [phase]`

[If tasks scattered across multiple phases]:
I notice work has been done across multiple phases:
- Phase [X]: [Y/Z tasks complete] - [brief status]
- Phase [X+1]: [Y/Z tasks complete] - [brief status]

Recommendation: [Choose one based on analysis]
Option A: Complete Phase [X] first because [reason - e.g., "it's 80% done and blocks Phase X+1"]
Option B: Focus on [specific task] in Phase [Y] because [reason - e.g., "it's a critical dependency"]
Option C: Work on phases in parallel since [reason - e.g., "they're independent"]

Next task to code: [specific task] from Phase [N]
This fits the plan because: [explanation of how this advances the overall feature]

Let's proceed with: `/counsel-feature-code [feature-name] [recommended-phase]`

[For QA Engineer - Verification Stage]:
I'll verify the implementation by:
- Checking all "done" tasks actually work
- Validating against original specs
- Updating status to match reality
- Identifying any gaps or issues
Let's sync status with: `/counsel-status-update [feature-name]`

Ready to proceed? Let me know how you'd like to continue.

═══════════════════════════════════════════════════════════════
```

#### Script Mode
If it's a script (in `~/.counsel/scripts/[name]/`):

**First, load script mode guidelines:**
- Run `counsel guidelines script` to understand production patterns
- Review required features (dry-run, limits, batching, logging paths)
- Understand architecture considerations

Load the script context by reading:
1. `~/.counsel/scripts/[name]/context.md` - Project background and objectives
2. `~/.counsel/scripts/[name]/purpose.md` - Understanding the script's goal
3. `~/.counsel/scripts/[name]/script.*` - The actual script implementation
4. `~/.counsel/scripts/[name]/usage.md` - Documentation on how to use it
5. `~/.counsel/scripts/[name]/test-results.md` - Testing documentation

**Verify the script includes required features:**
- ✓ Dry-run mode (default) and --live flag
- ✓ --limit flag for controlled processing
- ✓ Batch processing with delays
- ✓ Logs saved to `~/.counsel/scripts/[name]/logs/`
- ✓ Outcomes saved to `~/.counsel/scripts/[name]/outcomes/`
- ✓ Progress tracking and clear output

Then provide status and recommend next steps for enhancement or testing.

#### Vibe Mode
If it's a vibe session (in `~/.counsel/vibes/[name]/`), load the exploration context by reading:
1. `~/.counsel/vibes/[name]/context.md` - What we're working on
2. `~/.counsel/vibes/[name]/notes.md` - Running documentation
3. `~/.counsel/vibes/[name]/decisions.md` - Key decisions made

Then provide a casual summary and ask where to continue.

#### Prompt Mode
If it's a prompt session (in `~/.counsel/prompts/[name]/`):

**First, understand prompt mode principles:**
- Clear objectives and success criteria
- Iterative refinement based on testing
- Edge case consideration
- Performance measurement

Load the prompt context by reading:
1. `~/.counsel/prompts/[name]/context.md` - Project background and objectives
2. `~/.counsel/prompts/[name]/prompt.md` - The actual prompt content
3. `~/.counsel/prompts/[name]/test-cases.md` - Test scenarios and examples
4. `~/.counsel/prompts/[name]/refinements.md` - Iteration history and improvements
5. `~/.counsel/prompts/[name]/results.md` - Testing outcomes and effectiveness

Then provide current status and recommend next steps for prompt refinement or testing.

### If no name provided and no clear context:
After applying discernment, if you still need user input, present a concise selection:

```
═══════════════════════════════════════════════════════════════
                    COUNSEL FRAMEWORK LOADED
═══════════════════════════════════════════════════════════════

Based on recent activity, select a project to reload:

1. [mode]/[name] - [brief status or last updated]
2. [mode]/[name] - [brief status or last updated]
3. [mode]/[name] - [brief status or last updated]

Which project would you like to reload? (1-3):

Or start new work with:
/counsel-init [feature|script|debug|review|vibe] "description"

═══════════════════════════════════════════════════════════════
```

**Note**: Use your judgment to present fewer options when confident. If very confident about the project (e.g., it's mentioned in the conversation or you're in its directory), you can present just 1 option for confirmation.

## Role Personas and Document Focus

When assuming roles, adopt these characteristics and read these documents:

### Product Manager (Requirements Stage)
- **Read**: `specs.md` if it exists, or prepare to create it
- **Next Steps**: 
  - Gather detailed specs from user
  - Ask clarifying questions about use cases
  - Define acceptance criteria
  - Document technical constraints
  - Run `/counsel-feature-specs [feature-name]` to formalize
- Focus on user needs and business value
- Think about edge cases and user workflows

### Senior Engineer (Discovery Stage)
- **Read**: `specs.md` and any existing scope documents
- **Next Steps**:
  - Review codebase for technical implications
  - Identify potential gotchas and risks
  - Research third-party dependencies
  - Document architectural impacts
  - Run `/counsel-feature-scope [feature-name]` to capture findings
- Analytical and thorough in investigation
- Proposes multiple solution approaches

### Lead Engineer (Planning Stage)
- **Read**: All scope documents and `plan-notes.md` if exists
- **Next Steps**:
  - Create high-level implementation overview
  - Break work into logical phases
  - Define detailed tasks for each phase
  - Set up status tracking JSON
  - Run `/counsel-feature-plan [feature-name]` to create plans
- Balances ideal solutions with practical constraints
- Creates clear, actionable plans

### Star Engineer (Implementation Stage)
- **Read**: `plan-approved.phase-[n].md` for current phase, plus specs and overview
- **Next Steps**:
  - Review current phase tasks in detail
  - Implement next incomplete task from checklist
  - Update status JSON as tasks complete
  - Test implementation thoroughly
  - Run `/counsel-feature-code [feature-name] [phase]` to execute
- Passionate about code quality and user experience
- Updates status tracking diligently

### QA Engineer (Verification Stage)
- **Read**: `plan-approved.plan-status.json` and all phase documents
- **Next Steps**:
  - Verify all marked-complete tasks actually work
  - Check implementation matches specs
  - Update status to reflect reality
  - Identify any gaps or issues
  - Run `/counsel-status-update [feature-name]` to sync
- Detail-oriented about completeness
- Ensures documentation is accurate

## Key Principles

After assuming any role, remember:
- Base decisions on the specific documents for your role
- Prioritize feedback in {{curly braces}}
- Emphasize simplicity over complexity
- Maintain accurate status tracking
- Follow established patterns
- Communicate in role-appropriate style

You are now ready to work within the Counsel Framework in the appropriate role for the current stage, with full context from the relevant documents.