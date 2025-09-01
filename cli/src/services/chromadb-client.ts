import { ChromaClient, Collection, IncludeEnum, DefaultEmbeddingFunction } from 'chromadb';
import { CounselMode } from '../types';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getEmbeddingFunction } from './embedding-functions';

// Configuration
const CHROMADB_CONFIG = {
  host: process.env.CHROMADB_HOST || 'localhost',
  port: parseInt(process.env.CHROMADB_PORT || '8444'),
  persistDir: process.env.CHROMADB_PERSIST_DIR || path.join(os.homedir(), '.counsel', 'chromadb'),
  defaultLimit: parseInt(process.env.DEFAULT_SEARCH_LIMIT || '10'),
  defaultThreshold: parseFloat(process.env.DEFAULT_SIMILARITY_THRESHOLD || '0.7')
};

// Collection names
const COLLECTIONS = {
  DOCUMENTS: 'counsel_documents',
  KNOWLEDGE: 'counsel_knowledge'
};

// File patterns for vectorization with semantic weights
const VECTORIZATION_CONFIG = {
  index: {
    'specs.md': 10,
    'scope_*.md': 9,
    'plan-approved.overview.md': 8,
    'plan-approved.phase-*.md': 7,
    'purpose.md': 10,
    'issue.md': 10,
    'diagnosis.md': 9,
    'fix.md': 9,
    'scope.md': 10,
    'findings.md': 9,
    'recommendations.md': 8,
    'implementation.md': 7,
    'usage.md': 7,
    'notes.md': 5,
    'context.md': 5,
    'investigation.md': 5,
    'decisions.md': 5,
    'test-results.md': 6,
    '*.md': 3  // Catch-all for other markdown
  },
  skip: [
    '*.json',
    '*.log',
    '*.txt',
    '*.tmp',
    '.DS_Store',
    'node_modules/**',
    '.git/**'
  ]
};

// Singleton client instance
let chromaClient: ChromaClient | null = null;
let isConnected = false;

/**
 * Initialize ChromaDB client with retry logic
 */
export const getChromaClient = async (): Promise<ChromaClient> => {
  if (chromaClient && isConnected) {
    return chromaClient;
  }

  try {
    // Try to connect to ChromaDB server
    chromaClient = new ChromaClient({
      path: `http://${CHROMADB_CONFIG.host}:${CHROMADB_CONFIG.port}`
    });
    
    // Test connection
    await chromaClient.heartbeat();
    isConnected = true;
    console.log(`Connected to ChromaDB at ${CHROMADB_CONFIG.host}:${CHROMADB_CONFIG.port}`);
    
  } catch (error) {
    console.log('ChromaDB server not available, using ephemeral client for now');
    console.log(`💡 To fix: Run "counsel chromadb start" or check connection at http://localhost:${CHROMADB_CONFIG.port}`);
    // Fall back to ephemeral client for development
    try {
      chromaClient = new ChromaClient();
      isConnected = true;
    } catch (ephemeralError) {
      console.log('❌ Failed to connect to ChromaDB. Please run "counsel chromadb health" for diagnosis.');
      throw new Error(`ChromaDB unavailable: ${error}. Ephemeral fallback also failed: ${ephemeralError}`);
    }
  }

  return chromaClient;
};

/**
 * Get or create a collection
 */
const getCollection = async (name: string): Promise<Collection> => {
  const client = await getChromaClient();
  const embeddingFunction = await getEmbeddingFunction();
  
  try {
    return await client.getCollection({ 
      name,
      embeddingFunction
    });
  } catch {
    // Collection doesn't exist, create it
    return await client.createCollection({
      name,
      embeddingFunction,
      metadata: { 
        created: new Date().toISOString(),
        version: '2.0'  // Updated for simplified schema
      }
    });
  }
};

/**
 * Get file weight for indexing priority
 */
const getFileWeight = (fileName: string): number => {
  for (const [pattern, weight] of Object.entries(VECTORIZATION_CONFIG.index)) {
    if (pattern.includes('*')) {
      // Convert glob pattern to regex properly
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')    // ** matches anything including /
        .replace(/\*/g, '[^/]*');  // * matches anything except /
      try {
        const regex = new RegExp(regexPattern);
        if (regex.test(fileName)) return weight as number;
      } catch {
        // Invalid regex, skip this pattern
        continue;
      }
    } else if (fileName === pattern) {
      return weight as number;
    }
  }
  return 0; // Don't index by default
};

