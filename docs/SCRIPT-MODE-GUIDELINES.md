# Script Mode Guidelines

## Overview

This document outlines the required patterns and best practices for all scripts created in Counsel Framework's script mode. These guidelines ensure scripts are safe, testable, observable, and production-ready from the start.

## Core Principles

1. **Safety First** - Default to dry-run mode to prevent accidental damage
2. **Test Incrementally** - Start with small limits and gradually increase
3. **Monitor Everything** - Show progress, track statistics, save outcomes
4. **Fail Gracefully** - Save partial results and provide clear error messages
5. **Optimize for Readability** - Clear variable names, section comments, small functions
6. **Separate Concerns** - Keep business logic as pure functions, orchestrate with operational runner

## Required Features Checklist

Every production script MUST include:

- [ ] `--dry-run` flag (default: true for safety)
- [ ] `--limit N` flag for controlled processing
- [ ] Batch processing with configurable size
- [ ] Rate limiting with delays between operations
- [ ] Progress indicators showing current/total items
- [ ] Outcome JSON with execution statistics
- [ ] Confirmation prompts for destructive operations
- [ ] Logging to both console and file in `~/.counsel/scripts/{script-name}/logs/`

**IMPORTANT**: Logs and outcomes must be saved in the counsel directory structure:
- Logs: `~/.counsel/scripts/{script-name}/logs/{script-name}-{timestamp}.log`
- Outcomes: `~/.counsel/scripts/{script-name}/outcomes/{script-name}-{timestamp}.json`
- Do NOT save logs in the current working directory

## Optional Features (When Appropriate)

