#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n📦 Counsel Framework installed\n');
console.log('To complete setup, run:');
console.log('  npm run setup');
console.log('\nThis will:');
console.log('  • Create ~/.counsel directories');
console.log('  • Install ChromaDB (Python package)');
console.log('  • Set up CLI commands');
console.log('  • Copy slash commands to Claude (optional)');
console.log('\nFor more information, see the README.md\n');

// Check if this is a global install
const isGlobal = process.env.npm_config_global === 'true';

if (isGlobal) {
  console.log('✨ Counsel CLI is now available globally');
  console.log('   Run "counsel --help" to get started\n');
} else {
  console.log('💡 To make the counsel CLI available globally, run:');
  console.log('   npm link\n');
}

// Build the TypeScript CLI
try {
  console.log('Building CLI...');
  execSync('cd cli && npm install && npm run build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ CLI built successfully\n');
} catch (error) {
  console.error('⚠️  Failed to build CLI automatically');
  console.error('   Please run "npm run build" manually\n');
}