---
description: "Store a rule or prompt in the woolly library for reuse"
argument-hint: "{rule|prompt} [brief description]"
---

You are implementing the `/woolly-remember` command to store reusable knowledge. Parse the arguments from $ARGUMENTS as:
1. **Type**: Either `rule` or `prompt`
2. **Description**: The rest of the arguments form the initial description

## Step 1: Parse and Validate Type

Validate the type is either `rule` or `prompt`. If invalid or missing:

```
═══════════════════════════════════════════════════════════════
                    WOOLLY REMEMBER
═══════════════════════════════════════════════════════════════

Store reusable knowledge in your woolly library:

• rule - Project guidelines, patterns, and practices
• prompt - AI prompts for common tasks

Usage: /woolly-remember {rule|prompt} [description]
═══════════════════════════════════════════════════════════════
```

## Step 2: Handle Rule Creation

If type is `rule`, analyze the description and context to create an enhanced rule:

### 2.1 Analyze Context
- Check current project files (package.json, tech stack)
- Review recent work and files being edited
- Identify the rule category (coding-practices, config, guideline, etc.)

### 2.2 Propose Enhanced Rule
Present a well-structured rule proposal:

```
I'll create this rule for your project:

**[Title]** ([type], [scope] scope)

[Enhanced summary based on context]

✅ **Good Practice:**
[Example of correct usage]

❌ **Avoid:**
[Example of what to avoid]

**Benefits:** [Why this rule matters]

Should I save this rule, or would you like me to adjust anything?
```

### 2.3 Handle User Refinement
If the user requests changes, incorporate them and show the updated rule.

### 2.4 Determine Scope
- **Session**: Temporary keywords ("for now", "currently", "this session")
- **Project**: Default for most rules ("always", "never", "standard")
- **User**: Personal preferences ("I prefer", "my approach")

### 2.5 Save Rule
Use the Bash tool to execute:

For project rules:
```bash
woolly rule create --type [type] --title "[title]" --summary "[summary]" --details "[details]" --scope project
```

For session rules (check if you're in a woolly project first):
```bash
# If working on a woolly project, include the project name
woolly rule create --type [type] --title "[title]" --summary "[summary]" --details "[details]" --scope session --project-name "[current_counsel_project_name]"
```

## Step 3: Handle Prompt Creation

If type is `prompt`, create an enhanced AI prompt:

### 3.1 Analyze Intent
Understand what task the prompt should accomplish.

### 3.2 Propose Enhanced Prompt
```
I'll create this prompt for your library:

**[Title]**

[Enhanced prompt with clear instructions, context, and expected output format]

**Use cases:**
- [When you'd use this prompt]

Should I save this prompt, or would you like me to adjust anything?
```

### 3.3 Save Prompt
Use the Bash tool to execute:
```bash
woolly prompt create --title "[title]" --description "[description]" --prompt "[prompt]" --tags "[tag1,tag2]"
```

## Step 4: Confirm Storage

After saving:
```
✅ Successfully stored [type]: [title]

• ID: [generated_id]
• Scope: [scope]
• Location: ~/.woolly/library/[rules|prompts]/

You can manage this [type] using:
• woolly [rule|prompt] list
• woolly [rule|prompt] show [id]
• woolly [rule|prompt] edit [id]
```

## Rule Types Reference

When categorizing rules, use these types:
- **`coding-practices`** - Approaches, patterns, standards
- **`code-snippet`** - Actual reusable code fragments
- **`workaround`** - Problem-solving fixes
- **`config`** - Settings, commands, dependencies
- **`reference`** - Links, contacts, documentation
- **`guideline`** - Directives ("do this", "don't do that")
- **`general-note`** - Miscellaneous important info

## Remember

- Be intelligent about enhancing the user's description
- Use project context to make rules specific and actionable
- Keep the conversational flow natural
- For rules, they will be automatically injected into CLAUDE.md files
- For prompts, they're stored for future retrieval and use