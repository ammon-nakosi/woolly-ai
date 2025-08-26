import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import os from 'os';

export function registerCursorCommands(program: Command) {
  const cursor = program
    .command('cursor')
    .description('Manage Cursor IDE commands for the current project');

  // Init subcommand
  cursor
    .command('init')
    .description('Initialize Cursor commands in the current project')
    .option('--force', 'Overwrite existing commands')
    .option('--no-gitignore', 'Skip adding to .gitignore')
    .action(async (options) => {
      console.log(chalk.cyan('\n🚀 Initializing Cursor Commands\n'));
      
      const cursorDir = path.join(process.cwd(), '.cursor');
      const cursorCommandsDir = path.join(cursorDir, 'commands');
      
      // Check if already initialized
      try {
        await fs.access(cursorCommandsDir);
        if (!options.force) {
          console.log(chalk.yellow('ℹ️  Cursor commands already initialized.'));
          console.log(chalk.gray(`   Use ${chalk.bold('counsel cursor update')} to update to latest version`));
          console.log(chalk.gray(`   Use ${chalk.bold('counsel cursor init --force')} to overwrite`));
          return;
        }
      } catch {
        // Directory doesn't exist, we'll create it
      }
      
      await installCursorCommands(options.force);
      
      // Handle .gitignore
      if (options.gitignore !== false) {
        await addToGitignore();
      }
      
      showSuccessMessage('init');
    });

  // Update subcommand
  cursor
    .command('update')
    .description('Update Cursor commands to the latest version')
    .option('--init', 'Initialize if not already present')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔄 Updating Cursor Commands\n'));
      
      const cursorCommandsDir = path.join(process.cwd(), '.cursor', 'commands');
      
      // Check if initialized
      try {
        await fs.access(cursorCommandsDir);
      } catch {
        if (options.init) {
          console.log(chalk.yellow('Cursor not initialized. Initializing now...'));
          await installCursorCommands(false);
          await addToGitignore();
          showSuccessMessage('init');
          return;
        } else {
          console.log(chalk.red('❌ Cursor commands not initialized in this project.'));
          console.log(chalk.gray(`   Run ${chalk.bold('counsel cursor init')} first`));
          return;
        }
      }
      
      await installCursorCommands(true);
      showSuccessMessage('update');
    });
}

async function installCursorCommands(overwrite: boolean): Promise<void> {
  const spinner = ora('Installing Cursor commands...').start();
  
  try {
    // Get source commands from the framework
    const frameworkRoot = path.join(__dirname, '..', '..', '..');
    const commandsDir = path.join(frameworkRoot, 'commands');
    
    // Read command files
    let commandFiles: string[];
    try {
      const files = await fs.readdir(commandsDir);
      commandFiles = files.filter(f => f.startsWith('counsel-') && f.endsWith('.md'));
    } catch (error) {
      spinner.fail('Could not find Counsel Framework commands');
      throw new Error('Make sure counsel-framework is properly installed');
    }
    
    if (commandFiles.length === 0) {
      spinner.fail('No counsel commands found');
      return;
    }
    
    // Create .cursor/commands directory
    const cursorCommandsDir = path.join(process.cwd(), '.cursor', 'commands');
    await fs.mkdir(cursorCommandsDir, { recursive: true });
    
    // Copy commands with Cursor compatibility note
    let copied = 0;
    let updated = 0;
    
    for (const file of commandFiles) {
      const src = path.join(commandsDir, file);
      const dest = path.join(cursorCommandsDir, file);
      
      // Check if file exists
      const exists = await fs.access(dest).then(() => true).catch(() => false);
      
      // Read source content
      let content = await fs.readFile(src, 'utf-8');
      
      // Add Cursor compatibility note if not present
      if (!content.includes('Cursor compatibility')) {
        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd > -1) {
          content = content.slice(0, frontmatterEnd) + 
            '# Note: Cursor commands are in beta. Syntax may change.\n' +
            '# Installed by Counsel Framework\n' +
            content.slice(frontmatterEnd);
        }
      }
      
      await fs.writeFile(dest, content);
      
      if (exists && overwrite) {
        updated++;
      } else {
        copied++;
      }
    }
    
    if (overwrite && updated > 0) {
      spinner.succeed(`Updated ${updated} Cursor commands`);
    } else {
      spinner.succeed(`Installed ${copied} Cursor commands`);
    }
  } catch (error) {
    spinner.fail(`Failed to install Cursor commands: ${error}`);
    throw error;
  }
}

async function addToGitignore(): Promise<void> {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  try {
    let content = '';
    try {
      content = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // .gitignore doesn't exist, we'll create it
    }
    
    // Check if already ignored
    if (content.includes('.cursor/commands')) {
      console.log(chalk.gray('📝 .cursor/commands/ already in .gitignore'));
      return;
    }
    
    // Add to .gitignore
    const addition = '\n# Counsel Framework - Cursor IDE commands (project-specific)\n.cursor/commands/\n';
    await fs.writeFile(gitignorePath, content + addition);
    console.log(chalk.gray('📝 Added .cursor/commands/ to .gitignore'));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not update .gitignore: ${error}`));
  }
}

function showSuccessMessage(action: 'init' | 'update'): void {
  console.log(chalk.green(`\n✅ Cursor commands ${action === 'init' ? 'initialized' : 'updated'} successfully!\n`));
  console.log(chalk.cyan('Next steps:'));
  console.log(`  1. ${action === 'init' ? 'Restart' : 'Reload'} Cursor IDE`);
  console.log('  2. Open the chat/composer (Cmd/Ctrl + L)');
  console.log('  3. Type / to see available Counsel commands');
  console.log(chalk.gray('\nNote: Commands are project-specific and in beta'));
}