import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { WoollyMode, WOOLLY_MODES, ProjectMetadata } from '../types';

const WOOLLY_BASE = path.join(os.homedir(), '.woolly');

// Extend ProjectMetadata to include worktree info
interface ExtendedProjectMetadata extends ProjectMetadata {
  projectPath?: string;
  worktree?: {
    path: string;
    branch: string;
    createdAt: string;
  } | null;
}

export function registerCreateCommands(program: Command) {
  program
    .command('create <mode> <name> <description>')
    .description('Create a new woolly work directory with initial context')
    .action(async (mode: string, name: string, description: string) => {
      const spinner = ora('Creating woolly work...').start();
      
      try {
        // Validate mode
        const validModes = WOOLLY_MODES;
        if (!validModes.includes(mode as WoollyMode)) {
          spinner.fail(`Invalid mode: ${mode}`);
          console.log(chalk.yellow(`Valid modes: ${validModes.join(', ')}`));
          process.exit(1);
        }
        
        // Create directory path
        const woollyPath = path.join(WOOLLY_BASE, `${mode}s`, name);
        
        // Check if already exists
        if (existsSync(woollyPath)) {
          spinner.fail(`Woolly ${mode} '${name}' already exists`);
          console.log(chalk.yellow(`Path: ${woollyPath}`));
          process.exit(1);
        }
        
        // Create directory structure
        await fs.mkdir(woollyPath, { recursive: true });
        
        // Create initial context.md
        const contextContent = `# Context: ${name}

## Initial Query
${description}
`;
        
        await fs.writeFile(
          path.join(woollyPath, 'context.md'),
          contextContent,
          'utf-8'
        );
        
        // Create metadata.json with standard fields plus worktree extension
        const metadata: ExtendedProjectMetadata = {
          name,
          mode: mode as WoollyMode,
          status: 'open',
          createdAt: new Date().toISOString(),
          closedAt: null,
          updatedAt: new Date().toISOString(),
          projectPath: process.cwd(),
          worktree: null
        };
        
        await fs.writeFile(
          path.join(woollyPath, 'metadata.json'),
          JSON.stringify(metadata, null, 2),
          'utf-8'
        );
        
        spinner.succeed(`Created woolly ${mode}: ${name}`);
        console.log(chalk.gray(`Path: ${woollyPath}`));
        
      } catch (error: any) {
        spinner.fail('Failed to create woolly work');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}