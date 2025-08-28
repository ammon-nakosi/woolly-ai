import fs from 'fs/promises';
import path from 'path';

export type CounselMode = 'feature' | 'script' | 'debug' | 'review' | 'vibe';

export interface FileItem {
  name: string;
  isDirectory: boolean;
}

export interface CounselProject {
  name: string;
  mode: CounselMode;
  path: string;
  created: Date;
  modified: Date;
  files: string[];  // Keep for backward compatibility
  fileItems?: FileItem[];  // New detailed file/directory info
  metadata?: {
    status?: string;
    description?: string;
  };
}

export interface PlanStatus {
  project?: string | {
    name: string;
    description: string;
    totalPhases: number;
    createdAt: string;
    lastUpdated: string;
  };
  description?: string;
  totalPhases?: number;
  createdAt?: string;
  lastUpdated?: string;
  phases?: Array<{
    phaseNumber: number;
    title: string;
    status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'partially-completed' | 'to-do';
    description: string;
    duration?: string;
    checklist?: Array<{
      id: string;
      category: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'to-do' | 'partially-completed';
      priority: 'low' | 'medium' | 'high';
    }>;
  }>;
  // Legacy format support
  items?: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'done' | 'blocked';
    description?: string;
    dependencies?: string[];
  }>;
}

const MODE_DIRS: Record<CounselMode, string> = {
  feature: 'features',
  script: 'scripts',
  debug: 'debugs',
  review: 'reviews',
  vibe: 'vibes'
};

export async function getCounselProjects(projectRoot: string): Promise<CounselProject[]> {
  const projects: CounselProject[] = [];

  for (const [mode, dirName] of Object.entries(MODE_DIRS)) {
    const modePath = path.join(projectRoot, dirName);
    
    try {
      const stat = await fs.stat(modePath);
      if (!stat.isDirectory()) continue;
      
      const entries = await fs.readdir(modePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const projectPath = path.join(modePath, entry.name);
        const projectStat = await fs.stat(projectPath);
        
        const files = await fs.readdir(projectPath);
        
        const project: CounselProject = {
          name: entry.name,
          mode: mode as CounselMode,
          path: projectPath,
          created: projectStat.birthtime,
          modified: projectStat.mtime,
          files,
          metadata: await getProjectMetadata(projectPath, mode as CounselMode)
        };
        
        projects.push(project);
      }
    } catch (error) {
      // Directory doesn't exist, skip
      continue;
    }
  }

  return projects;
}

export async function getProject(projectRoot: string, mode: CounselMode, name: string): Promise<CounselProject | null> {
  const projectPath = path.join(projectRoot, MODE_DIRS[mode], name);
  
  try {
    const stat = await fs.stat(projectPath);
    if (!stat.isDirectory()) return null;
    
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    const files = entries.map(e => e.name);
    const fileItems = entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory()
    }));
    
    return {
      name,
      mode,
      path: projectPath,
      created: stat.birthtime,
      modified: stat.mtime,
      files,
      fileItems,
      metadata: await getProjectMetadata(projectPath, mode)
    };
  } catch (error) {
    return null;
  }
}

async function getProjectMetadata(projectPath: string, mode: CounselMode) {
  const metadata: any = {};
  
  try {
    // Check for plan-approved.plan-status.json (features)
    if (mode === 'feature') {
      const planStatusPath = path.join(projectPath, 'plan-approved.plan-status.json');
      try {
        const content = await fs.readFile(planStatusPath, 'utf-8');
        const planStatus = JSON.parse(content);
        metadata.status = planStatus.status || 'planning';
        metadata.planItems = planStatus.items?.length || 0;
      } catch {}
    }
    
    // Check for common description files
    const descFiles = ['requirements.md', 'purpose.md', 'issue.md', 'scope.md', 'context.md'];
    for (const file of descFiles) {
      try {
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
        // Get first non-empty line after header
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        if (lines.length > 0) {
          metadata.description = lines[0].substring(0, 100);
          break;
        }
      } catch {}
    }
  } catch {}
  
  return metadata;
}

export async function getFileContent(projectPath: string, fileName: string): Promise<string | null> {
  try {
    const filePath = path.join(projectPath, fileName);
    const stat = await fs.stat(filePath);
    
    // If it's a directory, return a listing of its contents
    if (stat.isDirectory()) {
      const entries = await fs.readdir(filePath, { withFileTypes: true });
      const listing = entries.map(e => {
        const type = e.isDirectory() ? '📁' : '📄';
        return `${type} ${e.name}`;
      }).join('\n');
      return `Directory contents:\n\n${listing}`;
    }
    
    // If it's a file, return its content
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

export async function getPlanStatus(projectPath: string): Promise<PlanStatus | null> {
  try {
    const content = await fs.readFile(path.join(projectPath, 'plan-approved.plan-status.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function updatePlanStatus(projectPath: string, planStatus: PlanStatus): Promise<void> {
  const filePath = path.join(projectPath, 'plan-approved.plan-status.json');
  await fs.writeFile(filePath, JSON.stringify(planStatus, null, 2), 'utf-8');
}

export async function updateFileContent(projectPath: string, fileName: string, content: string): Promise<void> {
  const filePath = path.join(projectPath, fileName);
  await fs.writeFile(filePath, content, 'utf-8');
}