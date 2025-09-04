import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { LinearClient } from '../services/linear-client';
import { getConfig } from '../utils/config';
import { getUserEmail } from '../utils/user-detection';

export function registerLinearCommands(program: Command) {
  const linear = program
    .command('linear')
    .alias('l')
    .description('Linear ticket management');

  // Default command - get your tickets
  linear
    .command('list', { isDefault: true })
    .description('List Linear tickets (yours by default)')
    .option('--user <user>', 'Get tickets for specific user')
    .option('--team', 'Get team tickets')
    .option('--unassigned', 'Get unassigned tickets')
    .option('--open', 'Only open tickets')
    .option('--recent', 'Recently updated tickets')
    .option('--urgent', 'Urgent/high priority tickets')
    .option('-s, --search <query>', 'Search within tickets')
    .action(async (options) => {
      const spinner = ora('Fetching tickets...').start();
      
      try {
        const config = await getConfig();
        
        if (!config.linear?.apiKey) {
          spinner.fail('Linear API key not configured');
          console.log(chalk.yellow('\nPlease add your Linear API key to ~/.woolly/config.json:'));
          console.log(chalk.gray(JSON.stringify({ linear: { apiKey: 'lin_api_xxx' } }, null, 2)));
          return;
        }
        
        const client = new LinearClient(config.linear.apiKey);
        
        let tickets;
        let description: string;

        if (options.team) {
          tickets = await client.getTeamTickets(options);
          description = "Team tickets";
        } else if (options.unassigned) {
          tickets = await client.getUnassignedTickets(options);
          description = "Unassigned tickets";
        } else if (options.user) {
          tickets = await client.getUserTickets(options.user, options);
          description = `${options.user}'s tickets`;
        } else {
          // DEFAULT: Your tickets
          const userEmail = await getUserEmail();
          if (!userEmail) {
            spinner.fail('User email not configured');
            console.log(chalk.yellow('\nPlease add your email to ~/.woolly/config.json:'));
            console.log(chalk.gray(JSON.stringify({ linear: { userEmail: 'you@company.com' } }, null, 2)));
            return;
          }
          
          tickets = await client.getMyTickets(options);
          description = `Your tickets (${userEmail})`;
        }

        spinner.succeed(`Found ${tickets.length} tickets`);
        
        if (tickets.length === 0) {
          console.log(chalk.gray('\nNo tickets found matching criteria'));
          return;
        }
        
        console.log(chalk.bold(`\n${description}:\n`));
        
        tickets.forEach((ticket, i) => {
          const priority = 
            ticket.priority === 1 ? chalk.red(' [URGENT]') :
            ticket.priority === 2 ? chalk.yellow(' [HIGH]') : '';
          
          console.log(
            `${chalk.cyan(`${i + 1}.`)} ${chalk.bold(ticket.identifier)}: ${ticket.title}${priority}`
          );
          
          if (ticket.state) {
            console.log(`   ${chalk.gray('Status:')} ${ticket.state.name}`);
          }
          
          if (ticket.assignee) {
            console.log(`   ${chalk.gray('Assignee:')} ${ticket.assignee.name}`);
          }
          
          if (options.recent && ticket.updatedAt) {
            const updated = new Date(ticket.updatedAt);
            const now = new Date();
            const diffHours = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            
            const timeAgo = diffDays > 0 
              ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
              : `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            
            console.log(`   ${chalk.gray('Updated:')} ${timeAgo}`);
          }
          
          console.log(); // Empty line between tickets
        });
        
      } catch (error: any) {
        spinner.fail('Failed to fetch tickets');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Pull ticket command
  linear
    .command('pull [ticketId]')
    .description('Pull Linear ticket and create woolly work')
    .action(async (ticketId) => {
      const spinner = ora('Pulling ticket...').start();
      
      try {
        const config = await getConfig();
        
        if (!config.linear?.apiKey) {
          spinner.fail('Linear API key not configured');
          return;
        }
        
        const client = new LinearClient(config.linear.apiKey);
        
        // If no ticket ID, get highest priority
        if (!ticketId) {
          const nextTicket = await client.getNextHighPriorityTicket();
          if (!nextTicket) {
            spinner.fail('No high priority tickets found');
            return;
          }
          ticketId = nextTicket.identifier;
        }
        
        const ticket = await client.pullTicket(ticketId);
        spinner.succeed(`Pulled ${ticketId}: ${ticket.title}`);
        
        console.log(chalk.cyan('\nTicket Details:'));
        console.log(`  ${chalk.gray('Title:')} ${ticket.title}`);
        console.log(`  ${chalk.gray('Status:')} ${ticket.state}`);
        console.log(`  ${chalk.gray('Priority:')} ${ticket.priority}`);
        console.log(`  ${chalk.gray('Assignee:')} ${ticket.assignee || 'Unassigned'}`);
        
        if (ticket.labels.length > 0) {
          console.log(`  ${chalk.gray('Labels:')} ${ticket.labels.join(', ')}`);
        }
        
        if (ticket.description) {
          console.log(`\n${chalk.gray('Description:')}`);
          console.log(ticket.description);
        }
        
        // TODO: Create woolly work from ticket
        console.log(chalk.yellow('\n→ Use `woolly init` to create woolly work from this ticket'));
        
      } catch (error: any) {
        spinner.fail('Failed to pull ticket');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Update ticket command
  linear
    .command('update <ticketId> <message>')
    .description('Add update comment to Linear ticket')
    .action(async (ticketId, message) => {
      const spinner = ora('Updating ticket...').start();
      
      try {
        const config = await getConfig();
        
        if (!config.linear?.apiKey) {
          spinner.fail('Linear API key not configured');
          return;
        }
        
        const client = new LinearClient(config.linear.apiKey);
        await client.updateTicket(ticketId, message);
        
        spinner.succeed(`Updated ${ticketId}`);
        
      } catch (error: any) {
        spinner.fail('Failed to update ticket');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Create ticket command
  linear
    .command('create <title>')
    .description('Create new Linear ticket')
    .option('-d, --description <desc>', 'Ticket description')
    .action(async (title, options) => {
      const spinner = ora('Creating ticket...').start();
      
      try {
        const config = await getConfig();
        
        if (!config.linear?.apiKey) {
          spinner.fail('Linear API key not configured');
          return;
        }
        
        const client = new LinearClient(config.linear.apiKey);
        const ticketId = await client.createTicket(title, options.description);
        
        spinner.succeed(`Created ticket: ${ticketId}`);
        console.log(chalk.cyan(`\nView at: https://linear.app/issue/${ticketId}`));
        
      } catch (error: any) {
        spinner.fail('Failed to create ticket');
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Next ticket command
  linear
    .command('next')
    .description('Get your next high priority ticket')
    .action(async () => {
      const spinner = ora('Finding next ticket...').start();
      
      try {
        const config = await getConfig();
        
        if (!config.linear?.apiKey) {
          spinner.fail('Linear API key not configured');
          return;
        }
        
        const client = new LinearClient(config.linear.apiKey);
        const ticket = await client.getNextHighPriorityTicket();
        
        if (!ticket) {
          spinner.succeed('No high priority tickets found');
          console.log(chalk.gray('\nAll caught up! 🎉'));
          return;
        }
        
        spinner.succeed('Found your next ticket');
        
        const priority = 
          ticket.priority === 1 ? chalk.red(' [URGENT]') :
          ticket.priority === 2 ? chalk.yellow(' [HIGH]') : '';
        
        console.log(chalk.bold(`\n${ticket.identifier}: ${ticket.title}${priority}`));
        
        if (ticket.state) {
          console.log(`${chalk.gray('Status:')} ${ticket.state.name}`);
        }
        
        if (ticket.description) {
          console.log(`\n${chalk.gray('Description:')}`);
          console.log(ticket.description.substring(0, 200));
          if (ticket.description.length > 200) {
            console.log(chalk.gray('...'));
          }
        }
        
        console.log(chalk.cyan('\n→ Use `woolly linear pull` to start working on this'));
        
      } catch (error: any) {
        spinner.fail('Failed to find next ticket');
        console.error(chalk.red('Error:'), error.message);
      }
    });
}