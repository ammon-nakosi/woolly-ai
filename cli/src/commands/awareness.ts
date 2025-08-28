#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { Command } from 'commander';
import { execSync } from 'child_process';

const COUNSEL_DIR = path.join(os.homedir(), '.counsel');
const AI_AWARENESS_DIR = path.join(COUNSEL_DIR, 'ai-awareness');
const AWARENESS_FILE = 'COUNSEL-AWARENESS.md';

class AwarenessCommand {
  private program: Command;

  constructor() {
    this.program = new Command('awareness')
      .description('Manage AI assistant counsel awareness')
      .addCommand(this.createStatusCommand())
      .addCommand(this.createSetupCommand())
      .addCommand(this.createUpdateCommand())
      .addCommand(this.createVerifyCommand());
  }

  private createStatusCommand(): Command {
    return new Command('status')
      .description('Check AI awareness configuration status')
      .action(() => this.checkStatus());
  }

  private createSetupCommand(): Command {
    return new Command('setup')
      .description('Set up AI awareness for Claude and Cursor')
      .option('--claude', 'Setup Claude awareness only')
      .option('--cursor', 'Setup Cursor awareness only')
      .action((options) => this.setupAwareness(options));
  }

  private createUpdateCommand(): Command {
    return new Command('update')
      .description('Update AI awareness to latest version')
      .action(() => this.updateAwareness());
  }

  private createVerifyCommand(): Command {
    return new Command('verify')
      .description('Verify AI awareness is working')
      .action(() => this.verifyAwareness());
  }

  private checkStatus(): void {
    console.log(chalk.cyan('\n📊 AI Awareness Status\n'));

    // Check awareness files
    const awarenessPath = path.join(AI_AWARENESS_DIR, AWARENESS_FILE);
    const awarenessExists = fs.existsSync(awarenessPath);
    
    if (awarenessExists) {
      const versionPath = path.join(AI_AWARENESS_DIR, 'version.txt');
      const version = fs.existsSync(versionPath) 
        ? fs.readFileSync(versionPath, 'utf8').trim() 
        : 'unknown';
      console.log(`✅ Awareness files installed (v${version})`);
    } else {
      console.log('❌ Awareness files not found');
    }

    // Check Claude configuration
    const claudeDir = path.join(os.homedir(), '.claude');
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    
    if (fs.existsSync(claudeMdPath)) {
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      const hasImport = content.includes('counsel/ai-awareness');
      
      if (hasImport) {
        console.log('✅ Claude: Configured with counsel awareness');
      } else {
        console.log('⚠️  Claude: CLAUDE.md exists but missing counsel import');
        console.log(chalk.gray('   Run: counsel awareness setup --claude'));
      }
    } else if (fs.existsSync(claudeDir)) {
      console.log('⚠️  Claude: Directory exists but CLAUDE.md not found');
      console.log(chalk.gray('   Run: counsel awareness setup --claude'));
    } else {
      console.log('ℹ️  Claude: Not detected');
    }

    // Check Cursor configuration (project-level)
    const cursorRulesPath = '.cursorrules';
    const cursorDirPath = '.cursor';
    
    if (fs.existsSync(cursorRulesPath)) {
      const content = fs.readFileSync(cursorRulesPath, 'utf8');
      const hasCounsel = content.toLowerCase().includes('counsel');
      
      if (hasCounsel) {
        console.log('✅ Cursor: Project configured with counsel awareness');
      } else {
        console.log('⚠️  Cursor: .cursorrules exists but missing counsel awareness');
        console.log(chalk.gray('   Run: counsel cursor awareness'));
      }
    } else if (fs.existsSync(cursorDirPath)) {
      console.log('ℹ️  Cursor: Project has .cursor/ but no rules file');
      console.log(chalk.gray('   Run: counsel cursor awareness'));
    } else {
      console.log('ℹ️  Cursor: No project configuration');
      console.log(chalk.gray('   Run: counsel cursor init'));
    }

    // Summary
    console.log(chalk.cyan('\n📝 Summary'));
    if (awarenessExists) {
      console.log('AI assistants can understand natural "counsel" mentions.');
      console.log('Try saying: "counsel log this works" to test.\n');
    } else {
      console.log('Run ' + chalk.bold('counsel awareness setup') + ' to configure AI awareness.\n');
    }
  }

