import test from "node:test";
import assert from "node:assert/strict";
import { lengthVerdict, deliveryFacts, shapeFeedback } from "../scoring.js";

test("length bands match contest rules", () => {
  assert.equal(lengthVerdict(59).ok, false);
  assert.equal(lengthVerdict(60).ok, true);
  assert.equal(lengthVerdict(150).ok, true);
  assert.equal(lengthVerdict(151).ok, false);
});
test("fillers and pace are measured", () => {
  const f = deliveryFacts("um so I went um to the market and uh bought apples", 30);
  assert.equal(f.fillers.um, 2); assert.equal(f.fillers.uh, 1);
  assert.ok(f.wpm > 0);
});
test("scores are clamped to ballot weights", () => {
  const fb = shapeFeedback({ content: 99, delivery: 99, language: 99 }, "word ".repeat(250), 120);
  assert.equal(fb.scores.content, 55); assert.ok(fb.scores.total <= 100);
});
