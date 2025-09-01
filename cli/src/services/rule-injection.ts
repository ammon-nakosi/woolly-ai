import * as fs from 'fs/promises';
import * as path from 'path';
import { Rule, RuleDisplay } from '../types/library';
import { libraryService } from './library-service';

const RULE_HEADER = `# Counsel Project Rules

This file contains project-specific rules managed by the Counsel Framework.
Each rule is managed programmatically - do not edit manually.

**Rule Types:**
- \`coding-practices\` - Approaches, patterns, standards
- \`code-snippet\` - Actual reusable code fragments
- \`workaround\` - Problem-solving fixes
- \`config\` - Settings, commands, dependencies
- \`reference\` - Links, contacts, documentation
- \`guideline\` - Directives ("do this", "don't do that")
- \`general-note\` - Miscellaneous important info

**Management:** Use \`counsel rule\` commands to modify rules

---

`;

const SESSION_HEADER = `# Counsel Session Rules

This file contains temporary session-specific rules.
These rules will be cleared when the counsel session ends.

---

`;

export class RuleInjectionService {
  private renderFullRule(rule: Rule): string {
    let content = `## ${rule.title}\n\n`;
    content += `${rule.summary}\n\n`;
    
    if (rule.details) {
      content += `${rule.details}\n\n`;
    }
    
    return content;
  }

  private renderSummaryRule(rule: Rule): string {
    return `## ${rule.title}\n\n${rule.summary}\n\n`;
  }

  private renderRule(rule: Rule): string {
    if (rule.display === 'hidden') {
      return '';
    }
    
    if (rule.display === 'summary') {
      return this.renderSummaryRule(rule);
    }
    
    return this.renderFullRule(rule);
  }

  async generateProjectRulesFile(projectPath: string): Promise<void> {
    const claudeDir = path.join(projectPath, '.claude');
    const rulesFile = path.join(claudeDir, 'counsel-project-rules.md');
    
    // Ensure .claude directory exists
    await fs.mkdir(claudeDir, { recursive: true });
    
    // Get all active project rules for this repo
    const rules = await libraryService.listRules({
      scope: 'project',
      status: 'active',
      repoPath: projectPath
    });
    
    // Build the content
    let content = RULE_HEADER;
    
    for (const rule of rules) {
      const rendered = this.renderRule(rule);
      if (rendered) {
        content += rendered;
      }
    }
    
    // Write the file
    await fs.writeFile(rulesFile, content, 'utf-8');
  }

  async generateSessionRulesFile(projectPath: string): Promise<void> {
    const claudeDir = path.join(projectPath, '.claude');
    const rulesFile = path.join(claudeDir, 'counsel-session-rules.md');
    
    // Ensure .claude directory exists
    await fs.mkdir(claudeDir, { recursive: true });
    
    // Get all active session rules
    const rules = await libraryService.listRules({
      scope: 'session',
      status: 'active'
    });
    
    // Build the content
    let content = SESSION_HEADER;
    
    for (const rule of rules) {
      const rendered = this.renderRule(rule);
      if (rendered) {
        content += rendered;
      }
    }
    
    // Write the file
    await fs.writeFile(rulesFile, content, 'utf-8');
    
    // Ensure it's in .gitignore
    await this.ensureGitignored(projectPath, '.claude/counsel-session-rules.md');
  }

  async ensureGitignored(projectPath: string, pattern: string): Promise<void> {
    const gitignorePath = path.join(projectPath, '.gitignore');
    
    try {
      const content = await fs.readFile(gitignorePath, 'utf-8');
      
      // Check if pattern already exists
      if (content.includes(pattern)) {
        return;
      }
      
      // Add pattern to .gitignore
      const newContent = content.trimEnd() + '\n\n# Counsel session rules (temporary)\n' + pattern + '\n';
      await fs.writeFile(gitignorePath, newContent, 'utf-8');
    } catch (error) {
      // .gitignore doesn't exist, create it
      const content = `# Counsel session rules (temporary)\n${pattern}\n`;
      await fs.writeFile(gitignorePath, content, 'utf-8');
    }
  }

  async ensureClaudeImports(projectPath: string): Promise<void> {
    const claudeMdPath = path.join(projectPath, '.claude', 'CLAUDE.md');
    
    try {
      let content = await fs.readFile(claudeMdPath, 'utf-8');
      
      // Check if imports already exist
      if (content.includes('@.claude/counsel-project-rules.md')) {
        return;
      }
      
      // Add imports section
      const imports = `\n# Counsel Rules\n@.claude/counsel-project-rules.md\n@.claude/counsel-session-rules.md\n`;
      
      content = content.trimEnd() + '\n' + imports;
      await fs.writeFile(claudeMdPath, content, 'utf-8');
    } catch (error) {
      // CLAUDE.md doesn't exist, create it with imports
      const content = `# Project Configuration

This file contains project-specific configuration for Claude Code.

# Counsel Rules
@.claude/counsel-project-rules.md
@.claude/counsel-session-rules.md
`;
      
      const claudeDir = path.join(projectPath, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(claudeMdPath, content, 'utf-8');
    }
  }

  async refreshRules(projectPath: string): Promise<void> {
    // Generate both rule files
    await this.generateProjectRulesFile(projectPath);
    await this.generateSessionRulesFile(projectPath);
    
    // Ensure imports are in CLAUDE.md
    await this.ensureClaudeImports(projectPath);
  }

  async clearSessionRules(projectPath: string, projectName?: string): Promise<void> {
    const rulesFile = path.join(projectPath, '.claude', 'counsel-session-rules.md');
    
    try {
      if (projectName) {
        // Mark all session rules for this project as inactive
        const projectRules = await libraryService.listRules({
          scope: 'session',
          status: 'active',
          projectName: projectName
        });
        
        for (const rule of projectRules) {
          await libraryService.updateRule(rule.id, { status: 'inactive' });
        }
        
        // Get all remaining active session rules (from other projects)
        const remainingRules = await libraryService.listRules({
          scope: 'session',
          status: 'active',
          excludeProjectName: projectName
        });
        
        // Rebuild the file with remaining rules
        let content = SESSION_HEADER;
        
        for (const rule of remainingRules) {
          const rendered = this.renderRule(rule);
          if (rendered) {
            content += rendered;
          }
        }
        
        await fs.writeFile(rulesFile, content, 'utf-8');
      } else {
        // Legacy behavior - clear all session rules
        await fs.writeFile(rulesFile, SESSION_HEADER, 'utf-8');
      }
    } catch {
      // File doesn't exist, that's fine
    }
  }

  async hasRules(projectPath: string): Promise<boolean> {
    const projectRules = await libraryService.listRules({
      scope: 'project',
      repoPath: projectPath
    });
    
    const sessionRules = await libraryService.listRules({
      scope: 'session'
    });
    
    return projectRules.length > 0 || sessionRules.length > 0;
  }
}

export const ruleInjectionService = new RuleInjectionService();