/**
 * Check if file should be indexed
 */
const shouldIndexFile = (fileName: string): boolean => {
  // Check skip list first
  for (const pattern of VECTORIZATION_CONFIG.skip) {
    if (pattern.includes('*')) {
      // Convert glob pattern to regex properly
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')    // ** matches anything including /
        .replace(/\*/g, '[^/]*');  // * matches anything except /
      try {
        const regex = new RegExp(regexPattern);
        if (regex.test(fileName)) return false;
      } catch {
        // Invalid regex, skip this pattern
        continue;
      }
    } else if (fileName === pattern) {
      return false;
    }
  }
  
  // Check if it has a weight > 0
  return getFileWeight(fileName) > 0;
};


/**
 * Index a document (markdown file content)
 */
export const indexDocument = async (doc: {
  counselWork: string;
  mode: CounselMode;
  fileName: string;
  filePath: string;
  content: string;
  weight?: number;
}) => {
  // Check if file should be indexed
  if (!shouldIndexFile(doc.fileName)) {
    return [];
  }
  
  const collection = await getCollection(COLLECTIONS.DOCUMENTS);
  
  // Get file weight
  const weight = doc.weight || getFileWeight(doc.fileName);
  
  // Chunk large documents
  const chunks = chunkDocument(doc.content);
  const ids = chunks.map(() => uuidv4());
  const timestamp = new Date().toISOString();
  
  const metadatas = chunks.map((chunk, index) => ({
    id: ids[index],
    type: 'document',
    counselWork: doc.counselWork,
    counselMode: doc.mode,
    fileName: doc.fileName,
    filePath: doc.filePath,
    fileType: doc.fileName.replace('.md', '').replace(/_.*/, ''), // Extract type from filename
    semanticWeight: weight,
    chunkIndex: index,
    totalChunks: chunks.length,
    chunkText: chunk.substring(0, 100), // Preview for debugging
    indexed: timestamp,
    fileModified: timestamp
  }));
  
  // Delete old versions of this file
  try {
    const existing = await collection.get({
      where: { filePath: doc.filePath }
    });
    if (existing.ids.length > 0) {
      await collection.delete({ ids: existing.ids });
    }
  } catch {
    // No existing documents
  }
  
  await collection.add({
    ids,
    documents: chunks,
    metadatas
  });
  
  return ids;
};


/**
 * Index reusable knowledge or pattern
 */
export const indexKnowledge = async (knowledge: {
  title: string;
  description: string;
  knowledgeType: 'pattern' | 'solution' | 'gotcha' | 'best-practice' | 'anti-pattern' | 'learning';
  sourceItemId?: string;
  category: string;
  tags?: string[];
  technologies?: string[];
  confidence?: 'low' | 'medium' | 'high';
}) => {
  const collection = await getCollection(COLLECTIONS.KNOWLEDGE);
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  
  await collection.add({
    ids: [id],
    documents: [`${knowledge.title}\n\n${knowledge.description}`],
    metadatas: [{
      id,
      type: 'knowledge',
      knowledgeType: knowledge.knowledgeType,
      sourceItemId: knowledge.sourceItemId || null,
      title: knowledge.title,
      category: knowledge.category,
      tags: knowledge.tags ? JSON.stringify(knowledge.tags) : '[]',
      technologies: knowledge.technologies ? JSON.stringify(knowledge.technologies) : '[]',
      confidence: knowledge.confidence || 'medium',
      usage: 0,
      created: timestamp,
      verified: false
    }]
  });
  
  return id;
};

/**
 * Search across collections
 */
