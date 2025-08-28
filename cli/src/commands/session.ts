#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { Command } from 'commander';
import { CounselMode } from '../types';

const COUNSEL_DIR = path.join(os.homedir(), '.counsel');
const FOUR_HOURS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

interface SessionFile {
  path: string;
  timestamp: number;
}

class SessionCommand {
  private program: Command;
  private activeWork: { name: string; mode: CounselMode } | null = null;

  constructor() {
    this.program = new Command('session')
      .description('Add entry to current counsel work session')
      .argument('<message>', 'Session entry message')
      .option('-w, --work <name>', 'Specify counsel work name')
      .option('-m, --mode <mode>', 'Specify counsel mode (feature, script, debug, review, vibe, prompt)')
      .option('--list', 'List recent session entries')
      .action((message, options) => this.handleSession(message, options));
  }

  private async handleSession(message: string, options: {
    work?: string;
    mode?: string;
    list?: boolean;
  }): Promise<void> {
    // Handle listing sessions
    if (options.list) {
      await this.listSessions(options.work, options.mode as CounselMode);
      return;
    }

    // Get work context
    const work = await this.getWorkContext(options.work, options.mode as CounselMode);
    if (!work) {
      console.error(chalk.red('No active counsel work found.'));
      console.log(chalk.yellow('Specify work with: counsel session "message" --work <name> --mode <mode>'));
      console.log(chalk.yellow('Or reload work first: counsel reload <name>'));
      return;
    }

    // Create session entry
    await this.createSessionEntry(work, message);
  }

  private async getWorkContext(workName?: string, mode?: CounselMode): Promise<{ name: string; mode: CounselMode; path: string } | null> {
    // If work name specified, find it
    if (workName) {
      const modes: CounselMode[] = mode ? [mode] : ['feature', 'script', 'debug', 'review', 'vibe', 'prompt'];
      
      for (const m of modes) {
        const workPath = path.join(COUNSEL_DIR, `${m}s`, workName);
        if (fs.existsSync(workPath)) {
          return { name: workName, mode: m, path: workPath };
        }
      }

      console.error(chalk.red(`Counsel work not found: ${workName}`));
      return null;
    }

    // Try to detect from current directory
    const cwd = process.cwd();
    const counselMatch = cwd.match(/\.counsel[\/\\](\w+)s[\/\\]([^\/\\]+)/);
    if (counselMatch) {
      const [, modePrefix, name] = counselMatch;
      const mode = modePrefix as CounselMode;
      return { name, mode, path: path.join(COUNSEL_DIR, `${mode}s`, name) };
    }

    // Check for .counsel-active file (could be set by counsel-reload)
    const activeFile = path.join(COUNSEL_DIR, '.counsel-active');
    if (fs.existsSync(activeFile)) {
      try {
        const active = JSON.parse(fs.readFileSync(activeFile, 'utf8'));
        if (active.name && active.mode) {
          const workPath = path.join(COUNSEL_DIR, `${active.mode}s`, active.name);
          if (fs.existsSync(workPath)) {
            return { name: active.name, mode: active.mode, path: workPath };
          }
        }
      } catch {
        // Invalid active file
      }
    }

    return null;
  }

  private async createSessionEntry(work: { name: string; mode: CounselMode; path: string }, message: string): Promise<void> {
    // Ensure sessions directory exists
    const sessionsDir = path.join(work.path, 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    // Find recent session file
    const recentSession = this.findRecentSession(sessionsDir);
    
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    let sessionFile: string;

    if (recentSession && (now - recentSession.timestamp < FOUR_HOURS)) {
      // Append to existing session
      sessionFile = recentSession.path;
    } else {
      // Create new session file
      sessionFile = path.join(sessionsDir, `session-${now}.md`);
      const header = `## Session ${now}\nStarted: ${timestamp}\n\n`;
      fs.writeFileSync(sessionFile, header);
    }

    // Format entry
    const timeShort = new Date(now).toTimeString().slice(0, 5);
    const entry = `### ${timeShort} - ${timestamp}\n${message}\n\n`;
    
    // Append entry
    fs.appendFileSync(sessionFile, entry);

    console.log(chalk.green(`✅ Session updated for ${work.mode}/${work.name}`));
    console.log(chalk.gray(`   ${sessionFile}`));
  }

  private findRecentSession(sessionsDir: string): SessionFile | null {
    if (!fs.existsSync(sessionsDir)) {
      return null;
    }

    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.startsWith('session-') && f.endsWith('.md'))
      .map(f => {
        const match = f.match(/session-(\d+)\.md/);
        if (match) {
          return {
            path: path.join(sessionsDir, f),
            timestamp: parseInt(match[1])
          };
        }
        return null;
      })
      .filter(f => f !== null) as SessionFile[];

    if (files.length === 0) {
      return null;
    }

    // Sort by timestamp descending
    files.sort((a, b) => b.timestamp - a.timestamp);
    return files[0];
  }

  private async listSessions(workName?: string, mode?: CounselMode): Promise<void> {
    const work = await this.getWorkContext(workName, mode);
    if (!work) {
      console.error(chalk.red('No counsel work specified or found.'));
      return;
    }

    const sessionsDir = path.join(work.path, 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      console.log(chalk.yellow('No sessions found.'));
      return;
    }

    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.startsWith('session-') && f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 5); // Show last 5 sessions

    console.log(chalk.cyan(`\n📝 Recent Sessions for ${work.mode}/${work.name}\n`));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(sessionsDir, file), 'utf8');
      const lines = content.split('\n');
      const sessionStart = lines.find(l => l.startsWith('Started:'));
      const entries = lines.filter(l => l.startsWith('###')).length;
      
      console.log(chalk.bold(`📄 ${file}`));
      if (sessionStart) {
        console.log(chalk.gray(`   ${sessionStart}`));
      }
      console.log(chalk.gray(`   Entries: ${entries}`));
      console.log();
    }
  }

  getCommand(): Command {
    return this.program;
  }
}

// Export register function for main CLI
export function registerSessionCommands(program: Command) {
  const sessionCmd = new Command('session')
    .description('Manage counsel work sessions')
    .argument('[message]', 'Session entry message')
    .option('-w, --work <name>', 'Specify counsel work name')
    .option('-m, --mode <mode>', 'Specify counsel mode')
    .option('-l, --list', 'List recent sessions')
    .action(async (message, options) => {
      const sessionCommand = new SessionCommand();
      
      if (options.list || !message) {
        // List sessions
        await sessionCommand['listSessions'](options.work, options.mode);
      } else {
        // Add session entry
        await sessionCommand['handleSession'](message, options);
      }
    });

  program.addCommand(sessionCmd);
}

// Export for use in main CLI
export default SessionCommand;

// Allow direct execution
if (require.main === module) {
  const sessionCommand = new SessionCommand();
  sessionCommand.getCommand().parse(process.argv);
}