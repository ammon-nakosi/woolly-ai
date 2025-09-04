# The Woolly Framework

## Overview

The Woolly Framework is a structured approach for organized development work that supports multiple modes: feature development, script creation, debugging, review processes, and vibe exploration. It guides projects through appropriate workflows using specialized slash commands and organized documentation, providing a systematic way for AI agents to collaborate on various software engineering tasks while maintaining consistency and tracking progress.

## Core Philosophy

The framework emphasizes:
- **Phased Development**: Breaking features into manageable phases with clear deliverables
- **Deep Discovery**: Thorough investigation before implementation to avoid costly mistakes
- **Status Tracking**: Real-time visibility into what's planned vs what's actually implemented
- **Simplicity**: Choosing elegant solutions over complex engineering
- **Verification**: Continuous validation that implementation matches plan

## Woolly Modes

The framework supports four distinct modes for different types of work:

### 1. Feature Mode
**Purpose**: Full feature development lifecycle  
**Directory**: `.features/{feature-name}/`  
**Workflow**: Specs → Scope → Plan → Code → Verification  
**Use Cases**: New features, major enhancements, complex functionality

### 2. Script Mode
**Purpose**: Quick automation scripts and utilities with proper logging  
**Directory**: `.scripts/{script-name}/`  
**Workflow**: Purpose → Implementation → Testing → Documentation  
**Use Cases**: Automation tasks, CLI tools, data processing scripts  
**Key Principle**: All script executions MUST use `tee` to simultaneously display output and save to log files

### 3. Debug Mode
**Purpose**: Systematic debugging and issue resolution  
**Directory**: `.debug/{issue-name}/`  
**Workflow**: Reproduce → Investigate → Diagnose → Fix → Verify  
**Use Cases**: Bug fixes, performance issues, error tracking

### 4. Review Mode
**Purpose**: Systematic review of code, features, or architecture  
**Directory**: `.review/{review-name}/`  
**Workflow**: Scope → Examine → Document → Recommend → Decide  
**Use Cases**: Code review, PR review, security audit, reviewing completed woolly work

### 5. Vibe Mode
**Purpose**: Flexible, exploratory work  
**Directory**: `.vibe/{session-name}/`  
**Workflow**: Context → Work → Document  
**Use Cases**: Research, refactoring, prototyping, learning

## Directory Structure

Work is organized by mode:

```
Project Root/
├── .features/          # Feature development
│   └── {feature-name}/
│       ├── specs.md                          # Initial feature specifications
│       ├── scope_*.md                        # Scoping documents from different agents
│       ├── plan-notes.md                      # Direct implementation notes (optional)
│       ├── plan-approved.overview.md          # High-level implementation plan
│       ├── plan-approved.phase-1.md           # Detailed plan for Phase 1
│       ├── plan-approved.phase-2.md           # Detailed plan for Phase 2
│       ├── plan-approved.phase-N.md           # Additional phase plans
│       └── plan-approved.plan-status.json     # Current implementation status
├── .scripts/           # Script automation
│   └── {script-name}/
│       ├── purpose.md                         # Script purpose and specs
│       ├── script.{ext}                       # The actual script
│       ├── test-results.md                    # Testing documentation
│       └── usage.md                           # Usage instructions
├── .debug/             # Debug sessions
│   └── {issue-name}/
│       ├── issue.md                           # Problem description
│       ├── reproduction.md                    # Steps to reproduce
│       ├── investigation.md                   # Investigation notes
│       ├── diagnosis.md                       # Root cause analysis
│       ├── fix.md                            # Solution implemented
│       └── verification.md                    # Fix verification
├── .review/            # Review sessions
│   └── {review-name}/
│       ├── scope.md                           # What's being reviewed and criteria
│       ├── findings.md                        # Issues and observations
│       ├── recommendations.md                 # Suggested improvements
│       └── approval.md                        # Final decision (optional)
└── .vibe/              # Vibe exploration
    └── {session-name}/
        ├── context.md                         # Session context
        ├── notes.md                           # Running notes
        └── decisions.md                       # Key decisions
```

