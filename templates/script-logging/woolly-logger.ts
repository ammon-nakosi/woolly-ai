#!/usr/bin/env tsx

import { createWriteStream, existsSync, mkdirSync, writeFileSync, symlinkSync, unlinkSync, type WriteStream } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

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
    [key: string]: any;
  };
  errorMessage?: string;
  metadata?: Record<string, any>;
  verboseData?: {
    processedRecords?: any[];
    failedRecords?: any[];
    [key: string]: any;
  };
}

interface Logger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  success: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  close: () => void;
  saveOutcome: (customStats?: Record<string, any>, metadata?: Record<string, any>) => void;
  logFile: string;
  outcomeFile: string;
  stats: {
    successes: number;
    failures: number;
    warnings: number;
  };
}

interface LoggerOptions {
  scriptName: string;
  noLog?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  limit?: number;
  logDir?: string;
}

/**
 * Creates a dual-output logger for woolly scripts
 * Logs to both console and file for crash recovery
 */
export const createCounselLogger = (options: LoggerOptions): Logger => {
  const { scriptName, noLog = false, verbose = false, dryRun = false, limit, logDir } = options;
  
  let logStream: WriteStream | null = null;
  let logFilePath = '';
  let outcomeFilePath = '';
  const startTime = new Date();
  
  // Stats tracking
  const stats = {
    successes: 0,
    failures: 0,
    warnings: 0
  };
  
  // Build filename suffix based on context
  const buildFilenameSuffix = (): string => {
    const parts: string[] = [];
    if (dryRun) parts.push('dryrun');
    if (limit !== undefined) parts.push(`limit${limit}`);
    return parts.length > 0 ? '-' + parts.join('-') : '';
  };
  
  if (!noLog) {
    // Create directories
    const baseDir = join(homedir(), '.woolly', 'scripts', scriptName);
    const logsDir = join(baseDir, 'logs');
    const outcomesDir = join(baseDir, 'outcomes');
    mkdirSync(logsDir, { recursive: true });
    mkdirSync(outcomesDir, { recursive: true });
    
    // Create file names with context
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = buildFilenameSuffix();
    logFilePath = join(logsDir, `${scriptName}-${timestamp}${suffix}.log`);
    outcomeFilePath = join(outcomesDir, `${scriptName}-${timestamp}${suffix}.json`);
    
    // Create log stream
    logStream = createWriteStream(logFilePath, { flags: 'a' });
    
    // Log the file location as first entry
    const startMessage = `Logging to: ${logFilePath}`;
    const outcomeMessage = `Outcomes to: ${outcomeFilePath}`;
    console.info(`\x1b[36mℹ\x1b[0m ${startMessage}`);
    console.info(`\x1b[36mℹ\x1b[0m ${outcomeMessage}`);
    logStream.write(`[${new Date().toISOString()}] [INFO] ${startMessage}\n`);
    logStream.write(`[${new Date().toISOString()}] [INFO] ${outcomeMessage}\n`);
    logStream.write(`[${new Date().toISOString()}] [INFO] Script started: ${scriptName}\n`);
    logStream.write(`[${new Date().toISOString()}] [INFO] Run mode: ${dryRun ? 'DRY RUN' : 'LIVE'}${limit ? ` (limit: ${limit})` : ''}\n`);
    logStream.write(`[${new Date().toISOString()}] [INFO] Arguments: ${process.argv.slice(2).join(' ')}\n`);
    logStream.write(`[${new Date().toISOString()}] [INFO] Working directory: ${process.cwd()}\n`);
    logStream.write('='.repeat(80) + '\n');
  }
  
  const log = (level: string, color: string, symbol: string, ...args: any[]) => {
    // Format message
    const timestamp = new Date().toISOString();
    const message = args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    ).join(' ');
    
    // Track stats based on level
    if (level === 'SUCCESS') stats.successes++;
    if (level === 'ERROR') stats.failures++;
    if (level === 'WARN') stats.warnings++;
    
    // Log to console with color
    if (level !== 'DEBUG' || verbose) {
      console.log(`${color}${symbol}\x1b[0m ${message}`);
    }
    
    // Log to file if enabled
    if (logStream) {
      logStream.write(`[${timestamp}] [${level}] ${message}\n`);
    }
  };
  
  const saveOutcome = (customStats?: Record<string, any>, metadata?: Record<string, any>) => {
    if (noLog) return;
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const outcome: ScriptOutcome = {
      scriptName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      success: stats.failures === 0,
      runMode: {
        dryRun,
        limit,
        verbose
      },
      stats: {
        ...stats,
        ...customStats
      }
    };
    
    if (metadata) {
      // Separate verbose data from regular metadata
      const { verboseData, ...regularMetadata } = metadata;
      outcome.metadata = regularMetadata;
      
      // Only include verbose data if verbose mode is enabled
      if (verbose && verboseData) {
        outcome.verboseData = verboseData;
      }
    }
    
    // Save outcome file
    writeFileSync(outcomeFilePath, JSON.stringify(outcome, null, 2));
    
    // Create/update latest symlink
    const latestPath = join(homedir(), '.woolly', 'scripts', scriptName, 'outcomes', 'latest.json');
    try {
      // Remove existing symlink if it exists
      if (existsSync(latestPath)) {
        unlinkSync(latestPath);
      }
      // Create new symlink
      symlinkSync(outcomeFilePath, latestPath);
    } catch (error) {
      // Symlink creation might fail on some systems, ignore
    }
    
    console.info(`\x1b[36mℹ\x1b[0m Outcome saved to: ${outcomeFilePath}`);
  };
  
  return {
    info: (...args: any[]) => log('INFO', '\x1b[36m', 'ℹ', ...args),
    warn: (...args: any[]) => log('WARN', '\x1b[33m', '⚠', ...args),
    error: (...args: any[]) => log('ERROR', '\x1b[31m', '✗', ...args),
    success: (...args: any[]) => log('SUCCESS', '\x1b[32m', '✓', ...args),
    debug: (...args: any[]) => log('DEBUG', '\x1b[90m', '○', ...args),
    close: () => {
      if (logStream) {
        logStream.write('='.repeat(80) + '\n');
        logStream.write(`[${new Date().toISOString()}] [INFO] Script completed\n`);
        logStream.end();
      }
    },
    saveOutcome,
    logFile: logFilePath,
    outcomeFile: outcomeFilePath,
    stats
  };
};

// Export singleton factory for scripts
let globalLogger: Logger | null = null;

export const getCounselLogger = (options?: LoggerOptions): Logger => {
  if (!globalLogger && options) {
    globalLogger = createCounselLogger(options);
    
    // Handle process termination
    const cleanup = () => {
      if (globalLogger) {
        globalLogger.saveOutcome();
        globalLogger.close();
      }
    };
    
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (err) => {
      if (globalLogger) {
        globalLogger.error('Uncaught exception:', err);
        globalLogger.saveOutcome({ errorType: 'uncaughtException' }, { errorMessage: err.message });
        globalLogger.close();
      }
      process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
      if (globalLogger) {
        globalLogger.error('Unhandled rejection at:', promise, 'reason:', reason);
        globalLogger.saveOutcome({ errorType: 'unhandledRejection' }, { errorMessage: String(reason) });
        globalLogger.close();
      }
      process.exit(1);
    });
  }
  
  return globalLogger || createCounselLogger({ scriptName: 'unnamed-script' });
};