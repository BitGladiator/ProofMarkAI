import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseFrontendOrigins(originsString) {
  if (!originsString) {
    return ['http://localhost:5173', 'http://localhost:3000'];
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

export const config = {
  APP_ENV: process.env.APP_ENV || 'development',
  HOST: process.env.HOST || '127.0.0.1',
  PORT: parseInt(process.env.PORT || '8000', 10),
  FRONTEND_ORIGINS: parseFrontendOrigins(process.env.FRONTEND_ORIGINS),
  AI_PROVIDER: process.env.AI_PROVIDER || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || '',
  AI_TIMEOUT_SECONDS: parseInt(process.env.AI_TIMEOUT_SECONDS || '30', 10),
  MAX_DRAFT_LENGTH: parseInt(process.env.MAX_DRAFT_LENGTH || '20000', 10),
  AI_BASE_URL: process.env.AI_BASE_URL || '',
  DATA_DIR: path.resolve(__dirname, '../data')
};

export default config;