## Creating Work (`/woolly-create`)

Start any new work with the create command:

```bash
/woolly-create [mode] "brief description"
```

The command will:
1. Suggest an appropriate name based on your description
2. Create the directory structure for the chosen mode
3. Guide you to the next appropriate step

Examples:
- `/woolly-create feature "add user authentication"`
- `/woolly-create script "automate deployment process"`
- `/woolly-create debug "fix memory leak in chat component"`
- `/woolly-create review "review authentication feature"`
- `/woolly-create vibe "explore GraphQL migration"`

## Feature Mode Workflow

### 1. Specifications Gathering (`/woolly-feature specs`)
**Purpose**: Define what needs to be built

- Captures feature specifications from stakeholder input
- Asks clarifying questions to ensure completeness
- Searches codebase for relevant context
- Creates structured specifications document
- **Output**: `specs.md` with clear feature specification

### 2. Scoping & Discovery (`/woolly-feature scope`)
**Purpose**: Understand technical implications and complexity

- Reviews specifications and existing codebase thoroughly
- Identifies potential gotchas and technical challenges
- Evaluates architectural impacts and dependencies
- Proposes solutions and alternatives
- Asks critical questions about implementation approach
- **Output**: `scope_{model_name}.md` with technical analysis

### 3. Planning (`/woolly-feature plan`)
**Purpose**: Create detailed implementation roadmap

**Phase 1: High-Level Planning**
- Reviews specifications and scoping documents
- Prioritizes feedback in curly braces {{like this}}
- Creates overview of implementation approach
- **Output**: `plan-approved.overview.md`

**Phase 2: Detailed Phase Planning**
- Launches parallel subagents for each phase
- Creates detailed task breakdowns with checklists
- Emphasizes simplicity and type safety
- **Output**: `plan-approved.phase-N.md` for each phase

**Phase 3: Status Tracking Setup**
- Consolidates checklists from all phases
- Creates JSON structure for progress tracking
- **Output**: `plan-approved.plan-status.json`

### 4. Coding (`/woolly-feature code`)
**Purpose**: Execute the planned work

- Implements specific phase following approved plan
- Reviews specifications and overall plan for context
- Can suggest modifications to approach if needed
- Updates status JSON as tasks are completed
- Emphasizes quality and user experience
- **Input**: Feature name and phase number
- **Updates**: `plan-approved.plan-status.json` as work progresses

### 5. Status Management

#### Quick Status Check (`/woolly-status-light`)
**Purpose**: Fast overview from JSON only

- Reads plan-status.json without verification
- Shows current phase and task
- Lists upcoming work
- No codebase validation
- **Speed**: Instant response

#### Full Status Verification (`/woolly-status`)
**Purpose**: Comprehensive status with validation

- Launches subagent for deep investigation
- Verifies actual coding vs planned
- Identifies discrepancies
- Provides detailed progress report
- **Accuracy**: Validates against actual code

#### Status Update (`/woolly-status-update`)
**Purpose**: Synchronize status with reality

- Launches subagent to scan entire codebase
- Updates task statuses based on actual coding
- Adds implementation details and notes
- Shows diff before saving changes
- **Maintenance**: Keeps tracking accurate

## Status Definitions

The framework uses these standard statuses:

- **`to-do`**: Task not yet started
- **`doing`**: Task in progress/partially complete
- **`done`**: Task fully implemented and working
- **`skipped`**: Intentionally not implemented (with reason)
- **`canceled`**: No longer needed (with reason)

## JSON Status Structure

