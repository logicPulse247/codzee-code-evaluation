import fs from 'fs/promises';
import path from 'path';
import { runKitPipeline } from '../services/pipeline/kitPipeline.js';
import { logger } from '../utils/logger.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let inputPath = 'eval_inputs.json';
  let outputPath = 'eval_outputs.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    }
  }

  return { inputPath, outputPath };
}

async function main() {
  const { inputPath, outputPath } = parseArgs();

  console.log(`\n🚀 Starting Batch Evaluation CLI`);
  console.log(`Input File:  ${inputPath}`);
  console.log(`Output File: ${outputPath}\n`);

  try {
    const rawData = await fs.readFile(path.resolve(inputPath), 'utf-8');
    const cases = JSON.parse(rawData);

    if (!Array.isArray(cases) || cases.length === 0) {
      console.error('Error: Input file must contain a non-empty array of test cases.');
      process.exit(1);
    }

    const results = [];

    for (let i = 0; i < cases.length; i++) {
      const testCase = cases[i];
      const caseId = testCase.id || `case-${i + 1}`;
      console.log(`--------------------------------------------------`);
      console.log(`[Case ${i + 1}/${cases.length}] Processing: ${caseId} (${testCase.company_url || 'No URL'})`);

      const kit = await runKitPipeline({
        jd: testCase.jd || '',
        companyUrl: testCase.company_url || '',
        days: testCase.days || 5,
        onProgress: async (stage, message) => {
          console.log(`  [${caseId}] [${stage}] ${message}`);
        }
      });

      results.push({
        case_id: caseId,
        input: testCase,
        generated_kit: kit
      });

      console.log(`✅ [Case ${i + 1}/${cases.length}] Successfully generated kit for ${caseId}\n`);
    }

    await fs.writeFile(path.resolve(outputPath), JSON.stringify(results, null, 2), 'utf-8');

    console.log(`==================================================`);
    console.log(`🎉 Batch evaluation completed successfully!`);
    console.log(`Saved ${results.length} kits to ${outputPath}\n`);
  } catch (error) {
    console.error(`❌ Batch evaluation failed:`, error.message);
    process.exit(1);
  }
}

main();
