import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { pickTopic } from "./topics.js";
import { coachSpeech, ollamaStatus, MODEL } from "./coach.js";
import { spokenSummary } from "./scoring.js";

const PORT = Number(process.env.PORT || 3000);
const PUB = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const EL_KEY = process.env.ELEVENLABS_API_KEY || "";
const EL_VOICE = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb"; // "George"; override with any voice id
const EL_MODEL = process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

// tiny per-IP rate limit so a public demo cannot burn the ElevenLabs quota
const hits = new Map();
const limited = ip => {
  const now = Date.now(), win = 60_000, max = Number(process.env.RATE_PER_MIN || 20);
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
};

const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => {
  let b = ""; req.on("data", c => { b += c; if (b.length > 50_000) { req.destroy(); no(new Error("too large")); } });
  req.on("end", () => { try { ok(JSON.parse(b || "{}")); } catch (e) { no(e); } });
});

export const server = http.createServer(async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "";
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/api/health") {
      const o = await ollamaStatus();
      return json(res, 200, { model: MODEL, ollama: o, elevenlabs: Boolean(EL_KEY), mock: process.env.COACH_MOCK === "1" });
    }
    if (url.pathname === "/api/topic") return json(res, 200, { topic: pickTopic(url.searchParams.get("not") || "") });
    if (req.method === "POST" && url.pathname === "/api/coach") {
      if (limited(ip)) return json(res, 429, { error: "Slow down - try again in a minute." });
      const { topic, transcript, seconds } = await body(req);
      if (!transcript || String(transcript).trim().split(/\s+/).length < 15)
        return json(res, 400, { error: "That was too short to coach. Speak for at least 30 seconds." });
      const fb = await coachSpeech({ topic: String(topic || "").slice(0, 300), transcript: String(transcript), seconds: Number(seconds) || 0 });
      return json(res, 200, { feedback: fb, speak: spokenSummary(fb) });
    }
    if (req.method === "POST" && url.pathname === "/api/speak") {
      if (!EL_KEY) return json(res, 501, { error: "ElevenLabs not configured" });
      if (limited(ip)) return json(res, 429, { error: "Rate limited" });
      const { text } = await body(req);
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}?output_format=mp3_44100_64`, {
        method: "POST",
        headers: { "xi-api-key": EL_KEY, "content-type": "application/json" },
        body: JSON.stringify({ text: String(text || "").slice(0, 700), model_id: EL_MODEL })
      });
      if (!r.ok) return json(res, 502, { error: `ElevenLabs ${r.status}` });
      res.writeHead(200, { "content-type": "audio/mpeg" });
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    // static
    let p = normalize(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^(\.\.[/\\])+/, "");
    const data = await readFile(join(PUB, p));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    if (e.code === "ENOENT") return json(res, 404, { error: "not found" });
    console.error(e);
    json(res, 502, { error: String(e.message || e) });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(PORT, () => console.log(`Coach on :${PORT}`));
