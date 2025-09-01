export type RuleType = 
  | 'coding-practices'
  | 'code-snippet'
  | 'workaround'
  | 'config'
  | 'reference'
  | 'guideline'
  | 'general-note';

export type RuleScope = 'project' | 'session' | 'user';
export type RuleStatus = 'active' | 'inactive';
export type RuleDisplay = 'full' | 'summary' | 'hidden';

export interface RuleRepo {
  url?: string;
  name: string;
  path: string;
}

export interface Rule {
  id: string;
  type: RuleType;
  title: string;
  display: RuleDisplay;
  scope: RuleScope;
  status: RuleStatus;
  repo?: RuleRepo;
  projectName?: string;  // For session rules - tracks which counsel project owns this rule
  created: string;
  updated: string;
  summary: string;
  details?: string;
}

export interface Prompt {
  id: string;
  title: string;
  scope: RuleScope;
  created: string;
  updated: string;
  description: string;
  content: string;  // The actual prompt content
  variables?: string[];  // Variables used in the prompt
  tags?: string[];
  context?: string;  // Context/instructions for using the prompt
  usage_count: number;
}

export interface LibraryMetadata {
  version: string;
  created: string;
  updated: string;
  counts: {
    rules: number;
    prompts: number;
  };
}