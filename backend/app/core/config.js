import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseFrontendOrigins(originsString) {
  if (!originsString) {
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
  }
  try {
    if (originsString.startsWith('[') && originsString.endsWith(']')) {
      return JSON.parse(originsString);
    }
  } catch {
    // fallback to comma-separated
  }
  return originsString.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function resolveAiDefaults(env) {
  const provider = (env.AI_PROVIDER || '').toLowerCase();
  let defaultBaseUrl = 'https://api.openai.com/v1';
  let defaultModel = 'gpt-4o-mini';

  if (provider === 'groq') {
    defaultBaseUrl = 'https://api.groq.com/openai/v1';
    defaultModel = 'openai/gpt-oss-120b';
  } else if (provider === 'gemini') {
    defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    defaultModel = 'gemini-1.5-flash';
  } else if (provider === 'ollama') {
    defaultBaseUrl = 'http://localhost:11434/v1';
    defaultModel = 'llama3.2';
  }

  return {
    baseUrl: env.AI_BASE_URL || defaultBaseUrl,
    model: env.AI_MODEL || defaultModel
  };
}

const aiDefaults = resolveAiDefaults(process.env);

export const config = {
  APP_ENV: process.env.APP_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  HOST: process.env.HOST || (process.env.PORT || process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  PORT: parseInt(process.env.PORT || '8000', 10),
  FRONTEND_ORIGINS: parseFrontendOrigins(process.env.FRONTEND_ORIGINS),
  AI_PROVIDER: process.env.AI_PROVIDER || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: aiDefaults.model,
  AI_TIMEOUT_SECONDS: parseInt(process.env.AI_TIMEOUT_SECONDS || '30', 10),
  MAX_DRAFT_LENGTH: parseInt(process.env.MAX_DRAFT_LENGTH || '20000', 10),
  AI_BASE_URL: aiDefaults.baseUrl,
  DATA_DIR: path.resolve(__dirname, '../data')
};

export default config;