- [ ] Idempotency checks (only when low-cost, e.g., checking a status field)
- [ ] Result caching (only for expensive external API calls)
- [ ] Concurrent processing (when order doesn't matter)
- [ ] Resume/checkpoint support (for very long-running scripts)

## Standard Script Flags

### Core Safety Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--dry-run` | Simulate without making changes | true |
| `--live` | Execute actual changes | false |
| `--limit N` | Maximum items to process | none |
| `--force` | Skip confirmation prompts | false |

### Processing Control

| Flag | Description | Default |
|------|-------------|---------|
| `--batch-size N` | Items to process per batch | 10 |
| `--delay-items MS` | Delay between individual items | 200ms |
| `--delay-batches MS` | Delay between batches | 1000ms |
| `--concurrency N` | Parallel processing workers | 1 |

### Monitoring

| Flag | Description | Default |
|------|-------------|---------|
| `--verbose` | Show detailed debug output | false |
| `--no-log` | Disable file logging | false |
| `--progress-interval N` | Update progress every N items | 100 |

## Testing Progression

Always follow this progression when testing scripts:

1. **Initial Test**: `--dry-run --limit 5`
   - Verify basic logic works
   - Check output format
   - Confirm no errors

2. **Extended Test**: `--dry-run --limit 100`
   - Test with larger sample
   - Verify batch processing
   - Check performance

3. **Small Live Test**: `--live --limit 10`
   - Confirm actual operations work
   - Verify side effects
   - Check outcomes

4. **Medium Live Test**: `--live --limit 100`
   - Test at moderate scale
   - Monitor resource usage
   - Validate results

5. **Full Production**: `--live`
   - Complete execution
   - Monitor throughout
   - Review final outcomes

## Architecture Questions (Before Implementation)

Ask 2-3 relevant questions based on the script's purpose:

| If script involves... | Ask about... | Example |
|----------------------|--------------|---------|
| Fetching + processing large datasets | Decomposition | "Split into fetch.ts and process.ts?" |
| Expensive operations (API calls, DB writes) | Idempotency | "Check if already processed?" |
| External API calls | Caching | "Cache responses for re-runs?" |
| Processing >1000 items | Recovery | "Save checkpoints to resume?" |
| Long running (>10 min) | Progress saves | "Save partial results?" |
| High volume operations | Concurrency | "Parallel or sequential?" |

Document key decisions in script header:
```typescript
/**
 * Architecture Decisions:
 * - Split into separate fetch/process scripts for caching
 * - Checks status field for idempotency (low-cost DB query)
 * - Saves checkpoint every 100 items for recovery
 */
```

## Common Patterns

### Code Organization Pattern

Separate business logic from operational concerns for readability:

```typescript
// ✅ Business logic - pure functions
async function loadExistingContacts(csvPath: string): Promise<Set<string>> { ... }
async function syncUser(user: User, existingEmails: Set<string>, dryRun: boolean): Promise<Result> { ... }

// Main script - orchestrates with operational runner  
async function main() {
  const runner = new ProductionScriptRunner("script-name", config);
  const existingEmails = await loadExistingContacts(csvPath);
  const users = await getAllDatabaseUsers();
  
  await runner.processBatches(users, async (user) => {
    return await syncUser(user, existingEmails, options.dryRun);
  });
}
```

### API Integration Pattern

Process with small batches and appropriate delays to respect rate limits:

```typescript
const BATCH_SIZE = 10;  // Small batches for APIs
const API_DELAY = 500;  // 500ms between API calls

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, Math.min(i + BATCH_SIZE, items.length));
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);
  
  logger.info(`Processing batch ${batchNum}/${totalBatches}`);
  
  for (const item of batch) {
    if (!dryRun) {
      await callAPI(item);
      logger.success(`Processed ${item.id}`);
    } else {
      logger.info(`[DRY RUN] Would process ${item.id}`);
    }
    
    // Rate limiting
    await sleep(API_DELAY);
  }
  
  // Pause between batches
  await sleep(DELAY_BETWEEN_BATCHES);
}
```

### Database Operations Pattern

Larger batches with simple duplicate checking when cheap:

```typescript
const BATCH_SIZE = 100;  // Larger batches for DB operations

// Simple existence check (only if low-cost)
const existing = await db.query('SELECT id FROM items WHERE status = "processed"');
const processedIds = new Set(existing.map(e => e.id));

for (const batch of chunks(items, BATCH_SIZE)) {
  const newItems = batch.filter(item => !processedIds.has(item.id));
  
  if (newItems.length === 0) {
    logger.info(`Batch already processed, skipping`);
    continue;
  }
  
  if (!dryRun) {
    await db.transaction(async (trx) => {
      await trx.batchInsert('items', newItems);
    });
    logger.success(`Inserted ${newItems.length} items`);
  } else {
    logger.info(`[DRY RUN] Would insert ${newItems.length} items`);
  }
  
  // Small delay even for DB operations
  await sleep(100);
}
```

### File Processing Pattern

Stream large files to avoid memory issues:

```typescript
const rl = readline.createInterface({
  input: fs.createReadStream(inputFile),
  crlfDelay: Infinity
});

let lineNum = 0;
let processedCount = 0;

for await (const line of rl) {
  lineNum++;
  
  // Respect limit
  if (limit && processedCount >= limit) {
    logger.info(`Reached limit of ${limit}, stopping`);
    break;
  }
  
  // Show progress periodically
  if (lineNum % 1000 === 0) {
    logger.info(`Read ${lineNum} lines, processed ${processedCount}`);
  }
  
  // Process line
  if (shouldProcess(line)) {
    if (!dryRun) {
      await processLine(line);
    }
    processedCount++;
  }
}

logger.success(`Processed ${processedCount} of ${lineNum} lines`);
```

### Confirmation Prompt Pattern

Always confirm before destructive operations:

```typescript
if (!dryRun && !force) {
  logger.warn('⚠️  This will modify production data!');
  logger.warn(`About to process ${items.length} items`);
  logger.warn('Starting in 5 seconds... (Ctrl+C to cancel)');
  
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`\r${i}...`);
    await sleep(1000);
  }
  process.stdout.write('\r     \r');
}
```

## Progress Tracking

Show clear progress throughout execution:

```typescript
function showProgress(current: number, total: number, startTime: Date) {
  const percent = Math.round((current / total) * 100);
  const elapsed = Date.now() - startTime.getTime();
  const rate = current / (elapsed / 1000);
  const remaining = (total - current) / rate;
  
  logger.info(
    `Progress: ${current}/${total} (${percent}%) | ` +
    `Rate: ${rate.toFixed(1)}/sec | ` +
    `ETA: ${formatDuration(remaining)}`
  );
}
```

## Outcome Structure

Save comprehensive outcomes for every run:

```typescript
interface ScriptOutcome {
  scriptName: string;
  startTime: string;
  endTime: string;
  duration: number;
  success: boolean;
  runMode: {
    dryRun: boolean;
    limit?: number;
    verbose: boolean;
  };
  stats: {
    successes: number;
    failures: number;
    warnings: number;
    totalProcessed: number;
    // Custom stats specific to script
  };
  metadata?: {
    inputFile?: string;
    environment?: string;
    // Other relevant context
  };
  verboseData?: {  // Only if --verbose
    processedItems?: any[];
    failedItems?: any[];
  };
}
```

## Error Handling

Handle errors gracefully with partial results:

```typescript
const results = {
  succeeded: [],
  failed: []
};

try {
  for (const item of items) {
    try {
      await processItem(item);
      results.succeeded.push(item.id);
    } catch (error) {
      logger.error(`Failed to process ${item.id}:`, error.message);
      results.failed.push({ id: item.id, error: error.message });
      // Continue processing other items
    }
  }
} finally {
  // Always save outcomes, even on crash
  logger.saveOutcome({
    successCount: results.succeeded.length,
    failureCount: results.failed.length
  }, {
    results: verbose ? results : undefined
  });
}
```

## Anti-patterns to Avoid

### ❌ No Dry-Run Mode
```typescript
// BAD: No safety mechanism
await db.deleteAll();
```

### ❌ Processing Everything at Once
```typescript
// BAD: Could overwhelm system
const results = await Promise.all(items.map(processItem));
```

### ❌ No Progress Indicators
```typescript
// BAD: User has no idea what's happening
for (const item of millionItems) {
  await process(item);
}
```

### ❌ No Rate Limiting
```typescript
// BAD: Will hit API rate limits
for (const item of items) {
  await apiCall(item);  // No delay!
}
```

### ❌ Silent Failures
```typescript
// BAD: Errors disappear
try {
  await riskyOperation();
} catch {
  // Swallowing error
}
```

### ❌ No Partial Results
```typescript
// BAD: All or nothing
await processEverything();  // No intermediate saves
```

## Production Readiness Checklist

Before running a script in production:

1. **Tested with dry-run** at various limits?
2. **Rate limits configured** appropriately?
3. **Batch sizes optimized** for the operation type?
4. **Progress tracking** shows meaningful updates?
5. **Error handling** continues processing on failures?
6. **Outcomes saved** with comprehensive statistics?
7. **Confirmation prompt** for destructive operations?
8. **Logging enabled** for audit trail?
9. **Documentation updated** with usage examples?
10. **Tested progression** from small to large scale?

## Summary

Following these guidelines ensures that counsel scripts are:
- **Safe** - Won't accidentally damage production data
- **Testable** - Can be validated incrementally
- **Observable** - Clear progress and comprehensive logging
- **Resilient** - Handle failures gracefully
- **Production-ready** - Include all necessary safeguards

Always prioritize safety and observability over speed. A slower, safer script is better than a fast, risky one.