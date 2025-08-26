---
description: "Quick status check of a feature based on plan JSON only"
argument-hint: "feature-name"
---

You are checking the quick status of a feature implementation. Parse the argument as the feature name from $ARGUMENTS. If no feature name is provided, list available features in the .features directory and ask which one to check.

This is a lightweight status check that only reads from the plan status JSON file without verification.

## Workflow

1. Read the file at `.features/[feature-name]/plan-approved.plan-status.json`
2. Parse the current phase and task statuses
3. Calculate progress metrics
4. Present a concise status report

## Status Report Format

Provide the status in this format:

```
═══════════════════════════════════════════════════════════════
                    FEATURE STATUS (QUICK)
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Phase: [number]
Task: [Current task description or "All tasks completed" if phase is done]

───────────────────────────────────────────────────────────────

Summary of completed work:
• Phase 1: [X/Y tasks] - [status]
  - [Brief description of what phase covers]
• Phase 2: [X/Y tasks] - [status]  
  - [Brief description of what phase covers]
• Phase 3: [X/Y tasks] - [status]
  - [Brief description of what phase covers]

───────────────────────────────────────────────────────────────

Upcoming tasks: (next 5)
1. [Task description] (Phase [number])
2. [Task description] (Phase [number])
3. [Task description] (Phase [number])
4. [Task description] (Phase [number])
5. [Task description] (Phase [number])

───────────────────────────────────────────────────────────────

Next steps:
[2-3 sentence description of what should be done next based on the current phase and remaining tasks]

═══════════════════════════════════════════════════════════════
```

## Important Notes

- This is a QUICK status check - do not verify implementation
- Only read from the plan-status.json file
- If the JSON file doesn't exist, report that formal planning needs to be completed
- For "Task:" field, show the current task marked as "doing", or if none, show the next "to-do" task
- If all tasks in current phase are done, show "All tasks completed" and indicate moving to next phase
- Keep the response concise and fast

Do not use subagents for this command - directly read the JSON and format the response.