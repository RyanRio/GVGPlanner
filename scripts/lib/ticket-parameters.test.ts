import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseGvgDatamine } from "./gvg-datamine.mjs";
import { roundParameter, parameterLegend, parameterLabel } from "./ticket-parameters";

test("No. 4 uses each leader's actual tier rules and final-tier rotation", () => {
  const repo = fileURLToPath(new URL('../../vendor/pokemas-datamine', import.meta.url));
  const source = { path: '2.73/🥊 Pasio Gym Battle No. 4.txt' };
  const text = execFileSync('git', ['-C', repo, 'show', `HEAD:${source.path}`], { encoding: 'utf8' });
  const data = parseGvgDatamine(text, source);
  assert.equal(roundParameter(data, [], 3, 1), "No rules");
  assert.equal(roundParameter(data, [], 4, 1), "Zero physical damage");
  assert.equal(roundParameter(data, [], 4, 2), "Zero special damage");
  assert.equal(roundParameter(data, [], 5, 1), "Zero special damage");
  assert.match(roundParameter(data, [], 7, 1), /zero damage when not super effective/);
  assert.equal(roundParameter(data, [], 15, 1), roundParameter(data, [], 18, 1));
  assert.match(roundParameter(data, [], 16, 1), /^Zero physical damage/);
  const rules = Array.from({ length: 15 }, (_, r) => Array.from({ length: 8 }, (_, s) => roundParameter(data, [], r + 1, s + 1))).flat();
  const legend = parameterLegend(rules);
  assert.equal(legend.length, 4);
  assert.equal(new Set(legend.map((entry) => entry.fill)).size, 4);
  assert.match(parameterLabel("Zero physical damage"), /^Special damage only/);
  assert.match(parameterLabel("Zero special damage"), /^Physical damage only/);
});

test("legacy challenges use the configured cycle; incomplete metadata fails clearly", () => {
  assert.equal(roundParameter(null, ['A', 'B', 'C'], 3, 1), 'No rules');
  assert.equal(roundParameter(null, ['A', 'B', 'C'], 4, 2), 'B');
  assert.equal(roundParameter(null, ['A', 'B', 'C'], 5, 1), 'B');
  assert.throws(() => roundParameter(null, [], 4, 1), /Configure/);
  assert.throws(() => roundParameter({}, [], 4, 1), /missing battle tiers/);
});
