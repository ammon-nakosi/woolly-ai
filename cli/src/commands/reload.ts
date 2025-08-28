import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import readline from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CounselMode } from '../types';

const execAsync = promisify(exec);
const COUNSEL_BASE = path.join(os.homedir(), '.counsel');

interface WorkContext {
  name: string;
  mode: CounselMode;
  path: string;
}

async function findCounselWork(name: string): Promise<WorkContext | null> {
  const modes: CounselMode[] = ['feature', 'script', 'debug', 'review', 'vibe', 'prompt'];
  
  for (const mode of modes) {
    const workPath = path.join(COUNSEL_BASE, `${mode}s`, name);
    try {
      await fs.access(workPath);
      return { name, mode, path: workPath };
    } catch {
      // Not found in this mode
    }
  }
  
  return null;
}

async function detectWorkFromDirectory(): Promise<WorkContext | null> {
  const cwd = process.cwd();
  const counselMatch = cwd.match(/\.counsel[\/\\](\w+)s[\/\\]([^\/\\]+)/);
  
  if (counselMatch) {
    const [, modePrefix, name] = counselMatch;
    const mode = modePrefix as CounselMode;
    return { name, mode, path: path.join(COUNSEL_BASE, `${mode}s`, name) };
  }
  
  // Check for .counsel-active file
  const activeFile = path.join(COUNSEL_BASE, '.counsel-active');
  try {
    const active = JSON.parse(await fs.readFile(activeFile, 'utf8'));
    if (active.name && active.mode) {
      const workPath = path.join(COUNSEL_BASE, `${active.mode}s`, active.name);
      try {
        await fs.access(workPath);
        return { name: active.name, mode: active.mode, path: workPath };
      } catch {
        // Active file points to non-existent work
      }
    }
  } catch {
    // No active file or invalid
  }
  
  return null;
}

async function getUserConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

export function registerReloadCommands(program: Command) {
  program
    .command('reload')
    .description('Load Counsel Framework context for new sessions')
    .argument('[name]', 'Optional counsel work name')
    .action(async (name?: string) => {
      try {
        let work: WorkContext | null = null;
        
        if (name) {
          // Find specific work by name
          work = await findCounselWork(name);
          if (!work) {
            console.error(chalk.red(`Counsel work not found: ${name}`));
            console.log(chalk.yellow('Available work:'));
            await execAsync('counsel list --recent --limit 10');
            return;
          }
        } else {
          // Try to detect from current directory or active file
          work = await detectWorkFromDirectory();
          
          if (!work) {
            // Show available work and exit
            console.log(chalk.cyan('═'.repeat(63)));
            console.log(chalk.cyan('                    COUNSEL FRAMEWORK LOADED'));
            console.log(chalk.cyan('═'.repeat(63)));
            console.log();
            console.log('No specific counsel work detected. Available work:');
            console.log();
            
            try {
              const { stdout } = await execAsync('counsel list --recent --limit 10');
              console.log(stdout);
            } catch (error) {
              console.error(chalk.red('Error listing work:'), error);
            }
            
            console.log('To continue existing work:');
            console.log(chalk.gray('counsel reload [name]'));
            console.log();
            console.log('To start new work:');
            console.log(chalk.gray('counsel init [feature|script|debug|review|vibe|prompt] "description"'));
            console.log(chalk.cyan('═'.repeat(63)));
            return;
          }
        }
        
        // Show detected work and ask for confirmation
        console.log(chalk.cyan('═'.repeat(63)));
        console.log(chalk.cyan('                    COUNSEL FRAMEWORK LOADED'));
        console.log(chalk.cyan('═'.repeat(63)));
        console.log();
        console.log(`Detected work: ${chalk.bold(work.mode)}/${chalk.bold(work.name)}`);
        console.log(`Path: ${chalk.gray(work.path)}`);
        console.log();
        
        const confirmed = await getUserConfirmation(
          chalk.yellow('Continue with this work? (y/n): ')
        );
        
        if (!confirmed) {
          console.log(chalk.gray('Reload cancelled.'));
          return;
        }
        
        // Set as active work
        const activeFile = path.join(COUNSEL_BASE, '.counsel-active');
        await fs.writeFile(activeFile, JSON.stringify({
          name: work.name,
          mode: work.mode,
          path: work.path,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        // Load mode-specific guidelines
        console.log();
        console.log(chalk.yellow(`Loading ${work.mode} mode guidelines...`));
        
        try {
          const { stdout } = await execAsync(`counsel guidelines ${work.mode}`);
          console.log(stdout);
        } catch (error) {
          console.error(chalk.red('Failed to load guidelines:'), error);
        }
        
        console.log(chalk.cyan('═'.repeat(63)));
        console.log(chalk.green(`✅ Ready to work on ${work.mode}/${work.name}`));
        console.log(chalk.cyan('═'.repeat(63)));
        
      } catch (error: any) {
        console.error(chalk.red('Error during reload:'), error.message);
        process.exit(1);
      }
    });
}