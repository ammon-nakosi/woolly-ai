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

## CLI Integration: Check Available Work
If no name provided, use the Counsel CLI to show available work:
```bash
counsel list --recent --limit 10
```

## Parse Arguments and Detect Mode
Parse the optional name from $ARGUMENTS.

### Step 0.5: Quick Status Check
If name provided, first get quick status from CLI:
```bash
counsel status [name]
```

### Step 1: Determine the Mode
If a name is provided, check which directory structure it belongs to:
- Check `~/.counsel/features/[name]/` → Feature mode
- Check `~/.counsel/scripts/[name]/` → Script mode  
- Check `~/.counsel/debugs/[name]/` → Debug mode
- Check `~/.counsel/reviews/[name]/` → Review mode
- Check `~/.counsel/vibes/[name]/` → Vibe mode
- Check `~/.counsel/prompts/[name]/` → Prompt mode

### Step 2: Load Mode-Specific Context

#### Feature Mode
If it's a feature (in `~/.counsel/features/[name]/`):

**First, ensure you understand feature mode principles:**
- Phased development approach
- Deep discovery before implementation
- Status tracking and verification
- Simplicity over complexity

Load the specific feature context by reading:
1. `~/.counsel/features/[feature-name]/requirements.md` - Understanding what needs to be built
2. `~/.counsel/features/[feature-name]/discovery_*.md` - Technical analysis and considerations  
3. `~/.counsel/features/[feature-name]/plan-approved.overview.md` - High-level implementation approach
4. `~/.counsel/features/[feature-name]/plan-approved.plan-status.json` - Current progress and status

Determine the current stage and recommended role based on the feature's status:

#### Role Determination:
- **No requirements.md exists** → Product Manager role (Requirements stage)
- **Requirements exist but no discovery** → Senior Engineer role (Discovery stage)  
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
   - **Product Manager**: Read `requirements.md` thoroughly to understand user needs
   - **Senior Engineer**: Read `requirements.md` and any existing `discovery_*.md` files
   - **Lead Engineer**: Read all discovery documents and `plan-notes.md` if it exists
   - **Star Engineer**: Read `plan-approved.phase-[current].md` for the current phase, plus requirements and overview
   - **QA Engineer**: Read `plan-approved.plan-status.json` and all phase documents to verify completeness

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
I'll start by gathering detailed requirements. Let me ask you about:
- Core functionality needed
- User workflows and use cases  
- Success criteria
- Any technical constraints
Then we'll formalize with: `/counsel-feature-requirements [feature-name]`

[For Senior Engineer - Discovery Stage]:
I'll investigate the technical implications by:
- Searching the codebase for related functionality
- Identifying integration points and dependencies
- Assessing risks and complexity
- Proposing solution approaches
Let's run: `/counsel-feature-discovery [feature-name]`

[For Lead Engineer - Planning Stage]:
I'll create the implementation plan by:
- Reviewing all discovery feedback (especially {{curly brace}} items)
- Breaking work into deployable phases
- Creating detailed task checklists
- Setting up progress tracking
Let's execute: `/counsel-feature-planning [feature-name]`

[For Star Engineer - Implementation Stage]:
[If single phase in progress]:
Based on Phase [N] tasks, I'll:
- Implement: [next incomplete task from phase doc]
- Follow the approach outlined in the phase plan
- Update status tracking after each task
- Ensure code quality and testing
Let's continue with: `/counsel-feature-implement [feature-name] [phase]`

[If tasks scattered across multiple phases]:
I notice work has been done across multiple phases:
- Phase [X]: [Y/Z tasks complete] - [brief status]
- Phase [X+1]: [Y/Z tasks complete] - [brief status]

Recommendation: [Choose one based on analysis]
Option A: Complete Phase [X] first because [reason - e.g., "it's 80% done and blocks Phase X+1"]
Option B: Focus on [specific task] in Phase [Y] because [reason - e.g., "it's a critical dependency"]
Option C: Work on phases in parallel since [reason - e.g., "they're independent"]

Next task to implement: [specific task] from Phase [N]
This fits the plan because: [explanation of how this advances the overall feature]

Let's proceed with: `/counsel-feature-implement [feature-name] [recommended-phase]`

[For QA Engineer - Verification Stage]:
I'll verify the implementation by:
- Checking all "done" tasks actually work
- Validating against original requirements
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
1. `~/.counsel/scripts/[name]/purpose.md` - Understanding the script's goal
2. `~/.counsel/scripts/[name]/script.*` - The actual script implementation
3. `~/.counsel/scripts/[name]/usage.md` - Documentation on how to use it
4. `~/.counsel/scripts/[name]/test-results.md` - Testing documentation

**Verify the script includes required features:**
- ✓ Dry-run mode (default) and --live flag
- ✓ --limit flag for controlled processing
- ✓ Batch processing with delays
- ✓ Logs saved to `~/.counsel/scripts/[name]/logs/`
- ✓ Outcomes saved to `~/.counsel/scripts/[name]/outcomes/`
- ✓ Progress tracking and clear output

Then provide status and recommend next steps for enhancement or testing.

#### Debug Mode  
If it's a debug session (in `~/.counsel/debugs/[name]/`):

**First, understand debug mode principles:**
- Systematic investigation approach
- Clear reproduction steps
- Root cause analysis before fixing
- Verification of fixes

