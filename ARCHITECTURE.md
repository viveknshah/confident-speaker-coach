# Architecture note

## Open-source AI is the core
The coaching itself is an open-weight LLM served by Ollama. Remove it and the product is a timer. Everything that makes the feedback useful (ballot scoring, audience-view note, the one fix, the rewritten beat) comes from the model, constrained to a strict JSON schema with `format: "json"`.

## Model choice: qwen2.5:3b-instruct (default)
- Reliable at structured JSON output for its size, which matters because the UI renders the fields directly.
- Small enough for a 4 GB CPU box (about 2 GB on disk), so a club can self-host cheaply.
- Apache-2.0 style open weights; swap with `OLLAMA_MODEL` (for example `gemma3:4b`, `llama3.1:8b` on a GPU) without code changes.

## Why open matters here
- Cost: practice is unlimited. No per-token bill when a club runs 30 members x 10 drills a week.
- Privacy: speeches (often personal stories) stay on infrastructure the club controls. Only the short coach summary leaves, as text to ElevenLabs for the voice.
- No lock-in: the model, prompt and scoring rules are in the repo and replaceable.

## Division of labour
- Measured in code: length verdict (1:00-2:30 contest rule), words per minute, filler counts, score clamping to 55/30/15.
- Judged by the model: content, structure, language, audience view, fix, upgrade.
This keeps the number honest even when a small model is generous.

## ElevenLabs
`/api/speak` proxies text to ElevenLabs text-to-speech so the key never reaches the browser. The coach reads a 3-sentence spoken verdict. Browser speech synthesis is the fallback.

## Zero setup for users
Hosted web app. Mic capture and live transcription run in the browser (Web Speech API), so no install, no API key, no model download for the end user.
