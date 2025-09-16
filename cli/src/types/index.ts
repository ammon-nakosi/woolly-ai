// Core types for Woolly CLI

export type WoollyMode = 'feature' | 'script' | 'vibe';
export const WOOLLY_MODES: WoollyMode[] = ['feature', 'script', 'vibe'];
export type ProjectStatus = 'active' | 'completed' | 'closed' | 'archived';
export type TaskStatus = 'to-do' | 'doing' | 'done' | 'skipped' | 'canceled';
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface ProjectMetadata {
  name: string;
  mode: WoollyMode;
  status: 'open' | 'closed';
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
}

// Knowledge types
export interface WoollyKnowledge {
  id: string;
  version: string;
  type: 'pattern' | 'solution' | 'gotcha' | 'learning' | 'template';
  mode: WoollyMode;
  
  // Core content
  title: string;
  description: string;
  context: string;
  
  // Project tracking
  project: {
    name: string;
    repo?: string;
    path: string;
  };
  
  // Learnings
  learnings?: {
    what_worked?: string[];
    what_failed?: string[];
    key_insights?: string[];
    warnings?: string[];
  };
  
  // Implementation
  implementation?: {
    files?: string[];
    codeSnippets?: Array<{
      language: string;
      code: string;
      description: string;
    }>;
    commands?: string[];
    dependencies?: string[];
  };
  
  // Outcome
  outcome?: {
    successful: boolean;
    impact: 'high' | 'medium' | 'low';
    reusable: boolean;
  };
  
  // Relationships
  related?: {
    linearTickets?: string[];
    woollyWork?: string[];
    tags?: string[];
  };
  
  // Metadata
  created: string;
  updated: string;
  lastUsed?: string;
  usageCount?: number;
}

// Woolly work item (tracked in ChromaDB)
export interface WoollyItem {
  id: string;
  type: 'woolly_item';
  mode: WoollyMode;
  name: string;
  
  // Project association
  project: {
    name: string;
    path: string;
    gitRemote?: string;
  };
  
  // Status tracking
  status: 'planned' | 'in_progress' | 'completed' | 'closed' | 'archived';
  currentPhase?: number;
  totalPhases?: number;
  tasksComplete?: number;
  tasksTotal?: number;
  
  // Linear integration
  linearTicket?: string;
  priority?: Priority;
  
  // Timestamps
  created: string;
  updated: string;
  lastWorked: string;
  
  // Export tracking
  exported?: boolean;
  exportedDate?: string;
  
  // Personal notes (not exported)
  personalNotes?: string;
  
  // Closing and retrospective
  closedDate?: string;
  retrospective?: WoollyRetrospective;
}

// Retrospective structure for closed projects
export interface WoollyRetrospective {
  id: string;
  projectName: string;
  mode: WoollyMode;
  closedDate: string;
  duration: {
    startDate: string;
    endDate: string;
    totalDays: number;
    activeDays?: number;
  };
  
  // Completion metrics
  metrics: {
    plannedTasks: number;
    completedTasks: number;
    skippedTasks: number;
    completionRate: number;
    phasesCompleted: number;
    totalPhases: number;
  };
  
  // Key learnings
  learnings: {
    successes: string[];
    challenges: string[];
    improvements: string[];
    keyInsights: string[];
  };
  
  // Technical insights
  technical: {
    technologiesUsed: string[];
    patternsApplied: string[];
    problemsSolved: string[];
    codeQuality?: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  };
  
  // Reusable knowledge
  knowledge: {
    reusablePatterns: Array<{
      name: string;
      description: string;
      applicability: string;
    }>;
    documentation?: string[];
    templates?: string[];
  };
  
  // Impact assessment
  impact: {
    businessValue: 'high' | 'medium' | 'low';
    userExperience: 'improved' | 'maintained' | 'degraded';
    technicalDebt: 'reduced' | 'maintained' | 'increased';
    teamLearning: 'significant' | 'moderate' | 'minimal';
  };
  
  // Future recommendations
  recommendations: {
    nextSteps?: string[];
    followUpWork?: string[];
    maintenanceNotes?: string[];
  };
  
  // Linear integration
  linearSummary?: {
    ticketsCompleted: string[];
    totalPoints?: number;
    velocity?: number;
  };
  
  // AI-generated summary
  summary: string;
  
  // Metadata
  generatedBy?: string;
  reviewedBy?: string;
  approved?: boolean;
}

// Plan status structure (from plan-approved.plan-status.json)
export interface PlanStatus {
  project: string;
  totalPhases: number;
  lastUpdated: string;
  updateNotes?: string;
  phases: Phase[];
}

export interface Phase {
  phaseNumber: number;
  title: string;
  status: TaskStatus;
  checklist: ChecklistItem[];
  completionNotes?: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  implementationDetails?: string;
  notes?: string;
}

// Archive types
export interface WoollyArchive {
  version: '1.0.0';
  type: 'archive';
  mode: WoollyMode;
  name: string;
  exported: string;
  
  metadata: {
    source: string;
    project: string;
    gitRemote?: string;
    exportedBy?: string;
  };
  
  files: Array<{
    path: string;
    content: string;
    encoding: 'utf-8' | 'base64';
    size: number;
    modified: string;
  }>;
  
  summary?: {
    status?: string;
    phase?: number;
    outcome?: string;
    linearTickets?: string[];
  };
}

// Configuration
export interface WoollyConfig {
  version?: string;
  
  linear?: {
    apiKey?: string;
    userEmail?: string;
    teamId?: string;
    projectId?: string;
    userAliases?: Record<string, string>;
  };
  
  chromadb?: {
    host?: string;
    port?: number;
    path?: string;  // Defaults to ~/.woolly/chromadb
    embeddings?: {
      provider?: 'ollama' | 'openai' | 'default';
      ollamaModel?: string;
      autoStartOllama?: boolean;
      defaultThreshold?: number;
    };
  };
  
  patternExtraction?: {
    mode: 'auto' | 'semi-auto' | 'manual' | 'off';
    triggers?: {
      onComplete?: boolean;
      onArchive?: boolean;
      minComplexity?: string;
    };
  };
  
  preferences?: {
    autoSync?: boolean;
    autoExport?: boolean;
    defaultMode?: WoollyMode;
  };
  
  git?: {
    userEmail?: string;
    userName?: string;
  };
  
  initialized?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// CLI command options
export interface ListOptions {
  mode?: WoollyMode;
  status?: string;
  project?: string;
  recent?: boolean;
  all?: boolean;
  limit?: number;
}

export interface SearchOptions {
  mode?: WoollyMode;
  type?: string;
  project?: string;
  semantic?: boolean;
  limit?: number;
}

export interface ExportOptions {
  format?: 'archive' | 'knowledge' | 'both';
  outputPath?: string;
  commit?: boolean;
  message?: string;
}

export interface ImportOptions {
  source: string;
  overwrite?: boolean;
  merge?: boolean;
}