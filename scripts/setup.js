#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const COUNSEL_DIR = path.join(os.homedir(), '.counsel');

class CounselSetup {
  async run() {
    console.log(chalk.bold.cyan('\n🎯 Counsel Framework Setup\n'));
    
    // Check Node version
    this.checkNodeVersion();
    
    // Create counsel directories
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
    
    // Install visualizer dependencies
    await this.installVisualizerDependencies();
    
    console.log(chalk.green('\n✅ Counsel Framework setup complete!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log('  1. Run ' + chalk.bold('counsel init') + ' to configure your settings');
    console.log('  2. Start ChromaDB: ' + chalk.bold('counsel chromadb start'));
    console.log('  3. Set up AI assistant commands:');
    console.log('     - Claude: Commands installed globally');
    console.log('     - Cursor: Run ' + chalk.bold('counsel cursor init') + ' in your project');
    console.log('  4. Create your first counsel work: ' + chalk.bold('/counsel-create feature "your feature"'));
    console.log('\nDocumentation: https://github.com/ammon-nakosi/counsel-framework');
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
  
  async createDirectories() {
    const spinner = ora('Creating counsel directories...').start();
    
    const dirs = [
      COUNSEL_DIR,
      path.join(COUNSEL_DIR, 'features'),
      path.join(COUNSEL_DIR, 'scripts'),
      path.join(COUNSEL_DIR, 'debugs'),
      path.join(COUNSEL_DIR, 'reviews'),
      path.join(COUNSEL_DIR, 'vibes'),
      path.join(COUNSEL_DIR, 'archives'),
      path.join(COUNSEL_DIR, 'knowledge'),
      path.join(COUNSEL_DIR, 'chromadb'),
      path.join(COUNSEL_DIR, 'bin')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    spinner.succeed('Counsel directories created');
  }
  
  async setupPython() {
    const spinner = ora('Checking Python installation...').start();
    
    // Check for Python 3
    let pythonCmd = null;
    let pythonVersion = null;
    
    for (const cmd of ['python3', 'python']) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf-8' }).trim();
        if (version.includes('Python 3.')) {
          pythonCmd = cmd;
          pythonVersion = version;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    if (!pythonCmd) {
      spinner.fail('Python 3 is not installed');
      console.log(chalk.red('\n❌ Python 3.8+ is required for ChromaDB'));
      console.log(chalk.yellow('Please install Python from: https://www.python.org/downloads/'));
      console.log(chalk.gray('After installing Python, run this setup again'));
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
        process.exit(1);
      }
    }
    
    // Determine pip path based on OS
    const isWindows = process.platform === 'win32';
    const pipPath = isWindows 
      ? path.join(venvPath, 'Scripts', 'pip')
      : path.join(venvPath, 'bin', 'pip');
    
    // Install/upgrade ChromaDB in virtual environment
    spinner.text = 'Installing ChromaDB in virtual environment...';
    try {
      execSync(`${pipPath} install --upgrade chromadb --quiet`, { 
        stdio: 'ignore',
        encoding: 'utf-8'
      });
      spinner.succeed('ChromaDB installed successfully in virtual environment');
    } catch (error) {
      spinner.fail('Failed to install ChromaDB');
      console.log(chalk.yellow('\nPlease install ChromaDB manually:'));
      console.log(chalk.gray(`  source ${venvPath}/bin/activate`));
      console.log(chalk.gray(`  pip install chromadb`));
      process.exit(1);
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
sys.path.insert(0, str(Path.home() / '.counsel'))

def start_chromadb():
    """Start ChromaDB server"""
    import chromadb
    from chromadb.server import app
    import uvicorn
    
    # Set ChromaDB persistent directory
    persist_directory = Path.home() / '.counsel' / 'chromadb'
    persist_directory.mkdir(exist_ok=True)
    
    # Configure ChromaDB
    os.environ['PERSIST_DIRECTORY'] = str(persist_directory)
    os.environ['CHROMA_SERVER_CORS_ALLOW_ORIGINS'] = '["*"]'
    os.environ['ANONYMIZED_TELEMETRY'] = 'false'
    
    print(f"Starting ChromaDB server...")
    print(f"Data directory: {persist_directory}")
    print(f"Server URL: http://localhost:8000")
    print(f"Press Ctrl+C to stop")
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

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
# ChromaDB server for Counsel Framework
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
        port: 8000,
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
      initialized: false, // Will be set to true after counsel init
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
    
    // Check for existing counsel commands in Claude's commands directory
    const existingFiles = fs.existsSync(claudeCommandsDir) 
      ? fs.readdirSync(claudeCommandsDir).filter(f => f.startsWith('counsel-'))
      : [];
    
    if (existingFiles.length > 0) {
      // Found existing counsel commands, ask to overwrite
      const customCommands = existingFiles.filter(f => f.includes('-custom'));
      const standardCommands = existingFiles.filter(f => !f.includes('-custom'));
      
      console.log(chalk.yellow(`\nFound ${existingFiles.length} existing counsel commands:`));
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
          message: 'Update counsel commands? (custom commands will be preserved)',
          default: true
        }
      ]);
      
      if (overwrite) {
        const spinner = ora('Updating counsel commands...').start();
        
        // Remove all counsel- commands that don't have -custom in the name
        let removed = 0;
        for (const file of standardCommands) {
          const filePath = path.join(claudeCommandsDir, file);
          fs.unlinkSync(filePath);
          removed++;
        }
        
        // Copy all new counsel commands from the commands directory
        const commandsDir = path.join(__dirname, '..', 'commands');
        const counselCommands = fs.readdirSync(commandsDir).filter(f => f.startsWith('counsel-'));
        
        let copied = 0;
        for (const file of counselCommands) {
          const src = path.join(commandsDir, file);
          const dest = path.join(claudeCommandsDir, file);
          fs.copyFileSync(src, dest);
          copied++;
        }
        
        spinner.succeed(`Updated counsel commands (removed ${removed}, added ${copied}, preserved ${customCommands.length} custom)`);
      } else {
        console.log(chalk.gray('Skipped updating counsel commands'));
      }
    } else {
      // No existing counsel commands, just copy them all
      const spinner = ora('Installing counsel slash commands...').start();
      
      const commandsDir = path.join(__dirname, '..', 'commands');
      const counselCommands = fs.readdirSync(commandsDir).filter(f => f.startsWith('counsel-'));
      
      let copied = 0;
      for (const file of counselCommands) {
        const src = path.join(commandsDir, file);
        const dest = path.join(claudeCommandsDir, file);
        fs.copyFileSync(src, dest);
        copied++;
      }
      
      spinner.succeed(`Installed ${copied} counsel slash commands`);
    }
  }
  
  async createCLICommands() {
    // Create a wrapper script for ChromaDB management
    const chromadbCommand = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const command = process.argv[2];
const scriptPath = path.join(os.homedir(), '.counsel', 'bin', 'chromadb-server.py');
const venvPython = path.join(os.homedir(), '.counsel', 'venv', 'bin', 'python');

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
  console.log('Usage: counsel chromadb [start|stop]');
}
`;
    
    const chromadbCmdPath = path.join(__dirname, '..', 'cli', 'bin', 'counsel-chromadb');
    fs.writeFileSync(chromadbCmdPath, chromadbCommand);
    fs.chmodSync(chromadbCmdPath, '755');
  }
  
  async installVisualizerDependencies() {
    const visualizerPath = path.join(__dirname, '..', 'visualizer');
    
    // Check if visualizer directory exists
    if (!fs.existsSync(visualizerPath)) {
      console.log(chalk.yellow('⚠️  Visualizer directory not found, skipping dependency installation'));
      return;
    }
    
    const spinner = ora('Installing visualizer dependencies...').start();
    
    try {
      // Check if node_modules already exists
      const nodeModulesPath = path.join(visualizerPath, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        spinner.info('Visualizer dependencies already installed');
        return;
      }
      
      // Install dependencies
      execSync('npm install', {
        cwd: visualizerPath,
        stdio: 'ignore',
        encoding: 'utf-8'
      });
      
      spinner.succeed('Visualizer dependencies installed successfully');
    } catch (error) {
      spinner.warn('Failed to install visualizer dependencies');
      console.log(chalk.yellow('You can install them manually by running:'));
      console.log(chalk.gray('  cd visualizer && npm install'));
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