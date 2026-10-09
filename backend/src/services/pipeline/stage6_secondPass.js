import { z } from 'zod';
import { checkCoverage } from '../coverage/coverageChecker.js';
import { llmClient } from '../llm/llmClient.js';
import { questionSchema } from '../validation/kitSchemas.js';
import { fallbackQuestionGenerator, deduplicateQuestions } from './stage4_questionGeneration.js';
import { logger } from '../../utils/logger.js';

const secondPassResponseSchema = z.object({
  questions: z.array(questionSchema)
});

const MAX_PASSES = 3;

export async function runSecondPassGeneration(requirements, existingQuestions, companyBrief = {}) {
  let currentQuestions = deduplicateQuestions(existingQuestions);
  let passCount = 1;
  let coverageResult = checkCoverage(requirements, currentQuestions);

  while (!coverageResult.must_satisfied && passCount < MAX_PASSES) {
    passCount++;
    logger.info(`[Second-Pass Generation] Pass ${passCount}: Uncovered must requirements:`, coverageResult.uncovered_must_ids);

    const uncoveredReqs = requirements.filter(r => coverageResult.uncovered_must_ids.includes(r.id));

    const prompt = `The initial question set missed covering some MUST-HAVE job requirements. Generate specific interview questions targeting these uncovered requirements.

UNCOVERED MUST REQUIREMENTS:
${JSON.stringify(uncoveredReqs, null, 2)}

INSTRUCTIONS:
1. Generate at least 1 question per uncovered requirement ID.
2. Every question MUST include the exact requirement ID it covers in "requirement_ids".
3. Return JSON:
{
  "questions": [
    {
      "id": "q_second_${passCount}_1",
      "requirement_ids": ["r2"],
      "category": "technical",
      "prompt": "...",
      "answer_outline": "...",
      "difficulty": 2
    }
  ]
}`;

    const llmResult = await llmClient.generateJSON({
      prompt,
      systemInstruction: 'You generate target interview questions for uncovered mandatory job requirements.',
      schemaValidator: secondPassResponseSchema
    });

    let newQuestions = [];
    if (llmResult && llmResult.questions && llmResult.questions.length > 0) {
      newQuestions = llmResult.questions.map((q, idx) => ({
        ...q,
        id: q.id || `q_pass${passCount}_${idx + 1}`,
        status: 'generated'
      }));
    } else {
      newQuestions = fallbackQuestionGenerator(uncoveredReqs, companyBrief).map((q, idx) => ({
        ...q,
        id: `q_pass${passCount}_${idx + 1}`
      }));
    }

    currentQuestions = deduplicateQuestions([...currentQuestions, ...newQuestions]);
    coverageResult = checkCoverage(requirements, currentQuestions);
  }

  // Final check: if still uncovered musts exist after MAX_PASSES, append deterministic fallback questions to guarantee 100% must-have coverage
  if (!coverageResult.must_satisfied) {
    logger.warn('[Second-Pass Generation] Reached MAX_PASSES. Injecting deterministic fallback questions for remaining uncovered musts.');
    const remainingUncovered = requirements.filter(r => coverageResult.uncovered_must_ids.includes(r.id));
    const deterministicExtra = fallbackQuestionGenerator(remainingUncovered, companyBrief).map((q, idx) => ({
      ...q,
      id: `q_guarantee_${idx + 1}`
    }));
    currentQuestions = deduplicateQuestions([...currentQuestions, ...deterministicExtra]);
    coverageResult = checkCoverage(requirements, currentQuestions);
  }

  return {
    questions: currentQuestions,
    coverage: {
      uncovered_requirement_ids: coverageResult.uncovered_requirement_ids,
      passes: passCount
    }
  };
}
