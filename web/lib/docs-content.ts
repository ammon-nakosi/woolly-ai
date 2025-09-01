import React from 'react';
import { 
  DocContent, 
  CounselMode, 
  Command, 
  Integration
} from './docs-types';

// Import content sections
import { 
  OverviewSection, 
  GettingStartedSection, 
  CounselModesSection, 
  CLIReferenceSection, 
  SlashCommandsSection 
} from './docs-content-sections';

import { 
  IntegrationsSection, 
  ArchitectureSection, 
  ExamplesSection, 
  DevelopmentSection 
} from './docs-content-sections-2';


// Counsel Modes Data
export const counselModes: CounselMode[] = [
  {
    name: 'Feature Mode',
    id: 'feature',
    description: 'Develop new features with structured planning and implementation tracking',
    purpose: 'For building new functionality with clear requirements, design, and implementation phases',
    directoryStructure: [
      '.features/',
      '.features/[feature-name]/',
      '.features/[feature-name]/requirements.md',
      '.features/[feature-name]/design.md',
      '.features/[feature-name]/implementation.md',
      '.features/[feature-name]/status.json'
    ],
    workflow: [
      {
        step: 1,
        title: 'Requirements Gathering',
        description: 'Define what the feature should do and capture user stories',
        commands: ['/counsel-feature-requirements', 'counsel add feature']
      },
      {
        step: 2,
        title: 'Design Planning',
        description: 'Create technical design and architecture decisions',
        commands: ['/counsel-feature-planning']
      },
      {
        step: 3,
        title: 'Implementation',
        description: 'Build the feature following the design specifications',
        commands: ['/counsel-feature-implement']
      },
      {
        step: 4,
        title: 'Status Tracking',
        description: 'Monitor progress and update status throughout development',
        commands: ['/counsel-status', '/counsel-status-update']
      }
    ],
    useCases: [
      'Building new user authentication system',
      'Adding payment processing functionality',
      'Creating admin dashboard features',
      'Implementing API endpoints'
    ],
    relatedCommands: ['counsel add feature', '/counsel-feature-requirements', '/counsel-feature-planning', '/counsel-feature-implement']
  },
  {
    name: 'Script Mode',
    id: 'script',
    description: 'Create and manage automation scripts and utilities',
    purpose: 'For building standalone scripts, utilities, and automation tools',
    directoryStructure: [
      '.scripts/',
      '.scripts/[script-name]/',
      '.scripts/[script-name]/requirements.md',
      '.scripts/[script-name]/implementation.md',
      '.scripts/[script-name]/status.json'
    ],
    workflow: [
      {
        step: 1,
        title: 'Script Planning',
        description: 'Define what the script should accomplish and its requirements',
        commands: ['counsel add script', '/counsel-feature-requirements']
      },
      {
        step: 2,
        title: 'Implementation',
        description: 'Write the script with proper error handling and documentation',
        commands: ['/counsel-feature-implement']
      },
      {
        step: 3,
        title: 'Testing & Validation',
        description: 'Test the script and ensure it works as expected',
        commands: ['/counsel-status']
      }
    ],
    useCases: [
      'Database migration scripts',
      'Build automation tools',
      'Data processing utilities',
      'Deployment scripts'
    ],
    relatedCommands: ['counsel add script', '/counsel-feature-requirements', '/counsel-feature-implement']
  },
  {
    name: 'Vibe Mode',
    id: 'vibe',
    description: 'Explore ideas and experiment with new concepts',
    purpose: 'For brainstorming, prototyping, and experimental development',
    directoryStructure: [
      '.vibe/',
      '.vibe/[experiment-name]/',
      '.vibe/[experiment-name]/exploration.md',
      '.vibe/[experiment-name]/findings.md',
      '.vibe/[experiment-name]/status.json'
    ],
    workflow: [
      {
        step: 1,
        title: 'Idea Exploration',
        description: 'Brainstorm and explore new concepts or approaches',
        commands: ['counsel add vibe', '/counsel-feature-discovery']
      },
      {
        step: 2,
        title: 'Experimentation',
        description: 'Build prototypes and test ideas',
        commands: ['/counsel-reload', '/counsel-feature-implement']
      },
      {
        step: 3,
        title: 'Documentation',
        description: 'Document findings and lessons learned',
        commands: ['/counsel-status']
      }
    ],
    useCases: [
      'New technology evaluation',
      'Proof of concept development',
      'Architecture experimentation',
      'Creative problem solving'
    ],
    relatedCommands: ['counsel add vibe', '/counsel-feature-discovery', '/counsel-reload']
  }
];

