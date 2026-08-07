/**
 * Drift tripwire for `eval/rerank/prompt.ts`. Reads the edge function's
 * source as text, pulls out its SYSTEM/SCHEMA literals, and asserts they
 * match the duplicated copies here — so a prompt edit in production fails
 * this loudly instead of the eval harness silently scoring a stale prompt.
 *
 * This intentionally re-parses the *source text* of the edge function rather
 * than importing it (it's Deno code) — `new Function` is used to evaluate
 * the extracted literal, which is safe here because the input is this
 * repo's own trusted source file, not external/user input.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SYSTEM, SCHEMA } from './prompt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDGE_FN_PATH = path.resolve(__dirname, '../../supabase/functions/hoppr-rank/index.ts');

function evalLiteral(source: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(`'use strict'; return (${source});`)();
}

export function checkPromptSync(): void {
  const src = readFileSync(EDGE_FN_PATH, 'utf8');

  const systemMatch = src.match(/const SYSTEM =\n([\s\S]*?);\n/);
  if (!systemMatch) {
    throw new Error(`sync-check: could not find "const SYSTEM = ...;" in ${EDGE_FN_PATH}`);
  }
  const edgeSystem = evalLiteral(systemMatch[1]);
  if (edgeSystem !== SYSTEM) {
    throw new Error(
      'sync-check: SYSTEM prompt in eval/rerank/prompt.ts has drifted from ' +
        'supabase/functions/hoppr-rank/index.ts. Update the copy in prompt.ts to match.',
    );
  }

  const schemaMatch = src.match(/const SCHEMA = (\{[\s\S]*?\n\};)/);
  if (!schemaMatch) {
    throw new Error(`sync-check: could not find "const SCHEMA = {...};" in ${EDGE_FN_PATH}`);
  }
  const edgeSchema = evalLiteral(schemaMatch[1].slice(0, -1)); // strip trailing ';'
  if (JSON.stringify(edgeSchema) !== JSON.stringify(SCHEMA)) {
    throw new Error(
      'sync-check: SCHEMA in eval/rerank/prompt.ts has drifted from ' +
        'supabase/functions/hoppr-rank/index.ts. Update the copy in prompt.ts to match.',
    );
  }
}
