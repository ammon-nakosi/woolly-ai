import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { getConfig, updateConfig } from '../utils/config';

const execAsync = promisify(exec);

const CHROMADB_PORT = process.env.CHROMADB_PORT || '8444';
const CHROMADB_DATA_DIR = process.env.CHROMADB_DATA_DIR || path.join(os.homedir(), '.counsel', 'chromadb');
const COUNSEL_DIR = path.join(os.homedir(), '.counsel');
const VENV_PATH = path.join(COUNSEL_DIR, 'venv');
const CHROMADB_SCRIPT = path.join(COUNSEL_DIR, 'bin', 'chromadb-server.py');
const PID_FILE = path.join(COUNSEL_DIR, 'chromadb.pid');

// Determine Python executable path based on OS
const isWindows = process.platform === 'win32';
const VENV_PYTHON = isWindows 
  ? path.join(VENV_PATH, 'Scripts', 'python.exe')
  : path.join(VENV_PATH, 'bin', 'python');

async function checkVenv(): Promise<boolean> {
  try {
    await fs.access(VENV_PYTHON);
    return true;
  } catch {
    return false;
  }
}

async function checkChromaDBInstalled(): Promise<boolean> {
  try {
    const cmd = `"${VENV_PYTHON}" -c "import chromadb; print(chromadb.__version__)"`;
    await execAsync(cmd, { encoding: 'utf-8', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function checkOllamaInstalled(): Promise<boolean> {
  try {
    await execAsync('which ollama', { encoding: 'utf-8', timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

async function checkOllamaRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('curl -s http://localhost:11434/api/tags', { encoding: 'utf-8', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function startOllama(): Promise<boolean> {
  try {
    // Start Ollama in background using spawn
    const child = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    
    // Wait for it to start
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (await checkOllamaRunning()) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function ensureOllamaModel(model: string = 'nomic-embed-text'): Promise<boolean> {
  try {
    // Check if model exists
    const { stdout } = await execAsync('ollama list', { encoding: 'utf-8', timeout: 5000 });
    if (stdout.includes(model)) {
      return true;
    }
    
    // Pull the model
    console.log(chalk.yellow(`\nDownloading ${model} model (this may take a few minutes)...`));
    await execAsync(`ollama pull ${model}`, { encoding: 'utf-8', timeout: 300000 }); // 5 minute timeout
    return true;
  } catch {
    return false;
  }
}

async function isChromaDBRunning(): Promise<boolean> {
  try {
    // Check if PID file exists
    const pidData = await fs.readFile(PID_FILE, 'utf-8');
    const pid = parseInt(pidData.trim());
    
    // Check if process is running
    process.kill(pid, 0);
    
    // Also check if port is responding
    const response = await fetch(`http://localhost:${CHROMADB_PORT}/api/v1`);
    return response.ok;
  } catch {
    // Clean up stale PID file
    try {
      await fs.unlink(PID_FILE);
    } catch {}
    return false;
  }
}

async function waitForChromaDB(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${CHROMADB_PORT}/api/v1`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function setupVenv(): Promise<boolean> {
  const spinner = ora('Setting up Python virtual environment...').start();
  
  try {
    // Check for Python 3
    let pythonCmd = null;
    for (const cmd of ['python3', 'python']) {
      try {
        const version = await execAsync(`${cmd} --version`);
        if (version.stdout.includes('Python 3.')) {
          pythonCmd = cmd;
          break;
        }
      } catch {}
    }
    
    if (!pythonCmd) {
      spinner.fail('Python 3 is not installed');
      console.log(chalk.red('\n❌ Python 3.8+ is required for ChromaDB'));
      console.log(chalk.yellow('Please install Python from: https://www.python.org/downloads/'));
      return false;
    }
    
    // Create virtual environment
    spinner.text = 'Creating Python virtual environment...';
    await execAsync(`${pythonCmd} -m venv ${VENV_PATH}`);
    
    // Install ChromaDB
    spinner.text = 'Installing ChromaDB in virtual environment...';
    const pipPath = isWindows 
      ? path.join(VENV_PATH, 'Scripts', 'pip')
      : path.join(VENV_PATH, 'bin', 'pip');
    
    await execAsync(`${pipPath} install --upgrade pip`, { encoding: 'utf-8' });
    await execAsync(`${pipPath} install chromadb`, { encoding: 'utf-8' });
    
    spinner.succeed('Virtual environment setup complete');
    return true;
  } catch (error: any) {
    spinner.fail('Failed to setup virtual environment');
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
}

async function createChromaDBScript(): Promise<void> {
  const script = `#!${VENV_PYTHON}
import os
import sys
import signal
from pathlib import Path

# Add ChromaDB to path
sys.path.insert(0, str(Path.home() / '.counsel'))

def signal_handler(sig, frame):
    """Handle shutdown gracefully"""
    print("\\nShutting down ChromaDB server...")
    # Clean up PID file
    pid_file = Path.home() / '.counsel' / 'chromadb.pid'
    if pid_file.exists():
        pid_file.unlink()
    sys.exit(0)

def start_chromadb():
    """Start ChromaDB server"""
    import chromadb
    
    # Set ChromaDB persistent directory
    persist_directory = Path.home() / '.counsel' / 'chromadb'
    persist_directory.mkdir(exist_ok=True)
    
    # Configure ChromaDB settings
    os.environ['PERSIST_DIRECTORY'] = str(persist_directory)
    os.environ['ANONYMIZED_TELEMETRY'] = 'false'
    os.environ['CHROMA_SERVER_HOST'] = '0.0.0.0'
    os.environ['CHROMA_SERVER_HTTP_PORT'] = '8444'
    
    # Write PID file
    pid_file = Path.home() / '.counsel' / 'chromadb.pid'
    with open(pid_file, 'w') as f:
        f.write(str(os.getpid()))
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"Starting ChromaDB server...")
    print(f"Data directory: {persist_directory}")
    print(f"Server URL: http://localhost:8444")
    print(f"Press Ctrl+C to stop")
    print("")
    
    # Run the ChromaDB server using the CLI interface
    from chromadb.cli.cli import app
    import sys
    sys.argv = ['chromadb', 'run', '--path', str(persist_directory), '--host', '0.0.0.0', '--port', '8444']
    app()

if __name__ == "__main__":
    try:
        start_chromadb()
    except KeyboardInterrupt:
        signal_handler(None, None)
    except ImportError as e:
        print(f"Error: {e}")
        print("Please ensure ChromaDB is installed: pip install chromadb")
        sys.exit(1)
`;
  
  await fs.mkdir(path.join(COUNSEL_DIR, 'bin'), { recursive: true });
  await fs.writeFile(CHROMADB_SCRIPT, script);
  await fs.chmod(CHROMADB_SCRIPT, '755');
}

export function registerChromaDBCommands(program: Command) {
  const chromadb = program
    .command('chromadb')
    .description('Manage ChromaDB server using Python virtual environment');

  chromadb
    .command('start')
    .description('Start ChromaDB server using Python venv')
    .option('--port <port>', 'Port to run ChromaDB on', CHROMADB_PORT)
    .option('--data-dir <dir>', 'Directory for ChromaDB data', CHROMADB_DATA_DIR)
    .option('--background', 'Run in background (detached)', false)
    .action(async (options) => {
      const spinner = ora('Checking Python virtual environment...').start();
      
      try {
        // Check config for Ollama auto-start
        const config = await getConfig();
        const embedConfig = config.chromadb?.embeddings;
        
        if (embedConfig?.provider === 'ollama' && embedConfig?.autoStartOllama !== false) {
          // Check if Ollama is installed
          if (await checkOllamaInstalled()) {
            spinner.text = 'Checking Ollama service...';
            
            if (!await checkOllamaRunning()) {
              spinner.text = 'Starting Ollama service...';
              if (await startOllama()) {
                spinner.succeed('Ollama service started');
              } else {
                spinner.warn('Could not start Ollama automatically');
              }
            }
            
            // Ensure the model is downloaded
            const model = embedConfig.ollamaModel || 'nomic-embed-text';
            spinner.text = `Checking Ollama model ${model}...`;
            if (!await ensureOllamaModel(model)) {
              spinner.warn(`Could not download ${model} model`);
            }
          }
        }
        
        // Check if venv exists
        spinner.text = 'Checking Python virtual environment...';
        if (!await checkVenv()) {
          spinner.text = 'Virtual environment not found. Setting up...';
          const setupSuccess = await setupVenv();
          if (!setupSuccess) {
            process.exit(1);
          }
        }
        
        // Check if ChromaDB is installed
        spinner.text = 'Checking ChromaDB installation...';
        if (!await checkChromaDBInstalled()) {
          spinner.text = 'Installing ChromaDB...';
          const pipPath = isWindows 
            ? path.join(VENV_PATH, 'Scripts', 'pip')
            : path.join(VENV_PATH, 'bin', 'pip');
          
          try {
            await execAsync(`${pipPath} install chromadb`, { encoding: 'utf-8' });
          } catch (error: any) {
            spinner.fail('Failed to install ChromaDB');
            console.error(chalk.red('Error:'), error.message);
            console.log(chalk.yellow('\nTry installing manually:'));
            console.log(chalk.gray(`  source ${VENV_PATH}/bin/activate`));
            console.log(chalk.gray(`  pip install chromadb`));
            process.exit(1);
          }
        }
        
        // Check if ChromaDB is already running
        if (await isChromaDBRunning()) {
          spinner.succeed('ChromaDB is already running');
          console.log(chalk.gray(`\nChromaDB is available at: http://localhost:${options.port}`));
          console.log(chalk.cyan('\nUseful commands:'));
          console.log('  View logs:    counsel chromadb logs');
          console.log('  Stop server:  counsel chromadb stop');
          console.log('  View status:  counsel chromadb status');
          return;
        }
        
        // Create data directory
        spinner.text = 'Creating data directory...';
        await fs.mkdir(options.dataDir, { recursive: true });
        
        // Create/update ChromaDB script
        spinner.text = 'Preparing ChromaDB server script...';
        await createChromaDBScript();
        
        // Start ChromaDB server
        spinner.text = 'Starting ChromaDB server...';
        
        if (options.background) {
          // Start in background
          const child = spawn(VENV_PYTHON, [CHROMADB_SCRIPT], {
            detached: true,
            stdio: 'ignore'
          });
          
          child.unref();
          
          // Wait for ChromaDB to be ready
          spinner.text = 'Waiting for ChromaDB to be ready...';
          const isReady = await waitForChromaDB();
          
          if (!isReady) {
            spinner.fail('ChromaDB failed to start');
            console.log(chalk.red('\nCheck if port 8444 is already in use'));
            process.exit(1);
          }
          
          spinner.succeed('ChromaDB started successfully in background!');
        } else {
          // Start in foreground
          spinner.succeed('Starting ChromaDB server...');
          
          console.log(chalk.green(`\n✅ ChromaDB is starting at: http://localhost:${options.port}\n`));
          
          const child = spawn(VENV_PYTHON, [CHROMADB_SCRIPT], {
            stdio: 'inherit'
          });
          
          child.on('error', (err) => {
            console.error(chalk.red('Failed to start ChromaDB:'), err);
            process.exit(1);
          });
          
          child.on('exit', (code) => {
            if (code !== 0 && code !== null) {
              console.error(chalk.red(`ChromaDB exited with code ${code}`));
              process.exit(code);
            }
          });
          
          // Keep the process running
          process.on('SIGINT', () => {
            child.kill('SIGINT');
          });
          
          return;
        }
        
        console.log(chalk.green(`\n✅ ChromaDB is running at: http://localhost:${options.port}\n`));
        console.log(chalk.cyan('Next steps:'));
        console.log('  1. Index your counsel work:  counsel index --all');
        console.log('  2. Search your work:         counsel search <query>');
        console.log(chalk.gray('\nManage ChromaDB:'));
        console.log('  View logs:    counsel chromadb logs');
        console.log('  Stop server:  counsel chromadb stop');
        console.log('  View status:  counsel chromadb status');
        
      } catch (error: any) {
        spinner.fail('Failed to start ChromaDB');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  chromadb
    .command('stop')
    .description('Stop ChromaDB server')
    .action(async () => {
      const spinner = ora('Stopping ChromaDB...').start();
      
      try {
        if (!await isChromaDBRunning()) {
          spinner.info('ChromaDB is not running');
          return;
        }
        
        // Read PID and kill process
        const pidData = await fs.readFile(PID_FILE, 'utf-8');
        const pid = parseInt(pidData.trim());
        
        process.kill(pid, 'SIGTERM');
        
        // Wait a moment for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clean up PID file
        try {
          await fs.unlink(PID_FILE);
        } catch {}
        
        spinner.succeed('ChromaDB stopped');
        
      } catch (error: any) {
        spinner.fail('Failed to stop ChromaDB');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  chromadb
    .command('status')
    .description('Check ChromaDB server status')
    .action(async () => {
      const spinner = ora('Checking ChromaDB status...').start();
      
      try {
        if (!await checkVenv()) {
          spinner.fail('Python virtual environment not found');
          console.log(chalk.gray('\nSetup with: counsel chromadb start'));
          return;
        }
        
        if (!await checkChromaDBInstalled()) {
          spinner.fail('ChromaDB is not installed in virtual environment');
          console.log(chalk.gray('\nInstall with: counsel chromadb start'));
          return;
        }
        
        if (!await isChromaDBRunning()) {
          spinner.info('ChromaDB is not running');
          console.log(chalk.gray('\nStart it with: counsel chromadb start'));
          return;
        }
        
        // Check if API is responding
        try {
          const response = await fetch(`http://localhost:${CHROMADB_PORT}/api/v1`);
          if (response.ok) {
            spinner.succeed('ChromaDB is running and healthy');
            
            // Get process info
            try {
              const pidData = await fs.readFile(PID_FILE, 'utf-8');
              const pid = parseInt(pidData.trim());
              console.log(chalk.cyan('\nServer Info:'));
              console.log(`  PID: ${pid}`);
            } catch {}
            
            console.log(chalk.green(`\nAPI endpoint: http://localhost:${CHROMADB_PORT}`));
            console.log(chalk.gray(`Data directory: ${CHROMADB_DATA_DIR}`));
          } else {
            spinner.warn('ChromaDB process is running but API is not responding');
            console.log(chalk.yellow('\nTry restarting: counsel chromadb restart'));
          }
        } catch {
          spinner.warn('ChromaDB process is running but API is not accessible');
        }
        
      } catch (error: any) {
        spinner.fail('Failed to check status');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  chromadb
    .command('logs')
    .description('View ChromaDB server logs')
    .action(async () => {
      console.log(chalk.yellow('For venv-based ChromaDB, logs are shown in the terminal where it\'s running.'));
      console.log(chalk.gray('To run in foreground and see logs: counsel chromadb start'));
      console.log(chalk.gray('To run in background: counsel chromadb start --background'));
    });

  chromadb
    .command('restart')
    .description('Restart ChromaDB server')
    .action(async () => {
      const spinner = ora('Restarting ChromaDB...').start();
      
      try {
        // Stop if running
        if (await isChromaDBRunning()) {
          spinner.text = 'Stopping ChromaDB...';
          const pidData = await fs.readFile(PID_FILE, 'utf-8');
          const pid = parseInt(pidData.trim());
          process.kill(pid, 'SIGTERM');
          
          // Wait for shutdown
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Clean up PID file
          try {
            await fs.unlink(PID_FILE);
          } catch {}
        }
        
        spinner.text = 'Starting ChromaDB...';
        
        // Start in background
        const child = spawn(VENV_PYTHON, [CHROMADB_SCRIPT], {
          detached: true,
          stdio: 'ignore'
        });
        
        child.unref();
        
        // Wait for ChromaDB to be ready
        spinner.text = 'Waiting for ChromaDB to be ready...';
        const isReady = await waitForChromaDB();
        
        if (isReady) {
          spinner.succeed('ChromaDB restarted successfully');
        } else {
          spinner.fail('ChromaDB restarted but API is not responding');
        }
        
      } catch (error: any) {
        spinner.fail('Failed to restart ChromaDB');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  chromadb
    .command('embeddings [provider]')
    .description('Configure embedding provider for ChromaDB search')
    .option('--model <model>', 'Model to use (for Ollama)', 'nomic-embed-text')
    .option('--auto-start', 'Auto-start Ollama when needed', true)
    .option('--threshold <threshold>', 'Default similarity threshold', '0.3')
    .action(async (provider: string | undefined, options) => {
      const spinner = ora('Updating embeddings configuration...').start();
      
      try {
        const config = await getConfig();
        
        // If no provider specified, show current config
        if (!provider) {
          spinner.stop();
          const currentConfig = config.chromadb?.embeddings;
          
          console.log(chalk.bold('\n📊 Current Embeddings Configuration\n'));
          console.log('Provider:', chalk.cyan(currentConfig?.provider || 'default'));
          
          if (currentConfig?.provider === 'ollama') {
            console.log('Model:', chalk.cyan(currentConfig.ollamaModel || 'nomic-embed-text'));
            console.log('Auto-start:', chalk.cyan(currentConfig.autoStartOllama !== false ? 'enabled' : 'disabled'));
          }
          
          console.log('Default threshold:', chalk.cyan(currentConfig?.defaultThreshold || '0.3'));
          
          console.log(chalk.gray('\nAvailable providers:'));
          console.log('  ollama  - Free, local, good quality (recommended)');
          console.log('  openai  - Best quality (requires API key)');
          console.log('  default - Basic embeddings (limited performance)');
          
          console.log(chalk.gray('\nTo change provider:'));
          console.log(chalk.cyan('  counsel chromadb embeddings ollama'));
          console.log(chalk.cyan('  counsel chromadb embeddings openai'));
          console.log(chalk.cyan('  counsel chromadb embeddings default'));
          return;
        }
        
        // Validate provider
        if (!['ollama', 'openai', 'default'].includes(provider.toLowerCase())) {
          spinner.fail('Invalid provider');
          console.error(chalk.red('Valid providers: ollama, openai, default'));
          process.exit(1);
        }
        
        const normalizedProvider = provider.toLowerCase() as 'ollama' | 'openai' | 'default';
        
        // Update config
        const embedConfig = {
          provider: normalizedProvider,
          ...(normalizedProvider === 'ollama' && {
            ollamaModel: options.model,
            autoStartOllama: options.autoStart
          }),
          defaultThreshold: normalizedProvider === 'default' ? 0.1 : parseFloat(options.threshold)
        };
        
        await updateConfig({
          chromadb: {
            ...config.chromadb,
            embeddings: embedConfig
          }
        });
        
        spinner.succeed('Configuration updated');
        
        // Provider-specific setup instructions
        if (normalizedProvider === 'ollama') {
          // Check if Ollama is installed
          if (!await checkOllamaInstalled()) {
            console.log(chalk.yellow('\n⚠️  Ollama is not installed'));
            console.log('\nTo install Ollama:');
            
            if (process.platform === 'darwin') {
              console.log(chalk.cyan('  brew install ollama'));
            } else {
              console.log(chalk.cyan('  curl -fsSL https://ollama.ai/install.sh | sh'));
            }
          } else {
            // Check if model is downloaded
            if (!await checkOllamaRunning()) {
              console.log(chalk.yellow('\nStarting Ollama service...'));
              await startOllama();
            }
            
            console.log(chalk.yellow(`\nChecking ${options.model} model...`));
            if (await ensureOllamaModel(options.model)) {
              console.log(chalk.green('✓ Model ready'));
            }
          }
          
          console.log(chalk.green('\n✅ Ollama embeddings configured'));
          console.log('\nOllama will auto-start when you run ChromaDB.');
          
        } else if (normalizedProvider === 'openai') {
          if (!process.env.OPENAI_API_KEY) {
            console.log(chalk.yellow('\n⚠️  OpenAI API key not found'));
            console.log('\nTo use OpenAI embeddings:');
            console.log('1. Get an API key from: https://platform.openai.com/api-keys');
            console.log('2. Set the environment variable:');
            console.log(chalk.cyan('   export OPENAI_API_KEY="sk-..."'));
          } else {
            console.log(chalk.green('\n✅ OpenAI embeddings configured'));
          }
        } else {
          console.log(chalk.yellow('\n⚠️  Using default embeddings'));
          console.log('Note: Default embeddings have limited performance for technical content.');
        }
        
        console.log('\nNext steps:');
        console.log('1. Re-index your content: ' + chalk.cyan('counsel index --all --force'));
        console.log('2. Test search: ' + chalk.cyan('counsel search "your query"'));
        
      } catch (error: any) {
        spinner.fail('Failed to update configuration');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  chromadb
    .command('clean')
    .description('Clean ChromaDB data (requires confirmation)')
    .action(async () => {
      const spinner = ora('Checking ChromaDB...').start();
      
      try {
        if (await isChromaDBRunning()) {
          spinner.fail('ChromaDB is running. Stop it first with: counsel chromadb stop');
          return;
        }
        
        spinner.stop();
        
        console.log(chalk.yellow('\n⚠️  This will delete all indexed counsel data!'));
        console.log(chalk.gray(`Data directory: ${CHROMADB_DATA_DIR}`));
        
        // Simple confirmation
        console.log('\nType "yes" to confirm deletion:');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('> ', async (answer: string) => {
          readline.close();
          
          if (answer.toLowerCase() === 'yes') {
            const cleanSpinner = ora('Cleaning ChromaDB data...').start();
            
            try {
              await fs.rm(CHROMADB_DATA_DIR, { recursive: true, force: true });
              await fs.mkdir(CHROMADB_DATA_DIR, { recursive: true });
              cleanSpinner.succeed('ChromaDB data cleaned');
              console.log(chalk.gray('\nStart fresh with: counsel chromadb start'));
            } catch (error: any) {
              cleanSpinner.fail('Failed to clean data');
              console.error(chalk.red('Error:'), error.message);
            }
          } else {
            console.log(chalk.gray('Cancelled'));
          }
        });
        
      } catch (error: any) {
        spinner.fail('Failed to check ChromaDB');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}