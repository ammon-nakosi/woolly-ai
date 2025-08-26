import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { getConfig } from '../utils/config';

const CONFIG_PATH = path.join(os.homedir(), '.counsel', 'config.json');
const COUNSEL_BASE = path.join(os.homedir(), '.counsel');

export function registerInitCommands(program: Command) {
  program
    .command('init')
    .description('Initialize counsel configuration and setup')
    .action(async () => {
      const spinner = ora('Checking counsel configuration...').start();
      
      try {
        // Check if config already exists
        let existingConfig = null;
        try {
          existingConfig = await getConfig();
          spinner.succeed('Found existing configuration');
        } catch {
          spinner.text = 'No configuration found, creating new one...';
        }
        
        console.log(chalk.bold('\n🎯 Counsel Configuration Setup\n'));
        
        // If config exists, show current values
        if (existingConfig) {
          console.log(chalk.gray('Current configuration:'));
          if (existingConfig.linear?.userEmail) {
            console.log(`  Email: ${existingConfig.linear.userEmail}`);
          }
          if (existingConfig.linear?.apiKey) {
            console.log(`  Linear API: ${existingConfig.linear.apiKey.substring(0, 10)}...`);
          }
          console.log('');
        }
        
        // Prompt for configuration
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'email',
            message: 'Your email address:',
            default: existingConfig?.linear?.userEmail,
            validate: (input) => {
              if (!input) return 'Email is required';
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(input) || 'Please enter a valid email';
            }
          },
          {
            type: 'input',
            name: 'linearApiKey',
            message: 'Linear API key (optional):',
            default: existingConfig?.linear?.apiKey,
            validate: (input) => {
              if (!input) return true; // Optional
              return input.startsWith('lin_api_') || 'Linear API key should start with "lin_api_"';
            }
          },
          {
            type: 'confirm',
            name: 'setupChromaDB',
            message: 'Setup ChromaDB for semantic search?',
            default: true
          }
        ]);
        
        // Additional ChromaDB setup if needed
        let chromaConfig = {};
        if (answers.setupChromaDB) {
          const chromaAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'host',
              message: 'ChromaDB host:',
              default: existingConfig?.chromadb?.host || 'localhost'
            },
            {
              type: 'input',
              name: 'port',
              message: 'ChromaDB port:',
              default: existingConfig?.chromadb?.port || '8000'
            }
          ]);
          
          chromaConfig = {
            host: chromaAnswers.host,
            port: parseInt(chromaAnswers.port)
          };
        }
        
        // Pattern extraction preferences
        const { patternExtraction } = await inquirer.prompt([
          {
            type: 'list',
            name: 'patternExtraction',
            message: 'Pattern extraction mode:',
            choices: [
              { name: 'Semi-automatic (ask before extracting)', value: 'semi-auto' },
              { name: 'Automatic (extract without asking)', value: 'auto' },
              { name: 'Manual (only when requested)', value: 'manual' },
              { name: 'Off (never extract)', value: 'off' }
            ],
            default: existingConfig?.patternExtraction?.mode || 'semi-auto'
          }
        ]);
        
        // Create config object
        const config = {
          linear: {
            userEmail: answers.email,
            ...(answers.linearApiKey && { apiKey: answers.linearApiKey })
          },
          ...(answers.setupChromaDB && { chromadb: chromaConfig }),
          patternExtraction: {
            mode: patternExtraction,
            triggers: {
              onComplete: true,
              onArchive: true,
              minComplexity: 'medium'
            }
          },
          initialized: true,
          createdAt: existingConfig?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save configuration
        spinner.text = 'Saving configuration...';
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
        
        // Create directory structure
        spinner.text = 'Creating counsel directories...';
        const directories = ['features', 'scripts', 'debug', 'review', 'vibe', 'archive', 'knowledge'];
        for (const dir of directories) {
          await fs.mkdir(path.join(COUNSEL_BASE, dir), { recursive: true });
        }
        
        spinner.succeed('Configuration saved and directories created');
        
        console.log(chalk.green('\n✓ Counsel is now configured!\n'));
        console.log(chalk.cyan('Next steps:'));
        console.log('  • Add existing counsel work: counsel add <mode> <name>');
        console.log('  • List your tickets: counsel linear');
        console.log('  • Search counsel work: counsel search <query>');
        console.log('  • Get help: counsel --help');
        
      } catch (error: any) {
        spinner.fail('Failed to initialize counsel');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}