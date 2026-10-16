// Deterministic delivery facts + ballot clamping. The LLM only judges content/language;
// timing, pace and fillers are measured, not guessed.
const FILLERS = ["um", "uh", "er", "ah", "like", "you know", "basically", "actually", "so", "right", "kind of", "sort of"];
const HARD = new Set(["um", "uh", "er", "ah"]);

export function fmt(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function lengthVerdict(sec) {
  if (sec < 60) return { ok: false, label: `${fmt(sec)} - UNDER 1:00. In a contest this is disqualification.` };
  if (sec > 150) return { ok: false, label: `${fmt(sec)} - OVER 2:30. In a contest this is disqualification.` };
  if (sec < 90) return { ok: true, label: `${fmt(sec)} - legal, but you left time unused. Aim for 1:50-2:20.` };
  if (sec <= 140) return { ok: true, label: `${fmt(sec)} - in the target band.` };
  return { ok: true, label: `${fmt(sec)} - legal but close to the red light. Land the line earlier.` };
}

export function deliveryFacts(transcript, sec) {
  const words = (transcript.toLowerCase().match(/[a-z']+/g) || []);
  const text = " " + words.join(" ") + " ";
  const found = {};
  for (const f of FILLERS) {
    const n = (text.match(new RegExp(` ${f} `, "g")) || []).length;
    if (n && (HARD.has(f) || n >= 3)) found[f] = n;
  }
  const wpm = sec > 0 ? Math.round(words.length / (sec / 60)) : 0;
  const pace = wpm === 0 ? "n/a" : wpm < 110 ? "slow" : wpm > 170 ? "fast" : "good";
  return { wordCount: words.length, wpm, pace, fillers: found };
}

const clamp = (n, max) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));

export function shapeFeedback(raw, transcript, sec) {
  const length = lengthVerdict(sec);
  const facts = deliveryFacts(transcript, sec);
  const content = clamp(raw.content, 55);
  let delivery = clamp(raw.delivery, 30);
  // Measured penalties so the number cannot flatter a rambling or rushed run.
  if (facts.pace === "fast" || facts.pace === "slow") delivery = Math.max(0, delivery - 2);
  const fillerTotal = Object.values(facts.fillers).reduce((a, b) => a + b, 0);
  if (fillerTotal > 8) delivery = Math.max(0, delivery - 2);
  const language = clamp(raw.language, 15);
  const str = v => (typeof v === "string" ? v.trim() : "");
  return {
    length,
    facts,
    scores: { content, delivery, language, total: content + delivery + language },
    ballot: { content: str(raw.content_note), delivery: str(raw.delivery_note), language: str(raw.language_note) },
    audience: str(raw.audience),
    biggestFix: str(raw.biggest_fix),
    upgrade: str(raw.upgrade),
    spoken: str(raw.spoken)
  };
}

export function spokenSummary(fb) {
  if (fb.spoken) return fb.spoken;
  return `${fb.length.label} You scored ${fb.scores.total} out of 100. Biggest fix: ${fb.biggestFix}`;
}
