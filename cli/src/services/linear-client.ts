import { LinearClient as LinearSDK, LinearDocument } from '@linear/sdk';
import type { IssueConnection } from '@linear/sdk';
import { getUserEmail } from '../utils/user-detection';

export interface LinearTicket {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  state?: {
    name: string;
    type: string;
  };
  assignee?: {
    email: string;
    name: string;
  };
  labels?: string[];
  updatedAt: Date;
  createdAt: Date;
}

export interface LinearOptions {
  status?: 'open' | 'in-progress' | 'closed';
  search?: string;
  recent?: boolean;
  urgent?: boolean;
  limit?: number;
}

export class LinearClient {
  private client: LinearSDK;
  private currentUser: string | null = null;

  constructor(apiKey: string) {
    this.client = new LinearSDK({ apiKey });
  }

  async getCurrentUser(): Promise<string> {
    if (this.currentUser) return this.currentUser;
    
    // Try multiple detection methods
    this.currentUser = 
      await getUserEmail() || 
      await this.getApiKeyOwner();
    
    if (!this.currentUser) {
      throw new Error('Could not determine current user. Please set LINEAR_USER_EMAIL or configure git user.email');
    }
    
    return this.currentUser;
  }

  private async getApiKeyOwner(): Promise<string> {
    const viewer = await this.client.viewer;
    return viewer.email;
  }

  async getMyTickets(options: LinearOptions = {}): Promise<LinearTicket[]> {
    const userEmail = await this.getCurrentUser();
    
    const issues = await this.client.issues({
      filter: {
        assignee: { email: { eq: userEmail } }
      },
      orderBy: LinearDocument.PaginationOrderBy.UpdatedAt
    });

    return this.filterAndFormatIssues(issues, options);
  }

  async getUserTickets(userIdentifier: string, options: LinearOptions = {}): Promise<LinearTicket[]> {
    let userEmail = userIdentifier;
    
    // If not an email, search for user by name
    if (!userIdentifier.includes('@')) {
      const users = await this.client.users({
        filter: { 
          or: [
            { name: { containsIgnoreCase: userIdentifier } },
            { displayName: { containsIgnoreCase: userIdentifier } }
          ]
        }
      });
      
      const userNodes = await users.nodes;
      if (userNodes.length > 0) {
        userEmail = userNodes[0].email;
      } else {
        throw new Error(`User not found: ${userIdentifier}`);
      }
    }

    const issues = await this.client.issues({
      filter: {
        assignee: { email: { eq: userEmail } }
      },
      orderBy: LinearDocument.PaginationOrderBy.UpdatedAt
    });

    return this.filterAndFormatIssues(issues, options);
  }

  async getTeamTickets(options: LinearOptions = {}): Promise<LinearTicket[]> {
    const issues = await this.client.issues({
      orderBy: LinearDocument.PaginationOrderBy.UpdatedAt
    });

    return this.filterAndFormatIssues(issues, options);
  }

  async getUnassignedTickets(options: LinearOptions = {}): Promise<LinearTicket[]> {
    const issues = await this.client.issues({
      filter: {
        assignee: { null: true }
      },
      orderBy: LinearDocument.PaginationOrderBy.UpdatedAt
    });

    return this.filterAndFormatIssues(issues, options);
  }

  async pullTicket(ticketId: string): Promise<{
    id: string;
    identifier: string;
    title: string;
    description: string;
    assignee: string;
    labels: string[];
    priority: string;
    state: string;
  }> {
    const issue = await this.client.issue(ticketId);
    const assignee = await issue.assignee;
    const state = await issue.state;
    const labels = await issue.labels();
    const labelNodes = await labels.nodes;

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || '',
      assignee: assignee?.email || '',
      labels: labelNodes.map(label => label.name),
      priority: this.mapPriority(issue.priority),
      state: state?.name || 'Unknown'
    };
  }

  async updateTicket(ticketId: string, update: string): Promise<void> {
    // For now, just log since Linear SDK v13 may not have commentCreate
    console.log(`Would update ticket ${ticketId} with: ${update}`);
    // TODO: Implement when Linear SDK is updated or use GraphQL directly
  }

  async createTicket(title: string, _description?: string): Promise<string> {
    // For now, return a placeholder ID
    console.log(`Would create ticket: ${title}`);
    return 'PLACEHOLDER-ID';
    // TODO: Implement when Linear SDK is updated or use GraphQL directly
  }

  async getNextHighPriorityTicket(): Promise<LinearTicket | null> {
    const tickets = await this.getMyTickets({ urgent: true });
    return tickets.length > 0 ? tickets[0] : null;
  }

  private async filterAndFormatIssues(
    issueConnection: IssueConnection,
    options: LinearOptions
  ): Promise<LinearTicket[]> {
    const nodes = await issueConnection.nodes;
    
    let tickets: LinearTicket[] = await Promise.all(
      nodes.map(async (issue) => {
        const state = await issue.state;
        const assignee = await issue.assignee;
        const labels = await issue.labels();
        const labelNodes = await labels.nodes;

        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          state: state ? {
            name: state.name,
            type: state.type
          } : undefined,
          assignee: assignee ? {
            email: assignee.email,
            name: assignee.name
          } : undefined,
          labels: labelNodes.map(l => l.name),
          updatedAt: issue.updatedAt,
          createdAt: issue.createdAt
        };
      })
    );

    // Apply filters
    if (options.status === 'open') {
      tickets = tickets.filter(t => 
        t.state?.type === 'unstarted' || 
        t.state?.type === 'started'
      );
    } else if (options.status === 'in-progress') {
      tickets = tickets.filter(t => t.state?.type === 'started');
    } else if (options.status === 'closed') {
      tickets = tickets.filter(t => 
        t.state?.type === 'completed' || 
        t.state?.type === 'canceled'
      );
    }

    if (options.urgent) {
      tickets = tickets.filter(t => t.priority <= 2);
    }

    if (options.recent) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      tickets = tickets.filter(t => t.updatedAt > dayAgo);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      tickets = tickets.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.labels?.some(l => l.toLowerCase().includes(search))
      );
    }

    if (options.limit) {
      tickets = tickets.slice(0, options.limit);
    }

    return tickets;
  }

  private mapPriority(priority: number): string {
    const map: Record<number, string> = {
      0: 'none',
      1: 'urgent',
      2: 'high',
      3: 'medium',
      4: 'low'
    };
    return map[priority] || 'none';
  }
}