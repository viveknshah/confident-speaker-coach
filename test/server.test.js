import test from "node:test";
import assert from "node:assert/strict";
process.env.COACH_MOCK = "1";
const { server } = await import("../server.js");

test("topic and coach endpoints (mock model)", async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const t = await (await fetch(base + "/api/topic")).json();
  assert.ok(t.topic);
  const speech = "When I was twelve I got lost in a market in Amritsar and an auto driver walked me home. ".repeat(3);
  const r = await (await fetch(base + "/api/coach", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ topic: t.topic, transcript: speech, seconds: 125 }) })).json();
  assert.equal(r.feedback.scores.total, r.feedback.scores.content + r.feedback.scores.delivery + r.feedback.scores.language);
  const short = await fetch(base + "/api/coach", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ transcript: "hi", seconds: 5 }) });
  assert.equal(short.status, 400);
  server.close();
});
