import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Rule, Prompt, RuleScope, RuleStatus, LibraryMetadata } from '../types/library';

const LIBRARY_BASE = path.join(os.homedir(), '.counsel', 'library');
const RULES_DIR = path.join(LIBRARY_BASE, 'rules');
const PROMPTS_DIR = path.join(LIBRARY_BASE, 'prompts');
const METADATA_FILE = path.join(LIBRARY_BASE, 'metadata.json');

export class LibraryService {
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(RULES_DIR, { recursive: true });
    await fs.mkdir(PROMPTS_DIR, { recursive: true });
  }

  private async updateMetadata(): Promise<void> {
    const rules = await this.listRules();
    const prompts = await this.listPrompts();
    
    const metadata: LibraryMetadata = {
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      counts: {
        rules: rules.length,
        prompts: prompts.length
      }
    };
    
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
  }

  // Rule Operations
  async saveRule(rule: Rule): Promise<void> {
    await this.ensureDirectories();
    const filePath = path.join(RULES_DIR, `${rule.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(rule, null, 2));
    await this.updateMetadata();
  }

  async getRule(id: string): Promise<Rule | null> {
    try {
      const filePath = path.join(RULES_DIR, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async listRules(filter?: {
    scope?: RuleScope;
    status?: RuleStatus;
    repoPath?: string;
    projectName?: string;
    excludeProjectName?: string;
  }): Promise<Rule[]> {
    await this.ensureDirectories();
    
    try {
      const files = await fs.readdir(RULES_DIR);
      const rules: Rule[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const content = await fs.readFile(path.join(RULES_DIR, file), 'utf-8');
        const rule: Rule = JSON.parse(content);
        
        // Apply filters
        if (filter) {
          if (filter.scope && rule.scope !== filter.scope) continue;
          if (filter.status && rule.status !== filter.status) continue;
          if (filter.repoPath && rule.repo?.path !== filter.repoPath) continue;
          if (filter.projectName && rule.projectName !== filter.projectName) continue;
          if (filter.excludeProjectName && rule.projectName === filter.excludeProjectName) continue;
        }
        
        rules.push(rule);
      }
      
      return rules.sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    } catch {
      return [];
    }
  }

  async updateRule(id: string, updates: Partial<Rule>): Promise<boolean> {
    const rule = await this.getRule(id);
    if (!rule) return false;
    
    const updatedRule: Rule = {
      ...rule,
      ...updates,
      updated: new Date().toISOString()
    };
    
    await this.saveRule(updatedRule);
    return true;
  }

  async deleteRule(id: string): Promise<boolean> {
    try {
      const filePath = path.join(RULES_DIR, `${id}.json`);
      await fs.unlink(filePath);
      await this.updateMetadata();
      return true;
    } catch {
      return false;
    }
  }

  // Prompt Operations
  async savePrompt(prompt: Prompt): Promise<void> {
    await this.ensureDirectories();
    const filePath = path.join(PROMPTS_DIR, `${prompt.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(prompt, null, 2));
    await this.updateMetadata();
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    try {
      const filePath = path.join(PROMPTS_DIR, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async listPrompts(filter?: {
    scope?: RuleScope;
    tags?: string[];
  }): Promise<Prompt[]> {
    await this.ensureDirectories();
    
    try {
      const files = await fs.readdir(PROMPTS_DIR);
      const prompts: Prompt[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const content = await fs.readFile(path.join(PROMPTS_DIR, file), 'utf-8');
        const prompt: Prompt = JSON.parse(content);
        
        // Apply filters
        if (filter) {
          if (filter.scope && prompt.scope !== filter.scope) continue;
          if (filter.tags && filter.tags.length > 0) {
            const hasTag = filter.tags.some(tag => 
              prompt.tags?.includes(tag)
            );
            if (!hasTag) continue;
          }
        }
        
        prompts.push(prompt);
      }
      
      return prompts.sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    } catch {
      return [];
    }
  }

  async updatePrompt(id: string, updates: Partial<Prompt>): Promise<boolean> {
    const prompt = await this.getPrompt(id);
    if (!prompt) return false;
    
    const updatedPrompt: Prompt = {
      ...prompt,
      ...updates,
      updated: new Date().toISOString()
    };
    
    await this.savePrompt(updatedPrompt);
    return true;
  }

  async deletePrompt(id: string): Promise<boolean> {
    try {
      const filePath = path.join(PROMPTS_DIR, `${id}.json`);
      await fs.unlink(filePath);
      await this.updateMetadata();
      return true;
    } catch {
      return false;
    }
  }

  // Utility functions
  generateRuleId(scope: RuleScope): string {
    const prefix = scope === 'session' ? 'session' : 
                  scope === 'project' ? 'proj' : 'user';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `rule_${prefix}_${timestamp}_${random}`;
  }

  generatePromptId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `prompt_${timestamp}_${random}`;
  }
}

export const libraryService = new LibraryService();