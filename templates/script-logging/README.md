# Woolly Framework Script Logging Templates

## Purpose
These templates provide crash-resistant logging and outcome tracking for woolly scripts, ensuring users always have logs and execution summaries to refer to even if scripts crash unexpectedly.

## Key Principles

1. **Dual Output**: Always log to both console AND file simultaneously
2. **Announce Locations**: First lines show where logs and outcomes are being saved
3. **Context-Aware Filenames**: Files include dry-run/limit indicators
4. **Automatic Outcome Tracking**: JSON summaries saved after each run
5. **Graceful Cleanup**: Handle script termination properly
6. **Consistent Locations**: 
   - Logs: `~/.woolly/scripts/{script-name}/logs/`
   - Outcomes: `~/.woolly/scripts/{script-name}/outcomes/`

## Available Templates

### Basic Templates (Simple Scripts)
- **woolly-logger.ts**: Reusable logging utility with outcome tracking
- **example-script.ts**: Example implementation showing basic usage
- **bash-logging.sh**: Complete bash logging template with outcome support

### Production Templates (Recommended)
- **production-script-template.ts**: Full-featured TypeScript template with all required patterns
- **production-script-template.sh**: Full-featured Bash template with all required patterns
- **See `docs/SCRIPT-MODE-GUIDELINES.md`** for comprehensive best practices

## Usage Pattern

### TypeScript/Node.js Scripts

```typescript
import { getCounselLogger } from './woolly-logger';

const logger = getCounselLogger({
  scriptName: 'my-script',
  noLog: false,     // Set via --no-log flag
  verbose: false,   // Set via --verbose flag
  dryRun: false,    // Set via --dry-run flag
  limit: 100        // Set via --limit flag
});

// Use throughout script
logger.info('Starting process...');
logger.success('Task completed');
logger.warn('Missing config file');
logger.error('Connection failed');
logger.debug('Variable value:', someVar); // Only shown with --verbose

// Save outcome with custom stats and verbose data
logger.saveOutcome(
  { 
    recordsProcessed: 100, 
    apiCallsMade: 50 
  },
  { 
    inputFile: 'data.csv',
    verboseData: {  // Only saved if verbose: true
      processedRecords: [...],
      failedRecords: [...]
    }
  }
);
```

### Bash Scripts

```bash
#!/bin/bash

# Source the template or copy its pattern
SCRIPT_NAME="my-script"
source /path/to/bash-logging.sh

# Use logging functions
log_info "Starting process..."
log_success "Task completed"
log_warn "Missing config file"
log_error "Connection failed"
log_debug "Variable value: $SOME_VAR"  # Only shown with --verbose

# Save outcome with custom stats
save_outcome \
  '"recordsProcessed": 100, "apiCallsMade": 50' \
  '{"inputFile": "data.csv"}' \
  '{"processedRecords": [...]}' # Verbose data (only if --verbose)
```

## Translation to Other Languages

### Python Example

```python
import logging
import os
from datetime import datetime
from pathlib import Path

def setup_counsel_logger(script_name, no_log=False, verbose=False):
    # Create log directory
    log_dir = Path.home() / '.woolly' / 'scripts' / script_name / 'logs'
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Create timestamped log file
    timestamp = datetime.now().isoformat().replace(':', '-')
    log_file = log_dir / f"{script_name}-{timestamp}.log"
    
    # Configure logging
    logger = logging.getLogger(script_name)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    
    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.DEBUG if verbose else logging.INFO)
    
    # File handler (if not disabled)
    if not no_log:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        logger.addHandler(file_handler)
        print(f"ℹ Logging to: {log_file}")
    
    logger.addHandler(console)
    return logger
```

### Ruby Example

```ruby
require 'logger'
require 'fileutils'

class CounselLogger
  def initialize(script_name, no_log: false, verbose: false)
    @script_name = script_name
    @verbose = verbose
    
    unless no_log
      # Create log directory
      log_dir = File.join(Dir.home, '.woolly', 'scripts', script_name, 'logs')
      FileUtils.mkdir_p(log_dir)
      
      # Create timestamped log file
      timestamp = Time.now.strftime('%Y-%m-%dT%H-%M-%S')
      log_file = File.join(log_dir, "#{script_name}-#{timestamp}.log")
      
      @file_logger = Logger.new(log_file)
      puts "ℹ Logging to: #{log_file}"
    end
    
    @console_logger = Logger.new(STDOUT)
  end
  
  def info(message)
    @console_logger.info(message)
    @file_logger&.info(message)
  end
  
  # ... other log levels
end
```

