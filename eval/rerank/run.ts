import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPromptSync } from './sync-check';
import { EVAL_CASES } from './fixtures';
import { callRank } from './anthropic-client';
import { scoreResult } from './scoring';
import { printComparisonTable } from './report';
import type { ScoredResult } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODELS = ['claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5-20251001'];
const CONCURRENCY = 4;

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  try {
    checkPromptSync();
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example) before running the eval.',
    );
    process.exit(1);
  }

  console.log(`Running ${MODELS.length} models x ${EVAL_CASES.length} cases = ${MODELS.length * EVAL_CASES.length} calls...`);

  type Job = { model: string; caseId: string };
  const jobs: Job[] = [];
  for (const model of MODELS) {
    for (const evalCase of EVAL_CASES) {
      jobs.push({ model, caseId: evalCase.id });
    }
  }
  const casesById = new Map(EVAL_CASES.map((c) => [c.id, c]));

  const results = await runWithConcurrency(jobs, CONCURRENCY, async ({ model, caseId }) => {
    const evalCase = casesById.get(caseId)!;
    try {
      const outcome = await callRank(model, evalCase.digest, evalCase.candidates);
      return scoreResult(
        evalCase,
        model,
        outcome.ranked,
        outcome.latencyMs,
        outcome.inputTokens,
        outcome.outputTokens,
      );
    } catch (e) {
      console.error(`  failed: model=${model} case=${caseId}: ${String(e)}`);
      return null;
    }
  });

  const scored = results.filter((r): r is ScoredResult => r != null);
  console.log(`\n${scored.length}/${jobs.length} calls succeeded.\n`);

  printComparisonTable(scored);

  const resultsDir = path.resolve(__dirname, 'results');
  mkdirSync(resultsDir, { recursive: true });
  const outPath = path.join(resultsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(outPath, JSON.stringify(scored, null, 2));
  console.log(`\nRaw results written to ${path.relative(process.cwd(), outPath)}`);
}

main();