// CLI Commands Data
export const cliCommands: Command[] = [
  {
    name: 'counsel init',
    type: 'cli',
    description: 'Initialize Counsel framework in the current directory',
    syntax: 'counsel init [options]',
    examples: [
      {
        command: 'counsel init',
        description: 'Initialize with default settings'
      },
      {
        command: 'counsel init --force',
        description: 'Force initialization even if already initialized'
      }
    ],
    options: [
      {
        name: '--force',
        description: 'Force initialization even if .counsel directory exists',
        required: false,
        type: 'boolean'
      }
    ],
    relatedCommands: ['counsel status', 'counsel add']
  },
  {
    name: 'counsel add',
    type: 'cli',
    description: 'Add a new item to track (feature, script, debug, review, or vibe)',
    syntax: 'counsel add <type> <name> [options]',
    examples: [
      {
        command: 'counsel add feature user-auth',
        description: 'Add a new feature called "user-auth"'
      },
      {
        command: 'counsel add script backup-db',
        description: 'Add a new script called "backup-db"'
      },
      {
        command: 'counsel add debug memory-leak --priority high',
        description: 'Add a high-priority debug item'
      }
    ],
    options: [
      {
        name: '--priority',
        description: 'Set priority level (low, medium, high)',
        required: false,
        type: 'string',
        default: 'medium'
      },
      {
        name: '--description',
        description: 'Brief description of the item',
        required: false,
        type: 'string'
      }
    ],
    relatedCommands: ['counsel list', 'counsel status']
  },
  {
    name: 'counsel list',
    type: 'cli',
    description: 'List all tracked items with their current status',
    syntax: 'counsel list [type] [options]',
    examples: [
      {
        command: 'counsel list',
        description: 'List all items across all types'
      },
      {
        command: 'counsel list feature',
        description: 'List only feature items'
      },
      {
        command: 'counsel list --status active',
        description: 'List only active items'
      }
    ],
    options: [
      {
        name: '--status',
        description: 'Filter by status (active, completed, paused)',
        required: false,
        type: 'string'
      },
      {
        name: '--priority',
        description: 'Filter by priority level',
        required: false,
        type: 'string'
      }
    ],
    relatedCommands: ['counsel add', 'counsel status']
  },
  {
    name: 'counsel status',
    type: 'cli',
    description: 'Show detailed status of a specific item or overview of all items',
    syntax: 'counsel status [type] [name] [options]',
    examples: [
      {
        command: 'counsel status',
        description: 'Show overview of all items'
      },
      {
        command: 'counsel status feature user-auth',
        description: 'Show detailed status of user-auth feature'
      }
    ],
    options: [
      {
        name: '--json',
        description: 'Output status in JSON format',
        required: false,
        type: 'boolean'
      }
    ],
    relatedCommands: ['counsel list', 'counsel add']
  },
  {
    name: 'counsel search',
    type: 'cli',
    description: 'Search through all tracked items and their content',
    syntax: 'counsel search <query> [options]',
    examples: [
      {
        command: 'counsel search "authentication"',
        description: 'Search for items containing "authentication"'
      },
      {
        command: 'counsel search "API" --type feature',
        description: 'Search for "API" only in features'
      }
    ],
    options: [
      {
        name: '--type',
        description: 'Limit search to specific type',
        required: false,
        type: 'string'
      },
      {
        name: '--limit',
        description: 'Maximum number of results',
        required: false,
        type: 'number',
        default: '10'
      }
    ],
    relatedCommands: ['counsel list', 'counsel status']
  }
];

