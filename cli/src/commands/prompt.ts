import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { libraryService } from '../services/library-service';
import { Prompt, RuleScope } from '../types/library';

export function registerPromptCommands(program: Command) {
  const prompt = program
    .command('prompt')
    .description('Manage counsel prompts library');

  // List prompts
  prompt
    .command('list')
    .description('List all prompts')
    .option('--scope <scope>', 'Filter by scope (project, session, user)')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .action(async (options) => {
      const spinner = ora('Loading prompts...').start();
      
      try {
        const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined;
        
        const prompts = await libraryService.listPrompts({
          scope: options.scope as RuleScope,
          tags
        });

        spinner.stop();

        if (prompts.length === 0) {
          console.log(chalk.gray('No prompts found.'));
          console.log(chalk.gray('Create your first prompt with: /counsel-remember prompt "description"'));
          return;
        }

        console.log(chalk.bold(`\n🤖 Counsel Prompts (${prompts.length})\n`));

        for (const prompt of prompts) {
          console.log(chalk.bold(prompt.title));
          console.log(`  ${chalk.gray(prompt.description)}`);
          console.log(`  ${chalk.dim(`ID: ${prompt.id} | Scope: ${prompt.scope}`)}`);
          if (prompt.tags && prompt.tags.length > 0) {
            console.log(`  ${chalk.dim(`Tags: ${prompt.tags.join(', ')}`)}`);
          }
          if (prompt.usage_count > 0) {
            console.log(`  ${chalk.dim(`Used: ${prompt.usage_count} times`)}`);
          }
          console.log();
        }

        console.log(chalk.gray('\nManage prompts with: counsel prompt show|use|edit|delete [id]'));
      } catch (error: any) {
        spinner.fail('Failed to list prompts');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Show prompt details
  prompt
    .command('show <id>')
    .description('Show detailed prompt information')
    .action(async (id: string) => {
      const spinner = ora('Loading prompt...').start();
      
      try {
        const prompt = await libraryService.getPrompt(id);
        
        if (!prompt) {
          spinner.fail(`Prompt not found: ${id}`);
          return;
        }

        spinner.stop();

        console.log(chalk.bold(`\n🤖 Prompt: ${prompt.title}\n`));
        console.log('═'.repeat(50));
        
        console.log(chalk.cyan('Metadata:'));
        console.log(`  ID: ${prompt.id}`);
        console.log(`  Scope: ${prompt.scope}`);
        console.log(`  Created: ${new Date(prompt.created).toLocaleDateString()}`);
        console.log(`  Updated: ${new Date(prompt.updated).toLocaleDateString()}`);
        console.log(`  Usage Count: ${prompt.usage_count}`);
        
        if (prompt.tags && prompt.tags.length > 0) {
          console.log(`  Tags: ${prompt.tags.join(', ')}`);
        }

        console.log(chalk.cyan('\nDescription:'));
        console.log(`  ${prompt.description}`);

        console.log(chalk.cyan('\nPrompt:'));
        console.log(prompt.content.split('\n').map(line => '  ' + line).join('\n'));

        console.log();
      } catch (error: any) {
        spinner.fail('Failed to show prompt');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Create prompt (called from slash command)
  prompt
    .command('create')
    .description('Create a new prompt')
    .requiredOption('--title <title>', 'Prompt title')
    .requiredOption('--description <description>', 'Prompt description')
    .requiredOption('--prompt <prompt>', 'The actual prompt text')
    .option('--scope <scope>', 'Prompt scope', 'project')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (options) => {
      const spinner = ora('Creating prompt...').start();
      
      try {
        const id = libraryService.generatePromptId();
        
        const prompt: Prompt = {
          id,
          title: options.title,
          scope: options.scope as RuleScope,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          description: options.description,
          content: options.prompt,
          tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [],
          usage_count: 0
        };

        await libraryService.savePrompt(prompt);
        
        spinner.succeed(`Created prompt: ${prompt.title}`);
        console.log(chalk.gray(`ID: ${id}`));
      } catch (error: any) {
        spinner.fail('Failed to create prompt');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Use prompt (copy to clipboard)
  prompt
    .command('use <id>')
    .description('Copy prompt to clipboard and increment usage count')
    .action(async (id: string) => {
      const spinner = ora('Loading prompt...').start();
      
      try {
        const prompt = await libraryService.getPrompt(id);
        
        if (!prompt) {
          spinner.fail(`Prompt not found: ${id}`);
          return;
        }

        // Increment usage count
        await libraryService.updatePrompt(id, { 
          usage_count: prompt.usage_count + 1 
        });

        spinner.stop();
        
        console.log(chalk.bold(`\n🤖 ${prompt.title}\n`));
        console.log('─'.repeat(50));
        console.log(prompt.content);
        console.log('─'.repeat(50));
        console.log(chalk.green('\n✓ Prompt displayed above'));
        console.log(chalk.gray(`Usage count: ${prompt.usage_count + 1}`));
      } catch (error: any) {
        spinner.fail('Failed to use prompt');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Delete prompt
  prompt
    .command('delete <id>')
    .description('Delete a prompt')
    .action(async (id: string) => {
      const spinner = ora('Deleting prompt...').start();
      
      try {
        const prompt = await libraryService.getPrompt(id);
        
        if (!prompt) {
          spinner.fail(`Prompt not found: ${id}`);
          return;
        }

        await libraryService.deletePrompt(id);
        spinner.succeed(`Deleted prompt: ${prompt.title}`);
      } catch (error: any) {
        spinner.fail('Failed to delete prompt');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Edit prompt
  prompt
    .command('edit <id>')
    .description('Edit an existing prompt')
    .action(async (id: string) => {
      const spinner = ora('Loading prompt...').start();
      
      try {
        const prompt = await libraryService.getPrompt(id);
        
        if (!prompt) {
          spinner.fail(`Prompt not found: ${id}`);
          return;
        }

        spinner.stop();

        console.log(chalk.bold(`\n📝 Editing Prompt: ${prompt.title}\n`));
        console.log(chalk.gray('Press Ctrl+C to cancel at any time\n'));

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'field',
            message: 'What would you like to edit?',
            choices: [
              { name: 'Title', value: 'title' },
              { name: 'Description', value: 'description' },
              { name: 'Content', value: 'content' },
              { name: 'Variables', value: 'variables' },
              { name: 'Tags', value: 'tags' },
              { name: 'Context', value: 'context' },
              { name: 'Cancel', value: 'cancel' }
            ]
          }
        ]);

        if (answers.field === 'cancel') {
          console.log(chalk.gray('Edit cancelled'));
          return;
        }

        let updates: Partial<Prompt> = {};
        
        switch (answers.field) {
          case 'title':
            const titleAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'New title:',
              default: prompt.title,
              validate: (input) => input.trim().length > 0 || 'Title cannot be empty'
            }]);
            updates.title = titleAnswer.value.trim();
            break;

          case 'description':
            const descAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'New description:',
              default: prompt.description,
              validate: (input) => input.trim().length > 0 || 'Description cannot be empty'
            }]);
            updates.description = descAnswer.value.trim();
            break;

          case 'content':
            console.log(chalk.gray('Enter prompt content (press Ctrl+D when done):'));
            const contentAnswer = await inquirer.prompt([{
              type: 'editor',
              name: 'value',
              message: 'Edit content:',
              default: prompt.content
            }]);
            updates.content = contentAnswer.value.trim();
            break;

          case 'variables':
            const varsAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'Variables (comma-separated):',
              default: prompt.variables?.join(', ') || '',
            }]);
            if (varsAnswer.value.trim()) {
              updates.variables = varsAnswer.value.split(',').map(v => v.trim()).filter(Boolean);
            } else {
              updates.variables = [];
            }
            break;

          case 'tags':
            const tagsAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'Tags (comma-separated):',
              default: prompt.tags?.join(', ') || '',
            }]);
            if (tagsAnswer.value.trim()) {
              updates.tags = tagsAnswer.value.split(',').map(t => t.trim()).filter(Boolean);
            } else {
              updates.tags = [];
            }
            break;

          case 'context':
            const contextAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'Context description:',
              default: prompt.context || '',
            }]);
            updates.context = contextAnswer.value.trim() || undefined;
            break;
        }

        updates.updated = new Date().toISOString();

        const updateSpinner = ora('Updating prompt...').start();
        const success = await libraryService.updatePrompt(id, updates);
        
        if (success) {
          updateSpinner.succeed(`Prompt updated: ${prompt.title}`);
        } else {
          updateSpinner.fail('Failed to update prompt');
        }
      } catch (error: any) {
        if (error.name === 'ExitPromptError') {
          console.log(chalk.gray('\nEdit cancelled'));
        } else {
          spinner.fail('Failed to edit prompt');
          console.error(chalk.red('Error:'), error.message);
        }
      }
    });
}