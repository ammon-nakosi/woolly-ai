import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// Get the woolly framework directory (where this CLI is running from)
const getFrameworkDir = (): string => {
  // Start from current file location and find the root
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json')) && 
        fs.existsSync(path.join(dir, 'docs'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error('Could not find woolly framework root directory');
};

export function registerGuidelinesCommand(program: Command) {
  program
    .command('guidelines')
    .description('Display framework documentation and mode-specific guidelines')
    .argument('<type>', 'Type to get guidelines for (framework, script, feature, vibe)')
    .option('-s, --summary', 'Show only core principles and specs')
    .option('-c, --checklist', 'Show only the specs checklist')
    .option('-e, --examples', 'Show only code examples')
    .action(async (type: string, options) => {
      try {
        const frameworkDir = getFrameworkDir();
        const frameworkDoc = path.join(frameworkDir, 'docs', 'WOOLLY-FRAMEWORK.md');
        
        // Handle 'framework' as a special case - just show the framework doc
        if (type === 'framework') {
          if (!fs.existsSync(frameworkDoc)) {
            console.error(chalk.red(`Framework documentation not found: ${frameworkDoc}`));
            process.exit(1);
          }
          const content = fs.readFileSync(frameworkDoc, 'utf-8');
          console.log(content);
          return;
        }
        
        // For modes, show framework doc + mode-specific guidelines if they exist
        const modeSpecificFiles: Record<string, string | null> = {
          script: path.join(frameworkDir, 'docs', 'SCRIPT-MODE-GUIDELINES.md'),
          feature: null, // No feature-specific guidelines yet
          vibe: null     // No vibe-specific guidelines yet
        };
        
        const validTypes = ['framework', ...Object.keys(modeSpecificFiles)];
        if (!validTypes.includes(type)) {
          console.error(chalk.red(`Invalid type: ${type}`));
          console.log(chalk.yellow(`Valid types: ${validTypes.join(', ')}`));
          process.exit(1);
        }
        
        // Start with framework documentation for all modes
        let content = '';
        if (fs.existsSync(frameworkDoc)) {
          content = fs.readFileSync(frameworkDoc, 'utf-8');
        }
        
        // Add mode-specific guidelines if they exist
        const modeSpecificFile = modeSpecificFiles[type];
        if (modeSpecificFile && fs.existsSync(modeSpecificFile)) {
          content += '\n\n' + '='.repeat(70) + '\n';
          content += `MODE-SPECIFIC GUIDELINES: ${type.toUpperCase()}\n`;
          content += '='.repeat(70) + '\n\n';
          const modeContent = fs.readFileSync(modeSpecificFile, 'utf-8');
          content += modeContent;
        }
        
        // Filter content based on options
        if (options.summary && type === 'script') {
          // Extract just core principles and required features for script mode
          const lines = content.split('\n');
          let inPrinciples = false;
          let inRequired = false;
          const output: string[] = [];
          
          for (const line of lines) {
            if (line.startsWith('## Core Principles')) {
              inPrinciples = true;
              output.push(line);
            } else if (line.startsWith('## Required Features Checklist')) {
              inRequired = true;
              output.push(line);
            } else if (line.startsWith('##') && (inPrinciples || inRequired)) {
              break;
            } else if (inPrinciples || inRequired) {
              output.push(line);
            }
          }
          
          console.log(output.join('\n'));
        } else if (options.checklist && type === 'script') {
          // Extract just the checklist
          const lines = content.split('\n');
          let inChecklist = false;
          const output: string[] = [];
          
          for (const line of lines) {
            if (line.startsWith('## Required Features Checklist')) {
              inChecklist = true;
              output.push(line);
            } else if (line.startsWith('##') && inChecklist) {
              break;
            } else if (inChecklist) {
              output.push(line);
            }
          }
          
          console.log(output.join('\n'));
        } else if (options.examples && type === 'script') {
          // Extract just the examples
          const lines = content.split('\n');
          let inExamples = false;
          const output: string[] = [];
          
          for (const line of lines) {
            if (line.startsWith('## Common Patterns')) {
              inExamples = true;
              output.push(line);
            } else if (line.startsWith('## Anti-patterns')) {
              output.push(line);
              inExamples = true;
            } else if (line.startsWith('##') && inExamples && 
                       !line.startsWith('### ') && 
                       !line.startsWith('## Anti-patterns')) {
              break;
            } else if (inExamples) {
              output.push(line);
            }
          }
          
          console.log(output.join('\n'));
        } else {
          // Show full content
          console.log(content);
        }
        
      } catch (error: any) {
        console.error(chalk.red('Error reading guidelines:'), error.message);
        process.exit(1);
      }
    });
}