// Slash Commands Data
export const slashCommands: Command[] = [
  {
    name: '/counsel-feature-requirements',
    type: 'slash',
    description: 'Help gather and document requirements for a feature or project',
    syntax: '/counsel-feature-requirements',
    examples: [
      {
        command: '/counsel-feature-requirements',
        description: 'Start interactive requirements gathering session',
        output: 'AI will guide you through defining user stories, acceptance criteria, and technical requirements'
      }
    ],
    relatedCommands: ['/counsel-feature-planning', '/counsel-feature-implement']
  },
  {
    name: '/counsel-feature-planning',
    type: 'slash',
    description: 'Create technical design and implementation plan',
    syntax: '/counsel-feature-planning',
    examples: [
      {
        command: '/counsel-feature-planning',
        description: 'Generate design document and implementation strategy',
        output: 'AI will help create architecture decisions, component design, and implementation roadmap'
      }
    ],
    relatedCommands: ['/counsel-feature-requirements', '/counsel-feature-implement']
  },
  {
    name: '/counsel-feature-implement',
    type: 'slash',
    description: 'Get assistance with implementation of planned features',
    syntax: '/counsel-feature-implement',
    examples: [
      {
        command: '/counsel-feature-implement',
        description: 'Start implementation with AI guidance',
        output: 'AI will help write code, suggest best practices, and guide implementation'
      }
    ],
    relatedCommands: ['/counsel-feature-planning', '/counsel-status']
  },
  {
    name: '/counsel-feature-discovery',
    type: 'slash',
    description: 'Explore and understand existing codebase or investigate issues',
    syntax: '/counsel-feature-discovery',
    examples: [
      {
        command: '/counsel-feature-discovery',
        description: 'Start codebase exploration session',
        output: 'AI will help analyze code structure, identify patterns, and understand system architecture'
      }
    ],
    relatedCommands: ['/counsel-reload', '/counsel-feature-implement']
  },
  {
    name: '/counsel-reload',
    type: 'slash',
    description: 'Get up to speed on existing code and prepare for development',
    syntax: '/counsel-reload',
    examples: [
      {
        command: '/counsel-reload',
        description: 'Learn about codebase and development environment',
        output: 'AI will provide codebase overview, setup instructions, and development guidelines'
      }
    ],
    relatedCommands: ['/counsel-feature-discovery', '/counsel-feature-implement']
  },
  {
    name: '/counsel-status',
    type: 'slash',
    description: 'Get current status and progress summary',
    syntax: '/counsel-status',
    examples: [
      {
        command: '/counsel-status',
        description: 'Show current progress and next steps',
        output: 'AI will summarize current status, completed work, and recommended next actions'
      }
    ],
    relatedCommands: ['/counsel-status-update', '/counsel-feature-implement']
  },
  {
    name: '/counsel-status-update',
    type: 'slash',
    description: 'Update progress and status information',
    syntax: '/counsel-status-update',
    examples: [
      {
        command: '/counsel-status-update',
        description: 'Update current progress and status',
        output: 'AI will help document completed work and update status tracking'
      }
    ],
    relatedCommands: ['/counsel-status', '/counsel-feature-implement']
  },
  {
    name: '/counsel-create',
    type: 'slash',
    description: 'Create new items or initialize new development workflows',
    syntax: '/counsel-create',
    examples: [
      {
        command: '/counsel-create',
        description: 'Start creation workflow for new items',
        output: 'AI will guide you through creating new features, scripts, or other tracked items'
      }
    ],
    relatedCommands: ['/counsel-feature-requirements', '/counsel-feature-planning']
  },
  {
    name: '/counsel-status-light',
    type: 'slash',
    description: 'Get a brief, lightweight status summary',
    syntax: '/counsel-status-light',
    examples: [
      {
        command: '/counsel-status-light',
        description: 'Show quick status overview',
        output: 'AI will provide a concise summary of current status and immediate next steps'
      }
    ],
    relatedCommands: ['/counsel-status', '/counsel-status-update']
  }
];

