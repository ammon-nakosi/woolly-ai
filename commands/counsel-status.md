---
description: "Check the development status of a feature and get upcoming tasks"
argument-hint: "feature-name"
---

You are a project manager checking the status of a feature implementation. Parse the argument as the feature name from $ARGUMENTS. If no feature name is provided, list available features in the .features directory and ask which one to check.

Use a general-purpose subagent to thoroughly investigate the feature status. The subagent should do deep research into both the planning documents and the actual codebase to provide an accurate assessment.

Instruct the subagent to follow this workflow to provide an accurate status report:

## 1. Read the Plan Status
First, read the file at `.features/[feature-name]/plan-approved.plan-status.json` to understand the official status and phase structure.

## 2. Verify Implementation Status
Cross-check the reported status by:
- Examining the actual codebase to see what has been implemented
- Looking for relevant files, functions, and components mentioned in the plan
- Checking for any test files or documentation that indicates completion
- Reading commit messages if necessary to understand recent work

## 3. Review Phase Details
For the current phase and next phase, read the relevant `.features/[feature-name]/plan-approved.phase-[n].md` files to understand the detailed tasks and requirements.

## 4. Generate Status Report

Provide the status in this format:

```
═══════════════════════════════════════════════════════════════
                    FEATURE STATUS REPORT
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Phase: [number]
Overall Progress: [X/Y phases completed]

───────────────────────────────────────────────────────────────
CURRENT PHASE STATUS
───────────────────────────────────────────────────────────────

Phase [N]: [Phase Title]
Status: [doing/to-do/done]
Progress: [X/Y tasks completed]

✅ Completed Tasks:
• [Task description] 
• [Task description]

🔄 In Progress:
• [Current task being worked on]
  └─ [Specific subtask or detail if applicable]

⏳ Remaining in This Phase:
• [Task description]
• [Task description]

───────────────────────────────────────────────────────────────
IMPLEMENTATION VERIFICATION
───────────────────────────────────────────────────────────────

[Brief verification of what's actually been implemented vs what the status JSON says]

Files Created/Modified:
• [file path] - [brief description]
• [file path] - [brief description]

[Any discrepancies between plan status and actual implementation]

───────────────────────────────────────────────────────────────
UPCOMING WORK
───────────────────────────────────────────────────────────────

Next 5 Priority Tasks:
1. [Task] (Phase [N])
2. [Task] (Phase [N])
3. [Task] (Phase [N])
4. [Task] (Phase [N])
5. [Task] (Phase [N])

───────────────────────────────────────────────────────────────
NEXT STEPS
───────────────────────────────────────────────────────────────

[2-3 sentence actionable description of what should be done next, including any blockers or decisions needed]

═══════════════════════════════════════════════════════════════
```

## 5. Special Cases

- If no plan-status.json exists, check for any planning documents and report that formal planning needs to be completed
- If there are discrepancies between the plan status and actual implementation, highlight them clearly
- If a phase is marked complete but implementation is missing, note this as a critical issue
- If implementation exists that isn't in the plan, note it as "unplanned work completed"

Always be thorough in verification - don't just trust the JSON status, actually check the codebase to confirm what's been done.

## Task Delegation

Launch a general-purpose subagent with the above instructions to perform the detailed status analysis. The subagent should:
- Have access to read all planning documents in the .features directory
- Search through the codebase to verify implementation
- Compare planned vs actual work completed
- Return a comprehensive status report in the format specified above

Wait for the subagent to complete its analysis and then present the formatted status report to the user.

## CLI Integration Tips

After presenting the status report, include helpful CLI commands:
```
💡 CLI Commands:
  • Quick status: counsel status [feature-name]
  • List all work: counsel list --mode feature
  • Search patterns: counsel search "[topic]"
  • Check Linear tickets: counsel linear
```