import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getChromaClient } from '../services/chromadb-client';
import { CounselMode } from '../types';
import simpleGit from 'simple-git';

const COUNSEL_BASE = path.join(os.homedir(), '.counsel');

interface ProjectInfo {
  name: string;
  path?: string;
  gitRemote?: string;
}

export function registerAddCommands(program: Command) {
  program
    .command('add <mode> <name>')
    .description('Add existing counsel work to the index')
    .option('-d, --description <desc>', 'Description of the work')
    .option('-p, --project <project>', 'Project name')
    .option('--status <status>', 'Current status (planned, in-progress, completed)', 'planned')
    .action(async (mode: string, name: string, options) => {
      const spinner = ora('Adding counsel work to index...').start();
      
      try {
        // Validate mode
        const validModes: CounselMode[] = ['feature', 'script', 'debug', 'review', 'vibe'];
        if (!validModes.includes(mode as CounselMode)) {
          spinner.fail(`Invalid mode: ${mode}`);
          console.log(chalk.yellow(`Valid modes: ${validModes.join(', ')}`));
          return;
        }
        
        // Check if counsel directory exists
        const counselPath = path.join(COUNSEL_BASE, `${mode}s`, name);
        try {
          await fs.access(counselPath);
        } catch {
          spinner.fail(`Counsel work not found: ${counselPath}`);
          console.log(chalk.yellow('Make sure the counsel work exists before adding it to the index'));
          return;
        }
        
        // Get project info if not provided
        let projectInfo: ProjectInfo | null = options.project ? { name: options.project } : null;
        if (!projectInfo) {
          const git = simpleGit();
          try {
            const remotes = await git.getRemotes(true);
            const remote = remotes[0]?.refs?.fetch || '';
            const projectPath = process.cwd();
            const projectName = path.basename(projectPath);
            projectInfo = {
              name: projectName,
              path: projectPath,
              gitRemote: remote
            };
          } catch {
            projectInfo = {
              name: path.basename(process.cwd()),
              path: process.cwd(),
              gitRemote: undefined
            };
          }
        }
        
        // Read existing files to build description
        let description = options.description || '';
        if (!description) {
          // Try to read from existing files
          const files = await fs.readdir(counselPath);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const content = await fs.readFile(path.join(counselPath, file), 'utf-8');
              const lines = content.split('\n').slice(0, 5);
              description = lines.find(line => line.trim() && !line.startsWith('#')) || '';
              if (description) break;
            }
          }
        }
        
        if (!description) {
          description = `${mode} work: ${name}`;
        }
        
        // Add to ChromaDB
        spinner.text = 'Indexing in ChromaDB...';
        const client = await getChromaClient();
        const collection = await client.getOrCreateCollection({
          name: 'counsel_items'
        });
        
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        
        // Read any plan-status.json if it exists
        let planStatus = null;
        try {
          const statusPath = path.join(counselPath, 'plan-approved.plan-status.json');
          const statusContent = await fs.readFile(statusPath, 'utf-8');
          planStatus = JSON.parse(statusContent);
        } catch {
          // No status file, that's okay
        }
        
        await collection.add({
          ids: [id],
          documents: [description],
          metadatas: [{
            id,
            type: 'counsel_item',
            mode,
            name,
            path: counselPath,
            project: projectInfo,
            status: options.status || 'planned',
            planStatus: planStatus ? JSON.stringify(planStatus) : null,
            created: timestamp,
            updated: timestamp,
            lastWorked: timestamp
          }]
        });
        
        spinner.succeed(`Added ${mode} '${name}' to counsel index`);
        
        console.log(chalk.gray(`\nID: ${id}`));
        console.log(chalk.gray(`Path: ${counselPath}`));
        console.log(chalk.gray(`Status: ${options.status || 'planned'}`));
        
        console.log(chalk.cyan('\nNext steps:'));
        console.log(`  • View details: counsel status ${name}`);
        console.log(`  • Search related: counsel search "${description.split(' ').slice(0, 3).join(' ')}"`);
        console.log(`  • List all: counsel list --mode ${mode}`);
        
      } catch (error: any) {
        spinner.fail('Failed to add counsel work');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}