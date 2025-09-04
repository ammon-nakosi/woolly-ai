---
description: "List woolly projects with smart filtering and sorting"
argument-hint: "[hint: asc/desc/last/recent/mode/etc.]"
---

You are listing woolly framework projects. Parse the hint from $ARGUMENTS to intelligently determine how to list and sort projects.

## Step 1: Parse and Interpret Hint

Interpret the user's hint smartly to build the appropriate woolly CLI command:

### Time-based Hints → Use `--recent`
- "recent", "latest", "newest", "last", "new" → `woolly list --recent`
- "last N", "recent N", "top N" → `woolly list --recent | head -N`
- "today", "yesterday", "this week" → `woolly list --recent` then filter by date

### Mode Filtering → Use `--mode`
- "feature", "features" → `woolly list --mode feature`
- "script", "scripts" → `woolly list --mode script`
- "vibe", "vibes", "explore" → `woolly list --mode vibe`
- "prompt", "prompts" → `woolly list --mode prompt`

### Status Filtering → Use `--status`
- "active", "wip", "in-progress", "working" → `woolly list --status in-progress`
- "planned", "todo", "upcoming" → `woolly list --status planned`
- "complete", "completed", "done", "finished" → `woolly list --status completed`

### Sorting Hints
- "asc", "ascending", "alpha", "alphabetical", "name", "a-z" → `woolly list` then sort alphabetically
- "desc", "descending", "z-a", "reverse" → `woolly list` then sort reverse alphabetically
- "oldest", "old first" → `woolly list` then sort by date ascending

### Combined Hints
Parse multiple hints and combine flags:
- "recent features" → `woolly list --mode feature --recent`
- "completed scripts" → `woolly list --mode script --status completed`
- "active feature" → `woolly list --mode feature --status in-progress`
- "last 5 features" → `woolly list --mode feature --recent | head -5`

### Project Search
- If hint contains specific words not matching above → `woolly list --project [hint]`

## Step 2: Execute with Smart Command Building

Build and execute the appropriate command based on interpretation. 
Try to run the woolly command directly - if it fails, fallback to filesystem scan:

```bash
# Example command builder logic
# CLI now defaults to local filesystem
cmd="woolly list"

# Add mode filter if detected
if [hint matches mode]; then
  cmd="$cmd --mode [detected_mode]"
fi

# Add status filter if detected
if [hint matches status]; then
  cmd="$cmd --status [detected_status]"
fi

# Add recent flag if time-based
if [hint matches time]; then
  cmd="$cmd --recent"
fi

# Execute - will fail if CLI not installed
$cmd 2>&1 || handle_cli_not_available
```

## Step 3: Handle CLI Not Available

If the woolly CLI command fails (not installed), fallback to filesystem scan:

```bash
handle_cli_not_available() {
  echo "⚠️ Woolly CLI not found. Using local filesystem scan..."
  echo "To get full functionality: npm install -g @woolly/cli"
  echo ""
  
  # Fallback to filesystem scan
  for mode in features scripts vibes prompts; do
    if [ -d "~/.woolly/$mode" ]; then
      find "~/.woolly/$mode" -maxdepth 1 -type d -not -path "~/.woolly/$mode" -exec basename {} \;
    fi
  done
}
```

## Step 4: ChromaDB Option

If the user explicitly wants to use ChromaDB (hint contains "chroma" or "remote"), add the flag:

```bash
woolly list --chroma 2>&1 || handle_cli_not_available
```

## Step 5: Post-Process Results if Needed

Apply additional filtering/sorting based on hints that the CLI doesn't directly support:

### For "last N" queries:
```bash
woolly list --recent | head -n [N]
```

### For alphabetical sorting:
```bash
woolly list [flags] | sort  # for ascending
woolly list [flags] | sort -r  # for descending
```

### For date range filtering:
Parse the output and filter based on timestamps if showing "today", "this week", etc.

## Step 6: Format and Display

Present results clearly, showing what filters were applied:

```
═══════════════════════════════════════════════════════════════
                    WOOLLY PROJECTS
═══════════════════════════════════════════════════════════════

Applied: [description of interpreted hint]
Command: woolly list [flags used]

[Output from woolly list command]

═══════════════════════════════════════════════════════════════

💡 Quick Actions:
  • View details: woolly status [project-name]
  • Open project: cd ~/.woolly/[mode]/[project-name]
  • Search: woolly search "[keyword]"
  • Different view: /woolly-list [different hint]
```

## Special Cases

### No Hint Provided
Default to `woolly list --recent` to show most recently updated projects.

### Unrecognized Hint
Try `woolly list --project [hint]` as it might be a project name search.
If no results, show:
```
No projects found matching "[hint]"

Did you mean:
  • /woolly-list recent    (show recent projects)
  • /woolly-list [mode]     (filter by mode)
  • /woolly-list active     (show active projects)

Or try: woolly search "[hint]"
```

### CLI Not Available
The fallback function `handle_cli_not_available` will be automatically triggered when the woolly command fails.

## Examples of Smart Interpretation

User input → Command executed:
- "last 10" → `woolly list --recent | head -10`
- "features" → `woolly list --mode feature`
- "active scripts" → `woolly list --mode script --status in-progress`
- "asc" → `woolly list | sort`
- "desc" → `woolly list | sort -r`
- "completed" → `woolly list --status completed`
- "recent vibe" → `woolly list --mode vibe --recent`
- "my-project" → `woolly list --project my-project`

## Implementation Notes

1. **Direct Execution**: Try woolly CLI directly without checking availability first
2. **Smart Parsing**: Be flexible with variations (plural/singular, abbreviations)
3. **Combine Flags**: Build complex queries by combining multiple CLI flags
4. **Graceful Fallback**: Automatically fallback to filesystem scan on CLI failure
5. **Clear Feedback**: Show user what interpretation was applied
6. **Helpful Errors**: When no results, suggest alternatives
7. **Performance**: Use CLI's built-in filtering rather than post-processing when possible
8. **JSON Option**: For complex filtering, could use `--json` flag and parse with jq if needed