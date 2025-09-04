import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { getChromaClient } from '../services/chromadb-client';

const COUNSEL_BASE = path.join(os.homedir(), '.woolly');

export function registerStatusCommands(program: Command) {
  program
    .command('status <name>')
    .description('Get detailed status of woolly work')
    .option('-m, --mode <mode>', 'Specify mode if name is ambiguous')
    .option('--verify', 'Verify against actual codebase (slower)')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      const spinner = ora('Fetching woolly status...').start();
      
      try {
        // Find the woolly work
        const counselPath = await findCounselPath(name, options.mode);
        if (!counselPath) {
          spinner.fail(`Woolly work not found: ${name}`);
          console.log(chalk.yellow('\nTry listing all work with: woolly list'));
          return;
        }
        
        const mode = counselPath.split('/').slice(-2, -1)[0].replace(/s$/, '');
        
        // Read plan status if exists
        let planStatus = null;
        let statusPath = path.join(counselPath, 'plan-approved.plan-status.json');
        try {
          const statusContent = await fs.readFile(statusPath, 'utf-8');
          planStatus = JSON.parse(statusContent);
        } catch {
          // No status file
        }
        
        // Get metadata from ChromaDB
        let metadata = null;
        try {
          const client = await getChromaClient();
          const collection = await client.getOrCreateCollection({
            name: 'woolly_documents'
          });
          
          const results = await collection.get({
            where: {
              counselWork: name
            },
            limit: 1
          });
          
          if (results.metadatas.length > 0) {
            metadata = results.metadatas[0];
          }
        } catch {
          // No ChromaDB entry
        }
        
        // Read description from files
        let description = '';
        let specs = '';
        try {
          const files = await fs.readdir(counselPath);
          for (const file of files) {
            if (file === 'specs.md' || file === 'purpose.md' || file === 'issue.md' || file === 'scope.md' || file === 'context.md') {
              const content = await fs.readFile(path.join(counselPath, file), 'utf-8');
              const lines = content.split('\n');
              description = lines.find(line => line.trim() && !line.startsWith('#')) || '';
              specs = content;
              break;
            }
          }
        } catch {
          // No description found
        }
        
        spinner.succeed('Status retrieved');
        
        if (options.json) {
          console.log(JSON.stringify({
            name,
            mode,
            path: counselPath,
            metadata,
            planStatus,
            description,
            specs
          }, null, 2));
          return;
        }
        
        // Display formatted status
        console.log(chalk.bold(`\n📊 Woolly Status: ${name}\n`));
        console.log(chalk.gray('─'.repeat(50)));
        
        // Basic info
        console.log(chalk.bold('Mode:'), mode);
        console.log(chalk.bold('Path:'), counselPath);
        
        if (metadata) {
          console.log(chalk.bold('Status:'), metadata.status || 'unknown');
          if (metadata.project?.name) {
            console.log(chalk.bold('Project:'), metadata.project.name);
          }
          if (metadata.created) {
            const date = new Date(metadata.created);
            console.log(chalk.bold('Created:'), date.toLocaleDateString());
          }
          if (metadata.updated) {
            const date = new Date(metadata.updated);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            const timeAgo = diffDays === 0 ? 'today' :
                          diffDays === 1 ? 'yesterday' :
                          `${diffDays} days ago`;
            console.log(chalk.bold('Updated:'), timeAgo);
          }
        }
        
        if (description) {
          console.log(chalk.bold('\nDescription:'));
          console.log(chalk.gray(description));
        }
        
        // Plan status details
        if (planStatus) {
          console.log(chalk.bold('\n📋 Implementation Progress:\n'));
          
          const totalPhases = planStatus.totalPhases || planStatus.phases?.length || 0;
          let currentPhase = 0;
          let totalTasks = 0;
          let completedTasks = 0;
          let inProgressTasks = 0;
          
          if (planStatus.phases) {
            for (const phase of planStatus.phases) {
              if (phase.status === 'doing' || phase.status === 'done') {
                currentPhase = phase.phaseNumber;
              }
              
              if (phase.checklist) {
                totalTasks += phase.checklist.length;
                completedTasks += phase.checklist.filter((t: any) => t.status === 'done').length;
                inProgressTasks += phase.checklist.filter((t: any) => t.status === 'doing').length;
              }
            }
          }
          
          // Overall progress
          const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const progressBar = generateProgressBar(percentage);
          
          console.log(chalk.bold('Overall Progress:'));
          console.log(`${progressBar} ${percentage}%`);
          console.log(`${completedTasks}/${totalTasks} tasks completed`);
          
          if (currentPhase > 0) {
            console.log(chalk.bold('\nCurrent Phase:'), `${currentPhase} of ${totalPhases}`);
          }
          
          // Phase breakdown
          if (planStatus.phases && planStatus.phases.length > 0) {
            console.log(chalk.bold('\nPhases:'));
            for (const phase of planStatus.phases) {
              const phaseComplete = phase.checklist?.filter((t: any) => t.status === 'done').length || 0;
              const phaseTotal = phase.checklist?.length || 0;
              const phasePercent = phaseTotal > 0 ? Math.round((phaseComplete / phaseTotal) * 100) : 0;
              
              const statusIcon = phase.status === 'done' ? chalk.green('✓') :
                                phase.status === 'doing' ? chalk.yellow('◐') :
                                chalk.gray('○');
              
              console.log(`  ${statusIcon} Phase ${phase.phaseNumber}: ${phase.title}`);
              if (phaseTotal > 0) {
                console.log(`     ${phaseComplete}/${phaseTotal} tasks (${phasePercent}%)`);
              }
            }
          }
          
          // Current/next task
          if (inProgressTasks > 0 || currentPhase > 0) {
            console.log(chalk.bold('\nActive Work:'));
            for (const phase of planStatus.phases || []) {
              for (const task of phase.checklist || []) {
                if (task.status === 'doing') {
                  console.log(`  ${chalk.yellow('→')} ${task.description}`);
                  if (task.implementationDetails) {
                    console.log(`     ${chalk.gray(task.implementationDetails)}`);
                  }
                }
              }
            }
          }
          
          // Show next tasks
          const upcomingTasks = [];
          for (const phase of planStatus.phases || []) {
            for (const task of phase.checklist || []) {
              if (task.status === 'to-do' && upcomingTasks.length < 3) {
                upcomingTasks.push({
                  phase: phase.phaseNumber,
                  task: task.description
                });
              }
            }
          }
          
          if (upcomingTasks.length > 0) {
            console.log(chalk.bold('\nUpcoming Tasks:'));
            upcomingTasks.forEach(item => {
              console.log(`  ${chalk.gray('•')} [Phase ${item.phase}] ${item.task}`);
            });
          }
        }
        
        // Verification option
        if (options.verify) {
          console.log(chalk.yellow('\n⚠️  Code verification not yet implemented'));
          console.log(chalk.gray('This will scan the codebase to verify actual implementation'));
        }
        
        // Available files
        console.log(chalk.bold('\n📁 Files:'));
        try {
          const files = await fs.readdir(counselPath);
          files.forEach(file => {
            console.log(`  ${chalk.gray('•')} ${file}`);
          });
        } catch {
          console.log(chalk.gray('  Unable to list files'));
        }
        
        // Next actions
        console.log(chalk.cyan('\n💡 Actions:'));
        console.log(`  • Update status: /woolly-status-update ${name}`);
        console.log(`  • Export knowledge: woolly export knowledge ${name}`);
        console.log(`  • Archive: woolly export archive ${name}`);
        if (metadata?.project?.name) {
          console.log(`  • Sync with Linear: woolly sync ${name}`);
        }
        
      } catch (error: any) {
        spinner.fail('Failed to get status');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}

async function findCounselPath(name: string, mode?: string): Promise<string | null> {
  const modes = mode ? [mode] : ['feature', 'script', 'vibe', 'prompt'];
  
  for (const m of modes) {
    const counselPath = path.join(COUNSEL_BASE, `${m}s`, name);
    try {
      await fs.access(counselPath);
      return counselPath;
    } catch {
      // Not found in this mode
    }
  }
  
  return null;
}

function generateProgressBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const filledBar = chalk.green('█'.repeat(filled));
  const emptyBar = chalk.gray('░'.repeat(empty));
  
  return `[${filledBar}${emptyBar}]`;
}