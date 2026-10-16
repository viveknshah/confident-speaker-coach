# Confident Speaker Coach

Impromptu speaking practice in the browser. Open the link, get a Table Topics prompt, speak for 1-2 minutes, and get scored on the official Toastmasters ballot (Content 55 / Delivery 30 / Language 15) plus an audience-member view. The coach reads the verdict back to you - in an ElevenLabs voice if you set a key, otherwise your browser's built-in voice.

**For users: nothing to install.** Open the hosted link, allow the microphone (Chrome or Edge), and speak.

**Who pays:** Toastmasters clubs and speaking coaches, as a monthly club subscription for shared practice and progress tracking. Individuals practise free on a self-hosted copy.

## How it works

| Piece | What it does |
|---|---|
| Browser | Timer with the 1:00-2:30 contest window, live speech-to-text (Web Speech API), typed fallback for other browsers |
| `scoring.js` | Measures length, words per minute and filler words in code, then clamps the model's ballot scores to 55/30/15 |
| `coach.js` | Sends topic + transcript to a local open-weight model through Ollama, asks for strict JSON feedback |
| `server.js` | Zero-dependency Node server: static page, `/api/topic`, `/api/coach`, `/api/speak` (ElevenLabs proxy), rate limit |

Timing, pace and fillers are measured, not guessed by the model. The model judges content, structure and language, and writes the audience view, the single biggest fix and one concrete upgrade.

If no ElevenLabs key is set, or the quota runs out, the app falls back to the browser's built-in voice.

## Quickstart

Check what you have: `docker --version`, `ollama --version`, `node --version`. You need either Docker, or Ollama + Node 18+.

With Docker:

```bash
docker compose up         # starts Ollama, pulls qwen2.5:3b-instruct (~1.9 GB first time), starts the app
# open http://localhost:3000 (Chrome or Edge for the mic)
```

Without Docker: install [Ollama](https://ollama.com), then

```bash
ollama pull qwen2.5:3b-instruct   # or reuse a model you have: OLLAMA_MODEL=gemma3:4b node server.js
node server.js                    # Node 18+, no npm install needed
```

Fully offline after the model pull. Health check: http://localhost:3000/api/health. First feedback takes 10-30 s on CPU - normal.

Try the UI without a model: `COACH_MOCK=1 node server.js` returns canned feedback.

Settings: `OLLAMA_URL`, `OLLAMA_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`, `PORT`, `RATE_PER_MIN`.

Tests: `npm test`.

## Hosting the public demo

The app server is tiny. Ollama needs a host with about 4 GB of RAM for a 3B model (CPU works, about 10-30 s per review; a small GPU is much faster). Keep the ElevenLabs key server-side only; the browser never sees it.

## Limits

- Live transcription depends on the browser (Chrome and Edge work best). Other browsers get the typed fallback.
- Delivery scoring cannot hear tone, gesture or eye contact. It scores what the transcript and timing show.
- A 3B model is a good practice partner, not a certified judge. Treat scores as a trend line.

## Deploy a public demo

- **Any VPS with 4 GB RAM** (Hetzner, DigitalOcean, ~$6-8/mo): clone, `cp .env.example .env`, add your ElevenLabs key, `docker compose up -d`. Put it behind Caddy or nginx for HTTPS. This is the cheapest always-on option.
- **Render**: this repo includes `render.yaml`. New Blueprint instance, paste `ELEVENLABS_API_KEY` when asked. Use a 4 GB plan, or set `OLLAMA_MODEL=qwen2.5:1.5b-instruct` on the 2 GB plan. Free tier is too small for the model.
- **No server?** Record a video demo instead: run `docker compose up` on a laptop, screen-record a full round (topic -> speech -> scored feedback -> spoken verdict).