Load the debug context by reading:
1. `~/.counsel/debugs/[name]/issue.md` - Problem description
2. `~/.counsel/debugs/[name]/reproduction.md` - How to reproduce
3. `~/.counsel/debugs/[name]/investigation.md` - What's been tried
4. `~/.counsel/debugs/[name]/diagnosis.md` - Root cause analysis
5. `~/.counsel/debugs/[name]/fix.md` - Solution implemented

Then provide current debug status and recommend investigation or fix steps.

#### Review Mode
If it's a review session (in `~/.counsel/reviews/[name]/`):

**First, understand review mode principles:**
- Systematic evaluation against criteria
- Constructive feedback focus
- Clear recommendations
- Actionable improvements

Load the review context by reading:
1. `~/.counsel/reviews/[name]/scope.md` - What's being reviewed and criteria
2. `~/.counsel/reviews/[name]/findings.md` - Issues and observations
3. `~/.counsel/reviews/[name]/recommendations.md` - Suggested improvements
4. `~/.counsel/reviews/[name]/approval.md` - Final decision if exists

If reviewing counsel work, also load the original work:
- For feature reviews: load from `~/.counsel/features/[target]/`
- For script reviews: load from `~/.counsel/scripts/[target]/` and verify against `docs/SCRIPT-MODE-GUIDELINES.md`
- For debug reviews: load from `~/.counsel/debugs/[target]/`

Then provide review status and next review steps.

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
1. `~/.counsel/prompts/[name]/purpose.md` - Understanding the prompt's goal
2. `~/.counsel/prompts/[name]/prompt.md` - The actual prompt content
3. `~/.counsel/prompts/[name]/test-cases.md` - Test scenarios and examples
4. `~/.counsel/prompts/[name]/refinements.md` - Iteration history and improvements
5. `~/.counsel/prompts/[name]/results.md` - Testing outcomes and effectiveness

Then provide current status and recommend next steps for prompt refinement or testing.

### If no name provided:
List available work across all modes and provide framework overview:

```
═══════════════════════════════════════════════════════════════
                    COUNSEL FRAMEWORK LOADED
═══════════════════════════════════════════════════════════════

The Counsel Framework supports multiple work modes.

## Available Work

### Features (~/.counsel/features/)
[List all directories in ~/.counsel/features/ with status]
• [feature-1]: Phase [N] - [Status]
• [feature-2]: Phase [N] - [Status]

### Scripts (~/.counsel/scripts/)
[List all directories in ~/.counsel/scripts/]
• [script-1]: [Purpose if known]
• [script-2]: [Purpose if known]

### Debug Sessions (~/.counsel/debugs/)
[List all directories in ~/.counsel/debugs/]
• [issue-1]: [Status]
• [issue-2]: [Status]

### Review Sessions (~/.counsel/reviews/)
[List all directories in ~/.counsel/reviews/]
• [review-1]: [Target] - [Status]
• [review-2]: [Target] - [Status]

### Vibe Sessions (~/.counsel/vibes/)
[List all directories in ~/.counsel/vibes/]

### Prompt Engineering (~/.counsel/prompts/)
[List all directories in ~/.counsel/prompts/]
• [session-1]: [Topic]
• [session-2]: [Topic]

## Commands

To start new work:
/counsel-init [feature|script|debug|review|vibe] "description"

To continue existing work:
/counsel-reload [name]

═══════════════════════════════════════════════════════════════
```

## Role Personas and Document Focus

When assuming roles, adopt these characteristics and read these documents:

### Product Manager (Requirements Stage)
- **Read**: `requirements.md` if it exists, or prepare to create it
- **Next Steps**: 
  - Gather detailed requirements from user
  - Ask clarifying questions about use cases
  - Define acceptance criteria
  - Document technical constraints
  - Run `/counsel-feature-requirements [feature-name]` to formalize
- Focus on user needs and business value
- Think about edge cases and user workflows

### Senior Engineer (Discovery Stage)
- **Read**: `requirements.md` and any existing discovery documents
- **Next Steps**:
  - Review codebase for technical implications
  - Identify potential gotchas and risks
  - Research third-party dependencies
  - Document architectural impacts
  - Run `/counsel-feature-discovery [feature-name]` to capture findings
- Analytical and thorough in investigation
- Proposes multiple solution approaches

### Lead Engineer (Planning Stage)
- **Read**: All discovery documents and `plan-notes.md` if exists
- **Next Steps**:
  - Create high-level implementation overview
  - Break work into logical phases
  - Define detailed tasks for each phase
  - Set up status tracking JSON
  - Run `/counsel-feature-planning [feature-name]` to create plans
- Balances ideal solutions with practical constraints
- Creates clear, actionable plans

### Star Engineer (Implementation Stage)
- **Read**: `plan-approved.phase-[n].md` for current phase, plus requirements and overview
- **Next Steps**:
  - Review current phase tasks in detail
  - Implement next incomplete task from checklist
  - Update status JSON as tasks complete
  - Test implementation thoroughly
  - Run `/counsel-feature-implement [feature-name] [phase]` to execute
- Passionate about code quality and user experience
- Updates status tracking diligently

### QA Engineer (Verification Stage)
- **Read**: `plan-approved.plan-status.json` and all phase documents
- **Next Steps**:
  - Verify all marked-complete tasks actually work
  - Check implementation matches requirements
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