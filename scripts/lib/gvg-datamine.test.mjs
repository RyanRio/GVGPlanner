import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseGvgDatamine } from './gvg-datamine.mjs';

const repo = fileURLToPath(new URL('../../vendor/pokemas-datamine', import.meta.url));
const source = { path: '2.73/🥊 Pasio Gym Battle No. 4.txt' };
const text = execFileSync('git', ['-C', repo, 'show', `HEAD:${source.path}`], { encoding: 'utf8' });

test('No. 4 maps Sinnoh leaders, stats, effects, and full metadata', () => {
  const result = parseGvgDatamine(text, source);
  assert.deepEqual(result.leaders.map((l) => l.weakness_type), ['Grass', 'Flying', 'Fairy', 'Dragon', 'Dark', 'Fighting', 'Poison', 'Ground']);
  assert.equal(result.leaders[0].battle_2_effect, 'Enfeeble 2');
  assert.equal(result.leaders[6].battle_3_effect, 'Entry: Team Evasiveness ↑ 1');
  assert.equal(result.rounds[0].middle_hp, 500500);
  assert.equal(result.rounds[1].side_offenses, 960);
  assert.equal(result.rounds[14].middle_hp, 64088640);
  assert.equal(result.rounds[29].middle_hp, 64088640);
  assert.equal(result.rounds[29].cumulative_points, 79720000);
  assert.deepEqual(result.tickets.map((t) => [t.seconds, t.syncBuff]), [[90, 0], [180, 2], [270, 5]]);
  assert.equal(result.schedule.find((s) => s.phase === 'Battle').start, '3/10/2026 06:00:00');
  assert.equal(result.tiers[14].leaders[0].rules.length, 3);
  assert.equal(result.tiers[0].leaders[5].units[1].passives.length, 0);
  assert.equal(result.rawText, text);
  assert.match(result.source.sha256, /^[a-f0-9]{64}$/);
});

test('fails closed on incomplete or unrepresentable source', () => {
  assert.throws(() => parseGvgDatamine(text.slice(0, 10000), source));
  assert.throws(() => parseGvgDatamine(text.replace('HP: 500,500', 'HP: 500,501'), source), /leader-specific stats/);
  assert.throws(() => parseGvgDatamine(text.replace('Passive 2: Enfeeble 2', 'Missing passive'), source), /Missing battle effects/);
  assert.throws(() => parseGvgDatamine(text.replace('🆔 Gardenia', '🆔 Changed'), source), /identity/);
  assert.throws(() => parseGvgDatamine(text.replace('🎟️ Ticket x3', 'Ticket three'), source), /ticket/);
});
