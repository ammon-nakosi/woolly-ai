import { Command } from 'commander';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function registerOpenCommands(program: Command) {
  program
    .command('open')
    .description('Open the Counsel Framework web interface')
    .action(async () => {
      const visualizerPath = path.join(process.cwd(), 'visualizer');
      
      if (!fs.existsSync(visualizerPath)) {
        console.error('❌ Visualizer directory not found. Make sure you are in the counsel-framework directory.');
        process.exit(1);
      }

      console.log('🚀 Starting Counsel Framework Visualizer...');
      console.log('   Access at: http://localhost:3555\n');
      
      const child = spawn('npm', ['run', 'dev'], {
        cwd: visualizerPath,
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