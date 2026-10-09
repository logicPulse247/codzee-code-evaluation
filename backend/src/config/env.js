import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or main root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV,
  // Optional: Serper.dev API key for reliable Google search (free tier: 2500 queries/month)
  // Sign up at https://serper.dev — no credit card required for free tier.
  // Without this key the system falls back to DuckDuckGo HTML scraping.
  SERPER_API_KEY: process.env.SERPER_API_KEY || 'b0a942ac102cc55865a51838683ef569a2e3841d',
};
