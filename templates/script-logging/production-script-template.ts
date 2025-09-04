#!/usr/bin/env tsx

/**
 * Production Script Template for Woolly Framework
 * 
 * This template implements all required patterns from docs/SCRIPT-MODE-GUIDELINES.md
 * Features: dry-run mode, limits, batching, rate limiting, progress tracking, outcomes
 * 
 * Usage:
 *   tsx script.ts --dry-run --limit 10                    # Test with 10 items
 *   tsx script.ts --live --limit 100 --batch-size 20      # Live run, limited
 *   tsx script.ts --live --force                           # Full production run
 */

import { getCounselLogger } from './woolly-logger';
import { parseArgs } from 'util';
import { readFileSync, existsSync } from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCRIPT_NAME = 'production-script';  // Update this
const SCRIPT_VERSION = '1.0.0';

// Default processing parameters
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_DELAY_BETWEEN_ITEMS = 200;    // ms
const DEFAULT_DELAY_BETWEEN_BATCHES = 1000; // ms
const DEFAULT_PROGRESS_INTERVAL = 100;      // Show progress every N items

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    // Safety flags
    'dry-run': { type: 'boolean', default: false },
    'live': { type: 'boolean', default: false },
    'force': { type: 'boolean', default: false },
    
    // Processing control
    'limit': { type: 'string' },
    'batch-size': { type: 'string' },
    'delay-items': { type: 'string' },
    'delay-batches': { type: 'string' },
    'concurrency': { type: 'string' },
    
    // Monitoring
    'verbose': { type: 'boolean', default: false },
    'no-log': { type: 'boolean', default: false },
    'progress-interval': { type: 'string' },
    
    // Standard
    'help': { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

// Show help if requested
if (values.help) {
  console.log(`
${SCRIPT_NAME} v${SCRIPT_VERSION}

Usage: tsx ${process.argv[1]} [options] [input-file]

Safety Flags:
  --dry-run           Run in simulation mode (default if --live not set)
  --live              Execute actual changes
  --force             Skip confirmation prompts

Processing Control:
  --limit N           Process maximum N items
  --batch-size N      Items per batch (default: ${DEFAULT_BATCH_SIZE})
  --delay-items MS    Delay between items (default: ${DEFAULT_DELAY_BETWEEN_ITEMS}ms)
  --delay-batches MS  Delay between batches (default: ${DEFAULT_DELAY_BETWEEN_BATCHES}ms)
  --concurrency N     Parallel workers (default: 1) [NOT IMPLEMENTED]

Monitoring:
  --verbose           Show detailed debug output
  --no-log            Disable file logging
  --progress-interval N  Update progress every N items (default: ${DEFAULT_PROGRESS_INTERVAL})

Standard:
  --help              Show this help message

Testing Progression:
  1. tsx ${process.argv[1]} --dry-run --limit 5
  2. tsx ${process.argv[1]} --dry-run --limit 100
  3. tsx ${process.argv[1]} --live --limit 10
  4. tsx ${process.argv[1]} --live --limit 100
  5. tsx ${process.argv[1]} --live

Logs saved to: ~/.woolly/scripts/${SCRIPT_NAME}/logs/
Outcomes saved to: ~/.woolly/scripts/${SCRIPT_NAME}/outcomes/
`);
  process.exit(0);
}

// ============================================================================
// PARSE AND VALIDATE OPTIONS
// ============================================================================

// Safety check: must specify either --dry-run or --live
const isDryRun = values['dry-run'] || !values.live;
if (!values['dry-run'] && !values.live) {
  console.warn('⚠️  Neither --dry-run nor --live specified. Defaulting to --dry-run for safety.');
}

// Parse numeric options
const limit = values.limit ? parseInt(values.limit as string) : undefined;
const batchSize = values['batch-size'] ? parseInt(values['batch-size'] as string) : DEFAULT_BATCH_SIZE;
const delayBetweenItems = values['delay-items'] ? parseInt(values['delay-items'] as string) : DEFAULT_DELAY_BETWEEN_ITEMS;
const delayBetweenBatches = values['delay-batches'] ? parseInt(values['delay-batches'] as string) : DEFAULT_DELAY_BETWEEN_BATCHES;
const progressInterval = values['progress-interval'] ? parseInt(values['progress-interval'] as string) : DEFAULT_PROGRESS_INTERVAL;

// Validate numeric options
if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
  console.error('Error: --limit must be a positive number');
  process.exit(1);
}
if (isNaN(batchSize) || batchSize <= 0) {
  console.error('Error: --batch-size must be a positive number');
  process.exit(1);
}

