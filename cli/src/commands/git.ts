import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';
import inquirer from 'inquirer';

const COUNSEL_DIR = path.join(os.homedir(), '.counsel');

export function registerGitCommands(program: Command) {
  const gitCmd = program
    .command('git')
    .description('Manage git repository for counsel work');

  // Init subcommand
  gitCmd
    .command('init')
    .description('Initialize git repository in ~/.counsel')
    .option('--remote <url>', 'Set remote repository URL')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔧 Initializing Git Repository for Counsel\n'));
      
      const git: SimpleGit = simpleGit(COUNSEL_DIR);
      
      // Check if already a git repo
      const isRepo = await git.checkIsRepo();
      if (isRepo) {
        console.log(chalk.yellow('ℹ️  Git repository already initialized'));
        
        // Show current remotes
        const remotes = await git.getRemotes(true);
        if (remotes.length > 0) {
          console.log(chalk.gray('\nCurrent remotes:'));
          remotes.forEach(remote => {
            console.log(chalk.gray(`  ${remote.name}: ${remote.refs.push}`));
          });
        }
        
        if (options.remote) {
          await setupRemote(git, options.remote);
        }
        return;
      }
      
      const spinner = ora('Initializing git repository...').start();
      
      try {
        // Initialize repository
        await git.init();
        
        // Create .gitignore
        await createGitignore();
        
        // Add all files and make initial commit
        await git.add('.');
        await git.commit('Initial commit of counsel work');
        
        spinner.succeed('Git repository initialized');
        
        // Set up remote if provided
        if (options.remote) {
          await setupRemote(git, options.remote);
        } else {
          // Ask if they want to set up remote
          const { wantRemote } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'wantRemote',
              message: 'Would you like to set up a remote repository for backup/sync?',
              default: false
            }
          ]);
          
          if (wantRemote) {
            const { remoteUrl } = await inquirer.prompt([
              {
                type: 'input',
                name: 'remoteUrl',
                message: 'Remote repository URL:',
                validate: (input) => {
                  if (!input) return 'URL is required';
                  return true;
                }
              }
            ]);
            await setupRemote(git, remoteUrl);
          }
        }
        
        console.log(chalk.green('\n✅ Git repository ready!\n'));
        console.log(chalk.cyan('Your counsel work is now version controlled.'));
        console.log(chalk.gray('Use ' + chalk.bold('counsel git sync') + ' to sync with remote'));
        
      } catch (error) {
        spinner.fail(`Failed to initialize repository: ${error}`);
      }
    });

  // Status subcommand
  gitCmd
    .command('status')
    .description('Show git status of counsel work')
    .action(async () => {
      const git: SimpleGit = simpleGit(COUNSEL_DIR);
      
      // Check if it's a repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.log(chalk.red('❌ No git repository found'));
        console.log(chalk.gray('Run ' + chalk.bold('counsel git init') + ' to initialize'));
        return;
      }
      
      console.log(chalk.cyan('\n📊 Counsel Git Status\n'));
      
      try {
        // Get status
        const status = await git.status();
        
        // Show branch
        console.log(chalk.bold('Branch:'), status.current || 'none');
        
        // Show tracking
        if (status.tracking) {
          console.log(chalk.bold('Tracking:'), status.tracking);
          if (status.ahead > 0) {
            console.log(chalk.yellow(`  Ahead by ${status.ahead} commit(s)`));
          }
          if (status.behind > 0) {
            console.log(chalk.yellow(`  Behind by ${status.behind} commit(s)`));
          }
        } else {
          console.log(chalk.gray('Not tracking any remote branch'));
        }
        
        console.log('');
        
        // Show changes
        if (status.files.length === 0) {
          console.log(chalk.green('✅ Working directory clean'));
        } else {
          console.log(chalk.bold(`Changes (${status.files.length} files):`));
          
          // Group by status
          const modified = status.files.filter(f => f.working_dir === 'M');
          const added = status.files.filter(f => f.working_dir === '?' || f.working_dir === 'A');
          const deleted = status.files.filter(f => f.working_dir === 'D');
          
          if (modified.length > 0) {
            console.log(chalk.yellow('\nModified:'));
            modified.forEach(f => console.log(`  ${f.path}`));
          }
          
          if (added.length > 0) {
            console.log(chalk.green('\nNew:'));
            added.forEach(f => console.log(`  ${f.path}`));
          }
          
          if (deleted.length > 0) {
            console.log(chalk.red('\nDeleted:'));
            deleted.forEach(f => console.log(`  ${f.path}`));
          }
        }
        
      } catch (error) {
        console.error(chalk.red('Error getting status:'), error);
      }
    });

  // Sync subcommand
  gitCmd
    .command('sync')
    .description('Sync counsel work with remote repository')
    .option('--message <msg>', 'Commit message', 'Update counsel work')
    .action(async (options) => {
      const git: SimpleGit = simpleGit(COUNSEL_DIR);
      
      // Check if it's a repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.log(chalk.red('❌ No git repository found'));
        console.log(chalk.gray('Run ' + chalk.bold('counsel git init') + ' to initialize'));
        return;
      }
      
      console.log(chalk.cyan('\n🔄 Syncing Counsel Work\n'));
      
      const spinner = ora('Checking remote...').start();
      
      try {
        // Check for remotes
        const remotes = await git.getRemotes();
        if (remotes.length === 0) {
          spinner.fail('No remote repository configured');
          console.log(chalk.gray('Run ' + chalk.bold('counsel git remote <url>') + ' to add remote'));
          return;
        }
        
        // Pull latest changes
        spinner.text = 'Pulling latest changes...';
        try {
          await git.pull('origin', 'main', { '--no-rebase': null });
        } catch (pullError: any) {
          // If pull fails because remote doesn't exist yet, that's okay
          if (!pullError.message.includes('couldn\'t find remote ref')) {
            spinner.fail(`Pull failed: ${pullError.message}`);
            return;
          }
        }
        
        // Check for changes
        spinner.text = 'Checking for local changes...';
        const status = await git.status();
        
        if (status.files.length > 0) {
          // Add and commit changes
          spinner.text = 'Committing changes...';
          await git.add('.');
          await git.commit(options.message);
          
          spinner.text = 'Pushing to remote...';
          await git.push('origin', 'main', { '--set-upstream': null });
          
          spinner.succeed(`Synced ${status.files.length} file(s)`);
        } else {
          spinner.succeed('Already up to date');
        }
        
        console.log(chalk.green('\n✅ Sync complete!'));
        
      } catch (error: any) {
        spinner.fail(`Sync failed: ${error.message}`);
      }
    });

  // Remote subcommand
  gitCmd
    .command('remote [url]')
    .description('Configure remote repository')
    .action(async (url) => {
      const git: SimpleGit = simpleGit(COUNSEL_DIR);
      
      // Check if it's a repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.log(chalk.red('❌ No git repository found'));
        console.log(chalk.gray('Run ' + chalk.bold('counsel git init') + ' to initialize'));
        return;
      }
      
      if (!url) {
        // Show current remotes
        const remotes = await git.getRemotes(true);
        if (remotes.length === 0) {
          console.log(chalk.yellow('No remotes configured'));
          console.log(chalk.gray('Add a remote with: ' + chalk.bold('counsel git remote <url>')));
        } else {
          console.log(chalk.cyan('\n📡 Current Remotes\n'));
          remotes.forEach(remote => {
            console.log(chalk.bold(remote.name + ':'));
            console.log(`  Fetch: ${remote.refs.fetch}`);
            console.log(`  Push:  ${remote.refs.push}`);
          });
        }
      } else {
        await setupRemote(git, url);
      }
    });
}

