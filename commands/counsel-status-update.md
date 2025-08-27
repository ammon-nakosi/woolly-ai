---
description: "Update the development status of a feature based on actual implementation"
argument-hint: "feature-name"
---

You are a project manager updating the status of a feature implementation. Parse the argument as the feature name from $ARGUMENTS. If no feature name is provided, list available features in the ~/.counsel/features directory and ask which one to update.

Use a general-purpose subagent to thoroughly investigate and update the feature status. The subagent should do deep research into both the planning documents and the actual codebase to provide an accurate status update.

Instruct the subagent to follow this workflow to update the status:

## 1. Read Current Plan Status
First, read the file at `~/.counsel/features/[feature-name]/plan-approved.plan-status.json` to understand the current status and phase structure.

## 2. Analyze Implementation Reality
Thoroughly examine the codebase to determine what has actually been implemented:
- Search for all files, functions, and components mentioned in the plan
- Check for test files that indicate feature completion
- Look for integration points with existing code
- Review recent commits related to the feature
- Identify any unplanned work that was completed

## 3. Review Phase Documents
For each phase, read the `~/.counsel/features/[feature-name]/plan-approved.phase-[n].md` files to understand the detailed tasks and map them to actual implementation.

## 4. Determine Accurate Status
For each task in the JSON status file:
- Verify if it's actually completed by finding the implementation
- Check if work is partially done (should be "doing")
- Identify tasks that haven't been started ("to-do")
- Note any tasks that were skipped or canceled with reasons

## 5. Update the Status JSON

Update the `~/.counsel/features/[feature-name]/plan-approved.plan-status.json` file with accurate statuses:

### Status Definitions:
- **"to-do"**: Task not yet started, no implementation found
- **"doing"**: Task partially complete, some implementation exists
- **"done"**: Task fully implemented and working
- **"skipped"**: Task intentionally not done (add notes explaining why)
- **"canceled"**: Task no longer needed (add notes explaining why)

### Update Format:
```json
{
  "project": "[project name]",
  "totalPhases": [number],
  "lastUpdated": "[ISO date string]",
  "updateNotes": "[Brief summary of what was updated and why]",
  "phases": [
    {
      "phaseNumber": [number],
      "title": "[phase title]",
      "status": "[to-do|doing|done]",
      "checklist": [
        {
          "id": "[unique-id]",
          "category": "[category]",
          "description": "[task description]",
          "status": "[to-do|doing|done|skipped|canceled]",
          "priority": "[high|medium|low]",
          "implementationDetails": "[Where this is implemented if done]",
          "notes": "[Any relevant notes about status]"
        }
      ],
      "completionNotes": "[Summary of phase status]"
    }
  ]
}
```

## 6. Generate Update Report

After updating, provide a summary in this format:

```
═══════════════════════════════════════════════════════════════
                    STATUS UPDATE COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Updated: [timestamp]

───────────────────────────────────────────────────────────────
CHANGES MADE
───────────────────────────────────────────────────────────────

Status Updates:
• [Task] changed from [old status] → [new status]
  Reason: [Brief explanation]
• [Task] changed from [old status] → [new status]
  Reason: [Brief explanation]

───────────────────────────────────────────────────────────────
VERIFICATION SUMMARY
───────────────────────────────────────────────────────────────

✅ Confirmed Implementations:
• [Task] - Found in [file/location]
• [Task] - Found in [file/location]

⚠️ Discrepancies Found:
• [Task marked as done but not found]
• [Implementation found but not in plan]

───────────────────────────────────────────────────────────────
NEW STATUS OVERVIEW
───────────────────────────────────────────────────────────────

Phase Progress:
• Phase 1: [X/Y tasks] - [status]
• Phase 2: [X/Y tasks] - [status]
• Phase 3: [X/Y tasks] - [status]

Overall: [X/Y total tasks completed]

═══════════════════════════════════════════════════════════════
```

## 7. Special Handling

- If no plan-status.json exists, create one based on the phase documents
- Add "implementationDetails" field to tasks marked as done (file paths, function names)
- Add "lastUpdated" timestamp to track when status was last verified
- If implementation is found that's not in the plan, add it as a new task marked as "done" with a note
- Preserve any existing notes and only update/add to them

## Task Delegation

Launch a general-purpose subagent with the above instructions to perform the detailed status analysis and update. The subagent should:
- Have access to read all planning documents in the ~/.counsel/features directory
- Search through the entire codebase to verify implementation
- Compare planned vs actual work completed
- Update the plan-status.json file with accurate information
- Return a comprehensive update report

Wait for the subagent to complete its analysis and update, then present the formatted update report to the user.

Always ask for user confirmation before saving the updated status file, showing a diff of the changes.