// ============================================================================
// INITIALIZE LOGGER
// ============================================================================

const logger = getCounselLogger({
  scriptName: SCRIPT_NAME,
  noLog: values['no-log'] as boolean,
  verbose: values.verbose as boolean,
  dryRun: isDryRun,
  limit,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function showProgress(current: number, total: number, startTime: Date) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const elapsed = (Date.now() - startTime.getTime()) / 1000;
  const rate = elapsed > 0 ? current / elapsed : 0;
  const remaining = rate > 0 ? (total - current) / rate : 0;
  
  logger.info(
    `Progress: ${current}/${total} (${percent}%) | ` +
    `Rate: ${rate.toFixed(1)}/sec | ` +
    `ETA: ${formatDuration(remaining)}`
  );
}

async function confirmExecution(itemCount: number) {
  if (isDryRun || values.force) {
    return;
  }
  
  logger.warn('');
  logger.warn('⚠️  WARNING: This will execute in LIVE mode!');
  logger.warn(`About to process ${itemCount} items`);
  logger.warn('');
  logger.warn('Starting in 5 seconds... (Press Ctrl+C to cancel)');
  
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`\r${i}...`);
    await sleep(1000);
  }
  process.stdout.write('\r     \r');
  logger.info('Starting execution...\n');
}

// ============================================================================
// DATA LOADING
// ============================================================================

interface Item {
  id: string;
  // Add your item structure here
  [key: string]: any;
}

async function loadItems(inputFile?: string): Promise<Item[]> {
  // Example: Load from file or database
  // Replace with your actual data loading logic
  
  if (inputFile && existsSync(inputFile)) {
    logger.info(`Loading items from file: ${inputFile}`);
    const content = readFileSync(inputFile, 'utf-8');
    // Parse your file format here
    const items = content.split('\n').filter(Boolean).map((line, index) => ({
      id: `item-${index + 1}`,
      data: line.trim()
    }));
    return items;
  }
  
  // Default: Generate sample items for demonstration
  logger.info('Using sample data for demonstration');
  const sampleItems: Item[] = [];
  for (let i = 1; i <= 100; i++) {
    sampleItems.push({
      id: `item-${i}`,
      value: Math.random() * 100
    });
  }
  return sampleItems;
}

// ============================================================================
// PROCESSING LOGIC
// ============================================================================

