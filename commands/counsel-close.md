# Counsel Close Command

You are closing a counsel project. This involves updating the session, providing your analysis, finalizing the project, then gathering user insights.

**IMPORTANT**: This is a slash command workflow (/counsel-close) for AI agents. The actual CLI command is `counsel finalize` (not `counsel close`).

## Determining Which Project to Close

Parse the user's request for the project name. If not explicitly provided:

1. **Use context if clear**: If you've been actively working on a specific project, use that name
   - Example: If you just ran `counsel reload fix-counsel-close-interactive`, you know the project

2. **Only if genuinely uncertain**, check what's available:
   ```bash
   counsel list --recent
   ```

3. **Ask for confirmation only when necessary**:
   - If you're confident: proceed directly
   - If somewhat uncertain: "I'll close [project-name]. Is that correct?"
   - If multiple possibilities: list them and ask which one

## Workflow

### Step 1: Update Session (Before Mentioning Closing)

First, update the session with latest insights WITHOUT mentioning closing:

```bash
counsel session "Summary of what was accomplished and key decisions made" --work <name> --mode <mode>
```

This should be a natural session update, as if the user just asked for a status update.

### Step 2: Provide Your Analysis and Finalize

Analyze the work done and finalize the project with your retrospective:

```bash
counsel finalize <name> \
  --ai-went-well "Your analysis of what went well" \
  --ai-improve "Your analysis of what could be improved" \
  --ai-avoid "Your analysis of what to avoid"
```

This command will:
- Mark project metadata as closed
- Create retro.md with your AI analysis
- Save the retrospective

**Your analysis should be thoughtful and specific to the actual work done**, for example:
- What went well: "Successfully implemented all core requirements with clean code structure"
- What could improve: "Test coverage could be more comprehensive, especially edge cases"
- What to avoid: "Avoid making assumptions about user requirements without clarification"

### Step 3: Share Your Analysis and Ask for User Insights

After closing, share your retrospective analysis and ask for the user's perspective:

```
The project has been closed with my retrospective analysis.

Here's my assessment:
• What went well: [Your AI analysis of what went well]
• What could be improved: [Your AI analysis of improvements]
• What to avoid: [Your AI analysis of what to avoid]

Would you like to add your own insights to the retrospective?
- What went well from your perspective?
- What could be improved?
- What should we avoid next time?

(Feel free to share your thoughts or skip if you prefer)
```

### Step 4: Update Retro with User Insights (If Provided)

If the user provides insights, directly update the retro.md file to add a "User Insights" section:

```bash
# Read the current retro
current_retro=$(cat ~/.counsel/<mode>s/<name>/retro.md)

# Append user insights section
cat >> ~/.counsel/<mode>s/<name>/retro.md << EOF

## User Insights

### What Went Well
- ${user_went_well}

### What Could Be Improved
- ${user_improve}

### What to Avoid
- ${user_avoid}

*User insights added: $(date -u +"%Y-%m-%dT%H:%M:%SZ")*
EOF
```

## Important Notes

- **Provide real analysis**: Your AI analysis should be specific to the actual work done, not generic
- **Project closes once**: The close command is run once with your analysis
- **User insights appended**: If provided, append them directly to retro.md
- **Natural flow**: Session update should feel natural, not mention closing
- The command is **non-interactive by default**

## Example Flows

### When Context is Clear (Most Common)

```
User: Let's close this project

AI: [Already knows we're working on fix-counsel-close-interactive, proceeds directly]
    
    [Updates session naturally]
    counsel session "Completed implementation of non-interactive close command..."
    
    [Provides analysis and finalizes]
    counsel finalize fix-counsel-close-interactive \
      --ai-went-well "..." \
      --ai-improve "..." \
      --ai-avoid "..."
```

### When Slightly Uncertain

```
User: Close the project

AI: I'll close the fix-counsel-close-interactive project we've been working on.
    
    [Proceeds with closing workflow]
```

### When Genuinely Uncertain

```
User: Close that feature from yesterday

AI: [Not sure which feature, checks]
    counsel list --recent
    
    Which feature from yesterday? I see:
    - feature/dark-mode 
    - feature/user-auth
    
User: Dark mode

AI: [Proceeds with closing dark-mode]
```

## Mode Detection

The finalize command will auto-detect the mode from the project path. If ambiguous:
```bash
counsel finalize <name> --mode <feature|script|debug|review|vibe>
```

## Error Handling

- **"Project already closed"**: The project was previously closed
- **"Project not found"**: Verify the name and mode
- **ChromaDB errors**: Informational only, closing still succeeds