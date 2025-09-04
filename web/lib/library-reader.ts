import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mirror the types from the CLI
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

export interface Rule {
  id: string;
  type: RuleType;
  title: string;
  display: RuleDisplay;
  scope: RuleScope;
  status: RuleStatus;
  repo?: {
    url?: string;
    name?: string;
    path?: string;
  };
  projectName?: string;
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
  content: string;
  variables?: string[];
  tags?: string[];
  context?: string;
  usage_count: number;
}

const LIBRARY_BASE = path.join(os.homedir(), '.woolly', 'library');
const RULES_DIR = path.join(LIBRARY_BASE, 'rules');
const PROMPTS_DIR = path.join(LIBRARY_BASE, 'prompts');

export async function getRules(): Promise<Rule[]> {
  try {
    await fs.access(RULES_DIR);
    const files = await fs.readdir(RULES_DIR);
    const rules: Rule[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const content = await fs.readFile(path.join(RULES_DIR, file), 'utf-8');
      const rule: Rule = JSON.parse(content);
      rules.push(rule);
    }
    
    return rules.sort((a, b) => 
      new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
  } catch {
    return [];
  }
}

export async function getRule(id: string): Promise<Rule | null> {
  try {
    const filePath = path.join(RULES_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function updateRule(id: string, updates: Partial<Rule>): Promise<boolean> {
  try {
    const rule = await getRule(id);
    if (!rule) return false;
    
    const updatedRule: Rule = {
      ...rule,
      ...updates,
      updated: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(RULES_DIR, `${id}.json`),
      JSON.stringify(updatedRule, null, 2)
    );
    
    return true;
  } catch {
    return false;
  }
}

export async function deleteRule(id: string): Promise<boolean> {
  try {
    await fs.unlink(path.join(RULES_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

export async function getPrompts(): Promise<Prompt[]> {
  try {
    await fs.access(PROMPTS_DIR);
    const files = await fs.readdir(PROMPTS_DIR);
    const prompts: Prompt[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const content = await fs.readFile(path.join(PROMPTS_DIR, file), 'utf-8');
      const prompt: Prompt = JSON.parse(content);
      prompts.push(prompt);
    }
    
    return prompts.sort((a, b) => 
      new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
  } catch {
    return [];
  }
}

export async function getPrompt(id: string): Promise<Prompt | null> {
  try {
    const filePath = path.join(PROMPTS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function updatePrompt(id: string, updates: Partial<Prompt>): Promise<boolean> {
  try {
    const prompt = await getPrompt(id);
    if (!prompt) return false;
    
    const updatedPrompt: Prompt = {
      ...prompt,
      ...updates,
      updated: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(PROMPTS_DIR, `${id}.json`),
      JSON.stringify(updatedPrompt, null, 2)
    );
    
    return true;
  } catch {
    return false;
  }
}

export async function deletePrompt(id: string): Promise<boolean> {
  try {
    await fs.unlink(path.join(PROMPTS_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}