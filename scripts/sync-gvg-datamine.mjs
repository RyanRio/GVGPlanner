import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = path.join(root, 'vendor/pokemas-datamine');
const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'inherit' });
if (process.argv.slice(2).some((arg) => arg !== '--latest')) throw new Error('Usage: npm run datamine:sync -- [--latest]');
git('submodule', 'init', 'vendor/pokemas-datamine');
if (!existsSync(path.join(repo, '.git'))) {
  mkdirSync(path.dirname(repo), { recursive: true });
  git('clone', '--no-checkout', 'https://github.com/absolutelypm/pokemas-datamine.git', repo);
  git('submodule', 'absorbgitdirs', 'vendor/pokemas-datamine');
}
// The upstream tree contains colon/pipe filenames. Only materialize Gym Battle files.
git('-C', repo, 'config', 'core.protectNTFS', 'false');
git('-C', repo, 'sparse-checkout', 'set', '--no-cone', '**/*Pasio Gym Battle*');
git('submodule', 'update', '--init', ...(process.argv.includes('--latest') ? ['--remote'] : []), 'vendor/pokemas-datamine');
git('-C', repo, 'read-tree', '-mu', 'HEAD');
