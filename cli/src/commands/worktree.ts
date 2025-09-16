import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const WOOLLY_BASE = path.join(os.homedir(), '.woolly');

interface WorktreeMetadata {
  path: string;
  branch: string;
  createdAt: string;
}

async function detectProjectType(): Promise<string | null> {
  // Check for various package managers and project types
  if (existsSync('package.json')) {
    if (existsSync('yarn.lock')) return 'yarn install';
    if (existsSync('pnpm-lock.yaml')) return 'pnpm install';
    return 'npm install';
  }
  if (existsSync('requirements.txt')) return 'pip install -r requirements.txt';
  if (existsSync('Pipfile')) return 'pipenv install';
  if (existsSync('Gemfile')) return 'bundle install';
  if (existsSync('go.mod')) return 'go mod download';
  if (existsSync('Cargo.toml')) return 'cargo build';
  return null;
}

async function copyEnvFiles(targetDir: string): Promise<string[]> {
  const envPatterns = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.npmrc',
    '.yarnrc'
  ];
  
  const copiedFiles: string[] = [];
  
  for (const pattern of envPatterns) {
    try {
      // Check for exact matches
      if (existsSync(pattern)) {
        await fs.copyFile(pattern, path.join(targetDir, pattern));
        copiedFiles.push(pattern);
      }
      
      // Check for .env.*.local pattern
      if (pattern === '.env.local') {
        const files = await fs.readdir('.');
        const envLocalFiles = files.filter(f => f.startsWith('.env.') && f.endsWith('.local'));
        for (const file of envLocalFiles) {
          await fs.copyFile(file, path.join(targetDir, file));
          copiedFiles.push(file);
        }
      }
    } catch {
      // File doesn't exist or couldn't be copied, skip
    }
  }
  
  return copiedFiles;
}

async function copyAIConfigDirs(targetDir: string): Promise<string[]> {
  const aiConfigDirs = [
    '.claude',
    '.cursor',
    '.github/copilot',
    '.vscode',  // Often contains AI-related settings
    '.idea'     // JetBrains AI settings
  ];
  
  const copiedDirs: string[] = [];
  
  for (const dir of aiConfigDirs) {
    try {
      if (existsSync(dir)) {
        // Create the directory structure
        const targetPath = path.join(targetDir, dir);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Copy directory recursively
        await copyDir(dir, targetPath);
        copiedDirs.push(dir);
      }
    } catch {
      // Directory doesn't exist or couldn't be copied, skip
    }
  }
  
  return copiedDirs;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export function registerWorktreeCommands(program: Command) {
  program
    .command('worktree <identifier>')
    .description('Create a git worktree for woolly work')
    .action(async (identifier: string) => {
      const spinner = ora('Creating git worktree...').start();
      
      try {
        // Parse mode and name from identifier (e.g., "feature-user-auth")
        const parts = identifier.split('-');
        const mode = parts[0];
        const name = parts.slice(1).join('-');
        
        // Validate that we're in a git repository
        try {
          await execAsync('git rev-parse --git-dir');
        } catch {
          spinner.fail('Not in a git repository');
          console.log(chalk.yellow('Git worktrees can only be created inside git repositories'));
          process.exit(1);
        }
        
        // Check if we're already in a worktree (prevent nested worktrees)
        try {
          const { stdout } = await execAsync('git rev-parse --show-superproject-working-tree');
          if (stdout.trim()) {
            spinner.fail('Already inside a git worktree');
            console.log(chalk.yellow('Cannot create nested worktrees. Navigate to the main repository first.'));
            process.exit(1);
          }
        } catch {
          // Not in a worktree, which is what we want
        }
        
        // Create the worktree
        const worktreePath = `../${identifier}`;
        const branchName = identifier;
        
        spinner.text = `Creating worktree at ${worktreePath}...`;
        
        try {
          await execAsync(`git worktree add ${worktreePath} -b ${branchName}`);
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            spinner.fail(`Branch '${branchName}' already exists`);
            console.log(chalk.yellow('Try a different name or remove the existing branch'));
          } else {
            spinner.fail('Failed to create worktree');
            console.log(chalk.red(error.message));
          }
          process.exit(1);
        }
        
        // Copy environment files and AI config directories
        spinner.text = 'Copying environment files...';
        const absoluteWorktreePath = path.resolve(worktreePath);
        const copiedFiles = await copyEnvFiles(absoluteWorktreePath);
        
        spinner.text = 'Copying AI configuration...';
        const copiedDirs = await copyAIConfigDirs(absoluteWorktreePath);
        
        // Update metadata.json in the woolly directory
        const woollyPath = path.join(WOOLLY_BASE, `${mode}s`, name);
        const metadataPath = path.join(woollyPath, 'metadata.json');
        
        if (existsSync(metadataPath)) {
          spinner.text = 'Updating metadata...';
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          metadata.worktree = {
            path: worktreePath,
            branch: branchName,
            createdAt: new Date().toISOString()
          };
          metadata.updatedAt = new Date().toISOString();
          await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        
        // Detect install command
        const installCommand = await detectProjectType();
        
        spinner.succeed(`Git worktree created successfully!`);
        
        console.log(chalk.green('\n✅ Worktree created at:'), chalk.cyan(worktreePath));
        console.log(chalk.green('🌿 Branch:'), chalk.cyan(branchName));
        
        if (copiedFiles.length > 0) {
          console.log(chalk.green('✅ Environment files copied:'), copiedFiles.join(', '));
        }
        
        if (copiedDirs.length > 0) {
          console.log(chalk.green('✅ AI config copied:'), copiedDirs.join(', '));
        }
        
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.gray('1.'), `cd ${worktreePath}`);
        if (installCommand) {
          console.log(chalk.gray('2.'), installCommand);
          console.log(chalk.gray('3.'), 'Start developing!');
        } else {
          console.log(chalk.gray('2.'), 'Set up your development environment');
          console.log(chalk.gray('3.'), 'Start developing!');
        }
        
      } catch (error: any) {
        spinner.fail('Failed to create worktree');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}