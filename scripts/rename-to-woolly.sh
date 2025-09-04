#!/bin/bash

# Script to rename all woolly references to woolly
# This handles the bulk text replacements

echo "Starting bulk rename from woolly to woolly..."

# Define file patterns to update
FILE_PATTERNS=(
    "*.md"
    "*.ts"
    "*.tsx"
    "*.js"
    "*.jsx"
    "*.json"
    "*.sh"
    "*.css"
)

# Create a function to perform replacements in a file
replace_in_file() {
    local file="$1"
    
    # Skip binary files and git directory
    if [[ "$file" == *".git/"* ]] || [[ "$file" == *"node_modules/"* ]] || [[ "$file" == *"dist/"* ]]; then
        return
    fi
    
    # Check if file exists and is readable
    if [[ ! -f "$file" ]] || [[ ! -r "$file" ]]; then
        return
    fi
    
    # Perform replacements (case-sensitive)
    # Using perl for in-place editing with backup
    perl -pi.bak -e '
        # Commands and slash commands
        s/\/woolly-/\/woolly-/g;
        
        # Framework name
        s/Woolly Framework/Woolly Framework/g;
        s/woolly framework/woolly framework/g;
        s/WOOLLY FRAMEWORK/WOOLLY FRAMEWORK/g;
        
        # Package names
        s/\@woolly\//\@woolly\//g;
        
        # Paths
        s/~\/\.woolly\//~\/.woolly\//g;
        s/\.woolly\//\.woolly\//g;
        
        # General references
        s/\bcounsel work\b/woolly work/g;
        s/\bcounsel mode\b/woolly mode/g;
        s/\bcounsel project\b/woolly project/g;
        s/\bcounsel session\b/woolly session/g;
        s/\bcounsel workflow\b/woolly workflow/g;
        s/\bcounsel command\b/woolly command/g;
        s/\bCounsel Mode\b/Woolly Mode/g;
        s/\bCounsel Work\b/Woolly Work/g;
        s/\bCounsel Project\b/Woolly Project/g;
        
        # CLI commands
        s/\bcounsel status\b/woolly status/g;
        s/\bcounsel search\b/woolly search/g;
        s/\bcounsel list\b/woolly list/g;
        s/\bcounsel add\b/woolly add/g;
        s/\bcounsel init\b/woolly init/g;
        s/\bcounsel context\b/woolly context/g;
        s/\bcounsel finalize\b/woolly finalize/g;
        s/\bcounsel session\b/woolly session/g;
        s/\bcounsel chromadb\b/woolly chromadb/g;
        s/\bcounsel index\b/woolly index/g;
        s/\bcounsel guidelines\b/woolly guidelines/g;
        s/\bcounsel time\b/woolly time/g;
        s/\bcounsel close\b/woolly close/g;
        s/\bcounsel help\b/woolly help/g;
        
        # Documentation references
        s/WOOLLY-/WOOLLY-/g;
        s/woolly-logger/woolly-logger/g;
        s/woolly_documents/woolly_documents/g;
        s/woolly-framework/woolly-framework/g;
        s/woolly-project-rules/woolly-project-rules/g;
        s/woolly-session-rules/woolly-session-rules/g;
        
        # Import and require statements
        s/from ["'\'']woolly/from "woolly/g;
        s/require\(["'\'']woolly/require("woolly/g;
        
        # Remaining generic woolly references
        s/\bCounsel\b/Woolly/g;
        s/\bcounsel\b/woolly/g;
        s/\bCOUNSEL\b/WOOLLY/g;
    ' "$file"
    
    # Remove backup file if replacement was successful
    if [ $? -eq 0 ]; then
        rm -f "${file}.bak"
        echo "✓ Updated: $file"
    else
        echo "✗ Failed: $file"
        # Restore from backup if replacement failed
        if [ -f "${file}.bak" ]; then
            mv "${file}.bak" "$file"
        fi
    fi
}

# Find and process all files
echo "Finding files to update..."
for pattern in "${FILE_PATTERNS[@]}"; do
    while IFS= read -r -d '' file; do
        replace_in_file "$file"
    done < <(find . -type f -name "$pattern" -print0 2>/dev/null)
done

echo ""
echo "Bulk rename complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Test the CLI with: npm run build && ./cli/bin/woolly --help"
echo "3. Update any hardcoded paths in user home directories"
echo "4. Consider creating a migration script for existing ~/.woolly/ directories"