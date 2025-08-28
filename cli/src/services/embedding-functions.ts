import { 
  DefaultEmbeddingFunction,
  OllamaEmbeddingFunction,
  OpenAIEmbeddingFunction,
  TransformersEmbeddingFunction,
  CohereEmbeddingFunction
} from 'chromadb';
import { getConfig } from '../utils/config';

/**
 * Get the configured embedding function for ChromaDB
 * Priority order:
 * 1. Config settings
 * 2. Environment variables
 * 3. Default (fallback)
 */
export async function getEmbeddingFunction() {
  // First check config
  try {
    const config = await getConfig();
    const embedConfig = config.chromadb?.embeddings;
    
    if (embedConfig?.provider === 'ollama') {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const model = embedConfig.ollamaModel || 'nomic-embed-text';
      console.log(`Using Ollama embeddings (${model}) at ${ollamaHost}`);
      return new OllamaEmbeddingFunction({
        url: ollamaHost,
        model
      });
    } else if (embedConfig?.provider === 'openai' && process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI embeddings (text-embedding-3-small)');
      return new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY,
        openai_model: "text-embedding-3-small"
      });
    } else if (embedConfig?.provider === 'default') {
      console.log('Using default ChromaDB embeddings (configured)');
      return new DefaultEmbeddingFunction();
    }
  } catch {
    // Config not available, fall through to env vars
  }
  
  // Option 1: OpenAI (best quality for code/technical content)
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI embeddings (text-embedding-3-small)');
    return new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
      openai_model: "text-embedding-3-small" // Good balance of quality/cost
    });
  }
  
  // Option 2: Ollama (local, free, good quality)
  if (process.env.USE_OLLAMA === 'true' || process.env.OLLAMA_HOST) {
    try {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      console.log(`Using Ollama embeddings at ${ollamaHost}`);
      return new OllamaEmbeddingFunction({
        url: ollamaHost,
        model: process.env.OLLAMA_MODEL || 'nomic-embed-text' // Good for technical content
      });
    } catch (error) {
      console.log('Ollama not available, falling back to default');
    }
  }
  
  // Option 3: Cohere (free tier available)
  if (process.env.COHERE_API_KEY) {
    console.log('Using Cohere embeddings');
    return new CohereEmbeddingFunction({
      cohere_api_key: process.env.COHERE_API_KEY,
      model: "embed-english-v3.0"
    });
  }
  
  // Option 4: Local Transformers (runs in Node.js, slower but free)
  if (process.env.USE_LOCAL_EMBEDDINGS === 'true') {
    console.log('Using local Transformers embeddings');
    return new TransformersEmbeddingFunction({
      model: 'Xenova/all-MiniLM-L6-v2' // Smaller, faster model
    });
  }
  
  // Fallback: Default embedding function
  console.log('Using default ChromaDB embeddings');
  return new DefaultEmbeddingFunction();
}

/**
 * Get embedding function for code-specific content
 * Uses models optimized for code understanding
 */
export async function getCodeEmbeddingFunction() {
  if (process.env.OPENAI_API_KEY) {
    // OpenAI's code models understand code context better
    return new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
      openai_model: "text-embedding-3-large" // Better for code
    });
  }
  
  if (process.env.USE_OLLAMA === 'true') {
    // Use a code-specific model if available
    return new OllamaEmbeddingFunction({
      url: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: 'codellama:7b' // Or another code-specific model
    });
  }
  
  // Fallback to general embedding
  return getEmbeddingFunction();
}