```json
{
  "project": "Project Name",
  "totalPhases": 3,
  "lastUpdated": "2024-08-25T18:00:00Z",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase Title",
      "status": "done|doing|to-do",
      "checklist": [
        {
          "id": "phase1-001",
          "category": "Category Name",
          "description": "Task description",
          "status": "done|doing|to-do|skipped|canceled",
          "priority": "high|medium|low",
          "implementationDetails": "Where/how coded",
          "notes": "Additional context"
        }
      ],
      "completionNotes": "Summary of phase status"
    }
  ]
}
```

## Best Practices

### For Specifications
- Be specific about user needs
- Include acceptance criteria
- Note technical constraints
- Reference existing functionality

### For Scoping
- Search extensively through codebase
- Consider edge cases and failure modes
- Identify dependencies and impacts
- Propose multiple solution approaches

### For Planning
- Break work into logical phases
- Keep phases independently deployable
- Create specific, measurable tasks
- Prioritize simplicity over complexity

### For Coding
- Follow established codebase patterns
- Maintain type safety
- Update status as you progress
- Test thoroughly before marking complete

### For Status Tracking
- Update immediately after completing tasks
- Add coding details for future reference
- Note any deviations from plan
- Keep status JSON as source of truth

## Feedback Convention

Throughout the framework, feedback and answers to questions are provided in curly braces:

```
{{This is user feedback that must be addressed}}
```

Agents must prioritize addressing this feedback during plan and coding.

## Subagent Usage

The framework leverages specialized subagents for complex tasks:
- Planning phases run parallel subagents for efficiency
- Status checks use general-purpose agents for thorough investigation
- Each subagent receives specific instructions for their task
- Results are consolidated and presented in standardized formats

## Success Criteria

A well-executed Woolly workflow results in:
1. Clear specifications understood by all parties
2. Thorough scoping preventing surprises during coding
3. Practical plans that balance ideal and pragmatic approaches
4. Consistent coding following established patterns
5. Accurate status tracking enabling informed decisions
6. Completed features that meet user needs elegantly

## Getting Started

### Starting New Work

Begin any type of work with:
```bash
/woolly-create [mode] "description"
```

Where mode is one of:
- `feature` - For new features requiring full development lifecycle
- `script` - For automation scripts and utilities
- `debug` - For systematic debugging of issues
- `review` - For reviewing code, PRs, or woolly work
- `vibe` - For exploratory work and research

### Continuing Existing Work

Load context for any existing work:
```bash
/woolly-reload [name]
```

This will:
1. Detect the mode from the directory structure
2. Load relevant documents and status
3. Recommend the appropriate role to assume
4. Provide next steps based on current progress

### Feature Development Example

```bash
# Start a new feature
/woolly-create feature "add dark mode"
# → Creates .features/dark-mode/

# Gather specifications
/woolly-feature specs dark-mode

# Technical scoping
/woolly-feature scope dark-mode

# Create implementation plan
/woolly-feature plan dark-mode

# Code Phase 1
/woolly-feature code dark-mode 1

# Check status anytime
/woolly-status dark-mode
```

### Quick Script Example

```bash
# Start a new script
/woolly-create script "database backup automation"
# → Creates .scripts/db-backup/
# → Guides through script definition and implementation
```

### Debug Session Example

```bash
# Start debugging an issue
/woolly-create debug "users reporting slow page loads"
# → Creates .debug/slow-page-loads/
# → Begins systematic investigation
```

### Review Session Example

```bash
# Review completed feature
/woolly-create review "review dark mode feature"
# → Creates .review/dark-mode-review/
# → Can review feature:dark-mode or external PR

# Review external code
/woolly-create review "security audit of API"
# → Creates .review/api-security-audit/
# → Systematic security review
```

### Vibe Exploration Example

```bash
# Start exploratory work
/woolly-create vibe "research new testing strategies"
# → Creates .vibe/testing-strategies/
# → Simple "Where should we start?"
```

The framework ensures systematic, well-documented work across all modes with clear visibility into progress and appropriate structure for each type of task.