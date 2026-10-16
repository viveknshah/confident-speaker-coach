# Confident Speaker Coach

Impromptu speaking practice in the browser. Open the link, get a Table Topics prompt, speak for 1-2 minutes, and get scored on the official Toastmasters ballot (Content 55 / Delivery 30 / Language 15) plus an audience-member view. The coach reads the verdict back to you in an ElevenLabs voice.

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

## Run it yourself

Needs Docker.

```bash
cp .env.example .env        # add ELEVENLABS_API_KEY (optional)
docker compose up -d        # starts Ollama, pulls the model, starts the app
# open http://localhost:3000
```

Without Docker: install [Ollama](https://ollama.com), `ollama pull qwen2.5:3b-instruct`, then

```bash
ELEVENLABS_API_KEY=... node server.js     # Node 18+, no npm install needed
```

Try the UI without a model: `COACH_MOCK=1 node server.js` returns canned feedback.

Settings: `OLLAMA_URL`, `OLLAMA_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`, `PORT`, `RATE_PER_MIN`.

Tests: `npm test`.

## Hosting the public demo

The app server is tiny. Ollama needs a host with about 4 GB of RAM for a 3B model (CPU works, about 10-30 s per review; a small GPU is much faster). Keep the ElevenLabs key server-side only; the browser never sees it.

## Limits

- Live transcription depends on the browser (Chrome and Edge work best). Other browsers get the typed fallback.
- Delivery scoring cannot hear tone, gesture or eye contact. It scores what the transcript and timing show.
- A 3B model is a good practice partner, not a certified judge. Treat scores as a trend line.
