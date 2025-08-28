import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { getChromaClient } from '../services/chromadb-client';
import { CounselMode } from '../types';

const COUNSEL_BASE = path.join(os.homedir(), '.counsel');

export function registerListCommands(program: Command) {
  program
    .command('list')
    .description('List counsel work')
    .option('-m, --mode <mode>', 'Filter by mode (feature, script, debug, review, vibe)')
    .option('-s, --status <status>', 'Filter by status (planned, in-progress, completed)')
    .option('-r, --recent', 'Sort by recently updated')
    .option('-p, --project <project>', 'Filter by project name')
    .option('-l, --limit <number>', 'Limit number of results', parseInt)
    .option('--json', 'Output as JSON')
    .option('--chroma', 'List from ChromaDB instead of local filesystem')
    .action(async (options) => {
      const spinner = ora('Fetching counsel work...').start();
      
      try {
        let items = [];
        
        // Default to local filesystem since ChromaDB isn't fully implemented
        if (options.chroma) {
          // List from ChromaDB (only if explicitly requested)
          items = await listFromChromaDB(options);
          spinner.succeed(`Found ${items.length} counsel items (ChromaDB)`);
        } else {
          // List from filesystem (default)
          items = await listFromFilesystem(options);
          spinner.succeed(`Found ${items.length} counsel items (local)`);
        }
        
        if (items.length === 0) {
          console.log(chalk.gray('\nNo counsel work found matching criteria'));
          return;
        }
        
        if (options.json) {
          console.log(JSON.stringify(items, null, 2));
          return;
        }
        
        // Group by mode
        const grouped: Record<string, typeof items> = {};
        for (const item of items) {
          const mode = item.mode || 'unknown';
          if (!grouped[mode]) grouped[mode] = [];
          grouped[mode].push(item);
        }
        
        // Display grouped items
        for (const [mode, modeItems] of Object.entries(grouped)) {
          console.log(chalk.bold.cyan(`\n${mode.toUpperCase()}`));
          console.log(chalk.gray('─'.repeat(40)));
          
          for (const item of modeItems) {
            const status = item.status === 'completed' ? chalk.green('✓') :
                          item.status === 'in-progress' ? chalk.yellow('◐') :
                          chalk.gray('○');
            
            console.log(`${status} ${chalk.bold(item.name)}`);
            
            if (item.description) {
              console.log(`  ${chalk.gray(item.description.substring(0, 60))}${item.description.length > 60 ? '...' : ''}`);
            }
            
            if (item.project?.name) {
              console.log(`  ${chalk.dim('Project:')} ${item.project.name}`);
            }
            
            if (item.updated) {
              const date = new Date(item.updated);
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
              const timeAgo = diffDays === 0 ? 'today' :
                            diffDays === 1 ? 'yesterday' :
                            `${diffDays} days ago`;
              console.log(`  ${chalk.dim('Updated:')} ${timeAgo}`);
            }
            
            // Show progress if available
            if (item.planStatus) {
              try {
                const status = JSON.parse(item.planStatus);
                const totalTasks = status.phases?.reduce((acc: number, phase: any) => 
                  acc + (phase.checklist?.length || 0), 0) || 0;
                const completedTasks = status.phases?.reduce((acc: number, phase: any) => 
                  acc + (phase.checklist?.filter((t: any) => t.status === 'done')?.length || 0), 0) || 0;
                
                if (totalTasks > 0) {
                  const percentage = Math.round((completedTasks / totalTasks) * 100);
                  console.log(`  ${chalk.dim('Progress:')} ${completedTasks}/${totalTasks} tasks (${percentage}%)`);
                }
              } catch {
                // Ignore parse errors
              }
            }
            
            console.log(); // Empty line between items
          }
        }
        
        // Summary
        console.log(chalk.gray('─'.repeat(40)));
        const statusCounts = items.reduce((acc: Record<string, number>, item) => {
          acc[item.status || 'unknown'] = (acc[item.status || 'unknown'] || 0) + 1;
          return acc;
        }, {});
        
        const summary = Object.entries(statusCounts)
          .map(([status, count]) => `${count} ${status}`)
          .join(', ');
        console.log(chalk.gray(`Total: ${items.length} items (${summary})`));
        
      } catch (error: any) {
        spinner.fail('Failed to list counsel work');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}

async function listFromChromaDB(options: any) {
  const client = await getChromaClient();
  const collection = await client.getOrCreateCollection({
    name: 'counsel_items'
  });
  
  // Build filter
  const where: any = { type: 'counsel_item' };
  if (options.mode) {
    where.mode = options.mode;
  }
  if (options.status) {
    where.status = options.status;
  }
  if (options.project) {
    where['project.name'] = options.project;
  }
  
  const results = await collection.get({
    where,
    limit: options.limit || 100
  });
  
  const items = results.metadatas.map((metadata: any, i: number) => ({
    id: metadata.id,
    name: metadata.name,
    mode: metadata.mode,
    status: metadata.status,
    description: results.documents[i],
    project: metadata.project,
    planStatus: metadata.planStatus,
    created: metadata.created,
    updated: metadata.updated
  }));
  
  // Sort by recent if requested
  if (options.recent) {
    items.sort((a, b) => 
      new Date(b.updated || b.created).getTime() - 
      new Date(a.updated || a.created).getTime()
    );
  }
  
  return items;
}

async function listFromFilesystem(options: any) {
  const items = [];
  const modes: CounselMode[] = options.mode ? [options.mode] : ['feature', 'script', 'debug', 'review', 'vibe'];
  
  for (const mode of modes) {
    // All directories use plural form
    const dirName = `${mode}s`;
    const modePath = path.join(COUNSEL_BASE, dirName);
    
    try {
      const dirs = await fs.readdir(modePath);
      
      for (const dir of dirs) {
        const itemPath = path.join(modePath, dir);
        const stats = await fs.stat(itemPath);
        
        if (!stats.isDirectory()) continue;
        
        // Try to read status
        let status = 'planned';
        let planStatus = null;
        try {
          const statusPath = path.join(itemPath, 'plan-approved.plan-status.json');
          const statusContent = await fs.readFile(statusPath, 'utf-8');
          planStatus = statusContent;
          const parsed = JSON.parse(statusContent);
          
          // Determine overall status
          const hasCompleted = parsed.phases?.some((p: any) => p.status === 'done');
          const hasInProgress = parsed.phases?.some((p: any) => p.status === 'doing');
          
          if (hasCompleted && !hasInProgress) {
            status = 'completed';
          } else if (hasInProgress || hasCompleted) {
            status = 'in-progress';
          }
        } catch {
          // No status file
        }
        
        // Read description from first .md file
        let description = '';
        try {
          const files = await fs.readdir(itemPath);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const content = await fs.readFile(path.join(itemPath, file), 'utf-8');
              const lines = content.split('\n').slice(0, 5);
              description = lines.find(line => line.trim() && !line.startsWith('#')) || '';
              if (description) break;
            }
          }
        } catch {
          // Couldn't read description
        }
        
        items.push({
          name: dir,
          mode,
          status,
          description,
          planStatus,
          created: stats.birthtime.toISOString(),
          updated: stats.mtime.toISOString(),
          path: itemPath
        });
      }
    } catch {
      // Mode directory doesn't exist
    }
  }
  
  // Filter by status if requested
  if (options.status) {
    return items.filter(item => item.status === options.status);
  }
  
  // Sort by recent if requested
  if (options.recent) {
    items.sort((a, b) => 
      new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
  }
  
  // Apply limit if specified
  if (options.limit) {
    return items.slice(0, options.limit);
  }
  
  return items;
}