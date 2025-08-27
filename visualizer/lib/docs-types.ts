import React from 'react';

// Core documentation content interfaces
export interface DocContent {
  sections: DocSection[];
  metadata: DocMetadata;
}

export interface DocMetadata {
  title: string;
  description: string;
  lastUpdated: string;
  version: string;
}

export interface DocSection {
  id: string;
  title: string;
  level: number;
  content: string | React.ReactNode;
  subsections?: DocSection[];
}

// Navigation interfaces
export interface NavigationItem {
  id: string;
  title: string;
  level: number;
  children?: NavigationItem[];
}

// Search interfaces
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  section: string;
  score: number;
}

export interface SearchIndex {
  sections: SearchableSection[];
  commands: SearchableCommand[];
  examples: SearchableExample[];
}

export interface SearchableSection {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  type: 'section' | 'subsection';
  path: string; // anchor link
}

export interface SearchableCommand {
  id: string;
  name: string;
  type: 'cli' | 'slash';
  description: string;
  syntax: string;
  keywords: string[];
  path: string;
}

export interface SearchableExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  keywords: string[];
  path: string;
}

// Command documentation interfaces
export interface Command {
  name: string;
  type: 'cli' | 'slash';
  description: string;
  syntax: string;
  examples: CommandExample[];
  options?: CommandOption[];
  relatedCommands?: string[];
}

export interface CommandExample {
  command: string;
  description: string;
  output?: string;
}

export interface CommandOption {
  name: string;
  description: string;
  required?: boolean;
  type?: string;
  default?: string;
}

// Mode documentation interfaces
export interface CounselMode {
  name: string;
  id: string;
  description: string;
  purpose: string;
  directoryStructure: string[];
  workflow: WorkflowStep[];
  useCases: string[];
  relatedCommands: string[];
}

export interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  commands?: string[];
}

// Integration documentation interfaces
export interface Integration {
  name: string;
  id: string;
  description: string;
  setupSteps: SetupStep[];
  configuration: ConfigurationOption[];
  features: string[];
  troubleshooting: TroubleshootingItem[];
}

export interface SetupStep {
  step: number;
  title: string;
  description: string;
  code?: string;
  language?: string;
}

export interface ConfigurationOption {
  name: string;
  description: string;
  required: boolean;
  type: string;
  example?: string;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
  code?: string;
}

// Component prop interfaces
export interface DocSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

export interface NavigationSidebarProps {
  items: NavigationItem[];
  activeSection: string;
}

export interface SearchBoxProps {
  onResultSelect: (result: SearchResult) => void;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature' | 'script' | 'debug' | 'review' | 'vibe' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}