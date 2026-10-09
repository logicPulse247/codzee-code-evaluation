import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { repairJson } from './jsonRepair.js';

let genAI = null;
if (env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const llmClient = {
  async generateJSON({ prompt, systemInstruction = '', schemaValidator = null, maxRetries = 3 }) {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '' || env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      logger.warn('[LLM] No valid GEMINI_API_KEY provided. Using rule-based fallback response engine.');
      return null;
    }

    let modelName = 'gemini-2.5-flash';
    try {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          attempt++;
          // Re-create model each attempt so fallback model name takes effect
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction ? `${systemInstruction}\nYou MUST output valid raw JSON only. Do not include markdown headers or commentary.` : 'Output valid raw JSON only.',
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            }
          });
          logger.debug(`[LLM] Requesting Gemini (${modelName}) attempt ${attempt}...`);
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const parsed = repairJson(text);

          if (parsed) {
            if (schemaValidator) {
              const validation = schemaValidator.safeParse(parsed);
              if (validation.success) {
                return validation.data;
              } else {
                logger.warn(`[LLM] Validation failed on attempt ${attempt}:`, validation.error.message);
              }
            } else {
              return parsed;
            }
          }
        } catch (err) {
          logger.warn(`[LLM] Error on attempt ${attempt}:`, err.message);
          if (err.message?.includes('429') || err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED')) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            logger.warn(`[LLM] Rate limited (429). Retrying in ${Math.round(delay)}ms...`);
            await sleep(delay);
          } else {
            // Fall back to previous stable model on non-rate-limit errors
            modelName = 'gemini-2.0-flash';
            await sleep(1000);
          }
        }
      }
    } catch (outerErr) {
      logger.error('[LLM] Failed to initialize/execute Gemini client:', outerErr.message);
    }

    return null; // Signals fallback to heuristic extraction/generation
  }
};
