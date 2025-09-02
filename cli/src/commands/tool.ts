import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getLibraryPath } from '../utils/paths';
import { generateId } from '../utils/id';

interface Tool {
  id: string;
  type: 'mcp' | 'cli' | 'script' | 'api';
  scope: 'user' | 'project' | 'session';
  status: 'active' | 'inactive';
  title: string;
  description?: string;
  created: string;
  updated: string;
  
  // Type-specific fields
  connection?: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
  binary?: string;
  install_hint?: string;
  script?: string;
  endpoint?: string;
  
  notes?: string;
  tags?: string[];
}

export function registerToolCommands(program: Command) {
  const tool = program
    .command('tool')
    .description('Manage counsel tools library');

  // List tools
  tool
    .command('list')
    .description('List all tools')
    .option('--scope <scope>', 'Filter by scope (project, session, user)')
    .option('--status <status>', 'Filter by status (active, inactive)')
    .option('--type <type>', 'Filter by type (mcp, cli, script, api)')
    .action(async (options) => {
      const spinner = ora('Loading tools...').start();
      
      try {
        const toolsDir = path.join(getLibraryPath(), 'tools');
        
        // Ensure tools directory exists
        await fs.mkdir(toolsDir, { recursive: true });
        
        const files = await fs.readdir(toolsDir);
        const toolFiles = files.filter(f => f.endsWith('.json'));
        
        const tools: Tool[] = [];
        for (const file of toolFiles) {
          const content = await fs.readFile(path.join(toolsDir, file), 'utf-8');
          const tool = JSON.parse(content) as Tool;
          
          // Apply filters
          if (options.scope && tool.scope !== options.scope) continue;
          if (options.status && tool.status !== options.status) continue;
          if (options.type && tool.type !== options.type) continue;
          
          tools.push(tool);
        }

        spinner.stop();

        if (tools.length === 0) {
          console.log(chalk.gray('No tools found.'));
          console.log(chalk.gray('Add your first tool with: counsel tool add'));
          return;
        }

        console.log(chalk.bold(`\n🧰 Counsel Tools (${tools.length})\n`));

        // Group by type
        const byType = {
          mcp: tools.filter(t => t.type === 'mcp'),
          cli: tools.filter(t => t.type === 'cli'),
          script: tools.filter(t => t.type === 'script'),
          api: tools.filter(t => t.type === 'api')
        };

        for (const [type, typeTools] of Object.entries(byType)) {
          if (typeTools.length === 0) continue;
          
          console.log(chalk.cyan(`\n${type.toUpperCase()} Tools:`));
          for (const tool of typeTools) {
            const status = tool.status === 'active' 
              ? chalk.green('●') 
              : chalk.gray('○');
            const scope = chalk.gray(`[${tool.scope}]`);
            console.log(`  ${status} ${tool.title} ${scope}`);
            if (tool.notes) {
              console.log(chalk.gray(`    ${tool.notes}`));
            }
          }
        }
      } catch (error) {
        spinner.fail('Failed to list tools');
        console.error(error);
        process.exit(1);
      }
    });

  // Add tool
  tool
    .command('add')
    .description('Add a new tool')
    .option('--type <type>', 'Tool type (mcp, cli, script, api)')
    .option('--scope <scope>', 'Tool scope (user, project, session)')
    .option('--title <title>', 'Tool title')
    .action(async (options) => {
      try {
        // Interactive prompts if options not provided
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'Tool type:',
            choices: ['mcp', 'cli', 'script', 'api'],
            when: !options.type
          },
          {
            type: 'list',
            name: 'scope',
            message: 'Tool scope:',
            choices: ['user', 'project', 'session'],
            default: 'user',
            when: !options.scope
          },
          {
            type: 'input',
            name: 'title',
            message: 'Tool title:',
            when: !options.title,
            validate: (input) => input.length > 0 || 'Title is required'
          }
        ]);

        const type = options.type || answers.type;
        const scope = options.scope || answers.scope;
        const title = options.title || answers.title;

        // Type-specific prompts
        let typeSpecific: any = {};
        
        if (type === 'mcp') {
          const mcpAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'command',
              message: 'MCP server command:',
              default: 'npx'
            },
            {
              type: 'input',
              name: 'args',
              message: 'Command arguments (comma-separated):',
              default: '-y,@modelcontextprotocol/server-name'
            }
          ]);
          typeSpecific.connection = {
            command: mcpAnswers.command,
            args: mcpAnswers.args.split(',').map((s: string) => s.trim())
          };
        } else if (type === 'cli') {
          const cliAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'binary',
              message: 'CLI binary name:',
              validate: (input) => input.length > 0 || 'Binary name is required'
            },
            {
              type: 'input',
              name: 'install_hint',
              message: 'Installation hint (optional):'
            }
          ]);
          typeSpecific.binary = cliAnswers.binary;
          if (cliAnswers.install_hint) {
            typeSpecific.install_hint = cliAnswers.install_hint;
          }
        } else if (type === 'script') {
          const scriptAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'script',
              message: 'Script path:',
              validate: (input) => input.length > 0 || 'Script path is required'
            }
          ]);
          typeSpecific.script = scriptAnswers.script;
        } else if (type === 'api') {
          const apiAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'endpoint',
              message: 'API endpoint:',
              validate: (input) => input.length > 0 || 'Endpoint is required'
            }
          ]);
          typeSpecific.endpoint = apiAnswers.endpoint;
        }

        // Additional info
        const additionalAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):'
          },
          {
            type: 'input',
            name: 'notes',
            message: 'Usage notes (optional):'
          },
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated, optional):'
          }
        ]);

        // Create tool object
        const tool: Tool = {
          id: `tool_${scope}_${title.toLowerCase().replace(/\s+/g, '_')}_${generateId(6)}`,
          type,
          scope,
          status: 'active',
          title,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          ...typeSpecific
        };

        if (additionalAnswers.description) {
          tool.description = additionalAnswers.description;
        }
        if (additionalAnswers.notes) {
          tool.notes = additionalAnswers.notes;
        }
        if (additionalAnswers.tags) {
          tool.tags = additionalAnswers.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        // Save tool
        const toolsDir = path.join(getLibraryPath(), 'tools');
        await fs.mkdir(toolsDir, { recursive: true });
        
        const filePath = path.join(toolsDir, `${tool.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(tool, null, 2));

        console.log(chalk.green(`\n✅ Tool "${title}" added successfully!`));
        console.log(chalk.gray(`   ID: ${tool.id}`));
        console.log(chalk.gray(`   Type: ${type}`));
        console.log(chalk.gray(`   Scope: ${scope}`));

      } catch (error) {
        console.error(chalk.red('Failed to add tool:'), error);
        process.exit(1);
      }
    });

  // Status command
  tool
    .command('status')
    .description('Check tool availability')
    .action(async () => {
      const spinner = ora('Checking tools...').start();
      
      try {
        const toolsDir = path.join(getLibraryPath(), 'tools');
        await fs.mkdir(toolsDir, { recursive: true });
        
        const files = await fs.readdir(toolsDir);
        const toolFiles = files.filter(f => f.endsWith('.json'));
        
        const tools: Tool[] = [];
        for (const file of toolFiles) {
          const content = await fs.readFile(path.join(toolsDir, file), 'utf-8');
          tools.push(JSON.parse(content) as Tool);
        }

        spinner.stop();

        console.log(chalk.bold('\n🔍 Tool Status\n'));

        for (const tool of tools) {
          if (tool.type === 'cli' && tool.binary) {
            // Check if CLI tool is installed
            const { execSync } = require('child_process');
            try {
              execSync(`which ${tool.binary}`, { stdio: 'pipe' });
              console.log(chalk.green(`✓ ${tool.title} - installed`));
            } catch {
              console.log(chalk.yellow(`✗ ${tool.title} - not found`));
              if (tool.install_hint) {
                console.log(chalk.gray(`  Install: ${tool.install_hint}`));
              }
            }
          } else if (tool.type === 'mcp') {
            console.log(chalk.blue(`◆ ${tool.title} - MCP server (on-demand)`));
          } else {
            console.log(chalk.gray(`• ${tool.title} - ${tool.type}`));
          }
        }

        console.log(chalk.gray(`\nTotal: ${tools.length} tools`));

      } catch (error) {
        spinner.fail('Failed to check tool status');
        console.error(error);
        process.exit(1);
      }
    });

  // Describe command
  tool
    .command('describe <id>')
    .description('Show details about a specific tool')
    .action(async (id) => {
      try {
        const toolsDir = path.join(getLibraryPath(), 'tools');
        const files = await fs.readdir(toolsDir);
        
        // Find tool by ID or title
        let tool: Tool | null = null;
        for (const file of files) {
          const content = await fs.readFile(path.join(toolsDir, file), 'utf-8');
          const t = JSON.parse(content) as Tool;
          if (t.id === id || t.title.toLowerCase() === id.toLowerCase()) {
            tool = t;
            break;
          }
        }

        if (!tool) {
          console.log(chalk.red(`Tool "${id}" not found`));
          process.exit(1);
        }

        console.log(chalk.bold(`\n🔧 ${tool.title}\n`));
        console.log(chalk.gray('ID:'), tool.id);
        console.log(chalk.gray('Type:'), tool.type);
        console.log(chalk.gray('Scope:'), tool.scope);
        console.log(chalk.gray('Status:'), tool.status === 'active' ? chalk.green('active') : chalk.gray('inactive'));
        
        if (tool.description) {
          console.log(chalk.gray('Description:'), tool.description);
        }
        
        if (tool.notes) {
          console.log(chalk.gray('Notes:'), tool.notes);
        }

        // Type-specific details
        if (tool.type === 'mcp' && tool.connection) {
          console.log(chalk.cyan('\nMCP Connection:'));
          console.log(chalk.gray('  Command:'), tool.connection.command);
          console.log(chalk.gray('  Args:'), tool.connection.args.join(' '));
        } else if (tool.type === 'cli' && tool.binary) {
          console.log(chalk.cyan('\nCLI Details:'));
          console.log(chalk.gray('  Binary:'), tool.binary);
          if (tool.install_hint) {
            console.log(chalk.gray('  Install:'), tool.install_hint);
          }
        } else if (tool.type === 'script' && tool.script) {
          console.log(chalk.cyan('\nScript Details:'));
          console.log(chalk.gray('  Path:'), tool.script);
        } else if (tool.type === 'api' && tool.endpoint) {
          console.log(chalk.cyan('\nAPI Details:'));
          console.log(chalk.gray('  Endpoint:'), tool.endpoint);
        }

        if (tool.tags && tool.tags.length > 0) {
          console.log(chalk.gray('\nTags:'), tool.tags.join(', '));
        }

        console.log(chalk.gray('\nCreated:'), new Date(tool.created).toLocaleString());
        console.log(chalk.gray('Updated:'), new Date(tool.updated).toLocaleString());

      } catch (error) {
        console.error(chalk.red('Failed to describe tool:'), error);
        process.exit(1);
      }
    });
}