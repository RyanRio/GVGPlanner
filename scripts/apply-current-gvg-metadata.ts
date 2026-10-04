import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { parseGvgDatamine } from './lib/gvg-datamine.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: {
  source: { type: 'string', default: '2.73/🥊 Pasio Gym Battle No. 4.txt' },
  apply: { type: 'boolean', default: false },
  'gym-id': { type: 'string' },
  output: { type: 'string' }
} });
const repo = path.join(root, 'vendor/pokemas-datamine');
const git = (...args: string[]) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trimEnd();
const commit = git('rev-parse', 'HEAD');
// Read the pinned Git object, not a possibly edited working-tree file.
const rawText = execFileSync('git', ['-C', repo, 'show', `${commit}:${values.source}`], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const metadata = parseGvgDatamine(rawText, {
  path: values.source, commit,
  url: `https://github.com/absolutelypm/pokemas-datamine/blob/${commit}/${values.source!.split('/').map(encodeURIComponent).join('/')}`
});
const output = path.resolve(root, values.output ?? 'exports/gvg-datamine-preview.json');
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(metadata, null, 2) + '\n');
console.log(`${metadata.name}: ${metadata.leaders.length} leaders, ${metadata.rounds.length} rounds. Preview: ${output}`);
console.table(metadata.leaders.map((l) => ({ leader: l.leader_name, type: l.boss_type, weakness: l.weakness_type })));
if (values.apply) {
  for (const filename of ['.env.seed.local', '.env.local']) {
    const file = path.join(root, filename);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/);
      if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for --apply');
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  let gymId = values['gym-id'];
  if (!gymId) {
    const { data, error } = await client.from('gyms').select('id').limit(2);
    if (error) throw error;
    if (data.length !== 1) throw new Error('Specify --gym-id when the database does not contain exactly one gym');
    gymId = data[0].id;
  }
  const { data, error } = await client.rpc('import_gvg_datamine', { p_gym_id: gymId, p_metadata: metadata });
  if (error) throw error;
  console.log(`Imported ${metadata.name} (${data}) into ${url}. Current challenge selection preserved.`);
} else {
  console.log('Preview only. Use --apply to import as a separate challenge; choose it as current in the app when ready.');
}
