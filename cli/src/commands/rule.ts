import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as path from 'path';
import { libraryService } from '../services/library-service';
import { ruleInjectionService } from '../services/rule-injection';
import { Rule, RuleScope, RuleStatus, RuleType, RuleDisplay } from '../types/library';

export function registerRuleCommands(program: Command) {
  const rule = program
    .command('rule')
    .description('Manage woolly rules library');

  // List rules
  rule
    .command('list')
    .description('List all rules')
    .option('--scope <scope>', 'Filter by scope (project, session, user)')
    .option('--status <status>', 'Filter by status (active, inactive)')
    .option('--repo <path>', 'Filter by repository path')
    .option('--type <type>', 'Filter by rule type')
    .action(async (options) => {
      const spinner = ora('Loading rules...').start();
      
      try {
        const rules = await libraryService.listRules({
          scope: options.scope as RuleScope,
          status: options.status as RuleStatus,
          repoPath: options.repo
        });

        spinner.stop();

        if (rules.length === 0) {
          console.log(chalk.gray('No rules found.'));
          console.log(chalk.gray('Create your first rule with: /woolly-remember rule "your guideline"'));
          return;
        }

        console.log(chalk.bold(`\n📚 Woolly Rules (${rules.length})\n`));

        // Group by scope
        const byScope = {
          project: rules.filter(r => r.scope === 'project'),
          session: rules.filter(r => r.scope === 'session'),
          user: rules.filter(r => r.scope === 'user')
        };

        for (const [scope, scopeRules] of Object.entries(byScope)) {
          if (scopeRules.length === 0) continue;

          console.log(chalk.cyan(`${scope.toUpperCase()} RULES`));
          console.log('─'.repeat(40));

          for (const rule of scopeRules) {
            const statusIcon = rule.status === 'active' ? '✓' : '○';
            const displayIcon = rule.display === 'full' ? '📖' : 
                              rule.display === 'summary' ? '📄' : '👁';
            
            console.log(`${statusIcon} ${displayIcon} ${chalk.bold(rule.title)}`);
            console.log(`  ${chalk.gray(rule.summary)}`);
            console.log(`  ${chalk.dim(`ID: ${rule.id} | Type: ${rule.type}`)}`);
            if (rule.repo) {
              console.log(`  ${chalk.dim(`Repo: ${rule.repo.name}`)}`);
            }
            console.log();
          }
        }

        console.log(chalk.gray('\nManage rules with: woolly rule show|edit|toggle|delete [id]'));
      } catch (error: any) {
        spinner.fail('Failed to list rules');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Show rule details
  rule
    .command('show <id>')
    .description('Show detailed rule information')
    .action(async (id: string) => {
      const spinner = ora('Loading rule...').start();
      
      try {
        const rule = await libraryService.getRule(id);
        
        if (!rule) {
          spinner.fail(`Rule not found: ${id}`);
          return;
        }

        spinner.stop();

        console.log(chalk.bold(`\n📚 Rule: ${rule.title}\n`));
        console.log('═'.repeat(50));
        
        console.log(chalk.cyan('Metadata:'));
        console.log(`  ID: ${rule.id}`);
        console.log(`  Type: ${rule.type}`);
        console.log(`  Scope: ${rule.scope}`);
        console.log(`  Status: ${rule.status}`);
        console.log(`  Display: ${rule.display}`);
        console.log(`  Created: ${new Date(rule.created).toLocaleDateString()}`);
        console.log(`  Updated: ${new Date(rule.updated).toLocaleDateString()}`);
        
        if (rule.repo) {
          console.log(chalk.cyan('\nRepository:'));
          console.log(`  Name: ${rule.repo.name}`);
          console.log(`  Path: ${rule.repo.path}`);
          if (rule.repo.url) {
            console.log(`  URL: ${rule.repo.url}`);
          }
        }

        console.log(chalk.cyan('\nSummary:'));
        console.log(`  ${rule.summary}`);

        if (rule.details) {
          console.log(chalk.cyan('\nDetails:'));
          console.log(rule.details.split('\n').map(line => '  ' + line).join('\n'));
        }

        console.log();
      } catch (error: any) {
        spinner.fail('Failed to show rule');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Create rule (called from slash command)
  rule
    .command('create')
    .description('Create a new rule')
    .requiredOption('--type <type>', 'Rule type')
    .requiredOption('--title <title>', 'Rule title')
    .requiredOption('--summary <summary>', 'Rule summary')
    .option('--details <details>', 'Rule details')
    .option('--scope <scope>', 'Rule scope', 'project')
    .option('--repo-path <path>', 'Repository path')
    .option('--repo-name <name>', 'Repository name')
    .option('--repo-url <url>', 'Repository URL')
    .option('--project-name <name>', 'Woolly project name (for session rules)')
    .action(async (options) => {
      const spinner = ora('Creating rule...').start();
      
      try {
        const id = libraryService.generateRuleId(options.scope as RuleScope);
        
        const rule: Rule = {
          id,
          type: options.type as RuleType,
          title: options.title,
          display: 'full',
          scope: options.scope as RuleScope,
          status: 'active',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          summary: options.summary,
          details: options.details
        };

        // Add repo info if provided
        if (options.repoPath || options.repoName) {
          rule.repo = {
            path: options.repoPath || process.cwd(),
            name: options.repoName || path.basename(process.cwd()),
            url: options.repoUrl
          };
        }

        // Add project name for session rules
        if (options.scope === 'session' && options.projectName) {
          rule.projectName = options.projectName;
        }

        await libraryService.saveRule(rule);
        
        // Refresh rule files if it's a project rule
        if (rule.scope === 'project' || rule.scope === 'session') {
          await ruleInjectionService.refreshRules(rule.repo?.path || process.cwd());
        }
        
        spinner.succeed(`Created rule: ${rule.title}`);
        console.log(chalk.gray(`ID: ${id}`));
      } catch (error: any) {
        spinner.fail('Failed to create rule');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Toggle rule status
  rule
    .command('toggle <id>')
    .description('Toggle rule active/inactive status')
    .action(async (id: string) => {
      const spinner = ora('Updating rule...').start();
      
      try {
        const rule = await libraryService.getRule(id);
        
        if (!rule) {
          spinner.fail(`Rule not found: ${id}`);
          return;
        }

        const newStatus: RuleStatus = rule.status === 'active' ? 'inactive' : 'active';
        await libraryService.updateRule(id, { status: newStatus });
        
        // Refresh rule files
        if (rule.scope === 'project' || rule.scope === 'session') {
          await ruleInjectionService.refreshRules(rule.repo?.path || process.cwd());
        }
        
        spinner.succeed(`Rule ${rule.title} is now ${newStatus}`);
      } catch (error: any) {
        spinner.fail('Failed to toggle rule');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Delete rule
  rule
    .command('delete <id>')
    .description('Delete a rule')
    .action(async (id: string) => {
      const spinner = ora('Deleting rule...').start();
      
      try {
        const rule = await libraryService.getRule(id);
        
        if (!rule) {
          spinner.fail(`Rule not found: ${id}`);
          return;
        }

        await libraryService.deleteRule(id);
        spinner.succeed(`Deleted rule: ${rule.title}`);
      } catch (error: any) {
        spinner.fail('Failed to delete rule');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Edit rule
  rule
    .command('edit <id>')
    .description('Edit an existing rule')
    .action(async (id: string) => {
      const spinner = ora('Loading rule...').start();
      
      try {
        const rule = await libraryService.getRule(id);
        
        if (!rule) {
          spinner.fail(`Rule not found: ${id}`);
          return;
        }

        spinner.stop();

        console.log(chalk.bold(`\n📝 Editing Rule: ${rule.title}\n`));
        console.log(chalk.gray('Press Ctrl+C to cancel at any time\n'));

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'field',
            message: 'What would you like to edit?',
            choices: [
              { name: 'Title', value: 'title' },
              { name: 'Summary', value: 'summary' },
              { name: 'Details', value: 'details' },
              { name: 'Type', value: 'type' },
              { name: 'Display Mode', value: 'display' },
              { name: 'Status', value: 'status' },
              { name: 'Cancel', value: 'cancel' }
            ]
          }
        ]);

        if (answers.field === 'cancel') {
          console.log(chalk.gray('Edit cancelled'));
          return;
        }

        let updates: Partial<Rule> = {};
        
        switch (answers.field) {
          case 'title':
            const titleAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'New title:',
              default: rule.title,
              validate: (input) => input.trim().length > 0 || 'Title cannot be empty'
            }]);
            updates.title = titleAnswer.value.trim();
            break;

          case 'summary':
            const summaryAnswer = await inquirer.prompt([{
              type: 'input',
              name: 'value',
              message: 'New summary:',
              default: rule.summary,
              validate: (input) => input.trim().length > 0 || 'Summary cannot be empty'
            }]);
            updates.summary = summaryAnswer.value.trim();
            break;

          case 'details':
            console.log(chalk.gray('Enter details (press Ctrl+D when done):'));
            const detailsAnswer = await inquirer.prompt([{
              type: 'editor',
              name: 'value',
              message: 'Edit details:',
              default: rule.details || ''
            }]);
            updates.details = detailsAnswer.value.trim();
            break;

          case 'type':
            const typeAnswer = await inquirer.prompt([{
              type: 'list',
              name: 'value',
              message: 'New type:',
              default: rule.type,
              choices: [
                { name: 'Coding Practices', value: 'coding-practices' },
                { name: 'Code Snippet', value: 'code-snippet' },
                { name: 'Workaround', value: 'workaround' },
                { name: 'Config', value: 'config' },
                { name: 'Reference', value: 'reference' },
                { name: 'Guideline', value: 'guideline' },
                { name: 'General Note', value: 'general-note' }
              ]
            }]);
            updates.type = typeAnswer.value as RuleType;
            break;

          case 'display':
            const displayAnswer = await inquirer.prompt([{
              type: 'list',
              name: 'value',
              message: 'New display mode:',
              default: rule.display,
              choices: [
                { name: 'Full - Show all details', value: 'full' },
                { name: 'Summary - Show title and summary only', value: 'summary' },
                { name: 'Hidden - Do not show in CLAUDE.md', value: 'hidden' }
              ]
            }]);
            updates.display = displayAnswer.value as RuleDisplay;
            break;

          case 'status':
            const statusAnswer = await inquirer.prompt([{
              type: 'list',
              name: 'value',
              message: 'New status:',
              default: rule.status,
              choices: [
                { name: 'Active', value: 'active' },
                { name: 'Inactive', value: 'inactive' }
              ]
            }]);
            updates.status = statusAnswer.value as RuleStatus;
            break;
        }

        updates.updated = new Date().toISOString();

        const updateSpinner = ora('Updating rule...').start();
        const success = await libraryService.updateRule(id, updates);
        
        if (success) {
          updateSpinner.succeed(`Rule updated: ${rule.title}`);
          
          // Refresh CLAUDE.md files
          const refreshSpinner = ora('Refreshing CLAUDE.md files...').start();
          await ruleInjectionService.refreshRules(process.cwd());
          refreshSpinner.succeed('CLAUDE.md files updated');
        } else {
          updateSpinner.fail('Failed to update rule');
        }
      } catch (error: any) {
        if (error.name === 'ExitPromptError') {
          console.log(chalk.gray('\nEdit cancelled'));
        } else {
          spinner.fail('Failed to edit rule');
          console.error(chalk.red('Error:'), error.message);
        }
      }
    });

  // Refresh rule files
  rule
    .command('refresh')
    .description('Regenerate CLAUDE.md rule files')
    .action(async () => {
      const spinner = ora('Refreshing rule files...').start();
      
      try {
        const projectPath = process.cwd();
        await ruleInjectionService.refreshRules(projectPath);
        
        spinner.succeed('Rule files refreshed');
        console.log(chalk.gray('Files updated:'));
        console.log(chalk.gray('  .claude/woolly-project-rules.md'));
        console.log(chalk.gray('  .claude/woolly-session-rules.md'));
      } catch (error: any) {
        spinner.fail('Failed to refresh rules');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}