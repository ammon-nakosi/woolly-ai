#!/usr/bin/env tsx

/**
 * Woolly Framework Script Template with Logging
 * 
 * This template demonstrates crash-resistant logging for TypeScript/Node.js scripts.
 * The pattern is easily translatable to other languages:
 * 
 * Python equivalent:
 * - Use Python's logging module with FileHandler and StreamHandler
 * - Create logs in: os.path.expanduser("~/.woolly/scripts/{script_name}/logs/")
 * - Use timestamp: datetime.now().isoformat().replace(":", "-")
 * 
 * Key principles for any language:
 * 1. Always announce log file location at startup
 * 2. Log to both console AND file simultaneously  
 * 3. Use timestamped log files to preserve history
 * 4. Handle crashes gracefully with cleanup handlers
 * 5. Include context (args, cwd, user) in initial log
 */

import { getCounselLogger } from './woolly-logger';
import { parseArgs } from 'util';

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'no-log': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    'limit': { type: 'string' },
    'help': { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Usage: tsx ${process.argv[1]} [options] [input-file]

Options:
  --no-log    Disable logging to file (console output only)
  --verbose   Enable verbose debug output
  --dry-run   Run in dry-run mode (no actual changes)
  --limit N   Limit processing to N items
  --help      Show this help message

Logs are saved to: ~/.woolly/scripts/{script-name}/logs/
Outcomes are saved to: ~/.woolly/scripts/{script-name}/outcomes/
`);
  process.exit(0);
}

// Initialize logger with script name
const logger = getCounselLogger({
  scriptName: 'example-script', // Replace with your script name
  noLog: values['no-log'] as boolean,
  verbose: values.verbose as boolean,
  dryRun: values['dry-run'] as boolean,
  limit: values.limit ? parseInt(values.limit as string) : undefined,
});

// Main script logic
async function main() {
  const inputFile = positionals[0] || 'default-input.csv';
  const isDryRun = values['dry-run'] as boolean;
  const limit = values.limit ? parseInt(values.limit as string) : undefined;
  
  logger.info(`Starting script execution (${isDryRun ? 'DRY RUN' : 'LIVE'})`);
  logger.info('Input file:', inputFile);
  if (limit) logger.info('Processing limit:', limit);
  
  // Track processing results
  const processedRecords: any[] = [];
  const failedRecords: any[] = [];
  
  try {
    // Simulate processing multiple items
    const itemsToProcess = limit || 10;
    logger.info(`Processing ${itemsToProcess} items...`);
    
    for (let i = 1; i <= itemsToProcess; i++) {
      // Simulate random success/failure
      const success = Math.random() > 0.2;
      
      if (success) {
        logger.success(`Item ${i}: Processed successfully`);
        processedRecords.push({
          id: `item-${i}`,
          status: 'success',
          processedAt: new Date().toISOString(),
        });
      } else {
        logger.error(`Item ${i}: Failed to process`);
        failedRecords.push({
          id: `item-${i}`,
          status: 'failed',
          error: 'Simulated error',
          failedAt: new Date().toISOString(),
        });
      }
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Example: Warning for something
    if (failedRecords.length > 0) {
      logger.warn(`${failedRecords.length} items failed processing`);
    }
    
    // Example: Debug output (only shown with --verbose)
    logger.debug('Processing stats:', {
      processed: processedRecords.length,
      failed: failedRecords.length,
    });
    
    // Save outcome with custom stats and verbose data
    logger.saveOutcome(
      {
        itemsProcessed: processedRecords.length,
        itemsFailed: failedRecords.length,
        successRate: `${Math.round((processedRecords.length / itemsToProcess) * 100)}%`,
      },
      {
        inputFile,
        totalItems: itemsToProcess,
        executionMode: isDryRun ? 'dry-run' : 'live',
        verboseData: {
          processedRecords,
          failedRecords,
        },
      }
    );
    
    logger.success('Script completed successfully');
  } catch (error) {
    logger.error('Script failed:', error);
    
    // Save outcome for failure case
    logger.saveOutcome(
      {
        itemsProcessed: processedRecords.length,
        itemsFailed: failedRecords.length,
      },
      {
        inputFile,
        errorMessage: error instanceof Error ? error.message : String(error),
        verboseData: {
          processedRecords,
          failedRecords,
        },
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