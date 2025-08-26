import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getChromaClient, findSimilarKnowledge } from '../services/chromadb-client';
import { CounselMode } from '../types';

export function registerSearchCommands(program: Command) {
  program
    .command('search <query>')
    .description('Search counsel work and knowledge using semantic search')
    .option('-m, --mode <mode>', 'Filter by mode (feature, script, debug, review, vibe)')
    .option('-t, --type <type>', 'Search type: work, knowledge, or all', 'all')
    .option('-l, --limit <number>', 'Maximum results', '10')
    .option('--threshold <number>', 'Similarity threshold (0-1)', '0.7')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options) => {
      const spinner = ora('Searching counsel...').start();
      
      try {
        const results = [];
        const limit = parseInt(options.limit);
        const threshold = parseFloat(options.threshold);
        
        // Search counsel work items
        if (options.type === 'all' || options.type === 'work') {
          spinner.text = 'Searching counsel work...';
          const workResults = await searchCounselWork(query, {
            mode: options.mode as CounselMode,
            limit,
            threshold
          });
          results.push(...workResults.map(r => ({ ...r, type: 'work' })));
        }
        
        // Search knowledge base
        if (options.type === 'all' || options.type === 'knowledge') {
          spinner.text = 'Searching knowledge base...';
          const knowledgeResults = await findSimilarKnowledge(query, {
            mode: options.mode as CounselMode,
            limit,
            threshold
          });
          results.push(...knowledgeResults.map(r => ({ ...r, type: 'knowledge' })));
        }
        
        // Sort by similarity score
        results.sort((a, b) => b.similarity - a.similarity);
        
        // Limit total results
        const topResults = results.slice(0, limit);
        
        spinner.succeed(`Found ${topResults.length} results`);
        
        if (topResults.length === 0) {
          console.log(chalk.gray('\nNo results found. Try:'));
          console.log(chalk.gray('  • Using different keywords'));
          console.log(chalk.gray('  • Lowering the threshold with --threshold 0.5'));
          console.log(chalk.gray('  • Searching all types with --type all'));
          return;
        }
        
        if (options.json) {
          console.log(JSON.stringify(topResults, null, 2));
          return;
        }
        
        // Display results
        console.log(chalk.bold('\n🔍 Search Results\n'));
        
        topResults.forEach((result, index) => {
          const similarity = Math.round(result.similarity * 100);
          const icon = result.type === 'knowledge' ? '📚' : '📁';
          
          console.log(chalk.bold(`${index + 1}. ${icon} ${result.knowledge?.title || result.metadata?.name || 'Untitled'}`));
          console.log(`   ${chalk.green(`${similarity}% match`)}`);
          
          if (result.type === 'work' && result.metadata) {
            console.log(`   ${chalk.gray('Mode:')} ${result.metadata.mode}`);
            console.log(`   ${chalk.gray('Status:')} ${result.metadata.status}`);
            if (result.metadata.project?.name) {
              console.log(`   ${chalk.gray('Project:')} ${result.metadata.project.name}`);
            }
          }
          
          if (result.type === 'knowledge' && result.knowledge) {
            console.log(`   ${chalk.gray('Type:')} ${result.knowledge.type}`);
            if (result.knowledge.tags?.length) {
              console.log(`   ${chalk.gray('Tags:')} ${result.knowledge.tags.join(', ')}`);
            }
          }
          
          // Show snippet
          const content = result.document || result.knowledge?.content || '';
          if (content) {
            const snippet = content.substring(0, 150).replace(/\n/g, ' ');
            console.log(`   ${chalk.dim(snippet)}${content.length > 150 ? '...' : ''}`);
          }
          
          console.log(); // Empty line between results
        });
        
        // Show tips
        if (topResults.length === limit) {
          console.log(chalk.gray(`Showing top ${limit} results. Use --limit to see more.`));
        }
        
        // Suggest related actions
        const topResult = topResults[0];
        if (topResult.type === 'work' && topResult.metadata?.name) {
          console.log(chalk.cyan('Next steps:'));
          console.log(`  • View details: counsel status ${topResult.metadata.name}`);
          console.log(`  • Export knowledge: counsel export knowledge ${topResult.metadata.name}`);
        }
        
      } catch (error: any) {
        spinner.fail('Search failed');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}

async function searchCounselWork(
  query: string,
  options: {
    mode?: CounselMode;
    limit?: number;
    threshold?: number;
  }
): Promise<any[]> {
  const client = await getChromaClient();
  const collection = await client.getOrCreateCollection({
    name: 'counsel_items'
  });
  
  // Build where clause
  const where: any = { type: 'counsel_item' };
  if (options.mode) {
    where.mode = options.mode;
  }
  
  // Perform semantic search
  const results = await collection.query({
    queryTexts: [query],
    nResults: options.limit || 10,
    where
  });
  
  // Filter by threshold and format results
  const formattedResults = [];
  for (let i = 0; i < results.ids[0].length; i++) {
    const distance = results.distances?.[0][i] || 0;
    const similarity = 1 - distance; // Convert distance to similarity
    
    if (similarity >= (options.threshold || 0.7)) {
      formattedResults.push({
        id: results.ids[0][i],
        similarity,
        document: results.documents[0][i],
        metadata: results.metadatas[0][i]
      });
    }
  }
  
  return formattedResults;
}