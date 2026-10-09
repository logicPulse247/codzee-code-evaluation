import { z } from 'zod';
import { llmClient } from '../llm/llmClient.js';
import { flashcardSchema } from '../validation/kitSchemas.js';
import { logger } from '../../utils/logger.js';

const flashcardsResponseSchema = z.object({
  flashcards: z.array(flashcardSchema)
});

export async function generateFlashcards(requirements, questions = []) {
  if (!requirements || requirements.length === 0) {
    return [
      {
        id: 'f1',
        front: 'What are the key technical concepts for this role?',
        back: 'Review core algorithms, design patterns, and framework lifecycle hooks.',
        requirement_ids: [],
        status: 'generated'
      }
    ];
  }

  const prompt = `Generate flashcards for quick active-recall practice based on the following job requirements.

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

INSTRUCTIONS:
1. Every flashcard must have a concise "front" (question/prompt) and clear "back" (answer/key concept).
2. Every flashcard MUST reference relevant requirement IDs in "requirement_ids".
3. Return JSON format:
{
  "flashcards": [
    {
      "id": "f1",
      "front": "What is the key advantage of React Virtual DOM?",
      "back": "Minimizes direct DOM manipulation by computing diffs in memory and batching UI updates.",
      "requirement_ids": ["r1"]
    }
  ]
}`;

  const llmResult = await llmClient.generateJSON({
    prompt,
    systemInstruction: 'You create effective active-recall interview flashcards.',
    schemaValidator: flashcardsResponseSchema
  });

  if (llmResult && llmResult.flashcards && llmResult.flashcards.length > 0) {
    return llmResult.flashcards.map((f, idx) => ({
      ...f,
      id: f.id || `f${idx + 1}`,
      status: 'generated'
    }));
  }

  logger.info('[Stage 8] Using fallback flashcard generator.');
  return fallbackFlashcardGenerator(requirements);
}

export function fallbackFlashcardGenerator(requirements) {
  return requirements.map((req, idx) => ({
    id: `f${idx + 1}`,
    front: `Key Concept: ${req.text}`,
    back: `Demonstrate practical experience, edge-case handling, and best practices regarding ${req.text}.`,
    requirement_ids: [req.id],
    status: 'generated'
  }));
}
