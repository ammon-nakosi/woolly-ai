import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { CounselConfig } from '../types';

// Default config location
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.woolly', 'config.json');

// Cached config
let cachedConfig: CounselConfig | null = null;

/**
 * Get the woolly configuration
 * Looks in: ~/.woolly/config.json
 */
export const getConfig = async (): Promise<CounselConfig> => {
  if (cachedConfig) return cachedConfig;
  
  try {
    const configContent = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf-8');
    cachedConfig = JSON.parse(configContent);
    return cachedConfig as CounselConfig;
  } catch (error) {
    // Config doesn't exist, return defaults
    return getDefaultConfig();
  }
};

/**
 * Get default configuration
 */
export const getDefaultConfig = (): CounselConfig => {
  return {
    version: '1.0.0',
    
    // User can set these in ~/.woolly/config.json
    linear: {
      apiKey: process.env.LINEAR_API_KEY || '',
      userEmail: undefined,
      teamId: undefined,
      projectId: undefined,
      userAliases: {}
    },
    
    chromadb: {
      path: path.join(os.homedir(), '.woolly', 'chromadb')
    },
    
    preferences: {
      autoSync: true,
      autoExport: false,
      defaultMode: 'feature'
    },
    
    git: {
      userEmail: undefined,
      userName: undefined
    }
  };
};

/**
 * Save configuration
 */
export const saveConfig = async (config: CounselConfig): Promise<void> => {
  const counselDir = path.dirname(DEFAULT_CONFIG_PATH);
  
  // Ensure directory exists
  await fs.mkdir(counselDir, { recursive: true });
  
  // Write config
  await fs.writeFile(
    DEFAULT_CONFIG_PATH,
    JSON.stringify(config, null, 2)
  );
  
  // Clear cache
  cachedConfig = null;
};

/**
 * Update specific config values
 */
export const updateConfig = async (updates: Partial<CounselConfig>): Promise<void> => {
  const current = await getConfig();
  const updated = mergeConfig(current, updates);
  await saveConfig(updated);
};

/**
 * Merge configs deeply
 */
const mergeConfig = (current: CounselConfig, updates: Partial<CounselConfig>): CounselConfig => {
  return {
    ...current,
    ...updates,
    linear: {
      ...current.linear,
      ...updates.linear
    },
    chromadb: {
      ...current.chromadb,
      ...updates.chromadb
    },
    preferences: {
      ...current.preferences,
      ...updates.preferences
    },
    git: {
      ...current.git,
      ...updates.git
    }
  };
};

/**
 * Initialize config file if it doesn't exist
 */
export const initializeConfig = async (): Promise<void> => {
  try {
    await fs.access(DEFAULT_CONFIG_PATH);
    // Config exists
  } catch {
    // Create default config
    console.log('Creating woolly config at ~/.woolly/config.json');
    
    const defaultConfig = getDefaultConfig();
    
    // Try to detect user email from git
    try {
      const simpleGit = (await import('simple-git')).default;
      const git = simpleGit();
      const email = await git.getConfig('user.email');
      const name = await git.getConfig('user.name');
      
      if (email.value) {
        defaultConfig.git!.userEmail = email.value;
      }
      if (name.value) {
        defaultConfig.git!.userName = name.value;
      }
    } catch {
      // Git not available
    }
    
    await saveConfig(defaultConfig);
    
    console.log(`
Please configure your Linear API key in ~/.woolly/config.json:
{
  "linear": {
    "apiKey": "lin_api_YOUR_KEY_HERE"
  }
}

You can get your API key from: https://linear.app/settings/api
`);
  }
};

/**
 * Get a specific config value
 */
export const getConfigValue = async <T>(path: string): Promise<T | undefined> => {
  const config = await getConfig();
  const parts = path.split('.');
  let value: any = config;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value as T;
};

/**
 * Clear cached config (useful after updates)
 */
export const clearConfigCache = (): void => {
  cachedConfig = null;
};