## Filename Conventions

Files are named with context indicators for easy identification:

### Examples
- `my-script-2025-01-27T10-00-00.log` - Regular run
- `my-script-2025-01-27T10-00-00-dryrun.log` - Dry run mode
- `my-script-2025-01-27T10-00-00-limit100.log` - Limited to 100 items
- `my-script-2025-01-27T10-00-00-dryrun-limit50.log` - Dry run with limit

### Directory Structure
```
~/.woolly/scripts/my-script/
├── logs/
│   ├── my-script-2025-01-27T09-00-00-dryrun.log
│   └── my-script-2025-01-27T10-00-00.log
├── outcomes/
│   ├── my-script-2025-01-27T09-00-00-dryrun.json
│   ├── my-script-2025-01-27T10-00-00.json
│   └── latest.json -> my-script-2025-01-27T10-00-00.json
```

## Outcome JSON Structure

```json
{
  "scriptName": "my-script",
  "startTime": "2025-01-27T10:00:00Z",
  "endTime": "2025-01-27T10:05:00Z",
  "duration": 300000,
  "success": true,
  "runMode": {
    "dryRun": false,
    "limit": 100,
    "verbose": false
  },
  "stats": {
    "successes": 95,
    "failures": 5,
    "warnings": 2,
    // Custom stats from script
    "recordsProcessed": 100,
    "apiCallsMade": 250
  },
  "metadata": {
    "inputFile": "data.csv",
    "environment": "production"
  },
  "verboseData": {  // Only included if verbose: true
    "processedRecords": [...],
    "failedRecords": [...]
  }
}
```

## Benefits

1. **Crash Recovery**: Logs and outcomes persist even if script crashes
2. **Execution History**: JSON outcomes enable analysis across runs
3. **Context Awareness**: Filenames show run mode at a glance
4. **Debug Support**: Verbose mode preserves full processing details
5. **User Transparency**: Always know where files are saved
6. **Easy Comparison**: Compare dry-run vs live outcomes side-by-side

## Integration with Woolly Framework

When creating scripts in script mode, agents should:

1. Import or include the appropriate logging template
2. Initialize logger with the script name at startup
3. Use logger throughout the script instead of plain print/echo
4. Include `--no-log` and `--verbose` flags as standard options
5. Document log location in the script's `usage.md` file

## Production Script Patterns

### Standard Flags for Production Scripts

All production scripts should include these flags:

| Flag | Purpose | Default |
|------|---------|---------|
| `--dry-run` / `--live` | Safety mode | dry-run |
| `--limit N` | Process max N items | none |
| `--batch-size N` | Items per batch | 10 |
| `--delay-items MS` | Rate limiting | 200ms |
| `--delay-batches MS` | Batch spacing | 1000ms |
| `--force` | Skip confirmations | false |
| `--verbose` | Debug output | false |

### Testing Progression

Always test scripts incrementally:

1. `--dry-run --limit 5` - Verify logic
2. `--dry-run --limit 100` - Test at scale
3. `--live --limit 10` - Small live test
4. `--live --limit 100` - Medium test
5. `--live` - Full production

### Common Patterns

#### API Integration
- Small batches (10-50)
- Longer delays (500-1000ms)
- Monitor rate limit headers

#### Database Operations
- Larger batches (100-1000)
- Minimal delays
- Transaction boundaries

#### File Processing
- Stream large files
- Progress by lines/bytes
- Memory monitoring

## Log File Management

Users can manage their logs with standard commands:

```bash
# View recent logs for a script
ls -la ~/.woolly/scripts/my-script/logs/

# View latest outcome
cat ~/.woolly/scripts/my-script/outcomes/latest.json | jq

# Clean old logs (keep last 10)
cd ~/.woolly/scripts/my-script/logs/
ls -t | tail -n +11 | xargs rm -f

# Search across all logs
grep -r "ERROR" ~/.woolly/scripts/*/logs/

# Compare dry-run vs live outcomes
diff <(jq . outcomes/*-dryrun.json) <(jq . outcomes/*-live.json)
```