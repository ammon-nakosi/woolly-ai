import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { statSync } from 'fs';
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
  confidence?: 'high' | 'medium' | 'low';
  reason?: string;
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

async function getRecentProjects(limit: number = 10): Promise<WorkContext[]> {
  const modes: CounselMode[] = ['feature', 'script', 'debug', 'review', 'vibe', 'prompt'];
  const projects: WorkContext[] = [];
  
  for (const mode of modes) {
    const modePath = path.join(COUNSEL_BASE, `${mode}s`);
    try {
      const dirs = await fs.readdir(modePath);
      for (const dir of dirs) {
        const itemPath = path.join(modePath, dir);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          projects.push({
            name: dir,
            mode,
            path: itemPath,
            confidence: 'low'
          });
        }
      }
    } catch {
      // Mode directory doesn't exist
    }
  }
  
  // Sort by modification time (most recent first)
  projects.sort((a, b) => {
    try {
      const aStats = statSync(a.path);
      const bStats = statSync(b.path);
      return bStats.mtime.getTime() - aStats.mtime.getTime();
    } catch {
      return 0;
    }
  });
  
  return projects.slice(0, limit);
}

async function applyDiscernment(projects: WorkContext[]): Promise<WorkContext[]> {
  const cwd = process.cwd();
  const activeWork = await detectWorkFromDirectory();
  
  // Apply confidence scores based on context
  for (const project of projects) {
    // High confidence: Current directory matches
    if (cwd.includes(project.path) || project.path === activeWork?.path) {
      project.confidence = 'high';
      project.reason = 'Currently in this directory';
      continue;
    }
    
    // High confidence: Active file matches
    if (activeWork && activeWork.name === project.name && activeWork.mode === project.mode) {
      project.confidence = 'high';
      project.reason = 'Recently active';
      continue;
    }
    
    // Medium confidence: Working in counsel directory of same mode
    if (cwd.includes(`.counsel/${project.mode}s`)) {
      project.confidence = 'medium';
      project.reason = `Working in ${project.mode} mode`;
      continue;
    }
  }
  
  // Sort by confidence then recency
  projects.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return (confidenceOrder[b.confidence || 'low'] - confidenceOrder[a.confidence || 'low']);
  });
  
  // Decide how many to show based on confidence distribution
  const highConfidence = projects.filter(p => p.confidence === 'high');
  const mediumConfidence = projects.filter(p => p.confidence === 'medium');
  
  if (highConfidence.length === 1) {
    // Very confident - show just this one
    return highConfidence;
  } else if (highConfidence.length > 1) {
    // Multiple high confidence - show them
    return highConfidence.slice(0, 3);
  } else if (mediumConfidence.length > 0) {
    // Some medium confidence - show top medium and a few recent
    return [...mediumConfidence.slice(0, 2), ...projects.filter(p => p.confidence === 'low').slice(0, 2)].slice(0, 4);
  } else {
    // No strong signals - show top 5 most recent
    return projects.slice(0, 5);
  }
}

async function getUserSelection(projects: WorkContext[]): Promise<WorkContext | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(chalk.cyan('\nSelect a project to reload:\n'));
  
  projects.forEach((project, index) => {
    const num = chalk.bold(`[${index + 1}]`);
    const name = chalk.yellow(`${project.mode}/${project.name}`);
    const reason = project.reason ? chalk.gray(` - ${project.reason}`) : '';
    console.log(`  ${num} ${name}${reason}`);
  });
  
  console.log();
  
  return new Promise((resolve) => {
    const prompt = projects.length === 1 
      ? 'Press Enter to continue or q to quit: '
      : `Enter selection (1-${projects.length}) or q to quit: `;
      
    rl.question(chalk.yellow(prompt), (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'q') {
        resolve(null);
        return;
      }
      
      // Default to 1 if just Enter pressed and only one option
      if (answer === '' && projects.length === 1) {
        resolve(projects[0]);
        return;
      }
      
      const selection = parseInt(answer);
      if (selection >= 1 && selection <= projects.length) {
        resolve(projects[selection - 1]);
      } else {
        resolve(null);
      }
    });
  });
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
            console.log(chalk.yellow('Try one of these recent projects:'));
            const recent = await getRecentProjects(5);
            recent.forEach(p => {
              console.log(chalk.gray(`  counsel reload ${p.name}`));
            });
            return;
          }
        } else {
          // Use smart selection
          console.log(chalk.cyan('═'.repeat(63)));
          console.log(chalk.cyan('                    COUNSEL FRAMEWORK'));
          console.log(chalk.cyan('═'.repeat(63)));
          
          // Get recent projects and apply discernment
          const recentProjects = await getRecentProjects(10);
          if (recentProjects.length === 0) {
            console.log(chalk.yellow('\nNo counsel work found.'));
            console.log('\nTo start new work:');
            console.log(chalk.gray('counsel init [feature|script|debug|review|vibe|prompt] "description"'));
            return;
          }
          
          const relevantProjects = await applyDiscernment(recentProjects);
          work = await getUserSelection(relevantProjects);
          
          if (!work) {
            console.log(chalk.gray('Reload cancelled.'));
            return;
          }
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