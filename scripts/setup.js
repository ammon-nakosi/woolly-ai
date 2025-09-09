#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const COUNSEL_DIR = path.join(os.homedir(), '.woolly');

class CounselSetup {
  async run() {
    console.log(chalk.bold.cyan('\n🎯 Woolly Framework Setup\n'));
    
    // Check Node version
    this.checkNodeVersion();
    
    // Install dependencies first
    await this.installDependencies();
    
    // Create woolly directories
    await this.createDirectories();
    
    // Check Python and setup ChromaDB
    await this.setupPython();
    await this.setupChromaDB();
    
    // Initialize configuration
    await this.initializeConfig();
    
    // Setup slash commands for Claude
    await this.setupSlashCommands();
    
    // Create CLI commands
    await this.createCLICommands();
    
    // Install woolly CLI globally
    await this.installCLIGlobally();
    
    // Install web dependencies
    await this.installWebDependencies();
    
    // Setup AI awareness
    await this.setupAIAwareness();
    
    // Verify ChromaDB setup
    await this.verifySetup();
    
    // Print setup summary
    console.log(chalk.green('\n✅ Woolly Framework setup complete!\n'));
    
    // Check what was successfully installed
    const venvPath = path.join(COUNSEL_DIR, 'venv');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    const hasChromaDB = fs.existsSync(pythonPath) && (() => {
      try {
        execSync(`${pythonPath} -c "import chromadb"`, { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    })();
    
    const woollyAvailable = (() => {
      try {
        execSync('which woolly', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    })();
    
    console.log(chalk.cyan('Setup Summary:'));
    console.log('  ' + (woollyAvailable ? chalk.green('✓') : chalk.yellow('⚠')) + ' Woolly CLI: ' + 
                (woollyAvailable ? 'Installed globally' : 'Run "cd cli && npm link" to install'));
    console.log('  ' + (hasChromaDB ? chalk.green('✓') : chalk.yellow('⚠')) + ' ChromaDB: ' + 
                (hasChromaDB ? 'Ready' : 'Manual installation required (see instructions above)'));
    console.log('  ' + chalk.green('✓') + ' AI Integration: Claude is woolly-aware');
    
    console.log(chalk.cyan('\nNext steps:'));
    if (woollyAvailable) {
      console.log('  1. Run ' + chalk.bold('woolly init') + ' to configure your settings');
      if (hasChromaDB) {
        console.log('  2. Start ChromaDB: ' + chalk.bold('woolly chromadb start'));
      } else {
        console.log('  2. Install ChromaDB manually (see instructions above)');
      }
      console.log('  3. Create your first woolly work: ' + chalk.bold('/woolly-create feature "your feature"'));
    } else {
      console.log('  1. Install woolly CLI: ' + chalk.bold('cd cli && npm link'));
      console.log('  2. Configure settings: ' + chalk.bold('woolly init'));
      if (!hasChromaDB) {
        console.log('  3. Install ChromaDB manually (see instructions above)');
      }
    }
    
    console.log('\nDocumentation: https://github.com/ammon-nakosi/woolly-framework');
  }
  
  checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion < 16) {
      console.error(chalk.red('Error: Node.js 16 or higher is required'));
      console.error(chalk.yellow(`Your version: ${nodeVersion}`));
      process.exit(1);
    }
  }

  async installDependencies() {
    const spinner = ora('Verifying dependencies...').start();
    
    try {
      // Since npm install is run before this script, just verify CLI dependencies
      const cliPath = path.join(process.cwd(), 'cli');
      if (fs.existsSync(cliPath)) {
        // Check if CLI node_modules exists
        const cliModulesPath = path.join(cliPath, 'node_modules');
        if (!fs.existsSync(cliModulesPath)) {
          spinner.text = 'Installing CLI dependencies...';
          execSync('npm install', {
            cwd: cliPath,
            stdio: 'ignore',
            encoding: 'utf-8'
          });
        }
      }
      
      spinner.succeed('Dependencies verified');
    } catch (error) {
      spinner.fail('Failed to verify dependencies');
      console.error(chalk.red('Error:'), error.message);
      console.log(chalk.yellow('\nTry running manually:'));
      console.log(chalk.gray('  cd cli && npm install'));
      process.exit(1);
    }
  }
  
  async createDirectories() {
    const spinner = ora('Creating woolly directories...').start();
    
    const dirs = [
      COUNSEL_DIR,
      path.join(COUNSEL_DIR, 'features'),
      path.join(COUNSEL_DIR, 'scripts'),
      path.join(COUNSEL_DIR, 'vibes'),
      path.join(COUNSEL_DIR, 'prompts'),
      path.join(COUNSEL_DIR, 'archives'),
      path.join(COUNSEL_DIR, 'knowledge'),
      path.join(COUNSEL_DIR, 'chromadb'),
      path.join(COUNSEL_DIR, 'bin'),
      path.join(COUNSEL_DIR, 'ai-awareness')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    spinner.succeed('Woolly directories created');
  }
  
  async setupPython() {
    const spinner = ora('Checking Python installation...').start();
    
    // Check for Python 3.11 first, then fall back to other versions
    let pythonCmd = null;
    let pythonVersion = null;
    
    // Prioritize Python 3.11 for ChromaDB compatibility
    for (const cmd of ['python3.11', 'python3.10', 'python3.9', 'python3', 'python']) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf-8' }).trim();
        if (version.includes('Python 3.')) {
          const versionMatch = version.match(/Python 3\.(\d+)\.(\d+)/);
          if (versionMatch) {
            const majorVersion = parseInt(versionMatch[1]);
            // ChromaDB doesn't support Python 3.13 yet
            if (majorVersion === 13) {
              spinner.text = `Found ${version} (not compatible with ChromaDB, checking for older versions...)`;
              continue;
            }
            if (majorVersion >= 9 && majorVersion <= 12) {
              pythonCmd = cmd;
              pythonVersion = version;
              break;
            }
          }
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    if (!pythonCmd) {
      spinner.fail('Compatible Python version not found');
      console.log(chalk.red('\n❌ Python 3.9-3.12 is required for ChromaDB'));
      console.log(chalk.red('   Python 3.13 is not yet supported by ChromaDB'));
      console.log(chalk.yellow('Please install Python 3.11 from: https://www.python.org/downloads/'));
      console.log(chalk.gray('After installing Python 3.11, run this setup again'));
      process.exit(1);
    }
    
    spinner.succeed(`Found ${pythonVersion}`);
    
    // Check pip
    spinner.start('Checking pip...');
    try {
      execSync(`${pythonCmd} -m pip --version`, { stdio: 'ignore' });
      spinner.succeed('pip is available');
    } catch (e) {
      spinner.fail('pip is not available');
      console.log(chalk.yellow('\nInstalling pip...'));
      try {
        execSync(`${pythonCmd} -m ensurepip`, { stdio: 'inherit' });
      } catch (e) {
        console.log(chalk.red('Failed to install pip'));
        process.exit(1);
      }
    }
    
    // Store Python command for later use
    this.pythonCmd = pythonCmd;
  }
  
  async setupChromaDB() {
    const spinner = ora('Setting up ChromaDB...').start();
    const venvPath = path.join(COUNSEL_DIR, 'venv');
    
    // Create virtual environment if it doesn't exist
    if (!fs.existsSync(venvPath)) {
      spinner.text = 'Creating Python virtual environment...';
      try {
        execSync(`${this.pythonCmd} -m venv ${venvPath}`, { stdio: 'ignore' });
      } catch (error) {
        spinner.fail('Failed to create virtual environment');
        console.log(chalk.red('Could not create Python virtual environment'));
        console.log(chalk.yellow('Please ensure Python venv module is installed'));
        console.log(chalk.gray('Try: apt-get install python3-venv (Ubuntu) or brew install python@3 (macOS)'));
        process.exit(1);
      }
    }
    
    // Determine pip path based on OS
    const isWindows = process.platform === 'win32';
    const pipPath = isWindows 
      ? path.join(venvPath, 'Scripts', 'pip')
      : path.join(venvPath, 'bin', 'pip');
    
    // First, ensure pip itself is up to date
    spinner.text = 'Updating pip in virtual environment...';
    try {
      execSync(`${pipPath} install --upgrade pip`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    } catch (pipError) {
      // Not critical if pip upgrade fails, continue
      console.log(chalk.yellow('⚠️  Could not upgrade pip, continuing with current version'));
    }
    
    // Install/upgrade ChromaDB in virtual environment
    spinner.text = 'Installing ChromaDB (this may take a minute)...';
    
    // Try multiple installation strategies
    const installStrategies = [
      {
        name: 'standard install',
        command: `${pipPath} install chromadb`,
        description: 'Installing with standard method'
      },
      {
        name: 'upgrade install',
        command: `${pipPath} install --upgrade chromadb`,
        description: 'Attempting upgrade installation'
      },
      {
        name: 'no-cache install',
        command: `${pipPath} install --no-cache-dir chromadb`,
        description: 'Installing without pip cache'
      }
    ];
    
    let installed = false;
    let lastError = null;
    
    for (const strategy of installStrategies) {
      try {
        spinner.text = `${strategy.description}...`;
        
        // Use 'pipe' to capture output, but print errors if they occur
        const output = execSync(strategy.command, {
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 120000 // 2 minute timeout
        });
        
        // If we get here, installation succeeded
        installed = true;
        spinner.succeed('ChromaDB installed successfully in virtual environment');
        break;
        
      } catch (error) {
        lastError = error;
        
        // Check for specific error patterns
        if (error.message && error.message.includes('Microsoft Visual C++')) {
          spinner.fail('ChromaDB installation requires Microsoft Visual C++ Build Tools');
          console.log(chalk.yellow('\n📦 Windows users need additional tools:'));
          console.log(chalk.gray('1. Download Visual Studio Build Tools:'));
          console.log(chalk.blue('   https://visualstudio.microsoft.com/visual-cpp-build-tools/'));
          console.log(chalk.gray('2. Install "Desktop development with C++" workload'));
          console.log(chalk.gray('3. Restart and run setup again\n'));
          process.exit(1);
        }
        
        // Continue to next strategy
        continue;
      }
    }
    
    if (!installed) {
      spinner.fail('Failed to install ChromaDB after multiple attempts');
      
      // Show the actual error to help with debugging
      if (lastError && lastError.stderr) {
        console.log(chalk.red('\n❌ Installation Error Details:'));
        console.log(chalk.gray(lastError.stderr.slice(-500))); // Show last 500 chars of error
      }
      
      // Provide helpful context based on Python version
      const pythonVersion = this.pythonCmd && execSync(`${this.pythonCmd} --version`, { encoding: 'utf-8' }).trim();
      if (pythonVersion && pythonVersion.includes('3.13')) {
        console.log(chalk.yellow('\n⚠️  Python 3.13 detected - this is a very new version'));
        console.log(chalk.gray('ChromaDB may not yet be fully compatible with Python 3.13'));
        console.log(chalk.gray('Consider using Python 3.11 or 3.12 for better compatibility\n'));
      }
      
      console.log(chalk.yellow('\n📝 Manual installation steps:'));
      console.log(chalk.gray('1. Activate the virtual environment:'));
      console.log(chalk.cyan(`   source ${venvPath}/bin/activate`));
      console.log(chalk.gray('2. Try installing with verbose output to see the issue:'));
      console.log(chalk.cyan('   pip install chromadb -v'));
      console.log(chalk.gray('3. If that fails, try with Python 3.11:'));
      console.log(chalk.cyan('   python3.11 -m venv ~/.woolly/venv'));
      console.log(chalk.cyan('   source ~/.woolly/venv/bin/activate'));
      console.log(chalk.cyan('   pip install chromadb\n'));
      
      // Don't exit immediately - mark as warning instead
      console.log(chalk.yellow('⚠️  Continuing setup without ChromaDB...'));
      console.log(chalk.gray('The framework will work but search functionality will be limited\n'));
      return; // Continue setup instead of exiting
    }
    
    // Store venv paths for later use
    this.venvPath = venvPath;
    this.venvPython = isWindows 
      ? path.join(venvPath, 'Scripts', 'python')
      : path.join(venvPath, 'bin', 'python');
    
    // Create ChromaDB startup script
    await this.createChromaDBScripts();
  }
  
  async createChromaDBScripts() {
    const spinner = ora('Creating ChromaDB scripts...').start();
    
    // Create start script using venv Python
    const startScript = `#!${this.venvPython}
import os
import sys
from pathlib import Path

# Add ChromaDB to path
sys.path.insert(0, str(Path.home() / '.woolly'))

def start_chromadb():
    """Start ChromaDB server"""
    import chromadb
    from chromadb.server import app
    import uvicorn
    
    # Set ChromaDB persistent directory
    persist_directory = Path.home() / '.woolly' / 'chromadb'
    persist_directory.mkdir(exist_ok=True)
    
    # Configure ChromaDB
    os.environ['PERSIST_DIRECTORY'] = str(persist_directory)
    os.environ['CHROMA_SERVER_CORS_ALLOW_ORIGINS'] = '["*"]'
    os.environ['ANONYMIZED_TELEMETRY'] = 'false'
    
    print(f"Starting ChromaDB server...")
    print(f"Data directory: {persist_directory}")
    print(f"Server URL: http://localhost:8444")
    print(f"Press Ctrl+C to stop")
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8444, log_level="info")

if __name__ == "__main__":
    try:
        start_chromadb()
    except KeyboardInterrupt:
        print("\\nChromaDB server stopped")
    except ImportError as e:
        print(f"Error: {e}")
        print("Please ensure ChromaDB is installed: pip install chromadb")
        sys.exit(1)
`;
    
    const scriptPath = path.join(COUNSEL_DIR, 'bin', 'chromadb-server.py');
    fs.writeFileSync(scriptPath, startScript);
    fs.chmodSync(scriptPath, '755');
    
    // Create convenience shell script that uses venv
    const shellScript = `#!/bin/bash
# ChromaDB server for Woolly Framework
# Uses Python from virtual environment
${this.venvPython} ${scriptPath}
`;
    
    const shellScriptPath = path.join(COUNSEL_DIR, 'bin', 'chromadb-start.sh');
    fs.writeFileSync(shellScriptPath, shellScript);
    fs.chmodSync(shellScriptPath, '755');
    
    spinner.succeed('ChromaDB scripts created');
  }
  
  async initializeConfig() {
    const spinner = ora('Creating default configuration...').start();
    const configPath = path.join(COUNSEL_DIR, 'config.json');
    
    if (fs.existsSync(configPath)) {
      spinner.info('Configuration already exists');
      return;
    }
    
    const defaultConfig = {
      version: '1.0.0',
      chromadb: {
        host: 'localhost',
        port: 8444,
        path: path.join(COUNSEL_DIR, 'chromadb')
      },
      patternExtraction: {
        mode: 'semi-auto',
        triggers: {
          onComplete: true,
          onArchive: true,
          minComplexity: 'medium'
        }
      },
      initialized: false, // Will be set to true after woolly init
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    spinner.succeed('Default configuration created');
  }
  
  async setupSlashCommands() {
    const claudeDir = path.join(os.homedir(), '.claude');
    const claudeCommandsDir = path.join(claudeDir, 'commands');
    
    // Check if .claude exists
    if (!fs.existsSync(claudeDir)) {
      console.log(chalk.yellow('\n⚠️  Claude directory not found at ~/.claude'));
      console.log(chalk.gray('You can copy slash commands manually later:'));
      console.log(chalk.gray('  cp commands/*.md ~/.claude/commands/'));
      return;
    }
    
    // Create commands directory if it doesn't exist
    if (!fs.existsSync(claudeCommandsDir)) {
      console.log(chalk.cyan('Creating Claude commands directory...'));
      fs.mkdirSync(claudeCommandsDir, { recursive: true });
    }
    
    // Check for existing woolly commands in Claude's commands directory
    const existingFiles = fs.existsSync(claudeCommandsDir) 
      ? fs.readdirSync(claudeCommandsDir).filter(f => f.startsWith('woolly-'))
      : [];
    
    if (existingFiles.length > 0) {
      // Found existing woolly commands, ask to overwrite
      const customCommands = existingFiles.filter(f => f.includes('-custom'));
      const standardCommands = existingFiles.filter(f => !f.includes('-custom'));
      
      console.log(chalk.yellow(`\nFound ${existingFiles.length} existing woolly commands:`));
      if (standardCommands.length > 0) {
        console.log(chalk.gray(`  - ${standardCommands.length} standard commands`));
      }
      if (customCommands.length > 0) {
        console.log(chalk.cyan(`  - ${customCommands.length} custom commands (will be preserved)`));
      }
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Update woolly commands? (custom commands will be preserved)',
          default: true
        }
      ]);
      
      if (overwrite) {
        const spinner = ora('Updating woolly commands...').start();
        
        // Remove all woolly- commands that don't have -custom in the name
        let removed = 0;
        for (const file of standardCommands) {
          const filePath = path.join(claudeCommandsDir, file);
          fs.unlinkSync(filePath);
          removed++;
        }
        
        // Copy all new woolly commands from the commands directory
        const commandsDir = path.join(__dirname, '..', 'commands');
        const counselCommands = fs.readdirSync(commandsDir).filter(f => f.startsWith('woolly-'));
        
        let copied = 0;
        for (const file of counselCommands) {
          const src = path.join(commandsDir, file);
          const dest = path.join(claudeCommandsDir, file);
          fs.copyFileSync(src, dest);
          copied++;
        }
        
        spinner.succeed(`Updated woolly commands (removed ${removed}, added ${copied}, preserved ${customCommands.length} custom)`);
      } else {
        console.log(chalk.gray('Skipped updating woolly commands'));
      }
    } else {
      // No existing woolly commands, just copy them all
      const spinner = ora('Installing woolly slash commands...').start();
      
      const commandsDir = path.join(__dirname, '..', 'commands');
      const counselCommands = fs.readdirSync(commandsDir).filter(f => f.startsWith('woolly-'));
      
      let copied = 0;
      for (const file of counselCommands) {
        const src = path.join(commandsDir, file);
        const dest = path.join(claudeCommandsDir, file);
        fs.copyFileSync(src, dest);
        copied++;
      }
      
      spinner.succeed(`Installed ${copied} woolly slash commands`);
    }
  }
  
  async createCLICommands() {
    // Create a wrapper script for ChromaDB management
    const chromadbCommand = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const command = process.argv[2];
const scriptPath = path.join(os.homedir(), '.woolly', 'bin', 'chromadb-server.py');
const venvPython = path.join(os.homedir(), '.woolly', 'venv', 'bin', 'python');

if (command === 'start') {
  console.log('Starting ChromaDB server...');
  const child = spawn(venvPython, [scriptPath], {
    stdio: 'inherit',
    detached: false
  });
  
  child.on('error', (err) => {
    console.error('Failed to start ChromaDB:', err);
    process.exit(1);
  });
} else if (command === 'stop') {
  console.log('To stop ChromaDB, press Ctrl+C in the terminal where it\\'s running');
} else {
  console.log('Usage: woolly chromadb [start|stop]');
}
`;
    
    const chromadbCmdPath = path.join(__dirname, '..', 'cli', 'bin', 'woolly-chromadb');
    fs.writeFileSync(chromadbCmdPath, chromadbCommand);
    fs.chmodSync(chromadbCmdPath, '755');
  }
  
  async installCLIGlobally() {
    const spinner = ora('Installing woolly CLI globally...').start();
    const cliPath = path.join(process.cwd(), 'cli');
    
    try {
      // First, ensure CLI is built
      spinner.text = 'Building CLI...';
      execSync('npm run build', {
        cwd: cliPath,
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      // Now run npm link to make it globally available
      spinner.text = 'Making woolly command globally available...';
      execSync('npm link', {
        cwd: cliPath,
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      // Verify the command is available
      try {
        const woollyVersion = execSync('woolly --version', {
          encoding: 'utf-8',
          stdio: 'pipe'
        }).trim();
        
        spinner.succeed(`Woolly CLI installed globally (${woollyVersion})`);
        console.log(chalk.gray('   Command available: woolly'));
      } catch (verifyError) {
        // Command may not be in PATH yet
        spinner.succeed('Woolly CLI linked successfully');
        console.log(chalk.yellow('   Note: You may need to restart your terminal for the woolly command to work'));
      }
      
    } catch (error) {
      spinner.warn('Could not install woolly CLI globally');
      console.log(chalk.yellow('\nTo install woolly CLI manually:'));
      console.log(chalk.gray('  cd cli && npm link'));
      console.log(chalk.gray('\nOr, if you have permission issues:'));
      console.log(chalk.gray('  cd cli && sudo npm link'));
      console.log(chalk.gray('\nAlternatively, use npx:'));
      console.log(chalk.gray('  npx woolly [command]'));
    }
  }
  
  async installWebDependencies() {
    const webPath = path.join(__dirname, '..', 'web');
    
    // Check if web directory exists
    if (!fs.existsSync(webPath)) {
      console.log(chalk.yellow('⚠️  Web directory not found, skipping dependency installation'));
      return;
    }
    
    const spinner = ora('Installing web dependencies...').start();
    
    try {
      // Check if node_modules already exists
      const nodeModulesPath = path.join(webPath, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        spinner.info('Web dependencies already installed');
        return;
      }
      
      // Install dependencies
      execSync('npm install', {
        cwd: webPath,
        stdio: 'ignore',
        encoding: 'utf-8'
      });
      
      spinner.succeed('Web dependencies installed successfully');
    } catch (error) {
      spinner.warn('Failed to install web dependencies');
      console.log(chalk.yellow('You can install them manually by running:'));
      console.log(chalk.gray('  cd web && npm install'));
    }
  }
  
  async setupAIAwareness() {
    const spinner = ora('Setting up AI awareness...').start();
    
    try {
      // Copy AI instructions document to ~/.woolly/ai-awareness/
      const sourceAwareness = path.join(__dirname, '..', 'docs', 'WOOLLY-AI-INSTRUCTIONS.md');
      const targetDir = path.join(COUNSEL_DIR, 'ai-awareness');
      const targetAwareness = path.join(targetDir, 'WOOLLY-AI-INSTRUCTIONS.md');
      
      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy AI instructions document
      if (fs.existsSync(sourceAwareness)) {
        fs.copyFileSync(sourceAwareness, targetAwareness);
      }
      
      // Setup Claude integration
      const claudeDir = path.join(os.homedir(), '.claude');
      const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
      
      if (fs.existsSync(claudeDir)) {
        // Check if CLAUDE.md exists
        let claudeMdContent = '';
        let isNewFile = false;
        
        if (fs.existsSync(claudeMdPath)) {
          claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');
        } else {
          isNewFile = true;
        }
        
        // Check if import already exists
        const newImportLine = 'import: ~/.woolly/ai-awareness/WOOLLY-AI-INSTRUCTIONS.md';
        const oldImportLine = 'import: ~/.woolly/ai-awareness/WOOLLY-AWARENESS.md';
        const hasNewImport = claudeMdContent.includes(newImportLine);
        const hasOldImport = claudeMdContent.includes(oldImportLine);
        const hasImport = hasNewImport || hasOldImport;
        
        if (hasOldImport && !hasNewImport) {
          // Migrate from old import to new import
          const updatedContent = claudeMdContent.replace(oldImportLine, newImportLine);
          fs.writeFileSync(claudeMdPath, updatedContent);
          spinner.succeed('AI instructions updated: Migrated to new woolly instructions file');
        } else if (!hasImport) {
          // Add import statement
          const updatedContent = claudeMdContent + 
            (claudeMdContent && !claudeMdContent.endsWith('\n') ? '\n' : '') +
            '\n# Woolly Framework Integration\n' +
            newImportLine + '\n';
          
          fs.writeFileSync(claudeMdPath, updatedContent);
          
          if (isNewFile) {
            spinner.succeed('AI instructions configured: Created CLAUDE.md with woolly instructions');
          } else {
            spinner.succeed('AI instructions configured: Added woolly import to CLAUDE.md');
          }
        } else {
          spinner.succeed('AI instructions already configured in CLAUDE.md');
        }
      } else {
        // Claude not installed, but instruction files are ready
        spinner.succeed('AI instruction files prepared (Claude not detected)');
        console.log(chalk.yellow('  To enable: Add this to ~/.claude/CLAUDE.md:'));
        console.log(chalk.gray('  import: ~/.woolly/ai-awareness/WOOLLY-AI-INSTRUCTIONS.md'));
      }
      
      // Create version file for tracking
      const versionPath = path.join(targetDir, 'version.txt');
      const packageJson = require(path.join(__dirname, '..', 'package.json'));
      fs.writeFileSync(versionPath, packageJson.version || '1.0.0');
      
    } catch (error) {
      spinner.warn('AI awareness setup partially completed');
      console.log(chalk.yellow('  Manual setup may be required. See docs/CLAUDE-INTEGRATION.md'));
    }
  }
  
  async verifySetup() {
    const spinner = ora('Verifying setup...').start();
    
    try {
      // Check if Python venv was created successfully
      const venvPath = path.join(COUNSEL_DIR, 'venv');
      const isWindows = process.platform === 'win32';
      const pythonPath = isWindows 
        ? path.join(venvPath, 'Scripts', 'python')
        : path.join(venvPath, 'bin', 'python');
      
      if (!fs.existsSync(pythonPath)) {
        spinner.warn('Python virtual environment not found');
        console.log(chalk.yellow('⚠️  Python venv was not created'));
        console.log(chalk.gray('ChromaDB features will not be available'));
        console.log(chalk.gray('The framework will still work for other features'));
        return;
      }
      
      // Test ChromaDB import
      spinner.text = 'Verifying ChromaDB installation...';
      try {
        const versionCheck = execSync(
          `${pythonPath} -c "import chromadb; print(f'ChromaDB version: {chromadb.__version__}')"`, 
          { 
            stdio: 'pipe', 
            encoding: 'utf-8',
            timeout: 10000 // 10 second timeout
          }
        ).trim();
        
        spinner.succeed('Setup verification passed');
        console.log(chalk.green('✅ ChromaDB is ready to use'));
        console.log(chalk.gray(`   ${versionCheck}`));
        console.log(chalk.gray(`   Virtual environment: ${venvPath}`));
        console.log(chalk.gray('   Start server: woolly chromadb start'));
        
      } catch (importError) {
        spinner.warn('ChromaDB not installed');
        console.log(chalk.yellow('\n⚠️  ChromaDB is not installed in the virtual environment'));
        console.log(chalk.gray('The framework will work, but with limited search functionality'));
        console.log(chalk.gray('\nTo enable ChromaDB features:'));
        console.log(chalk.cyan(`  source ${venvPath}/bin/activate`));
        console.log(chalk.cyan('  pip install chromadb'));
        console.log(chalk.gray('\nFor Python 3.13 users, consider using Python 3.11 or 3.12'));
      }
      
    } catch (error) {
      spinner.warn('Setup verification encountered issues');
      console.log(chalk.yellow('⚠️  Some components may need manual configuration'));
      console.log(chalk.gray('The core framework features will still work'));
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new CounselSetup();
  setup.run().catch(error => {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    process.exit(1);
  });
}

module.exports = CounselSetup;