export const search = async (
  query: string,
  options?: {
    type?: 'documents' | 'knowledge' | 'all';
    mode?: CounselMode;
    counselWork?: string;
    limit?: number;
    threshold?: number;
  }
) => {
  const limit = options?.limit || CHROMADB_CONFIG.defaultLimit;
  const threshold = options?.threshold || CHROMADB_CONFIG.defaultThreshold;
  const searchType = options?.type || 'all';
  
  const results: any[] = [];
  
  // Search documents
  if (searchType === 'all' || searchType === 'documents') {
    const where: any = {};
    if (options?.mode) where.counselMode = options.mode;
    if (options?.counselWork) where.counselWork = options.counselWork;
    
    const docResults = await searchCollection(COLLECTIONS.DOCUMENTS, query, {
      where,
      limit: limit * 2  // Get more results to account for chunking
    });
    
    // Apply semantic weighting to results
    const weightedResults = formatResults(docResults, 'documents', threshold).map(result => ({
      ...result,
      similarity: result.similarity * (1 + (result.metadata.semanticWeight || 1) / 20)  // Boost by weight
    }));
    
    results.push(...weightedResults);
  }
  
  // Search knowledge
  if (searchType === 'all' || searchType === 'knowledge') {
    const knowledgeResults = await searchCollection(COLLECTIONS.KNOWLEDGE, query, {
      limit
    });
    results.push(...formatResults(knowledgeResults, 'knowledge', threshold));
  }
  
  // Sort by weighted similarity and limit
  results.sort((a, b) => b.similarity - a.similarity);
  
  // Group by counsel work and deduplicate chunks
  const grouped = new Map();
  results.forEach(result => {
    if (result.type === 'documents' && result.metadata.counselWork) {
      const key = `${result.metadata.counselWork}_${result.metadata.fileName}`;
      if (!grouped.has(key) || grouped.get(key).similarity < result.similarity) {
        grouped.set(key, result);
      }
    } else {
      grouped.set(result.id, result);
    }
  });
  
  return Array.from(grouped.values()).slice(0, limit);
};

/**
 * Find similar knowledge
 */
export const findSimilarKnowledge = async (
  query: string,
  options?: {
    mode?: CounselMode;
    limit?: number;
    threshold?: number;
  }
) => {
  return search(query, { ...options, type: 'knowledge' });
};

/**
 * Find similar documents
 */
export const findSimilarDocuments = async (
  query: string,
  options?: {
    mode?: CounselMode;
    counselWork?: string;
    limit?: number;
    threshold?: number;
  }
) => {
  return search(query, { ...options, type: 'documents' });
};

/**
 * Helper: Search a specific collection
 */
const searchCollection = async (
  collectionName: string,
  query: string,
  options?: {
    where?: any;
    limit?: number;
  }
): Promise<any> => {
  try {
    const collection = await getCollection(collectionName);
    
    const results = await collection.query({
      queryTexts: [query],
      nResults: options?.limit || CHROMADB_CONFIG.defaultLimit,
      where: options?.where,
      include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances]
    });
    
    return results;
  } catch (error) {
    console.error(`Error searching ${collectionName}:`, error);
    console.log('💡 Troubleshooting: Run "counsel chromadb health" to check ChromaDB status');
    return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] };
  }
};

/**
 * Helper: Format search results
 */
const formatResults = (results: any, type: string, threshold: number): any[] => {
  const formatted = [];
  
  for (let i = 0; i < results.ids[0].length; i++) {
    const distance = results.distances?.[0][i] || 0;
    const similarity = 1 - distance;
    
    if (similarity >= threshold) {
      formatted.push({
        id: results.ids[0][i],
        type,
        similarity,
        document: results.documents[0][i],
        metadata: results.metadatas[0][i]
      });
    }
  }
  
  return formatted;
};

/**
 * Helper: Chunk large documents
 */
const chunkDocument = (content: string, chunkSize: number = 1000): string[] => {
  const words = content.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks.length > 0 ? chunks : [content];
};

/**
 * Initialize collections on startup
 */
export const initializeCollections = async () => {
  console.log('Initializing ChromaDB collections...');
  
  try {
    await getCollection(COLLECTIONS.DOCUMENTS);
    await getCollection(COLLECTIONS.KNOWLEDGE);
    
    console.log('ChromaDB collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize ChromaDB collections:', error);
    console.log('💡 This usually means ChromaDB is not running. Try:');
    console.log('   1. counsel chromadb start');
    console.log('   2. counsel chromadb health');
    return false;
  }
};

