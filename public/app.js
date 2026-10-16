const $ = id => document.getElementById(id);
const show = (...ids) => ["topicCard","live","manual","busy","result"].forEach(i => $(i).classList.toggle("hidden", !ids.includes(i)));
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
let topic = "", rec, t0, timer, finalText = "", lastAudio = "", lastSpeak = "";

async function loadTopic() {
  const r = await fetch("/api/topic?not=" + encodeURIComponent(topic)); topic = (await r.json()).topic;
  $("topic").textContent = topic;
}
async function health() {
  try {
    const h = await (await fetch("/api/health")).json();
    $("status").textContent = h.mock ? "(demo mode)" : h.ollama.up ? `Model: ${h.model}` : "Model offline";
  } catch {}
}
$("support").textContent = SR ? "Chrome or Edge will transcribe as you speak. Allow the microphone when asked." : "This browser cannot transcribe live. Speak, then type or paste your speech on the next screen.";

$("newTopic").onclick = loadTopic;
$("start").onclick = async () => {
  finalText = ""; $("transcript").textContent = "";
  if (!SR) { show("manual"); return; }
  rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
  rec.onresult = e => {
    let interim = ""; finalText = "";
    for (const r of e.results) (r.isFinal ? (finalText += r[0].transcript + " ") : (interim += r[0].transcript));
    $("transcript").textContent = finalText + interim; $("transcript").scrollTop = 1e6;
  };
  rec.onend = () => { if (timer) try { rec.start(); } catch {} };   // browsers stop on silence; keep going
  rec.onerror = e => { if (e.error === "not-allowed") { clearInterval(timer); timer = null; alert("Microphone blocked. Allow it in the address bar, or use the typed fallback."); show("manual"); } };
  try { rec.start(); } catch {}
  t0 = Date.now(); show("live");
  timer = setInterval(tick, 250); tick();
};
function tick() {
  const s = (Date.now() - t0) / 1000; $("clock").textContent = fmt(s);
  const z = $("zone");
  z.className = "zone " + (s < 60 ? "" : s <= 150 ? "ok" : "bad");
  z.textContent = s < 60 ? "Contest window opens at 1:00" : s <= 150 ? "In the window - land it before 2:30" : "Over 2:30 - stop";
}
$("stop").onclick = () => {
  const secs = (Date.now() - t0) / 1000; clearInterval(timer); timer = null;
  try { rec.stop(); } catch {}
  setTimeout(() => submit(finalText || $("transcript").textContent, secs), 600);
};
$("submitTyped").onclick = () => submit($("typed").value, Number($("typedSecs").value));

async function submit(transcript, seconds) {
  show("busy");
  try {
    const r = await fetch("/api/coach", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ topic, transcript, seconds: Math.round(seconds) }) });
    const j = await r.json();
    if (!r.ok) { alert(j.error || "Something went wrong"); show("topicCard"); return; }
    render(j.feedback); speak(j.speak);
  } catch (e) { alert("Could not reach the coach: " + e.message); show("topicCard"); }
}
const esc = s => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function render(f) {
  show("result");
  $("len").textContent = f.length.label; $("len").className = "len " + (f.length.ok ? "ok" : "bad");
  $("total").textContent = f.scores.total;
  const bar = (n, v, m) => `<div class="bar"><div class="t"><span>${n}</span><span>${v}/${m}</span></div><div class="b"><i style="width:${v/m*100}%"></i></div></div>`;
  $("bars").innerHTML = bar("Content", f.scores.content, 55) + bar("Delivery", f.scores.delivery, 30) + bar("Language", f.scores.language, 15);
  const fil = Object.entries(f.facts.fillers).map(([k,v]) => `${k} x${v}`).join(", ") || "none worth mentioning";
  const n = (h, t) => t ? `<div class="note"><b>${h}</b>${esc(t)}</div>` : "";
  $("notes").innerHTML =
    n("Pace and fillers", `${f.facts.wpm} words per minute (${f.facts.pace}). Fillers: ${fil}.`) +
    n("Content", f.ballot.content) + n("Delivery", f.ballot.delivery) + n("Language", f.ballot.language) +
    n("Audience view", f.audience) + n("Biggest fix", f.biggestFix) + n("One upgrade", f.upgrade);
}
async function speak(text) {
  lastSpeak = text;
  try {
    const r = await fetch("/api/speak", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ text }) });
    if (!r.ok) throw new Error();
    if (lastAudio) URL.revokeObjectURL(lastAudio);
    lastAudio = URL.createObjectURL(await r.blob());
    new Audio(lastAudio).play().catch(() => {});
  } catch {   // no ElevenLabs key or quota: fall back to the browser voice
    if ("speechSynthesis" in window) speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}
$("replay").onclick = () => lastAudio ? new Audio(lastAudio).play() : speak(lastSpeak);
$("again").onclick = async () => { await loadTopic(); show("topicCard"); };
loadTopic(); health();
