---
description: "Create detailed engineering implementation plan for a feature"
argument-hint: "feature-name"
---

You are a lead engineer and you are very experienced at planning engineering implementations, calculating how many resources it would take, assigning it to your engineers, and guiding their work.

Parse the argument as the feature name from $ARGUMENTS. If no feature name is provided, suggest which feature this is for based on context and wait for user confirmation.

Now it is time to thoroughly plan out the engineering implementation. First read the requirements at @.features/[feature-name]/requirements.md to understand the end goal. Then thoroughly review all of the discovery based on the discovery files in @.features/[feature-name] directory and any other pertinent files in the .features directory. All feedback and answers to the questions in the discovery files are in curly braces like this {{}}. You must pay close attention to feedback in curly braces and make sure to address it. When addressing the discovery documents, first group similar concepts, then prioritize addressing the ones that were responded to, then you're free to use your expertise and coding wisdom to figure out what you should actually implement, but even if you decide it's not best to go with the suggestions in the curly braces, make sure to highlight that in the planning document. There also may be a plan-notes.md document. If it exists, these are direct notes. Make sure to address it.

You must use your discernment when it comes to which parts of the discovery to focus on and use your own outside knowledge and wisdom to decide what to focus on and how to best execute, and which parts of the discovery are most important, but you must prioritize understanding and addressing feedback in the discovery files where it exists. You must thoroughly review the codebase to get an accurate assessment of viability. Now think very deeply about the best engineering implementation plan after considering multiple approaches. You heavily emphasize simplicity as opposed to creating custom solutions. You are very familiar with typescript and you pride yourself on type safety. Also be sure to review your memory in the CLAUDE.md files.

You will first layout the high level plan. Once we agree on this high level plan, you will store it to @.features/[feature-name]/plan-approved.overview.md. Once we complete this, you will then ask for approval to actually plan out the phases.

You will then create a detailed plan for each phase. Assign a phase to each sub agent and make sure they do deep research and deep thinking to create a detailed plan that will be simple, thorough, and elegant. These sub agents should run in parallel. Each of these sub agents will store the respective plan in plan-approved.phase-[n].md. Each sub agent should not make mention of the actual phase number in the md file itself, because if there are any changes to the phase order, it's easier if we don't have to come through the file and change the phase numbers. Make sure the sub agents give it their all. Each phase document should include a high level checklist at the top. This will later be used to create a json out of these checklists.

Once this is complete, you will then move on to creating a json file that stores the status. You will take the checklist from each of the plan-approved.phase-[n].md files and create a plan-approved.plan-status.json. Each phase should have a status and each phase task should also have a status. The possible statuses are "to-do", "doing", "done", "skipped", "canceled". It should look similar to this:

```json
{
  "project": "xyz project",
  "totalPhases": 7,
  "phases": [
    {
      "phaseNumber": 1,
      "title": "JUCE Integration & Validation",
      "status": "completed",
      "checklist": [
        {
          "id": "phase1-001",
          "category": "High-Level Deliverables",
          "description": "JUCE framework successfully integrated into Android build system",
          "status": "completed",
          "priority": "high"
        },
        {
          "id": "phase1-002",
          "category": "High-Level Deliverables",
          "description": "Basic audio I/O validation with test tone generation",
          "status": "completed",
          "priority": "high"
        },
        {
          "id": "phase1-003",
          "category": "High-Level Deliverables",
          "description": "Latency measurements on 3+ reference devices (Pixel, Samsung, OnePlus)",
          "status": "postponed",
          "priority": "high"
        },
        {
          "id": "phase1-004",
          "category": "High-Level Deliverables",
          "description": "Binary size impact assessment with APK analysis",
          "status": "completed",
          "notes": "JUCE adds ~8.5MB per architecture (stripped). Total APK: 342MB (debug build with all architectures). Acceptable given JUCE's comprehensive DSP capabilities.",
          "priority": "high"
        },
        {
          "id": "phase1-005",
          "category": "High-Level Deliverables",
          "description": "Performance benchmarking suite implementation",
          "status": "canceled",
          "notes": "Adds unnecessary overhead for unknown rewards - could introduce latency in critical audio path",
          "priority": "high"
        },
        {
          "id": "phase1-006",
          "category": "High-Level Deliverables",
          "description": "Build time optimization (< 2 minutes incremental)",
          "status": "postponed",
          "notes": "Current build times are acceptable for development productivity; optimization can be revisited if builds become a bottleneck",
          "priority": "medium"
        },
        {
          "id": "phase1-007",
          "category": "High-Level Deliverables",
          "description": "Documentation of build process for AI-assisted development",
          "status": "completed",
          "priority": "medium"
        },
        {
          "id": "phase1-008",
          "category": "High-Level Deliverables",
          "description": "Go/No-Go decision document with recommendations",
          "status": "completed",
          "notes": "Recommendation: GO. Custom Oboe+JUCE hybrid architecture successfully validated. Implemented custom Oboe audio backend to bypass JUCE AudioDeviceManager crashes in React Native. See phase0-go-no-go-decision.md for full details.",
          "priority": "high"
        }
      ],
      "completionNotes": "Phase 1 completed successfully with a custom architecture solution. Instead of using JUCE's AudioDeviceManager (which crashes when accessing Android system services from React Native's shared library context), we implemented a custom Oboe backend for audio I/O while keeping JUCE for DSP processing. This hybrid approach provides low-latency audio via Oboe and professional DSP capabilities via JUCE without JNI crashes."
    }
  ]
}
```

Now start the process. Give it your all and don't hold back.