  private async setupAwareness(options: { claude?: boolean; cursor?: boolean }): Promise<void> {
    const setupBoth = !options.claude && !options.cursor;
    
    console.log(chalk.cyan('\n🔧 Setting up AI Awareness\n'));

    // First ensure awareness files exist
    this.ensureAwarenessFiles();

    if (setupBoth || options.claude) {
      await this.setupClaude();
    }

    if (setupBoth || options.cursor) {
      await this.setupCursorProject();
    }

    console.log(chalk.green('\n✅ AI awareness setup complete!'));
    console.log('Test it by saying: "counsel log test message"\n');
  }

  private ensureAwarenessFiles(): void {
    if (!fs.existsSync(AI_AWARENESS_DIR)) {
      fs.mkdirSync(AI_AWARENESS_DIR, { recursive: true });
    }

    const sourceFile = path.join(__dirname, '..', '..', '..', 'docs', AWARENESS_FILE);
    const targetFile = path.join(AI_AWARENESS_DIR, AWARENESS_FILE);

    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log('✅ Copied awareness document to ~/.counsel/ai-awareness/');
    } else {
      console.log('⚠️  Source awareness file not found, creating minimal version');
      this.createMinimalAwareness(targetFile);
    }

    // Update version
    const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      fs.writeFileSync(path.join(AI_AWARENESS_DIR, 'version.txt'), packageJson.version || '1.0.0');
    }
  }

  private async setupClaude(): Promise<void> {
    const claudeDir = path.join(os.homedir(), '.claude');
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');

    if (!fs.existsSync(claudeDir)) {
      console.log('ℹ️  Claude directory not found at ~/.claude');
      console.log('   Creating directory and CLAUDE.md...');
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    let content = '';
    if (fs.existsSync(claudeMdPath)) {
      content = fs.readFileSync(claudeMdPath, 'utf8');
    }

    const importLine = 'import: ~/.counsel/ai-awareness/COUNSEL-AWARENESS.md';
    
    if (content.includes(importLine) || content.includes('counsel/ai-awareness')) {
      console.log('✅ Claude already configured with counsel awareness');
      return;
    }

    // Add import
    const updatedContent = content + 
      (content && !content.endsWith('\n') ? '\n' : '') +
      '\n# Counsel Framework Integration\n' +
      importLine + '\n';

    fs.writeFileSync(claudeMdPath, updatedContent);
    console.log('✅ Added counsel awareness to Claude configuration');
  }

  private async setupCursorProject(): Promise<void> {
    const cursorRulesPath = '.cursorrules';
    
    // Check if we're in a project directory
    if (!fs.existsSync('package.json') && !fs.existsSync('.git')) {
      console.log('⚠️  Cursor setup requires a project directory');
      console.log('   Navigate to your project and run: counsel cursor awareness');
      return;
    }

    let content = '';
    if (fs.existsSync(cursorRulesPath)) {
      content = fs.readFileSync(cursorRulesPath, 'utf8');
    }

    if (content.toLowerCase().includes('counsel framework')) {
      console.log('✅ Cursor already configured with counsel awareness');
      return;
    }

    const cursorAwareness = `
# Counsel Framework Awareness

When users mention "counsel" in any form, they're referring to the Counsel Framework.
Understand these patterns:
- "counsel log [anything]" = Add to current work notes
- "counsel track [issue]" = Create debug work
- "counsel this" = Create appropriate work
- "counsel status" = Check work status

Reference: @~/.counsel/ai-awareness/COUNSEL-AWARENESS.md
`;

    const updatedContent = content + 
      (content && !content.endsWith('\n') ? '\n' : '') +
      cursorAwareness;

    fs.writeFileSync(cursorRulesPath, updatedContent);
    console.log('✅ Added counsel awareness to .cursorrules');
  }

  private async updateAwareness(): Promise<void> {
    console.log(chalk.cyan('\n🔄 Updating AI Awareness\n'));

    // Get current version
    const versionPath = path.join(AI_AWARENESS_DIR, 'version.txt');
    const currentVersion = fs.existsSync(versionPath) 
      ? fs.readFileSync(versionPath, 'utf8').trim() 
      : '0.0.0';

    // Get latest version from package.json
    const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const latestVersion = packageJson.version || '1.0.0';

    console.log(`Current version: ${currentVersion}`);
    console.log(`Latest version: ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log(chalk.green('✅ Already up to date!'));
      return;
    }

    // Update awareness files
    this.ensureAwarenessFiles();
    console.log(chalk.green(`✅ Updated to version ${latestVersion}`));
    console.log('\nNote: Import statements in CLAUDE.md will automatically use the updated file.');
  }

  private async verifyAwareness(): Promise<void> {
    console.log(chalk.cyan('\n🔍 Verifying AI Awareness\n'));

    // Check if awareness file exists
    const awarenessPath = path.join(AI_AWARENESS_DIR, AWARENESS_FILE);
    if (!fs.existsSync(awarenessPath)) {
      console.log('❌ Awareness file not found');
      console.log('Run: counsel awareness setup');
      return;
    }

    console.log('✅ Awareness file exists');

    // Check Claude
    const claudeMdPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) {
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      if (content.includes('counsel/ai-awareness')) {
        console.log('✅ Claude is configured');
      } else {
        console.log('⚠️  Claude needs configuration');
      }
    }

    // Test suggestions
    console.log(chalk.cyan('\n📝 Test Phrases'));
    console.log('Try these with your AI assistant:');
    console.log('  • "counsel log fixed the bug"');
    console.log('  • "counsel track this issue"');
    console.log('  • "what\'s in counsel?"');
    console.log('  • "counsel status"');
    
    console.log(chalk.cyan('\n✨ Expected Behavior'));
    console.log('The AI should understand these as counsel commands');
    console.log('without requiring slash commands or exact syntax.\n');
  }

  private createMinimalAwareness(targetPath: string): void {
    const minimalContent = `# Counsel Framework AI Awareness

## Pattern Recognition
When users mention "counsel", they're referring to the Counsel Framework.

### Common Patterns
- counsel log [anything] → Add to current work notes
- counsel track [issue] → Create debug work  
- counsel this → Create appropriate work
- counsel status → Check work status
- counsel search [term] → Search all work

## Context
Maintain awareness of active counsel work in the session.
`;
    fs.writeFileSync(targetPath, minimalContent);
  }

  getCommand(): Command {
    return this.program;
  }
}

// Export register function for main CLI
export function registerAwarenessCommands(program: Command) {
  const awarenessCmd = new Command('awareness')
    .description('Manage AI assistant counsel awareness');

  awarenessCmd
    .command('status')
    .description('Check AI awareness configuration status')
    .action(() => {
      const awareness = new AwarenessCommand();
      awareness['checkStatus']();
    });

  awarenessCmd
    .command('setup')
    .description('Set up AI awareness for Claude and Cursor')
    .option('--claude', 'Setup Claude awareness only')
    .option('--cursor', 'Setup Cursor awareness only')
    .action((options) => {
      const awareness = new AwarenessCommand();
      awareness['setupAwareness'](options);
    });

  awarenessCmd
    .command('update')
    .description('Update AI awareness to latest version')
    .action(() => {
      const awareness = new AwarenessCommand();
      awareness['updateAwareness']();
    });

  awarenessCmd
    .command('verify')
    .description('Verify AI awareness is working')
    .action(() => {
      const awareness = new AwarenessCommand();
      awareness['verifyAwareness']();
    });

  program.addCommand(awarenessCmd);
}

// Export for use in main CLI
export default AwarenessCommand;

// Allow direct execution
if (require.main === module) {
  const awareness = new AwarenessCommand();
  awareness.getCommand().parse(process.argv);
}