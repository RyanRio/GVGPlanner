import assert from "node:assert/strict";
import test from "node:test";
import { displayMoveLevel } from "./move-level.js";

test("displays every Tracker move and superawakening level from preserved raw data", () => {
  for (let index = 0; index < 10; index += 1) {
    const pair = { syncLevel: Math.min(index + 1, 5), rawValue: `${index}|1|0|000|1|0` };
    assert.equal(displayMoveLevel(pair), index + 1);
    assert.equal(pair.syncLevel, Math.min(index + 1, 5));
  }
});

test("uses the stored base level when raw data is missing or invalid", () => {
  for (const rawValue of [undefined, null, "", "|1", "bad|1", "-1|1", "10|1", "9bad|1"]) {
    assert.equal(displayMoveLevel({ syncLevel: 3, rawValue }), 3);
  }
});
