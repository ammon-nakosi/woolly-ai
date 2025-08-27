import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const CHROMADB_PORT = process.env.CHROMADB_PORT || '8090';
const CHROMADB_DATA_DIR = process.env.CHROMADB_DATA_DIR || path.join(os.homedir(), '.counsel', 'chromadb');

async function checkDocker(): Promise<boolean> {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

async function checkDockerRunning(): Promise<boolean> {
  try {
    await execAsync('docker info');
    return true;
  } catch {
    return false;
  }
}

async function isChromaDBRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}"');
    return stdout.includes('chromadb');
  } catch {
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

export function registerChromaDBCommands(program: Command) {
  const chromadb = program
    .command('chromadb')
    .description('Manage ChromaDB server for semantic search');

  chromadb
    .command('start')
    .description('Start ChromaDB server using Docker')
    .option('--port <port>', 'Port to run ChromaDB on', CHROMADB_PORT)
    .option('--data-dir <dir>', 'Directory for ChromaDB data', CHROMADB_DATA_DIR)
    .action(async (options) => {
      const spinner = ora('Checking Docker...').start();
      
      try {
        // Check Docker installation
        if (!await checkDocker()) {
          spinner.fail('Docker is not installed');
          console.log(chalk.yellow('\nPlease install Docker first:'));
          console.log(chalk.gray('  Visit: https://docs.docker.com/get-docker/'));
          process.exit(1);
        }
        
        // Check Docker is running
        if (!await checkDockerRunning()) {
          spinner.fail('Docker is not running');
          console.log(chalk.yellow('\nPlease start Docker Desktop and try again.'));
          process.exit(1);
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
        
        // Start ChromaDB container
        spinner.text = 'Starting ChromaDB container...';
        const dockerCommand = [
          'run', '-d',
          '--name', 'chromadb',
          '-p', `${options.port}:8090`,
          '-v', `${options.dataDir}:/chroma/chroma`,
          '-e', 'ANONYMIZED_TELEMETRY=false',
          '-e', 'ALLOW_RESET=true',
          '--restart', 'unless-stopped',
          'chromadb/chroma:latest'
        ];
        
        try {
          await execAsync(`docker ${dockerCommand.join(' ')}`);
        } catch (error: any) {
          // Check if it's just a name conflict
          if (error.message.includes('Conflict')) {
            spinner.text = 'Removing old container...';
            await execAsync('docker rm chromadb');
            await execAsync(`docker ${dockerCommand.join(' ')}`);
          } else {
            throw error;
          }
        }
        
        // Wait for ChromaDB to be ready
        spinner.text = 'Waiting for ChromaDB to be ready...';
        const isReady = await waitForChromaDB();
        
        if (!isReady) {
          spinner.fail('ChromaDB failed to start');
          console.log(chalk.red('\nCheck Docker logs:'));
          console.log(chalk.gray('  counsel chromadb logs'));
          process.exit(1);
        }
        
        spinner.succeed('ChromaDB started successfully!');
        
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
        
        await execAsync('docker stop chromadb');
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
        if (!await checkDocker()) {
          spinner.fail('Docker is not installed');
          return;
        }
        
        if (!await checkDockerRunning()) {
          spinner.fail('Docker is not running');
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
            
            // Get container stats
            const { stdout } = await execAsync('docker stats chromadb --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"');
            console.log(chalk.cyan('\nContainer Stats:'));
            console.log(stdout);
            
            console.log(chalk.green(`\nAPI endpoint: http://localhost:${CHROMADB_PORT}`));
            console.log(chalk.gray(`Data directory: ${CHROMADB_DATA_DIR}`));
          } else {
            spinner.warn('ChromaDB container is running but API is not responding');
            console.log(chalk.yellow('\nTry restarting: counsel chromadb restart'));
          }
        } catch {
          spinner.warn('ChromaDB container is running but API is not accessible');
          console.log(chalk.yellow('\nCheck logs: counsel chromadb logs'));
        }
        
      } catch (error: any) {
        spinner.fail('Failed to check status');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  chromadb
    .command('logs')
    .description('View ChromaDB server logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <lines>', 'Number of lines to show', '50')
    .action(async (options) => {
      try {
        if (!await isChromaDBRunning()) {
          console.log(chalk.yellow('ChromaDB is not running'));
          console.log(chalk.gray('Start it with: counsel chromadb start'));
          return;
        }
        
        const args = ['logs', 'chromadb'];
        if (options.follow) {
          args.push('-f');
        } else {
          args.push('-n', options.lines);
        }
        
        const docker = spawn('docker', args, { stdio: 'inherit' });
        
        docker.on('error', (error) => {
          console.error(chalk.red('Error:'), error.message);
        });
        
      } catch (error: any) {
        console.error(chalk.red('Failed to get logs:'), error.message);
      }
    });

  chromadb
    .command('restart')
    .description('Restart ChromaDB server')
    .action(async () => {
      const spinner = ora('Restarting ChromaDB...').start();
      
      try {
        if (await isChromaDBRunning()) {
          await execAsync('docker restart chromadb');
          
          spinner.text = 'Waiting for ChromaDB to be ready...';
          const isReady = await waitForChromaDB();
          
          if (isReady) {
            spinner.succeed('ChromaDB restarted successfully');
          } else {
            spinner.fail('ChromaDB restarted but API is not responding');
            console.log(chalk.yellow('\nCheck logs: counsel chromadb logs'));
          }
        } else {
          spinner.info('ChromaDB is not running, starting it...');
          await execAsync(`docker start chromadb`);
          
          spinner.text = 'Waiting for ChromaDB to be ready...';
          const isReady = await waitForChromaDB();
          
          if (isReady) {
            spinner.succeed('ChromaDB started successfully');
          } else {
            spinner.fail('ChromaDB started but API is not responding');
          }
        }
        
      } catch (error: any) {
        spinner.fail('Failed to restart ChromaDB');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  chromadb
    .command('remove')
    .description('Remove ChromaDB container (preserves data)')
    .action(async () => {
      const spinner = ora('Removing ChromaDB container...').start();
      
      try {
        // Stop if running
        if (await isChromaDBRunning()) {
          spinner.text = 'Stopping ChromaDB...';
          await execAsync('docker stop chromadb');
        }
        
        // Remove container
        await execAsync('docker rm chromadb');
        spinner.succeed('ChromaDB container removed');
        console.log(chalk.gray(`\nData preserved in: ${CHROMADB_DATA_DIR}`));
        console.log(chalk.gray('Start fresh with: counsel chromadb start'));
        
      } catch (error: any) {
        if (error.message.includes('No such container')) {
          spinner.info('ChromaDB container does not exist');
        } else {
          spinner.fail('Failed to remove ChromaDB');
          console.error(chalk.red('Error:'), error.message);
        }
      }
    });
}