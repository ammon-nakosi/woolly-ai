import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { indexDocument, indexAllCounselWork, indexCounselWork, getIndexStats } from '../services/chromadb-client';
import { CounselMode } from '../types';

const COUNSEL_BASE = path.join(os.homedir(), '.counsel');

async function findCounselWork(name: string): Promise<{ mode: CounselMode; path: string } | null> {
  const modes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];
  
  for (const mode of modes) {
    const workPath = path.join(COUNSEL_BASE, `${mode}s`, name);
    try {
      await fs.access(workPath);
      return { mode, path: workPath };
    } catch {
      // Not found in this mode
    }
  }
  
  return null;
}

export function registerIndexCommands(program: Command) {
  program
    .command('index')
    .description('Index counsel work into ChromaDB for semantic search')
    .option('--all', 'Index all counsel work across all modes')
    .option('-m, --mode <mode>', 'Index all work in specific mode (feature, script, debug, review, vibe)')
    .option('-n, --name <name>', 'Index specific counsel work by name')
    .option('-f, --file <file>', 'Index specific file within counsel work')
    .option('--modified', 'Only index modified files since last index')
    .option('--init', 'Initialize index for new counsel work')
    .option('--force', 'Force re-index even if already indexed')
    .option('--status', 'Show indexing statistics')
    .action(async (options) => {
      const spinner = ora('Initializing ChromaDB...').start();
      
      try {
        // Show index status
        if (options.status) {
          spinner.text = 'Fetching index statistics...';
          const stats = await getIndexStats();
          spinner.succeed('Index Statistics:');
          
          console.log(chalk.cyan('\n📊 ChromaDB Index Status\n'));
          console.log(`Total indexed documents: ${chalk.bold(stats.totalDocuments)}`);
          console.log(`Total counsel work items: ${chalk.bold(stats.totalItems)}`);
          
          if (stats.byMode) {
            console.log(chalk.cyan('\nBy Mode:'));
            Object.entries(stats.byMode).forEach(([mode, count]) => {
              console.log(`  ${mode}: ${count}`);
            });
          }
          
          if (stats.byFileType) {
            console.log(chalk.cyan('\nBy File Type:'));
            Object.entries(stats.byFileType).forEach(([type, count]) => {
              console.log(`  ${type}: ${count}`);
            });
          }
          
          return;
        }
        
        // Index all counsel work
        if (options.all) {
          spinner.text = 'Indexing all counsel work...';
          const result = await indexAllCounselWork(options.force);
          
          spinner.succeed(`Indexed ${result.itemsIndexed} counsel items with ${result.filesIndexed} files`);
          
          if (result.errors.length > 0) {
            console.log(chalk.yellow('\n⚠️  Some files could not be indexed:'));
            result.errors.forEach(err => console.log(`  - ${err}`));
          }
          
          console.log(chalk.gray('\nRun `counsel search <query>` to search indexed content'));
          return;
        }
        
        // Index by mode
        if (options.mode) {
          const validModes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];
          if (!validModes.includes(options.mode as CounselMode)) {
            spinner.fail(`Invalid mode: ${options.mode}`);
            console.log(chalk.yellow(`Valid modes: ${validModes.join(', ')}`));
            return;
          }
          
          spinner.text = `Indexing all ${options.mode} work...`;
          const result = await indexAllCounselWork(options.force, options.mode as CounselMode);
          
          spinner.succeed(`Indexed ${result.itemsIndexed} ${options.mode} items with ${result.filesIndexed} files`);
          return;
        }
        
        // Index specific counsel work
        if (options.name) {
          spinner.text = `Finding counsel work: ${options.name}...`;
          
          const work = await findCounselWork(options.name);
          if (!work) {
            spinner.fail(`Counsel work not found: ${options.name}`);
            console.log(chalk.yellow('\nTry listing all work with: counsel list'));
            return;
          }
          
          spinner.text = `Indexing ${work.mode} work: ${options.name}...`;
          
          // Index specific file or all files
          if (options.file) {
            const filePath = path.join(work.path, options.file);
            try {
              await fs.access(filePath);
              const content = await fs.readFile(filePath, 'utf-8');
              await indexDocument({
                counselWork: options.name,
                mode: work.mode,
                fileName: options.file,
                filePath,
                content
              });
              spinner.succeed(`Indexed ${options.file} for ${options.name}`);
            } catch (error) {
              spinner.fail(`File not found: ${options.file}`);
            }
          } else {
            const result = await indexCounselWork(work.path, options.name, work.mode, {
              modified: options.modified,
              force: options.force
            });
            spinner.succeed(`Indexed ${result.filesIndexed} files for ${options.name}`);
            
            if (result.skipped > 0) {
              console.log(chalk.gray(`Skipped ${result.skipped} files (JSON/logs/already indexed)`));
            }
          }
          
          return;
        }
        
        // Interactive mode - detect unindexed work
        spinner.text = 'Detecting counsel work to index...';
        
        const unindexed: { name: string; mode: CounselMode; path: string }[] = [];
        const modes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];
        
        for (const mode of modes) {
          const modePath = path.join(COUNSEL_BASE, `${mode}s`);
          try {
            const items = await fs.readdir(modePath);
            for (const item of items) {
              const itemPath = path.join(modePath, item);
              const stat = await fs.stat(itemPath);
              if (stat.isDirectory()) {
                // Check if needs indexing
                unindexed.push({ name: item, mode, path: itemPath });
              }
            }
          } catch {
            // Mode directory doesn't exist
          }
        }
        
        if (unindexed.length === 0) {
          spinner.succeed('All counsel work is already indexed!');
          return;
        }
        
        spinner.succeed(`Found ${unindexed.length} counsel items to index`);
        
        console.log(chalk.cyan('\n📚 Indexing Counsel Work\n'));
        
        for (const work of unindexed) {
          console.log(chalk.gray(`Indexing ${work.mode}/${work.name}...`));
          const result = await indexCounselWork(work.path, work.name, work.mode);
          console.log(chalk.green(`  ✓ Indexed ${result.filesIndexed} files`));
        }
        
        console.log(chalk.green(`\n✅ Successfully indexed ${unindexed.length} counsel items`));
        console.log(chalk.gray('Run `counsel search <query>` to search indexed content'));
        
      } catch (error: any) {
        spinner.fail('Indexing failed');
        console.error(chalk.red('Error:'), error.message);
        console.log(chalk.yellow('\nMake sure ChromaDB is running:'));
        console.log(chalk.gray('  docker run -p 8090:8090 chromadb/chroma'));
      }
    });
}