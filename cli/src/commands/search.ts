import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { hybridSearchOrchestrator } from '../services/hybrid-search';
import { CounselMode } from '../types';

export function registerSearchCommands(program: Command) {
  program
    .command('search <query>')
    .description('Search woolly work and knowledge using semantic search')
    .option('-m, --mode <mode>', 'Filter by mode (feature, script, debug, review, vibe)')
    .option('-t, --type <type>', 'Search type: work, knowledge, or all', 'all')
    .option('-l, --limit <number>', 'Maximum results', '10')
    .option('--threshold <number>', 'Similarity threshold (0-1)')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options) => {
      const spinner = ora('Searching woolly...').start();
      
      try {
        const limit = parseInt(options.limit);
        const threshold = options.threshold ? parseFloat(options.threshold) : undefined;
        
        // Initialize hybrid search
        await hybridSearchOrchestrator.initialize();
        
        // Perform hybrid search
        const searchResult = await hybridSearchOrchestrator.search(query, {
          mode: options.mode as CounselMode,
          limit,
          threshold
        });
        
        const results = searchResult.results;
        const status = searchResult.status;
        
        // Update spinner based on available engines
        const availableEngines = [
          status.vector.available ? 'vector' : null,
          status.keyword.available ? 'keyword' : null,
          status.fuzzy.available ? 'fuzzy' : null
        ].filter(Boolean);
        
        spinner.succeed(`Found ${results.length} results across ${availableEngines.length} engines`);
        
        // Show engine status
        const engineStatus = [];
        if (status.vector.available) engineStatus.push('✅ semantic');
        else engineStatus.push('❌ semantic (ChromaDB unavailable)');
        
        if (status.keyword.available) engineStatus.push('✅ keyword');
        else engineStatus.push('❌ keyword');
        
        if (status.fuzzy.available) engineStatus.push('✅ fuzzy');
        else engineStatus.push('❌ fuzzy');
        
        console.log(chalk.dim(`Engines: ${engineStatus.join(' | ')}`));
        
        if (results.length === 0) {
          console.log(chalk.gray('\nNo results found. Try:'));
          console.log(chalk.gray('  • Using different keywords'));
          console.log(chalk.gray('  • Using broader search terms'));
          if (!status.vector.available) {
            console.log(chalk.gray('  • Starting ChromaDB: woolly chromadb start'));
          }
          return;
        }
        
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }
        
        // Display results
        console.log(chalk.bold('\n🔍 Search Results\n'));
        
        results.forEach((result, index) => {
          const score = Math.round(result.score * 100);
          const modeIcon = {
            feature: '🚀',
            script: '📜', 
            debug: '🐛',
            review: '👀',
            vibe: '✨',
            prompt: '💬'
          }[result.mode] || '📁';
          
          console.log(chalk.bold(`${index + 1}. ${modeIcon} ${result.title}`));
          console.log(`   ${chalk.green(`${score}% match`)} • ${chalk.cyan(result.mode)}/${chalk.cyan(result.name)}`);
          console.log(`   ${chalk.gray('Engines:')} ${result.engines.join(', ')}`);
          console.log(`   ${chalk.gray('File:')} ${result.fileName}`);
          
          // Show snippet
          if (result.snippet) {
            const snippet = result.snippet.replace(/\n/g, ' ');
            console.log(`   ${chalk.dim(snippet)}`);
          }
          
          console.log(); // Empty line between results
        });
        
        // Show tips
        if (results.length === limit) {
          console.log(chalk.gray(`Showing top ${limit} results. Use --limit to see more.`));
        }
        
        // Show ChromaDB help if it's down
        if (!status.vector.available) {
          console.log(chalk.yellow('\n💡 For better semantic search results:'));
          console.log('   Run: woolly chromadb health');
        }
        
      } catch (error: any) {
        spinner.fail('Search failed');
        console.error(chalk.red('Error:'), error.message);
        
        if (error.message.includes('ChromaDB') || error.message.includes('chromadb')) {
          console.log(chalk.yellow('\n💡 ChromaDB might be down. Try:'));
          console.log('   woolly chromadb health');
        }
      }
    });
}