async function setupRemote(git: SimpleGit, url: string): Promise<void> {
  const spinner = ora('Setting up remote...').start();
  
  try {
    // Check if origin exists
    const remotes = await git.getRemotes();
    const hasOrigin = remotes.some(r => r.name === 'origin');
    
    if (hasOrigin) {
      // Update existing
      await git.remote(['set-url', 'origin', url]);
      spinner.succeed('Updated remote origin');
    } else {
      // Add new
      await git.addRemote('origin', url);
      spinner.succeed('Added remote origin');
    }
    
    console.log(chalk.gray(`Remote URL: ${url}`));
    
    // Ask if they want to push now
    const { pushNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'pushNow',
        message: 'Push existing counsel work to remote now?',
        default: true
      }
    ]);
    
    if (pushNow) {
      const pushSpinner = ora('Pushing to remote...').start();
      try {
        await git.push('origin', 'main', { '--set-upstream': null });
        pushSpinner.succeed('Pushed to remote');
      } catch (error: any) {
        // If main doesn't exist, try master
        if (error.message.includes('main')) {
          await git.branch(['main']);
          await git.push('origin', 'main', { '--set-upstream': null });
          pushSpinner.succeed('Pushed to remote');
        } else {
          pushSpinner.fail(`Push failed: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    spinner.fail(`Failed to set up remote: ${error}`);
  }
}

async function createGitignore(): Promise<void> {
  const gitignorePath = path.join(COUNSEL_DIR, '.gitignore');
  
  const content = `# Counsel Framework Git Ignore
# This file controls what gets synced across machines

# Python virtual environment (large, regenerable)
venv/
*.pyc
__pycache__/
.Python
env/
ENV/

# ChromaDB database files (can be large, binary)
chromadb/
*.db
*.sqlite

# Temporary and build files
*.log
*.swp
*.swo
.DS_Store
tmp/
temp/
dist/
build/
node_modules/

# CLI installation (if present from testing)
cli/

# IDE files
.vscode/
.idea/
*.sublime-*

# Backup files
*.bak
*.backup
*~

# Optional: Uncomment to exclude sensitive configuration
# config.json

# Optional: Uncomment to exclude specific counsel modes
# debug/
# vibe/
`;
  
  await fs.writeFile(gitignorePath, content);
}