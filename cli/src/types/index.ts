// Core types for Counsel CLI

export type CounselMode = 'feature' | 'script' | 'vibe' | 'prompt';
export type ProjectStatus = 'active' | 'completed' | 'closed' | 'archived';
export type TaskStatus = 'to-do' | 'doing' | 'done' | 'skipped' | 'canceled';
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface ProjectMetadata {
  name: string;
  mode: CounselMode;
  status: 'open' | 'closed';
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
}

// Knowledge types
export interface CounselKnowledge {
  id: string;
  version: string;
  type: 'pattern' | 'solution' | 'gotcha' | 'learning' | 'template';
  mode: CounselMode;
  
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
    counselWork?: string[];
    tags?: string[];
  };
  
  // Metadata
  created: string;
  updated: string;
  lastUsed?: string;
  usageCount?: number;
}

// Counsel work item (tracked in ChromaDB)
export interface CounselItem {
  id: string;
  type: 'counsel_item';
  mode: CounselMode;
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
  retrospective?: CounselRetrospective;
}

// Retrospective structure for closed projects
export interface CounselRetrospective {
  id: string;
  projectName: string;
  mode: CounselMode;
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
export interface CounselArchive {
  version: '1.0.0';
  type: 'archive';
  mode: CounselMode;
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
export interface CounselConfig {
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
    path?: string;  // Defaults to ~/.counsel/chromadb
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
    defaultMode?: CounselMode;
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
  mode?: CounselMode;
  status?: string;
  project?: string;
  recent?: boolean;
  all?: boolean;
  limit?: number;
}

export interface SearchOptions {
  mode?: CounselMode;
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