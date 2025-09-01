import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { CounselMode } from '../types';

export interface CounselDocument {
  id: string;
  title: string;
  content: string;
  mode: CounselMode;
  name: string;
  fileName: string;
  filePath: string;
  keywords: string[];
  lastModified: Date;
}

export class FileBasedDocumentParser {
  private counselDir: string;

  constructor() {
    this.counselDir = path.join(os.homedir(), '.counsel');
  }

  /**
   * Scan and parse all counsel documents from file system
   */
  async parseAllDocuments(): Promise<CounselDocument[]> {
    const documents: CounselDocument[] = [];
    const modes: CounselMode[] = ['feature', 'script', 'vibe', 'prompt'];

    for (const mode of modes) {
      const modeDir = path.join(this.counselDir, `${mode}s`);
      
      try {
        const modeDocuments = await this.parseModeDocuments(mode, modeDir);
        documents.push(...modeDocuments);
      } catch (error) {
        // Mode directory doesn't exist, skip it
        continue;
      }
    }

    return documents;
  }

  /**
   * Parse documents for a specific mode
   */
  private async parseModeDocuments(mode: CounselMode, modeDir: string): Promise<CounselDocument[]> {
    const documents: CounselDocument[] = [];
    
    try {
      const counselItems = await fs.readdir(modeDir);
      
      for (const itemName of counselItems) {
        const itemPath = path.join(modeDir, itemName);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          const itemDocuments = await this.parseItemDocuments(mode, itemName, itemPath);
          documents.push(...itemDocuments);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't read, skip
    }

    return documents;
  }

  /**
   * Parse all markdown documents in a counsel work item
   */
  private async parseItemDocuments(mode: CounselMode, itemName: string, itemPath: string): Promise<CounselDocument[]> {
    const documents: CounselDocument[] = [];
    
    try {
      const files = await fs.readdir(itemPath);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      for (const fileName of markdownFiles) {
        const filePath = path.join(itemPath, fileName);
        
        try {
          const document = await this.parseDocument(mode, itemName, fileName, filePath);
          if (document) {
            documents.push(document);
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    } catch (error) {
      // Can't read directory, skip
    }

    return documents;
  }

  /**
   * Parse a single markdown document
   */
  private async parseDocument(mode: CounselMode, itemName: string, fileName: string, filePath: string): Promise<CounselDocument | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stat = await fs.stat(filePath);
      
      // Extract title from first heading or filename
      const title = this.extractTitle(content, fileName);
      
      // Extract keywords from content
      const keywords = this.extractKeywords(content, title);
      
      // Create unique ID
      const id = `${mode}-${itemName}-${fileName.replace('.md', '')}`;
      
      return {
        id,
        title,
        content,
        mode,
        name: itemName,
        fileName,
        filePath,
        keywords,
        lastModified: stat.mtime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract title from markdown content or filename
   */
  private extractTitle(content: string, fileName: string): string {
    // Look for first # heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    
    // Fall back to filename without extension
    return fileName.replace('.md', '').replace(/[-_]/g, ' ');
  }

  /**
   * Extract keywords from content (simplified version from web component)
   */
  private extractKeywords(content: string, title?: string): string[] {
    const text = `${title || ''} ${content}`.toLowerCase();
    
    // Remove code blocks and clean text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
      .replace(/`[^`]*`/g, ' ') // Remove inline code
      .replace(/[^\w\s-]/g, ' ') // Keep hyphens
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(/\s+/).filter(word => word.length > 2);
    
    // Basic stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
      'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'this', 
      'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said',
      'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'
    ]);
    
    // Filter and deduplicate
    const keywords = [...new Set(words.filter(word => 
      !stopWords.has(word) && 
      word.length > 2 && 
      !/^\d+$/.test(word) // Remove pure numbers
    ))];
    
    return keywords;
  }

  /**
   * Get documents modified after a certain date
   */
  async getModifiedDocuments(since: Date): Promise<CounselDocument[]> {
    const allDocuments = await this.parseAllDocuments();
    return allDocuments.filter(doc => doc.lastModified > since);
  }

  /**
   * Check if counsel directory exists
   */
  async counselDirectoryExists(): Promise<boolean> {
    try {
      const stat = await fs.stat(this.counselDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}