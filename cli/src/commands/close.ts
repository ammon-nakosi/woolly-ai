import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import { CounselMode } from '../types';
import { getChromaClient } from '../services/chromadb-client';
import { ruleInjectionService } from '../services/rule-injection';

const COUNSEL_BASE = path.join(os.homedir(), '.woolly');

interface ProjectMetadata {
  name: string;
  mode: CounselMode;
  status: 'open' | 'closed';
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
}

interface AgentAnalysis {
  whatWentWell: string[];
  whatCouldBeImproved: string[];
  whatToAvoid: string[];
}

interface UserInsights {
  whatWentWell: string[];
  whatCouldBeImproved: string[];
  whatToAvoid: string[];
  addedAt: string;
}

export function registerCloseCommands(program: Command) {
  program
    .command('finalize <name>')
    .description('Finalize a woolly project and generate retrospective')
    .option('-m, --mode <mode>', 'Specify mode if ambiguous')
    .option('--interactive', 'Enable interactive mode to prompt for user insights')
    .option('--agent', 'Running in agent mode (enforces AI analysis)')
    .option('--ai-went-well <text>', 'AI analysis: What went well')
    .option('--ai-improve <text>', 'AI analysis: What could be improved')
    .option('--ai-avoid <text>', 'AI analysis: What to avoid')
    .option('--went-well <text>', 'User insights: What went well')
    .option('--improve <text>', 'User insights: What could be improved')
    .option('--avoid <text>', 'User insights: What to avoid')
    .action(async (name: string, options) => {
      const spinner = ora('Finding project...').start();
      
      try {
        // Check if running in agent mode or non-TTY environment
        const isAgent = options.agent || !process.stdin.isTTY;
        
        const projectPath = await findProjectPath(name, options.mode);
        if (!projectPath) {
          spinner.fail(`Project "${name}" not found`);
          return;
        }
        
        const mode = extractModeFromPath(projectPath);
        spinner.succeed(`Found ${mode} project: ${name}`);
        
        // Update session with latest insights before closing
        spinner.start('Updating session with latest insights...');
        const sessionInsights = await generateSessionInsights(mode, projectPath);
        await createSessionEntry(projectPath, sessionInsights);
        spinner.succeed('Session updated with latest insights');
        
        // Check if already closed
        const metadata = await readMetadata(projectPath);
        if (metadata && metadata.status === 'closed') {
          console.log(chalk.yellow('Project is already closed'));
          const { reopen } = await inquirer.prompt([{
            type: 'confirm',
            name: 'reopen',
            message: 'Would you like to reopen it?',
            default: false
          }]);
          
          if (reopen) {
            await reopenProject(projectPath, metadata);
          }
          return;
        }
        
        // Use AI-provided analysis or generate basic one
        let analysis: AgentAnalysis;
        
        if (options.aiWentWell || options.aiImprove || options.aiAvoid) {
          // Use AI's provided analysis
          analysis = {
            whatWentWell: options.aiWentWell ? [options.aiWentWell] : [],
            whatCouldBeImproved: options.aiImprove ? [options.aiImprove] : [],
            whatToAvoid: options.aiAvoid ? [options.aiAvoid] : []
          };
          spinner.succeed('Using AI-provided analysis');
        } else if (isAgent) {
          // Agent mode requires AI analysis
          spinner.fail('Agent mode requires AI analysis flags (--ai-went-well, --ai-improve, --ai-avoid)');
          console.log(chalk.yellow('\nUsage for agents:'));
          console.log(chalk.gray('  woolly finalize <name> --agent \\'));
          console.log(chalk.gray('    --ai-went-well "What went well" \\'));
          console.log(chalk.gray('    --ai-improve "What could be improved" \\'));
          console.log(chalk.gray('    --ai-avoid "What to avoid"'));
          console.log(chalk.yellow('\nOr follow the /woolly-close workflow for proper instructions'));
          return;
        } else {
          // Fallback to programmatic analysis (deprecated path)
          spinner.start('Analyzing project artifacts...');
          analysis = await generateAgentAnalysis(mode, projectPath);
          spinner.succeed('Generated analysis from artifacts');
        }
        
        // Close the project immediately
        const closedAt = new Date().toISOString();
        await updateMetadata(projectPath, { 
          status: 'closed', 
          closedAt,
          updatedAt: closedAt
        });
        
        // Clear session rules for this project
        spinner.start('Clearing session rules...');
        try {
          await ruleInjectionService.clearSessionRules(process.cwd(), name);
          spinner.succeed(`Session rules for ${name} cleared`);
        } catch (error) {
          spinner.warn('Could not clear session rules');
        }
        
        // Generate and save retrospective
        let retroContent = await generateRetroMarkdown(name, mode, projectPath, analysis, null);
        await fs.writeFile(path.join(projectPath, 'retro.md'), retroContent);
        
        // Index in ChromaDB
        await indexRetrospective(name, mode, projectPath, analysis, null);
        
        spinner.succeed('Project closed and retrospective saved');
        
        // Only show summary if using programmatic analysis (deprecated)
        if (!options.aiWentWell && !options.aiImprove && !options.aiAvoid) {
          console.log(chalk.cyan('\nProgrammatic assessment:'));
          if (analysis.whatWentWell.length > 0) {
            console.log(chalk.green('• Went well:'), analysis.whatWentWell.slice(0, 2).join(', '));
          }
          if (analysis.whatCouldBeImproved.length > 0) {
            console.log(chalk.yellow('• Could improve:'), analysis.whatCouldBeImproved.slice(0, 2).join(', '));
          }
          if (analysis.whatToAvoid.length > 0) {
            console.log(chalk.red('• Avoid:'), analysis.whatToAvoid.slice(0, 2).join(', '));
          }
        }
        
        // Handle user insights - from CLI options, interactive mode, or none
        let userInsights: UserInsights | null = null;
        
        // Check if user insights provided via CLI options
        if (options.wentWell || options.improve || options.avoid) {
          userInsights = {
            whatWentWell: options.wentWell ? [options.wentWell] : [],
            whatCouldBeImproved: options.improve ? [options.improve] : [],
            whatToAvoid: options.avoid ? [options.avoid] : [],
            addedAt: new Date().toISOString()
          };
          
          // Update retrospective with user insights
          retroContent = await generateRetroMarkdown(name, mode, projectPath, analysis, userInsights);
          await fs.writeFile(path.join(projectPath, 'retro.md'), retroContent);
          
          // Update ChromaDB index
          await indexRetrospective(name, mode, projectPath, analysis, userInsights);
          
          console.log(chalk.green('✓ User insights added to retrospective'));
        }
        // Only show interactive prompts if --interactive flag is used
        else if (options.interactive) {
          console.log(chalk.gray('\nWould you like to add your thoughts? (Enter to skip each)'));
          
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'whatWentWell',
              message: 'What went well?',
              default: ''
            },
            {
              type: 'input',
              name: 'whatCouldBeImproved',
              message: 'What could be improved?',
              default: ''
            },
            {
              type: 'input',
              name: 'whatToAvoid',
              message: 'What to avoid?',
              default: ''
            }
          ]);
          
          const hasInput = answers.whatWentWell || answers.whatCouldBeImproved || answers.whatToAvoid;
          
          if (hasInput) {
            userInsights = {
              whatWentWell: answers.whatWentWell ? [answers.whatWentWell] : [],
              whatCouldBeImproved: answers.whatCouldBeImproved ? [answers.whatCouldBeImproved] : [],
              whatToAvoid: answers.whatToAvoid ? [answers.whatToAvoid] : [],
              addedAt: new Date().toISOString()
            };
            
            // Update retrospective with user insights
            retroContent = await generateRetroMarkdown(name, mode, projectPath, analysis, userInsights);
            await fs.writeFile(path.join(projectPath, 'retro.md'), retroContent);
            
            // Update ChromaDB index
            await indexRetrospective(name, mode, projectPath, analysis, userInsights);
            
            console.log(chalk.green('✓ User insights added to retrospective'));
          }
        }
        
      } catch (error: any) {
        spinner.fail('Failed to close project');
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  program
    .command('reopen <name>')
    .description('Reopen a closed woolly project')
    .option('-m, --mode <mode>', 'Specify mode if ambiguous')
    .action(async (name: string, options) => {
      const spinner = ora('Finding project...').start();
      
      try {
        const projectPath = await findProjectPath(name, options.mode);
        if (!projectPath) {
          spinner.fail(`Project "${name}" not found`);
          return;
        }
        
        const metadata = await readMetadata(projectPath);
        if (!metadata || metadata.status !== 'closed') {
          spinner.warn('Project is not closed');
          return;
        }
        
        await reopenProject(projectPath, metadata);
        spinner.succeed(`Project "${name}" has been reopened`);
        console.log(chalk.gray('Use woolly-reload to continue working on it'));
        
      } catch (error: any) {
        spinner.fail('Failed to reopen project');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}

async function findProjectPath(name: string, mode?: string): Promise<string | null> {
  const modes: CounselMode[] = mode ? [mode as CounselMode] : ['feature', 'script', 'vibe', 'prompt'];
  
  for (const m of modes) {
    const dirName = `${m}s`;
    const projectPath = path.join(COUNSEL_BASE, dirName, name);
    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      continue;
    }
  }
  
  return null;
}

function extractModeFromPath(projectPath: string): CounselMode {
  const parts = projectPath.split(path.sep);
  const modeDir = parts[parts.length - 2];
  return modeDir.slice(0, -1) as CounselMode;
}

async function readMetadata(projectPath: string): Promise<ProjectMetadata | null> {
  try {
    const content = await fs.readFile(path.join(projectPath, 'metadata.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function updateMetadata(projectPath: string, updates: Partial<ProjectMetadata>): Promise<void> {
  const metadataPath = path.join(projectPath, 'metadata.json');
  let metadata: ProjectMetadata;
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    metadata = JSON.parse(content);
  } catch {
    // Create new metadata if doesn't exist
    const name = path.basename(projectPath);
    const mode = extractModeFromPath(projectPath);
    const stats = await fs.stat(projectPath);
    
    metadata = {
      name,
      mode,
      status: 'open',
      createdAt: stats.birthtime.toISOString(),
      closedAt: null,
      updatedAt: new Date().toISOString()
    };
  }
  
  // Apply updates
  Object.assign(metadata, updates);
  
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

async function reopenProject(projectPath: string, metadata: ProjectMetadata): Promise<void> {
  await updateMetadata(projectPath, {
    status: 'open',
    closedAt: null,
    updatedAt: new Date().toISOString()
  });
}

async function generateAgentAnalysis(mode: CounselMode, projectPath: string): Promise<AgentAnalysis> {
  const analysis: AgentAnalysis = {
    whatWentWell: [],
    whatCouldBeImproved: [],
    whatToAvoid: []
  };
  
  try {
    switch (mode) {
      case 'feature':
        await analyzeFeatureProject(projectPath, analysis);
        break;
      case 'script':
        await analyzeScriptProject(projectPath, analysis);
        break;
      case 'vibe':
        await analyzeVibeProject(projectPath, analysis);
        break;
    }
  } catch (error) {
    // If analysis fails, return minimal analysis
    analysis.whatWentWell.push('Project completed');
  }
  
  return analysis;
}

async function analyzeFeatureProject(projectPath: string, analysis: AgentAnalysis): Promise<void> {
  try {
    const statusPath = path.join(projectPath, 'plan-approved.plan-status.json');
    const statusContent = await fs.readFile(statusPath, 'utf-8');
    const status = JSON.parse(statusContent);
    
    // Analyze completion
    const totalTasks = status.phases?.reduce((acc: number, phase: any) => 
      acc + (phase.checklist?.length || 0), 0) || 0;
    const completedTasks = status.phases?.reduce((acc: number, phase: any) => 
      acc + (phase.checklist?.filter((t: any) => t.status === 'done')?.length || 0), 0) || 0;
    const skippedTasks = status.phases?.reduce((acc: number, phase: any) => 
      acc + (phase.checklist?.filter((t: any) => ['skipped', 'canceled'].includes(t.status))?.length || 0), 0) || 0;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // What went well
    if (completionRate >= 90) {
      analysis.whatWentWell.push('High task completion rate (' + completionRate + '%)');
    } else if (completionRate >= 70) {
      analysis.whatWentWell.push('Good progress on core features (' + completionRate + '% complete)');
    }
    
    // Check for completed phases
    const completedPhases = status.phases?.filter((p: any) => p.status === 'done').length || 0;
    if (completedPhases > 0) {
      analysis.whatWentWell.push(`${completedPhases} phase${completedPhases > 1 ? 's' : ''} fully completed`);
    }
    
    // What could be improved
    if (skippedTasks > 0) {
      analysis.whatCouldBeImproved.push(`${skippedTasks} task${skippedTasks > 1 ? 's' : ''} skipped or canceled`);
      
      // Find reasons for skipped tasks
      const skippedReasons = new Set<string>();
      status.phases?.forEach((phase: any) => {
        phase.checklist?.forEach((task: any) => {
          if (['skipped', 'canceled'].includes(task.status) && task.notes) {
            skippedReasons.add(task.notes);
          }
        });
      });
      
      if (skippedReasons.size > 0) {
        const firstReason = Array.from(skippedReasons)[0];
        analysis.whatToAvoid.push(firstReason);
      }
    }
    
    if (completionRate < 70) {
      analysis.whatCouldBeImproved.push('Low completion rate - consider smaller scope');
    }
    
    // Look for patterns in task categories
    const categories = new Set<string>();
    status.phases?.forEach((phase: any) => {
      phase.checklist?.forEach((task: any) => {
        if (task.category) categories.add(task.category);
      });
    });
    
    if (categories.has('Documentation') || categories.has('Docs')) {
      const docTasks = status.phases?.reduce((acc: any[], phase: any) => {
        return acc.concat(phase.checklist?.filter((t: any) => 
          t.category === 'Documentation' || t.category === 'Docs') || []);
      }, []) || [];
      
      const incompleteDocs = docTasks.filter((t: any) => t.status !== 'done');
      if (incompleteDocs.length > 0) {
        analysis.whatCouldBeImproved.push('Documentation incomplete');
      }
    }
    
  } catch (error) {
    // No plan-status.json, try to infer from other files
    analysis.whatWentWell.push('Feature work completed');
  }
}


async function analyzeScriptProject(projectPath: string, analysis: AgentAnalysis): Promise<void> {
  try {
    const testResultsExists = await fileExists(path.join(projectPath, 'test-results.md'));
    const usageExists = await fileExists(path.join(projectPath, 'usage.md'));
    
    // Check if script file exists
    const files = await fs.readdir(projectPath);
    const scriptFiles = files.filter(f => 
      f.endsWith('.sh') || f.endsWith('.js') || f.endsWith('.ts') || 
      f.endsWith('.py') || f.endsWith('.rb'));
    
    if (scriptFiles.length > 0) {
      analysis.whatWentWell.push('Script implemented');
    }
    
    if (testResultsExists) {
      analysis.whatWentWell.push('Script tested and documented');
    }
    
    if (usageExists) {
      analysis.whatWentWell.push('Usage instructions provided');
    }
    
    if (!testResultsExists) {
      analysis.whatCouldBeImproved.push('No test results documented');
    }
    
    if (!usageExists) {
      analysis.whatCouldBeImproved.push('Usage instructions missing');
    }
    
  } catch {
    analysis.whatWentWell.push('Script work completed');
  }
}


async function analyzeVibeProject(projectPath: string, analysis: AgentAnalysis): Promise<void> {
  try {
    const notesExists = await fileExists(path.join(projectPath, 'notes.md'));
    const decisionsExists = await fileExists(path.join(projectPath, 'decisions.md'));
    
    if (notesExists) {
      analysis.whatWentWell.push('Exploration documented');
    }
    
    if (decisionsExists) {
      analysis.whatWentWell.push('Key decisions captured');
    }
    
    if (!decisionsExists && notesExists) {
      analysis.whatCouldBeImproved.push('Consider documenting key decisions separately');
    }
    
  } catch {
    analysis.whatWentWell.push('Exploration completed');
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateSessionInsights(mode: CounselMode, projectPath: string): Promise<string> {
  const insights: string[] = [];
  
  try {
    switch (mode) {
      case 'feature':
        // Analyze feature project progress
        try {
          const statusPath = path.join(projectPath, 'plan-approved.plan-status.json');
          const statusContent = await fs.readFile(statusPath, 'utf-8');
          const status = JSON.parse(statusContent);
          
          const totalTasks = status.phases?.reduce((acc: number, phase: any) => 
            acc + (phase.checklist?.length || 0), 0) || 0;
          const completedTasks = status.phases?.reduce((acc: number, phase: any) => 
            acc + (phase.checklist?.filter((t: any) => t.status === 'done')?.length || 0), 0) || 0;
          const doingTasks = status.phases?.reduce((acc: number, phase: any) => 
            acc + (phase.checklist?.filter((t: any) => t.status === 'doing')?.length || 0), 0) || 0;
          
          insights.push(`Progress update: ${completedTasks}/${totalTasks} tasks complete.`);
          
          if (doingTasks > 0) {
            insights.push(`${doingTasks} tasks currently in progress.`);
          }
          
          // Find recently completed tasks
          const recentlyCompleted: string[] = [];
          status.phases?.forEach((phase: any) => {
            phase.checklist?.forEach((task: any) => {
              if (task.status === 'done' && task.implementationDetails) {
                recentlyCompleted.push(task.category || task.description.slice(0, 30));
              }
            });
          });
          
          if (recentlyCompleted.length > 0) {
            const recent = recentlyCompleted.slice(-3); // Last 3 completed
            insights.push(`Recently completed: ${recent.join(', ')}.`);
          }
          
          // Note any blockers
          const skipped = status.phases?.reduce((acc: number, phase: any) => 
            acc + (phase.checklist?.filter((t: any) => ['skipped', 'canceled'].includes(t.status))?.length || 0), 0) || 0;
          
          if (skipped > 0) {
            insights.push(`${skipped} tasks skipped or canceled.`);
          }
        } catch {
          insights.push('Feature development work completed.');
        }
        break;
        
      case 'script':
        // Analyze script project
        const hasTests = await fileExists(path.join(projectPath, 'test-results.md'));
        const hasUsage = await fileExists(path.join(projectPath, 'usage.md'));
        
        insights.push('Script development complete.');
        if (hasTests) {
          insights.push('Testing performed and documented.');
        }
        if (hasUsage) {
          insights.push('Usage instructions documented.');
        }
        break;
        
      case 'vibe':
        // Analyze vibe/exploration project
        const hasNotes = await fileExists(path.join(projectPath, 'notes.md'));
        const hasDecisions = await fileExists(path.join(projectPath, 'decisions.md'));
        
        if (hasDecisions) {
          insights.push('Exploration complete with key decisions documented.');
        } else if (hasNotes) {
          insights.push('Exploration notes captured.');
        } else {
          insights.push('Exploration session complete.');
        }
        break;
        
      default:
        insights.push('Work session complete.');
    }
    
    // Add final note
    insights.push('Ready for project closure and retrospective generation.');
    
  } catch (error) {
    // Fallback message
    insights.push(`${mode.charAt(0).toUpperCase() + mode.slice(1)} work ready for closure.`);
  }
  
  return insights.join(' ');
}

async function createSessionEntry(projectPath: string, message: string): Promise<void> {
  const sessionsDir = path.join(projectPath, 'sessions');
  
  // Ensure sessions directory exists
  await fs.mkdir(sessionsDir, { recursive: true });
  
  // Find recent session file (within 4 hours)
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const now = Date.now();
  
  let sessionFile: string | null = null;
  
  try {
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files
      .filter(f => f.startsWith('session-') && f.endsWith('.md'))
      .map(f => {
        const match = f.match(/session-(\d+)\.md/);
        if (match) {
          return {
            filename: f,
            timestamp: parseInt(match[1])
          };
        }
        return null;
      })
      .filter(f => f !== null) as { filename: string; timestamp: number }[];
    
    // Sort by timestamp descending
    sessionFiles.sort((a, b) => b.timestamp - a.timestamp);
    
    // Check if most recent is within 4 hours
    if (sessionFiles.length > 0 && (now - sessionFiles[0].timestamp < FOUR_HOURS)) {
      sessionFile = path.join(sessionsDir, sessionFiles[0].filename);
    }
  } catch {
    // No existing sessions
  }
  
  // Create new session file if needed
  if (!sessionFile) {
    sessionFile = path.join(sessionsDir, `session-${now}.md`);
    const header = `## Session ${now}\nStarted: ${new Date(now).toISOString()}\n\n`;
    await fs.writeFile(sessionFile, header);
  }
  
  // Add entry in standard session format
  const timestamp = new Date(now).toISOString();
  const timeShort = new Date(now).toTimeString().slice(0, 5);
  const entry = `### ${timeShort} - ${timestamp}\n${message}\n\n`;
  
  await fs.appendFile(sessionFile, entry);
}

async function generateRetroMarkdown(
  name: string,
  mode: CounselMode,
  projectPath: string,
  analysis: AgentAnalysis,
  userInsights: UserInsights | null
): Promise<string> {
  const metadata = await readMetadata(projectPath);
  const closedDate = metadata?.closedAt ? new Date(metadata.closedAt).toLocaleDateString() : new Date().toLocaleDateString();
  
  // Calculate metrics based on mode
  let metricsSection = '';
  
  if (mode === 'feature') {
    try {
      const statusPath = path.join(projectPath, 'plan-approved.plan-status.json');
      const statusContent = await fs.readFile(statusPath, 'utf-8');
      const status = JSON.parse(statusContent);
      
      const totalTasks = status.phases?.reduce((acc: number, phase: any) => 
        acc + (phase.checklist?.length || 0), 0) || 0;
      const completedTasks = status.phases?.reduce((acc: number, phase: any) => 
        acc + (phase.checklist?.filter((t: any) => t.status === 'done')?.length || 0), 0) || 0;
      const skippedTasks = status.phases?.reduce((acc: number, phase: any) => 
        acc + (phase.checklist?.filter((t: any) => ['skipped', 'canceled'].includes(t.status))?.length || 0), 0) || 0;
      const phases = status.phases?.length || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      metricsSection = `## Metrics
- Total Tasks: ${totalTasks}
- Completed: ${completedTasks}
- Skipped: ${skippedTasks}
- Phases: ${phases}
- Completion Rate: ${completionRate}%

`;
    } catch {
      // No metrics available
    }
  }
  
  let content = `# Retrospective: ${name}

**Mode:** ${mode}  
**Closed:** ${closedDate}  

${metricsSection}## Agent Analysis

### What Went Well
${analysis.whatWentWell.length > 0 ? analysis.whatWentWell.map(item => `- ${item}`).join('\n') : '- No specific achievements documented'}

### What Could Be Improved
${analysis.whatCouldBeImproved.length > 0 ? analysis.whatCouldBeImproved.map(item => `- ${item}`).join('\n') : '- No improvements identified'}

### What to Avoid
${analysis.whatToAvoid.length > 0 ? analysis.whatToAvoid.map(item => `- ${item}`).join('\n') : '- No anti-patterns identified'}
`;

  if (userInsights) {
    content += `
## User Insights

### What Went Well
${userInsights.whatWentWell.length > 0 ? userInsights.whatWentWell.map(item => `- ${item}`).join('\n') : '- No user input provided'}

### What Could Be Improved
${userInsights.whatCouldBeImproved.length > 0 ? userInsights.whatCouldBeImproved.map(item => `- ${item}`).join('\n') : '- No user input provided'}

### What to Avoid
${userInsights.whatToAvoid.length > 0 ? userInsights.whatToAvoid.map(item => `- ${item}`).join('\n') : '- No user input provided'}
`;
  }
  
  content += `
---
*Generated: ${new Date().toISOString()}*`;
  
  if (userInsights) {
    content += `  
*User insights added: ${userInsights.addedAt}*`;
  }
  
  return content;
}

async function indexRetrospective(
  name: string,
  mode: CounselMode,
  projectPath: string,
  analysis: AgentAnalysis,
  userInsights: UserInsights | null
): Promise<void> {
  try {
    const client = await getChromaClient();
    const collection = await client.getOrCreateCollection({
      name: 'counsel_knowledge'
    });
    
    // Combine all text for indexing
    const allText = [
      ...analysis.whatWentWell,
      ...analysis.whatCouldBeImproved,
      ...analysis.whatToAvoid,
      ...(userInsights?.whatWentWell || []),
      ...(userInsights?.whatCouldBeImproved || []),
      ...(userInsights?.whatToAvoid || [])
    ].filter(Boolean).join(' ');
    
    const metadata = await readMetadata(projectPath);
    
    await collection.upsert({
      ids: [`retro-${mode}-${name}-${metadata?.closedAt || new Date().toISOString()}`],
      documents: [allText || `${mode} project completed`],
      metadatas: [{
        type: 'retrospective',
        project: name,
        mode: mode,
        path: path.join(projectPath, 'retro.md'),
        closedAt: metadata?.closedAt || new Date().toISOString(),
        hasUserInput: !!userInsights
      }]
    });
  } catch (error) {
    console.log(chalk.gray('ChromaDB indexing skipped (service not available)'));
  }
}