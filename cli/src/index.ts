#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initializeConfig } from './utils/config';
import { registerLinearCommands } from './commands/linear';
import { registerInitCommands } from './commands/init';
import { registerAddCommands } from './commands/add';
import { registerListCommands } from './commands/list';
import { registerSearchCommands } from './commands/search';
import { registerStatusCommands } from './commands/status';
import { registerCursorCommands } from './commands/cursor';
import { registerGitCommands } from './commands/git';
import { registerIndexCommands } from './commands/index';
import { registerChromaDBCommands } from './commands/chromadb';
import { registerOpenCommands } from './commands/open';

const program = new Command();

// ASCII art logo (optional)
const logo = chalk.cyan(`
╔═══════════════════════════════╗
║     COUNSEL FRAMEWORK CLI     ║
╚═══════════════════════════════╝
`);

async function main() {
  // Initialize config on first run
  await initializeConfig();
  
  program
    .name('counsel')
    .description('Counsel Framework CLI - Intelligent development workflow management')
    .version('1.0.0')
    .addHelpText('before', logo);

  // Register command groups
  registerInitCommands(program);
  registerAddCommands(program);
  registerChromaDBCommands(program);
  registerIndexCommands(program);
  registerLinearCommands(program);
  registerListCommands(program);
  registerOpenCommands(program);
  registerSearchCommands(program);
  registerStatusCommands(program);
  registerCursorCommands(program);
  registerGitCommands(program);

  // Global options
  program
    .option('--debug', 'Enable debug output')
    .option('--quiet', 'Suppress non-essential output');

  // Parse arguments
  await program.parseAsync(process.argv);

  // If no arguments, show help
  if (process.argv.length === 2) {
    program.help();
  }
}

// Error handling
process.on('unhandledRejection', (error: Error) => {
  console.error(chalk.red('Error:'), error.message);
  if (process.argv.includes('--debug')) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Run the CLI
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error.message);
  if (process.argv.includes('--debug')) {
    console.error(error.stack);
  }
  process.exit(1);
});