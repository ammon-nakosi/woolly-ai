import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { CounselMode } from '../types';

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
    .description('Display mode-specific guidelines and best practices')
    .argument('<mode>', 'Mode to get guidelines for (script, feature, debug, review, vibe, prompt)')
    .option('-s, --summary', 'Show only core principles and specs')
    .option('-c, --checklist', 'Show only the specs checklist')
    .option('-e, --examples', 'Show only code examples')
    .action(async (mode: string, options) => {
      try {
        const frameworkDir = getFrameworkDir();
        
        // Map modes to their guideline files
        const guidelineFiles: Record<string, string> = {
          script: path.join(frameworkDir, 'docs', 'SCRIPT-MODE-GUIDELINES.md'),
          feature: path.join(frameworkDir, 'docs', 'WOOLLY-FRAMEWORK.md'),
          debug: path.join(frameworkDir, 'docs', 'WOOLLY-FRAMEWORK.md'), // Use framework for now
          review: path.join(frameworkDir, 'docs', 'WOOLLY-FRAMEWORK.md'), // Use framework for now
          vibe: path.join(frameworkDir, 'docs', 'WOOLLY-FRAMEWORK.md'),   // Use framework for now
          prompt: path.join(frameworkDir, 'docs', 'WOOLLY-FRAMEWORK.md'), // Use framework for now
        };
        
        const validModes = Object.keys(guidelineFiles);
        if (!validModes.includes(mode)) {
          console.error(chalk.red(`Invalid mode: ${mode}`));
          console.log(chalk.yellow(`Valid modes: ${validModes.join(', ')}`));
          process.exit(1);
        }
        
        const guidelineFile = guidelineFiles[mode];
        
        if (!fs.existsSync(guidelineFile)) {
          console.error(chalk.red(`Guidelines file not found: ${guidelineFile}`));
          process.exit(1);
        }
        
        const content = fs.readFileSync(guidelineFile, 'utf-8');
        
        // Filter content based on options
        if (options.summary && mode === 'script') {
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
        } else if (options.checklist && mode === 'script') {
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
        } else if (options.examples && mode === 'script') {
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