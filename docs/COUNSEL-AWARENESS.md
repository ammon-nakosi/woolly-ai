# Counsel Framework AI Awareness

> This document teaches AI assistants how to understand and respond to "counsel" mentions in natural language.

## What is Counsel?

The Counsel Framework is a structured development workflow system that helps developers manage features, scripts, debugging, reviews, prompts, and exploratory work. When users mention "counsel" in any context, they're referring to this framework and its capabilities.

## Core Concept

**Users can mention "counsel" naturally in conversation, and you should understand they want to use the Counsel Framework.**

Examples:
- "counsel log that we fixed the auth bug" → Add note to current counsel work
- "let's counsel this feature" → Create new feature work
- "counsel track this issue" → Create debug work
- "add to counsel notes" → Append to active work's documentation

## Pattern Recognition

### 1. Logging and Documentation
Recognize these patterns for adding notes to current work:
- `counsel log [anything]` → Add to current work's log
- `counsel note [anything]` → Same as log
- `counsel document [anything]` → Add to documentation
- `counsel remember [anything]` → Add to knowledge base or notes
- `add to counsel` → Append to active work
- `counsel add [content]` → Add to current context

**Action**: Append to `~/.counsel/[mode]/[name]/notes.md` or appropriate file

### 2. Creating New Work
Recognize these patterns for creating new counsel work:
- `counsel this` → Determine appropriate mode from context
- `counsel track [issue]` → Create debug work
- `counsel feature [description]` → Create feature work
- `counsel script [purpose]` → Create script work
- `counsel review [target]` → Create review work
- `counsel prompt [purpose]` → Create prompt work
- `let's counsel [something]` → Create appropriate work type

**Action**: Use `/counsel-create [mode] [description]`

### 3. Status and Search
Recognize these patterns for querying counsel work:
- `counsel status` → Show current work status
- `what's in counsel?` → List recent work
- `counsel search [term]` → Search all counsel work
- `counsel find [pattern]` → Search for specific patterns
- `show counsel work` → List current work
- `counsel list` → Show all counsel items

**Action**: Use appropriate CLI command or `/counsel-status`

### 4. Work Management
Recognize these patterns for managing counsel work:
- `counsel continue [name]` → Resume specific work
- `counsel resume` → Load context for work
- `counsel update [status]` → Update work status
- `counsel complete` → Mark current work as done
- `counsel archive` → Archive completed work

**Action**: Use appropriate counsel command

### 5. Project Closure
Recognize these patterns for closing and finalizing counsel work:
- `close this counsel session` → Use `/counsel-close`
- `close the counsel project` → Use `/counsel-close`
- `counsel finalize` → Use `/counsel-close`
- `wrap up this counsel work` → Use `/counsel-close`
- `we're done with this counsel` → Use `/counsel-close`
- `close counsel session` → Use `/counsel-close`

**Action**: Use `/counsel-close` which handles the full closure workflow including retrospective analysis

## Context Awareness

### Active Work Tracking
Always maintain awareness of:
1. **Currently active counsel work** - Set when user resumes or creates work
2. **Recent counsel mentions** - Track last 3-5 counsel items discussed
3. **User's counsel patterns** - Learn their typical workflow

### Implicit Context
When user says "counsel log X" without specifying where:
1. Check if there's active counsel work in the session
2. If yes, add to that work's notes
3. If no, ask which counsel work to add to
4. Suggest creating new work if appropriate

### Mode Detection
When mode isn't specified, infer from context:
- Bug/error/issue → `debug` mode
- New functionality → `feature` mode
- Automation/utility → `script` mode
- Code review/PR → `review` mode
- AI/LLM related → `prompt` mode
- Exploration/research → `vibe` mode

## Proactive Suggestions

Suggest counsel usage when you detect:
- **Complex task starting** → "Would you like to counsel this as a feature?"
- **Debugging session** → "Should we track this in counsel debug mode?"
- **Multiple related changes** → "This could be a counsel feature with phases"
- **Learning/discovery** → "Want to counsel this exploration in vibe mode?"

## Integration with Commands

### Available Counsel Commands
When users mention counsel, you have access to these slash commands:
- `/counsel-create` - Create new work
- `/counsel-status` - Check work status
- `/counsel-list` - List all work
- `/counsel-reload` - Load work context
- `/counsel-close` - Finalize and close work with retrospective
- `/counsel-feature` - Feature-specific workflows
- `/counsel-prompt` - Prompt engineering workflows

### CLI Integration
You can also use the CLI directly:
```bash
counsel status [name]       # Get status
counsel search "[query]"    # Search work
counsel list --recent       # List recent work
counsel add [mode] [name]   # Add to index
```

## Response Templates

### When user says "counsel log [something]"
```
Added to [current-work-name] notes:
- [timestamp]: [what was logged]

[Optionally show current status or next steps]
```

### When user says "counsel this"
```
I'll help you counsel this. Based on the context, this looks like a [detected-mode].

Creating [mode] work: [suggested-name]

What would you like to name it? (or press enter for suggested name)
```

### When no active work exists
```
No active counsel work in this session. Would you like to:
1. Create new counsel work for this
2. Resume existing work
3. Just note this for later

Which counsel work should this go to?
```

## Important Behaviors

### DO:
- Recognize "counsel" in any case (Counsel, COUNSEL, counsel)
- Infer intent from context
- Maintain session awareness of active work
- Proactively suggest counsel for complex tasks
- Use natural, conversational responses
- Track what's been counseled in the session

### DON'T:
- Require exact command syntax
- Force users to specify modes explicitly
- Lose track of active counsel context
- Create duplicate work without checking
- Require slash commands for simple logging

## Examples in Practice

### Example 1: Natural Logging
```
User: "counsel log we decided to use Redis for caching"
AI: Added to 'user-authentication' feature notes:
    - 2024-11-27 10:30: Decided to use Redis for caching
```

### Example 2: Implicit Creation
```
User: "let's counsel this pagination bug"
AI: Creating debug work for the pagination bug.
    Created: ~/.counsel/debugs/pagination-bug/
    
    What symptoms are you seeing?
```

### Example 3: Context Awareness
```
User: [working on auth feature]
User: "counsel note that OAuth is working now"
AI: Added to 'user-authentication' feature notes:
    - OAuth implementation confirmed working
    
    Phase 2 progress: 3/5 tasks complete
```

### Example 4: Proactive Suggestion
```
User: "I need to refactor the entire API layer"
AI: This sounds like a significant task. Would you like to counsel this as a feature?
    We could break it into phases for systematic refactoring.
    
    Create feature work? (yes/no)
```

## Version
- Framework Version: 2.0.0
- Awareness Version: 1.0.0
- Last Updated: 2024-11-27

---

*This document enables AI assistants to understand and respond to natural "counsel" mentions, making the framework feel native to the conversation rather than command-driven.*