// Integrations Data
export const integrations: Integration[] = [
  {
    name: 'ChromaDB',
    id: 'chromadb',
    description: 'Vector database for semantic search and AI-powered code discovery',
    setupSteps: [
      {
        step: 1,
        title: 'Install ChromaDB',
        description: 'Install ChromaDB using pip or your preferred Python package manager',
        code: 'pip install chromadb',
        language: 'bash'
      },
      {
        step: 2,
        title: 'Start ChromaDB Server',
        description: 'Run ChromaDB server locally or configure remote connection',
        code: 'chroma run --host localhost --port 8000',
        language: 'bash'
      },
      {
        step: 3,
        title: 'Configure Counsel',
        description: 'Set ChromaDB connection details in Counsel configuration',
        code: 'counsel init --chromadb-url http://localhost:8000',
        language: 'bash'
      }
    ],
    configuration: [
      {
        name: 'CHROMADB_URL',
        description: 'URL of the ChromaDB server',
        required: true,
        type: 'string',
        example: 'http://localhost:8000'
      },
      {
        name: 'CHROMADB_COLLECTION',
        description: 'Name of the collection to use for storing embeddings',
        required: false,
        type: 'string',
        example: 'counsel_codebase'
      }
    ],
    features: [
      'Semantic code search across your entire codebase',
      'AI-powered code discovery and exploration',
      'Context-aware code recommendations',
      'Automatic code indexing and embedding generation'
    ],
    troubleshooting: [
      {
        issue: 'ChromaDB connection failed',
        solution: 'Ensure ChromaDB server is running and accessible at the configured URL'
      },
      {
        issue: 'Slow search performance',
        solution: 'Check ChromaDB server resources and consider optimizing collection size'
      }
    ]
  },
  {
    name: 'Linear',
    id: 'linear',
    description: 'Issue tracking integration for seamless project management',
    setupSteps: [
      {
        step: 1,
        title: 'Get Linear API Key',
        description: 'Generate a personal API key from Linear settings',
        code: '# Go to Linear Settings > API > Personal API Keys > Create Key',
        language: 'bash'
      },
      {
        step: 2,
        title: 'Configure API Key',
        description: 'Set your Linear API key in environment variables',
        code: 'export LINEAR_API_KEY=your_api_key_here',
        language: 'bash'
      },
      {
        step: 3,
        title: 'Initialize Linear Integration',
        description: 'Configure Counsel to use Linear for issue tracking',
        code: 'counsel init --linear-api-key $LINEAR_API_KEY',
        language: 'bash'
      }
    ],
    configuration: [
      {
        name: 'LINEAR_API_KEY',
        description: 'Your Linear personal API key',
        required: true,
        type: 'string',
        example: 'lin_api_xxxxxxxxxxxxxxxx'
      },
      {
        name: 'LINEAR_TEAM_ID',
        description: 'Default team ID for creating issues',
        required: false,
        type: 'string',
        example: 'team_xxxxxxxxxxxxxxxx'
      }
    ],
    features: [
      'Automatic issue creation from Counsel items',
      'Sync status between Counsel and Linear',
      'Link code changes to Linear issues',
      'Import existing Linear issues into Counsel'
    ],
    troubleshooting: [
      {
        issue: 'API authentication failed',
        solution: 'Verify your Linear API key is correct and has necessary permissions'
      },
      {
        issue: 'Team not found',
        solution: 'Check that the specified team ID exists and you have access to it'
      }
    ]
  },
  {
    name: 'Git',
    id: 'git',
    description: 'Version control integration for backup and synchronization',
    setupSteps: [
      {
        step: 1,
        title: 'Initialize Git Repository',
        description: 'Ensure your project has a Git repository initialized',
        code: 'git init',
        language: 'bash'
      },
      {
        step: 2,
        title: 'Configure Remote',
        description: 'Add a remote repository for backup and sync',
        code: 'git remote add origin https://github.com/username/repo.git',
        language: 'bash'
      },
      {
        step: 3,
        title: 'Enable Git Integration',
        description: 'Configure Counsel to use Git for backup and sync',
        code: 'counsel init --git-backup',
        language: 'bash'
      }
    ],
    configuration: [
      {
        name: 'GIT_BACKUP_ENABLED',
        description: 'Enable automatic Git backup of Counsel data',
        required: false,
        type: 'boolean',
        example: 'true'
      },
      {
        name: 'GIT_BACKUP_BRANCH',
        description: 'Branch to use for Counsel data backup',
        required: false,
        type: 'string',
        example: 'counsel-backup'
      }
    ],
    features: [
      'Automatic backup of Counsel data to Git',
      'Sync Counsel state across multiple machines',
      'Version history of all tracked items',
      'Integration with existing Git workflows'
    ],
    troubleshooting: [
      {
        issue: 'Git push failed',
        solution: 'Check Git credentials and remote repository permissions'
      },
      {
        issue: 'Merge conflicts in Counsel data',
        solution: 'Use counsel sync command to resolve conflicts automatically'
      }
    ]
  }
];

