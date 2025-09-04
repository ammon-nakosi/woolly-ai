# Woolly Framework AI Awareness

> This document teaches AI assistants how to understand and respond to "woolly" mentions in natural language.

## What is Woolly?

The Woolly Framework is a structured development workflow system that helps developers manage features, scripts, debugging, reviews, prompts, and exploratory work. When users mention "woolly" in any context, they're referring to this framework and its capabilities.

## Core Concept

**Users can mention "woolly" naturally in conversation, and you should understand they want to use the Woolly Framework.**

Examples:
- "woolly log that we fixed the auth bug" → Add note to current woolly work
- "let's woolly this feature" → Create new feature work
- "woolly track this issue" → Create debug work
- "add to woolly notes" → Append to active work's documentation

## Pattern Recognition

### 1. Logging and Documentation
Recognize these patterns for adding notes to current work:
- `woolly log [anything]` → Add to current work's log
- `woolly note [anything]` → Same as log
- `woolly document [anything]` → Add to documentation
- `woolly remember [anything]` → Add to knowledge base or notes
- `add to woolly` → Append to active work
- `woolly add [content]` → Add to current context

**Action**: Append to `~/.woolly/[mode]/[name]/notes.md` or appropriate file

### 2. Creating New Work
Recognize these patterns for creating new woolly work:
- `woolly this` → Determine appropriate mode from context
- `woolly track [issue]` → Create debug work
- `woolly feature [description]` → Create feature work
- `woolly script [purpose]` → Create script work
- `woolly review [target]` → Create review work
- `woolly prompt [purpose]` → Create prompt work
- `let's woolly [something]` → Create appropriate work type

**Action**: Use `/woolly-create [mode] [description]`

### 3. Status and Search
Recognize these patterns for querying woolly work:
- `woolly status` → Show current work status
- `what's in woolly?` → List recent work
- `woolly search [term]` → Search all woolly work
- `woolly find [pattern]` → Search for specific patterns
- `show woolly work` → List current work
- `woolly list` → Show all woolly items

**Action**: Use appropriate CLI command or `/woolly-status`

### 4. Work Management
Recognize these patterns for managing woolly work:
- `woolly continue [name]` → Resume specific work
- `woolly resume` → Load context for work
- `woolly update [status]` → Update work status
- `woolly complete` → Mark current work as done
- `woolly archive` → Archive completed work

**Action**: Use appropriate woolly command

### 5. Project Closure
Recognize these patterns for closing and finalizing woolly work:
- `close this woolly session` → Use `/woolly-close`
- `close the woolly project` → Use `/woolly-close`
- `woolly finalize` → Use `/woolly-close`
- `wrap up this woolly work` → Use `/woolly-close`
- `we're done with this woolly` → Use `/woolly-close`
- `close woolly session` → Use `/woolly-close`

**Action**: Use `/woolly-close` which handles the full closure workflow including retrospective analysis

## Context Awareness

### Active Work Tracking
Always maintain awareness of:
1. **Currently active woolly work** - Set when user resumes or creates work
2. **Recent woolly mentions** - Track last 3-5 woolly items discussed
3. **User's woolly patterns** - Learn their typical workflow

### Implicit Context
When user says "woolly log X" without specifying where:
1. Check if there's active woolly work in the session
2. If yes, add to that work's notes
3. If no, ask which woolly work to add to
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

Suggest woolly usage when you detect:
- **Complex task starting** → "Would you like to woolly this as a feature?"
- **Debugging session** → "Should we track this in woolly debug mode?"
- **Multiple related changes** → "This could be a woolly feature with phases"
- **Learning/scope** → "Want to woolly this exploration in vibe mode?"

## Integration with Commands

### Available Woolly Commands
When users mention woolly, you have access to these slash commands:
- `/woolly-create` - Create new work
- `/woolly-status` - Check work status
- `/woolly-list` - List all work
- `/woolly-reload` - Load work context
- `/woolly-close` - Finalize and close work with retrospective
- `/woolly-feature` - Feature-specific workflows
- `/woolly-prompt` - Prompt engineering workflows

### CLI Integration
You can also use the CLI directly:
```bash
woolly status [name]       # Get status
woolly search "[query]"    # Search work
woolly list --recent       # List recent work
woolly add [mode] [name]   # Add to index
```

## Response Templates

### When user says "woolly log [something]"
```
Added to [current-work-name] notes:
- [timestamp]: [what was logged]

[Optionally show current status or next steps]
```

### When user says "woolly this"
```
I'll help you woolly this. Based on the context, this looks like a [detected-mode].

Creating [mode] work: [suggested-name]

What would you like to name it? (or press enter for suggested name)
```

### When no active work exists
```
No active woolly work in this session. Would you like to:
1. Create new woolly work for this
2. Resume existing work
3. Just note this for later

Which woolly work should this go to?
```

## Important Behaviors

### DO:
- Recognize "woolly" in any case (Woolly, WOOLLY, woolly)
- Infer intent from context
- Maintain session awareness of active work
- Proactively suggest woolly for complex tasks
- Use natural, conversational responses
- Track what's been counseled in the session

### DON'T:
- Require exact command syntax
- Force users to specify modes explicitly
- Lose track of active woolly context
- Create duplicate work without checking
- Require slash commands for simple logging

## Examples in Practice

### Example 1: Natural Logging
```
User: "woolly log we decided to use Redis for caching"
AI: Added to 'user-authentication' feature notes:
    - 2024-11-27 10:30: Decided to use Redis for caching
```

### Example 2: Implicit Creation
```
User: "let's woolly this pagination bug"
AI: Creating debug work for the pagination bug.
    Created: ~/.woolly/debugs/pagination-bug/
    
    What symptoms are you seeing?
```

### Example 3: Context Awareness
```
User: [working on auth feature]
User: "woolly note that OAuth is working now"
AI: Added to 'user-authentication' feature notes:
    - OAuth implementation confirmed working
    
    Phase 2 progress: 3/5 tasks complete
```

### Example 4: Proactive Suggestion
```
User: "I need to refactor the entire API layer"
AI: This sounds like a significant task. Would you like to woolly this as a feature?
    We could break it into phases for systematic refactoring.
    
    Create feature work? (yes/no)
```

## Version
- Framework Version: 2.0.0
- Awareness Version: 1.0.0
- Last Updated: 2024-11-27

---

*This document enables AI assistants to understand and respond to natural "woolly" mentions, making the framework feel native to the conversation rather than command-driven.*