import { Command } from 'commander';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function registerOpenCommands(program: Command) {
  program
    .command('open')
    .description('Open the Woolly Framework web interface')
    .action(async () => {
      // Find the framework root directory relative to this command file
      const frameworkRoot = path.join(__dirname, '..', '..', '..');
      const webPath = path.join(frameworkRoot, 'web');
      
      if (!fs.existsSync(webPath)) {
        console.error('❌ Web directory not found at:', webPath);
        console.error('Please ensure the woolly-framework is properly installed.');
        process.exit(1);
      }

      console.log('🚀 Starting Woolly Framework Web Interface...');
      console.log('   Access at: http://localhost:3555\n');
      
      const child = spawn('npm', ['run', 'dev'], {
        cwd: webPath,
        stdio: 'inherit',
        shell: true
      });

      child.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`❌ Server exited with code ${code}`);
          process.exit(code);
        }
      });
    });
}