async function processItem(item: Item, isDryRun: boolean): Promise<boolean> {
  // Replace with your actual processing logic
  
  if (isDryRun) {
    logger.debug(`[DRY RUN] Would process item ${item.id}`);
    // Simulate processing time
    await sleep(50);
    // Simulate random success/failure
    return Math.random() > 0.1;
  }
  
  try {
    // Actual processing logic here
    logger.debug(`Processing item ${item.id}`);
    
    // Example: API call, database update, etc.
    await sleep(50);  // Simulate work
    
    // Return success
    return true;
  } catch (error) {
    logger.error(`Failed to process ${item.id}:`, error);
    return false;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const startTime = new Date();
  const inputFile = positionals[0];
  
  logger.info(`Starting ${SCRIPT_NAME} v${SCRIPT_VERSION}`);
  logger.info(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  if (limit) logger.info(`Limit: ${limit} items`);
  logger.info(`Batch size: ${batchSize}`);
  logger.info(`Delays: ${delayBetweenItems}ms between items, ${delayBetweenBatches}ms between batches`);
  logger.info('');
  
  // Track results
  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ id: string; error?: string }>,
    skipped: [] as string[],
  };
  
  try {
    // Load items
    logger.info('Loading items...');
    let items = await loadItems(inputFile);
    logger.info(`Loaded ${items.length} items`);
    
    // Apply limit if specified
    if (limit && limit < items.length) {
      items = items.slice(0, limit);
      logger.info(`Limited to first ${limit} items`);
    }
    
    if (items.length === 0) {
      logger.warn('No items to process');
      return;
    }
    
    // Confirmation prompt
    await confirmExecution(items.length);
    
    // Process in batches
    const totalBatches = Math.ceil(items.length / batchSize);
    let totalProcessed = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, items.length);
      const batch = items.slice(batchStart, batchEnd);
      
      logger.info(`\nProcessing batch ${batchIndex + 1}/${totalBatches} (${batch.length} items)`);
      
      // Process items in batch
      for (const item of batch) {
        totalProcessed++;
        
        // Show progress at intervals
        if (totalProcessed % progressInterval === 0 || totalProcessed === items.length) {
          showProgress(totalProcessed, items.length, startTime);
        }
        
        // Process item
        const success = await processItem(item, isDryRun);
        
        if (success) {
          results.succeeded.push(item.id);
          logger.success(`✓ ${item.id}`);
        } else {
          results.failed.push({ id: item.id });
          logger.error(`✗ ${item.id}`);
        }
        
        // Delay between items
        if (delayBetweenItems > 0 && totalProcessed < items.length) {
          await sleep(delayBetweenItems);
        }
      }
      
      // Delay between batches
      if (batchIndex < totalBatches - 1 && delayBetweenBatches > 0) {
        logger.debug(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await sleep(delayBetweenBatches);
      }
    }
    
    // Final summary
    logger.info('\n' + '='.repeat(60));
    logger.info('EXECUTION SUMMARY');
    logger.info('='.repeat(60));
    logger.success(`Succeeded: ${results.succeeded.length}`);
    if (results.failed.length > 0) {
      logger.error(`Failed: ${results.failed.length}`);
    }
    if (results.skipped.length > 0) {
      logger.warn(`Skipped: ${results.skipped.length}`);
    }
    
    const duration = (Date.now() - startTime.getTime()) / 1000;
    logger.info(`Total time: ${formatDuration(duration)}`);
    logger.info(`Average rate: ${(items.length / duration).toFixed(1)} items/sec`);
    
    // Save outcome
    logger.saveOutcome(
      {
        itemsProcessed: totalProcessed,
        itemsSucceeded: results.succeeded.length,
        itemsFailed: results.failed.length,
        itemsSkipped: results.skipped.length,
        successRate: `${Math.round((results.succeeded.length / totalProcessed) * 100)}%`,
        averageRate: parseFloat((items.length / duration).toFixed(1)),
      },
      {
        inputFile,
        totalItems: items.length,
        batchSize,
        executionMode: isDryRun ? 'dry-run' : 'live',
        verboseData: values.verbose ? {
          succeededIds: results.succeeded,
          failedItems: results.failed,
          skippedIds: results.skipped,
        } : undefined,
      }
    );
    
    logger.success('\n✅ Script completed successfully');
    
  } catch (error) {
    logger.error('Script failed with error:', error);
    
    // Save outcome even on failure
    logger.saveOutcome(
      {
        itemsProcessed: results.succeeded.length + results.failed.length,
        itemsSucceeded: results.succeeded.length,
        itemsFailed: results.failed.length,
        itemsSkipped: results.skipped.length,
      },
      {
        inputFile,
        errorMessage: error instanceof Error ? error.message : String(error),
        executionMode: isDryRun ? 'dry-run' : 'live',
      }
    );
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});