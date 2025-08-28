#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

class TimeCommand {
  private program: Command;

  constructor() {
    this.program = new Command('time')
      .description('Get reliable system timestamp in various formats')
      .option('-f, --filename', 'Filename-safe format (2024-11-27_14-30-45)')
      .option('-e, --epoch', 'Epoch milliseconds (1701095445123)')
      .option('-h, --human', 'Human readable (Nov 27, 2024 at 2:30 PM)')
      .option('-d, --date', 'Date only (2024-11-27)')
      .option('-s, --short', 'Short time (14:30)')
      .option('--iso', 'ISO format (default)')
      .action((options) => this.getTime(options));
  }

  private getTime(options: {
    filename?: boolean;
    epoch?: boolean;
    human?: boolean;
    date?: boolean;
    short?: boolean;
    iso?: boolean;
  }): void {
    const now = new Date();
    
    if (options.filename) {
      // 2024-11-27_14-30-45
      const isoString = now.toISOString();
      const formatted = isoString
        .replace('T', '_')
        .replace(/:/g, '-')
        .replace(/\.\d{3}Z$/, '');
      console.log(formatted);
    } else if (options.epoch) {
      // 1701095445123
      console.log(Date.now().toString());
    } else if (options.human) {
      // Nov 27, 2024 at 2:30 PM
      const formatted = now.toLocaleString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      });
      console.log(formatted);
    } else if (options.date) {
      // 2024-11-27
      console.log(now.toISOString().split('T')[0]);
    } else if (options.short) {
      // 14:30
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      console.log(`${hours}:${minutes}`);
    } else {
      // Default: ISO format
      // 2024-11-27T14:30:45.123Z
      console.log(now.toISOString());
    }
  }

  getCommand(): Command {
    return this.program;
  }
}

// Export register function for main CLI
export function registerTimeCommands(program: Command) {
  const timeCmd = new Command('time')
    .description('Get reliable system timestamp in various formats')
    .option('-f, --filename', 'Filename-safe format (2024-11-27_14-30-45)')
    .option('-e, --epoch', 'Epoch milliseconds (1701095445123)')
    .option('-h, --human', 'Human readable (Nov 27, 2024 at 2:30 PM)')
    .option('-d, --date', 'Date only (2024-11-27)')
    .option('-s, --short', 'Short time (14:30)')
    .option('--iso', 'ISO format (default)')
    .action((options) => {
      const timeCommand = new TimeCommand();
      timeCommand['getTime'](options);
    });

  program.addCommand(timeCmd);
}

// Export for use in main CLI
export default TimeCommand;

// Allow direct execution
if (require.main === module) {
  const timeCommand = new TimeCommand();
  timeCommand.getCommand().parse(process.argv);
}