/**
 * Health check for ChromaDB connection
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const client = await getChromaClient();
    await client.heartbeat();
    return true;
  } catch {
    return false;
  }
};

/**
 * Index a single counsel work item
 */
export const indexCounselWork = async (
  counselPath: string,
  counselName: string,
  mode: CounselMode,
  options?: {
    modified?: boolean;
    force?: boolean;
  }
): Promise<{ filesIndexed: number; skipped: number; errors: string[] }> => {
  const result = { filesIndexed: 0, skipped: 0, errors: [] as string[] };
  
  try {
    const files = await fs.readdir(counselPath);
    
    for (const file of files) {
      if (!shouldIndexFile(file)) {
        result.skipped++;
        continue;
      }
      
      const filePath = path.join(counselPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && file.endsWith('.md')) {
        try {
          // Check if needs indexing
          if (options?.modified && !options?.force) {
            const collection = await getCollection(COLLECTIONS.DOCUMENTS);
            const existing = await collection.get({
              where: { filePath }
            });
            if (existing.ids.length > 0) {
              const metadata = existing.metadatas[0] as any;
              const lastIndexed = new Date(metadata.indexed).getTime();
              if (stat.mtime.getTime() <= lastIndexed) {
                result.skipped++;
                continue;
              }
            }
          }
          
          const content = await fs.readFile(filePath, 'utf-8');
          await indexDocument({
            counselWork: counselName,
            mode,
            fileName: file,
            filePath,
            content
          });
          result.filesIndexed++;
        } catch (error: any) {
          result.errors.push(`${file}: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    result.errors.push(`Failed to read directory: ${error.message}`);
  }
  
  return result;
};

/**
 * Index all counsel work
 */
export const indexAllCounselWork = async (
  force?: boolean,
  mode?: CounselMode
): Promise<{ itemsIndexed: number; filesIndexed: number; errors: string[] }> => {
  const counselBase = path.join(os.homedir(), '.counsel');
  const modes: CounselMode[] = mode ? [mode] : ['feature', 'script', 'vibe', 'prompt'];
  const result = { itemsIndexed: 0, filesIndexed: 0, errors: [] as string[] };
  
  for (const currentMode of modes) {
    const modePath = path.join(counselBase, `${currentMode}s`);
    
    try {
      const items = await fs.readdir(modePath);
      
      for (const itemName of items) {
        const itemPath = path.join(modePath, itemName);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          const indexResult = await indexCounselWork(itemPath, itemName, currentMode, { force });
          if (indexResult.filesIndexed > 0) {
            result.itemsIndexed++;
            result.filesIndexed += indexResult.filesIndexed;
          }
          result.errors.push(...indexResult.errors);
        }
      }
    } catch (error) {
      console.log(`No ${currentMode}s directory found, skipping`);
    }
  }
  
  return result;
};

/**
 * Get indexing statistics
 */
export const getIndexStats = async (): Promise<{
  totalDocuments: number;
  totalItems: number;
  byMode?: Record<string, number>;
  byFileType?: Record<string, number>;
}> => {
  try {
    const collection = await getCollection(COLLECTIONS.DOCUMENTS);
    const allDocs = await collection.get();
    
    const stats = {
      totalDocuments: allDocs.ids.length,
      totalItems: 0,
      byMode: {} as Record<string, number>,
      byFileType: {} as Record<string, number>
    };
    
    const uniqueItems = new Set();
    
    allDocs.metadatas.forEach((metadata: any) => {
      // Count unique counsel work items
      uniqueItems.add(`${metadata.counselMode}_${metadata.counselWork}`);
      
      // Count by mode
      stats.byMode[metadata.counselMode] = (stats.byMode[metadata.counselMode] || 0) + 1;
      
      // Count by file type
      const fileType = metadata.fileType || 'unknown';
      stats.byFileType[fileType] = (stats.byFileType[fileType] || 0) + 1;
    });
    
    stats.totalItems = uniqueItems.size;
    
    return stats;
  } catch (error) {
    return {
      totalDocuments: 0,
      totalItems: 0
    };
  }
};

// Note: indexKnowledge is already exported above