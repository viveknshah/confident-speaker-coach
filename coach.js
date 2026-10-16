import { shapeFeedback } from "./scoring.js";

export const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
export const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct";

const SYSTEM = `You are a blunt, warm Toastmasters Table Topics coach and contest judge.
Score the speech transcript on the official ballot: content (0-55), delivery (0-30), language (0-15).
Content = did it answer THE TOPIC, structure (opening, body, close), a specific story or example, a clear ending.
Delivery = what can be inferred from the transcript: pacing of ideas, repetition, trailing off. Timing and filler counts are measured separately; do not invent them.
Language = word choice, grammar, vivid and concrete phrasing.
Be honest. Most good practice speeches score 70-82 in total. Do not give everyone high marks.
Also act as an audience member: which line would land, where would attention sag.
Quote the speaker's own words when you praise or criticise. No generic advice.
Reply with ONLY a JSON object with these keys:
content, delivery, language (numbers), content_note, delivery_note, language_note (one sentence each),
audience (2 sentences, audience view), biggest_fix (one concrete sentence), upgrade (one concrete rewritten beat or line),
spoken (3 short sentences to read aloud: the verdict, the line that landed, the one fix).`;

export async function coachSpeech({ topic, transcript, seconds }) {
  if (process.env.COACH_MOCK === "1") return shapeFeedback(mock(transcript), transcript, seconds);
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS || 120000)),
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: "json",
      options: { temperature: 0.3 },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Topic: ${topic}\nSpeaking time: ${seconds} seconds\nTranscript:\n"""${transcript.slice(0, 6000)}"""` }
      ]
    })
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  let raw;
  try { raw = JSON.parse(data.message.content); } catch { throw new Error("Model did not return valid JSON"); }
  return shapeFeedback(raw, transcript, seconds);
}

function mock(t) {
  const first = t.split(/[.!?]/)[0].slice(0, 80);
  return {
    content: 42, delivery: 23, language: 11,
    content_note: `You opened with "${first}" - clear, but the close needs to circle back to it.`,
    delivery_note: "Ideas arrive in a steady order.", language_note: "Mostly concrete; trim the hedging words.",
    audience: "The room leans in at your first specific detail. Attention sags in the middle when the point repeats.",
    biggest_fix: "End on your strongest line and stop talking.",
    upgrade: "Open with the scene, then name the lesson in one sentence at the end.",
    spoken: "Solid run. Your opening line landed. Land your last line and stop."
  };
}

export async function ollamaStatus() {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const j = await r.json();
    return { up: true, hasModel: (j.models || []).some(m => m.name === MODEL || m.name.startsWith(MODEL.split(":")[0] + ":" + (MODEL.split(":")[1] || ""))) };
  } catch { return { up: false, hasModel: false }; }
}