export default integrations;

// Main Documentation Content Structure
export const docsContent: DocContent = {
  metadata: {
    title: "Counsel Framework Documentation",
    description: "Comprehensive guide to the Counsel Framework for AI-assisted development",
    lastUpdated: "2025-01-26",
    version: "1.0.0"
  },
  sections: [
    {
      id: "overview",
      title: "Overview",
      level: 1,
      content: React.createElement(OverviewSection),
      subsections: [
        {
          id: "what-is-counsel",
          title: "What is Counsel?",
          level: 2,
          content: "Counsel is a comprehensive framework designed to enhance AI-assisted development workflows."
        },
        {
          id: "key-features",
          title: "Key Features",
          level: 2,
          content: "Structured workflows, AI integration, progress tracking, and more."
        },
        {
          id: "supported-modes",
          title: "Supported Modes",
          level: 2,
          content: "Five specialized modes for different development scenarios."
        },
        {
          id: "integrations-overview",
          title: "Integrations",
          level: 2,
          content: "ChromaDB, Linear, and Git integrations for enhanced functionality."
        }
      ]
    },
    {
      id: "getting-started",
      title: "Getting Started",
      level: 1,
      content: React.createElement(GettingStartedSection),
      subsections: [
        {
          id: "prerequisites",
          title: "Prerequisites",
          level: 2,
          content: "Node.js 18+, npm/yarn, Git, Python 3.8+ (optional), AI Assistant access"
        },
        {
          id: "installation",
          title: "Installation",
          level: 2,
          content: "Install via npm: npm install -g counsel-framework"
        },
        {
          id: "initial-setup",
          title: "Initial Setup",
          level: 2,
          content: "Initialize with: counsel init"
        },
        {
          id: "first-steps",
          title: "First Steps",
          level: 2,
          content: "Create your first feature and start using slash commands"
        }
      ]
    },
    {
      id: "counsel-modes",
      title: "Counsel Modes",
      level: 1,
      content: React.createElement(CounselModesSection),
      subsections: [
        {
          id: "feature-mode",
          title: "Feature Mode",
          level: 2,
          content: "Develop new features with structured planning and implementation tracking"
        },
        {
          id: "script-mode",
          title: "Script Mode",
          level: 2,
          content: "Create and manage automation scripts and utilities"
        },
        {
          id: "vibe-mode",
          title: "Vibe Mode",
          level: 2,
          content: "Explore ideas and experiment with new concepts"
        }
      ]
    },
    {
      id: "cli-reference",
      title: "CLI Reference",
      level: 1,
      content: React.createElement(CLIReferenceSection),
      subsections: [
        {
          id: "cli-overview",
          title: "CLI Overview",
          level: 2,
          content: "Programmatic access to all framework functionality"
        },
        {
          id: "core-commands",
          title: "Core Commands",
          level: 2,
          content: "Essential CLI commands for project management"
        },
        {
          id: "integration-commands",
          title: "Integration Commands",
          level: 2,
          content: "Commands for managing external integrations"
        },
        {
          id: "cli-troubleshooting",
          title: "CLI Troubleshooting",
          level: 2,
          content: "Common CLI issues and solutions"
        }
      ]
    },
    {
      id: "slash-commands",
      title: "Slash Commands",
      level: 1,
      content: React.createElement(SlashCommandsSection),
      subsections: [
        {
          id: "slash-overview",
          title: "Slash Commands Overview",
          level: 2,
          content: "Interactive workflows for AI assistants"
        },
        {
          id: "workflow-commands",
          title: "Workflow Commands",
          level: 2,
          content: "Commands for development workflows"
        },
        {
          id: "status-commands",
          title: "Status Commands",
          level: 2,
          content: "Commands for status tracking and updates"
        },
        {
          id: "ai-assistant-compatibility",
          title: "AI Assistant Compatibility",
          level: 2,
          content: "Compatibility with Claude and Cursor IDE"
        }
      ]
    },
    {
      id: "integrations",
      title: "Integrations",
      level: 1,
      content: React.createElement(IntegrationsSection),
      subsections: [
        {
          id: "chromadb-integration",
          title: "ChromaDB Integration",
          level: 2,
          content: "Vector database for semantic search and AI-powered code discovery"
        },
        {
          id: "linear-integration",
          title: "Linear Integration",
          level: 2,
          content: "Issue tracking integration for seamless project management"
        },
        {
          id: "git-integration",
          title: "Git Integration",
          level: 2,
          content: "Version control integration for backup and synchronization"
        },
        {
          id: "integration-troubleshooting",
          title: "Integration Troubleshooting",
          level: 2,
          content: "Common integration issues and solutions"
        }
      ]
    },
    {
      id: "architecture",
      title: "Architecture",
      level: 1,
      content: React.createElement(ArchitectureSection),
      subsections: [
        {
          id: "system-overview",
          title: "System Overview",
          level: 2,
          content: "Modular framework with AI-first design principles"
        },
        {
          id: "storage-structure",
          title: "Storage Structure",
          level: 2,
          content: "File-based storage with JSON metadata and Markdown content"
        },
        {
          id: "component-interaction",
          title: "Component Interaction",
          level: 2,
          content: "How CLI, slash commands, and integrations work together"
        },
        {
          id: "design-philosophy",
          title: "Design Philosophy",
          level: 2,
          content: "AI-first design, file-based storage, modular architecture"
        }
      ]
    },
    {
      id: "examples",
      title: "Examples",
      level: 1,
      content: React.createElement(ExamplesSection),
      subsections: [
        {
          id: "feature-workflow-example",
          title: "Feature Development Workflow",
          level: 2,
          content: "Complete example of developing a user authentication feature"
        },
        {
          id: "script-creation-example",
          title: "Script Creation Example",
          level: 2,
          content: "Example of creating a database backup script"
        },
        {
          id: "debug-workflow-example",
          title: "Debug Workflow Example",
          level: 2,
          content: "Example of investigating a memory leak"
        },
        {
          id: "integration-examples",
          title: "Integration Examples",
          level: 2,
          content: "Practical examples of using integrations"
        },
        {
          id: "best-practices",
          title: "Best Practices",
          level: 2,
          content: "Recommended practices for using Counsel effectively"
        }
      ]
    },
    {
      id: "development",
      title: "Development",
      level: 1,
      content: React.createElement(DevelopmentSection),
      subsections: [
        {
          id: "development-setup",
          title: "Development Setup",
          level: 2,
          content: "Set up your development environment to contribute"
        },
        {
          id: "codebase-structure",
          title: "Codebase Structure",
          level: 2,
          content: "Understanding the framework codebase organization"
        },
        {
          id: "contribution-guidelines",
          title: "Contribution Guidelines",
          level: 2,
          content: "Guidelines for contributing to the project"
        },
        {
          id: "testing-guidelines",
          title: "Testing Guidelines",
          level: 2,
          content: "Testing standards and best practices"
        },
        {
          id: "release-process",
          title: "Release Process",
          level: 2,
          content: "How releases are managed and deployed"
        }
      ]
    }
  ]
};

// Content organization utilities
export function getNavigationItems(): NavigationItem[] {
  return docsContent.sections.map(section => ({
    id: section.id,
    title: section.title,
    level: section.level,
    children: section.subsections?.map(subsection => ({
      id: subsection.id,
      title: subsection.title,
      level: subsection.level
    }))
  }));
}

export function getSectionById(id: string): DocSection | undefined {
  for (const section of docsContent.sections) {
    if (section.id === id) {
      return section;
    }
    if (section.subsections) {
      const subsection = section.subsections.find(sub => sub.id === id);
      if (subsection) {
        return subsection;
      }
    }
  }
  return undefined;
}

export function getAllSections(): DocSection[] {
  const allSections: DocSection[] = [];
  
  docsContent.sections.forEach(section => {
    allSections.push(section);
    if (section.subsections) {
      allSections.push(...section.subsections);
    }
  });
  
  return allSections;
}

// All exports are already declared above as individual exports