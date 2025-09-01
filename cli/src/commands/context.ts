import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { CounselMode } from '../types';

const COUNSEL_BASE = path.join(os.homedir(), '.counsel');

export function registerContextCommands(program: Command) {
  program
    .command('context')
    .description('Manage context for counsel projects')
    .addCommand(createAddCommand());
}

function createAddCommand(): Command {
  return new Command('add')
    .argument('<project-name>', 'Name of the counsel project')
    .requiredOption('--executed <text>', 'What was accomplished/executed')
    .requiredOption('--findings <text>', 'Key discoveries or results')  
    .requiredOption('--followup <text>', 'Next steps or follow-up plan')
    .description('Add structured update to project context')
    .action(async (projectName: string, options) => {
      const spinner = ora('Adding context update...').start();
      
      try {
        // Validate required fields are not empty
        if (!options.executed?.trim()) {
          spinner.fail('Field \'--executed\' cannot be empty');
          console.log(chalk.yellow('All fields must contain meaningful content'));
          return;
        }
        
        if (!options.findings?.trim()) {
          spinner.fail('Field \'--findings\' cannot be empty');
          console.log(chalk.yellow('All fields must contain meaningful content'));
          return;
        }
        
        if (!options.followup?.trim()) {
          spinner.fail('Field \'--followup\' cannot be empty');
          console.log(chalk.yellow('All fields must contain meaningful content'));
          return;
        }
        
        // Find the project directory
        const projectPath = await findProjectPath(projectName);
        if (!projectPath) {
          spinner.fail(`Project '${projectName}' not found`);
          console.log(chalk.yellow('Available projects:'));
          await listAvailableProjects();
          console.log(chalk.gray('Use \'counsel list\' to see all projects'));
          return;
        }
        
        // Check if context.md exists
        const contextPath = path.join(projectPath, 'context.md');
        try {
          await fs.access(contextPath);
        } catch {
          spinner.fail(`Context file not found: ${contextPath}`);
          console.log(chalk.yellow('Project exists but context.md file is missing'));
          return;
        }
        
        // Create the update content
        const timestamp = new Date().toISOString().split('T')[0] + ' ' + 
                         new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        const updateContent = `
## Update - ${timestamp}
**Executed**: ${options.executed.trim()}
**Key findings**: ${options.findings.trim()}
**Follow up plan**: ${options.followup.trim()}
`;
        
        // Append to context.md
        await fs.appendFile(contextPath, updateContent);
        
        spinner.succeed(`Context updated for '${projectName}'`);
        console.log(chalk.gray(`Added to: ${contextPath}`));
        
      } catch (error: any) {
        spinner.fail('Failed to add context update');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}

async function findProjectPath(projectName: string): Promise<string | null> {
  const modes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];
  
  for (const mode of modes) {
    const modePath = path.join(COUNSEL_BASE, `${mode}s`, projectName);
    try {
      await fs.access(modePath);
      return modePath;
    } catch {
      // Continue checking other modes
    }
  }
  
  return null;
}

async function listAvailableProjects(): Promise<void> {
  const modes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];
  const projects: string[] = [];
  
  for (const mode of modes) {
    const modePath = path.join(COUNSEL_BASE, `${mode}s`);
    try {
      const items = await fs.readdir(modePath);
      for (const item of items) {
        const itemPath = path.join(modePath, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          projects.push(item);
        }
      }
    } catch {
      // Mode directory doesn't exist, skip
    }
  }
  
  if (projects.length > 0) {
    // Remove duplicates and sort
    const uniqueProjects = [...new Set(projects)].sort();
    for (const project of uniqueProjects.slice(0, 10)) { // Limit to first 10
      console.log(chalk.gray(`  • ${project}`));
    }
    if (uniqueProjects.length > 10) {
      console.log(chalk.gray(`  ... and ${uniqueProjects.length - 10} more`));
    }
  } else {
    console.log(chalk.gray('  No projects found'));
  }
}