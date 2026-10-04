import assert from "node:assert/strict";
import test from "node:test";
import { addImportantPair, removeImportantPair, inDamageCategory, importantPairLabel } from "../../src/lib/important-pairs";
import type { CatalogPair, ImportantPair } from "../../src/types";

const pair: CatalogPair = {
  pairId: "test-pair", label: "Mixed attacker", trainerName: "Trainer", trainerAlt: "", pokemonName: "Pokemon",
  pokemonForm: "", roleCategory: "tech", roleLabel: "Tech", exRoleCategory: "", exRoleLabel: "",
  type: "Normal", region: "", acquisition: "", premiumCategory: "general"
};

test("legacy selections remain visible and can be classified", () => {
  assert.ok(inDamageCategory(pair, "unclassified"));
  assert.equal(importantPairLabel(pair), "Mixed attacker (Unclassified)");
  const classified = addImportantPair([pair], pair, "special");
  assert.equal(classified.length, 1);
  assert.equal(classified[0].damageCategory, "special");
  assert.ok(!inDamageCategory(classified[0], "unclassified"));
});

test("mixed attackers occupy both inputs but count only once", () => {
  let pairs: ImportantPair[] = addImportantPair([], pair, "physical");
  pairs = addImportantPair(pairs, pair, "physical");
  assert.equal(pairs.length, 1);
  pairs = addImportantPair(pairs, pair, "special");
  assert.equal(pairs.length, 1);
  assert.ok(inDamageCategory(pairs[0], "physical"));
  assert.ok(inDamageCategory(pairs[0], "special"));
  assert.equal(importantPairLabel(pairs[0]), "Mixed attacker (Physical + Special)");
  const remaining = removeImportantPair(pairs, pair.pairId, "physical");
  assert.equal(remaining[0].damageCategory, "special");
  assert.equal(pairs[0].damageCategory, "both");
  assert.deepEqual(removeImportantPair(remaining, pair.pairId, "special"), []);
});

test("Sub DPS stays distinct from primary damage categories", () => {
  const pairs = addImportantPair([pair], pair, "sub_dps");
  assert.equal(importantPairLabel(pairs[0]), "Mixed attacker (Sub DPS)");
  assert.ok(inDamageCategory(pairs[0], "sub_dps"));
  assert.ok(!inDamageCategory(pairs[0], "physical"));
  assert.ok(!inDamageCategory(pairs[0], "special"));
  assert.equal(addImportantPair(pairs, pair, "sub_dps").length, 1);
  assert.equal(addImportantPair(pairs, pair, "physical")[0].damageCategory, "physical");
  assert.equal(addImportantPair([{ ...pair, damageCategory: "both" }], pair, "sub_dps")[0].damageCategory, "sub_dps");
  assert.deepEqual(removeImportantPair(pairs, pair.pairId, "sub_dps"), []);
});
