import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { indexCounselWork } from '../services/chromadb-client';
import { CounselMode, ProjectMetadata } from '../types';
import simpleGit from 'simple-git';

const COUNSEL_BASE = path.join(os.homedir(), '.woolly');

interface ProjectInfo {
  name: string;
  path?: string;
  gitRemote?: string;
}

export function registerAddCommands(program: Command) {
  program
    .command('add <mode> <name>')
    .description('Add existing woolly work to the index')
    .option('-d, --description <desc>', 'Description of the work')
    .option('-p, --project <project>', 'Project name')
    .option('--status <status>', 'Current status (planned, in-progress, completed)', 'planned')
    .action(async (mode: string, name: string, options) => {
      const spinner = ora('Adding woolly work to index...').start();
      
      try {
        // Validate mode
        const validModes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];
        if (!validModes.includes(mode as CounselMode)) {
          spinner.fail(`Invalid mode: ${mode}`);
          console.log(chalk.yellow(`Valid modes: ${validModes.join(', ')}`));
          return;
        }
        
        // Check if woolly directory exists
        const counselPath = path.join(COUNSEL_BASE, `${mode}s`, name);
        try {
          await fs.access(counselPath);
        } catch {
          spinner.fail(`Woolly work not found: ${counselPath}`);
          console.log(chalk.yellow('Make sure the woolly work exists before adding it to the index'));
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
        
        // Create or update metadata.json
        const metadataPath = path.join(counselPath, 'metadata.json');
        const metadata: ProjectMetadata = {
          name,
          mode: mode as CounselMode,
          status: 'open',
          createdAt: new Date().toISOString(),
          closedAt: null,
          updatedAt: new Date().toISOString()
        };
        
        // Check if metadata already exists
        try {
          const existing = await fs.readFile(metadataPath, 'utf-8');
          const existingMetadata = JSON.parse(existing);
          // Preserve existing createdAt and status
          metadata.createdAt = existingMetadata.createdAt;
          metadata.status = existingMetadata.status;
          metadata.closedAt = existingMetadata.closedAt;
        } catch {
          // No existing metadata, use new
        }
        
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        // Index existing markdown files in the woolly work
        spinner.text = 'Indexing woolly work in ChromaDB...';
        const indexResult = await indexCounselWork(
          counselPath,
          name,
          mode as CounselMode
        );
        
        spinner.succeed(`Indexed ${indexResult.filesIndexed} files for ${mode} '${name}'`);
        
        if (indexResult.skipped > 0) {
          console.log(chalk.gray(`\nSkipped ${indexResult.skipped} non-markdown files`));
        }
        if (indexResult.errors.length > 0) {
          console.log(chalk.yellow('\nSome files could not be indexed:'));
          indexResult.errors.forEach(err => console.log(`  - ${err}`));
        }
        
        console.log(chalk.gray(`\nPath: ${counselPath}`));
        console.log(chalk.gray(`Status: ${options.status || 'planned'}`));
        
        console.log(chalk.cyan('\nNext steps:'));
        console.log(`  • View details: woolly status ${name}`);
        console.log(`  • Search related: woolly search "${description.split(' ').slice(0, 3).join(' ')}"`);
        console.log(`  • List all: woolly list --mode ${mode}`);
        
      } catch (error: any) {
        spinner.fail('Failed to add woolly work');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}