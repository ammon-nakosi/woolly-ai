---
description: "List counsel projects with smart filtering and sorting"
argument-hint: "[hint: asc/desc/last/recent/mode/etc.]"
---

You are listing counsel framework projects. Parse the hint from $ARGUMENTS to intelligently determine how to list and sort projects.

## Step 1: Parse and Interpret Hint

Interpret the user's hint smartly to build the appropriate counsel CLI command:

### Time-based Hints → Use `--recent`
- "recent", "latest", "newest", "last", "new" → `counsel list --recent`
- "last N", "recent N", "top N" → `counsel list --recent | head -N`
- "today", "yesterday", "this week" → `counsel list --recent` then filter by date

### Mode Filtering → Use `--mode`
- "feature", "features" → `counsel list --mode feature`
- "script", "scripts" → `counsel list --mode script`
- "debug", "debugging" → `counsel list --mode debug`
- "review", "reviews" → `counsel list --mode review`
- "vibe", "vibes", "explore" → `counsel list --mode vibe`

### Status Filtering → Use `--status`
- "active", "wip", "in-progress", "working" → `counsel list --status in-progress`
- "planned", "todo", "upcoming" → `counsel list --status planned`
- "complete", "completed", "done", "finished" → `counsel list --status completed`

### Sorting Hints
- "asc", "ascending", "alpha", "alphabetical", "name", "a-z" → `counsel list` then sort alphabetically
- "desc", "descending", "z-a", "reverse" → `counsel list` then sort reverse alphabetically
- "oldest", "old first" → `counsel list` then sort by date ascending

### Combined Hints
Parse multiple hints and combine flags:
- "recent features" → `counsel list --mode feature --recent`
- "completed scripts" → `counsel list --mode script --status completed`
- "active feature" → `counsel list --mode feature --status in-progress`
- "last 5 features" → `counsel list --mode feature --recent | head -5`

### Project Search
- If hint contains specific words not matching above → `counsel list --project [hint]`

## Step 2: Execute with Smart Command Building

Build and execute the appropriate command based on interpretation. 
Try to run the counsel command directly - if it fails, fallback to filesystem scan:

```bash
# Example command builder logic
# CLI now defaults to local filesystem
cmd="counsel list"

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

If the counsel CLI command fails (not installed), fallback to filesystem scan:

```bash
handle_cli_not_available() {
  echo "⚠️ Counsel CLI not found. Using local filesystem scan..."
  echo "To get full functionality: npm install -g @counsel/cli"
  echo ""
  
  # Fallback to filesystem scan
  for mode in features scripts debug review vibe; do
    if [ -d ".$mode" ]; then
      find ".$mode" -maxdepth 1 -type d -not -path ".$mode" -exec basename {} \;
    fi
  done
}
```

## Step 4: ChromaDB Option

If the user explicitly wants to use ChromaDB (hint contains "chroma" or "remote"), add the flag:

```bash
counsel list --chroma 2>&1 || handle_cli_not_available
```

## Step 5: Post-Process Results if Needed

Apply additional filtering/sorting based on hints that the CLI doesn't directly support:

### For "last N" queries:
```bash
counsel list --recent | head -n [N]
```

### For alphabetical sorting:
```bash
counsel list [flags] | sort  # for ascending
counsel list [flags] | sort -r  # for descending
```

### For date range filtering:
Parse the output and filter based on timestamps if showing "today", "this week", etc.

## Step 6: Format and Display

Present results clearly, showing what filters were applied:

```
═══════════════════════════════════════════════════════════════
                    COUNSEL PROJECTS
═══════════════════════════════════════════════════════════════

Applied: [description of interpreted hint]
Command: counsel list [flags used]

[Output from counsel list command]

═══════════════════════════════════════════════════════════════

💡 Quick Actions:
  • View details: counsel status [project-name]
  • Open project: cd .[mode]/[project-name]
  • Search: counsel search "[keyword]"
  • Different view: /counsel-list [different hint]
```

## Special Cases

### No Hint Provided
Default to `counsel list --recent` to show most recently updated projects.

### Unrecognized Hint
Try `counsel list --project [hint]` as it might be a project name search.
If no results, show:
```
No projects found matching "[hint]"

Did you mean:
  • /counsel-list recent    (show recent projects)
  • /counsel-list [mode]     (filter by mode)
  • /counsel-list active     (show active projects)

Or try: counsel search "[hint]"
```

### CLI Not Available
The fallback function `handle_cli_not_available` will be automatically triggered when the counsel command fails.

## Examples of Smart Interpretation

User input → Command executed:
- "last 10" → `counsel list --recent | head -10`
- "features" → `counsel list --mode feature`
- "active scripts" → `counsel list --mode script --status in-progress`
- "asc" → `counsel list | sort`
- "desc" → `counsel list | sort -r`
- "completed" → `counsel list --status completed`
- "recent debug" → `counsel list --mode debug --recent`
- "my-project" → `counsel list --project my-project`

## Implementation Notes

1. **Direct Execution**: Try counsel CLI directly without checking availability first
2. **Smart Parsing**: Be flexible with variations (plural/singular, abbreviations)
3. **Combine Flags**: Build complex queries by combining multiple CLI flags
4. **Graceful Fallback**: Automatically fallback to filesystem scan on CLI failure
5. **Clear Feedback**: Show user what interpretation was applied
6. **Helpful Errors**: When no results, suggest alternatives
7. **Performance**: Use CLI's built-in filtering rather than post-processing when possible
8. **JSON Option**: For complex filtering, could use `--json` flag and parse with jq if needed