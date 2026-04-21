// Thin wrapper around the browser speechSynthesis API.
// Auto-picks a French voice when available; graceful no-op when not.

const LANG = "fr-FR";

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    cachedVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  // Prefer native French voices; fall back to any fr-* voice.
  const exact = voices.find((v) => v.lang === LANG);
  const any = exact ?? voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
  cachedVoice = any ?? null;
  return cachedVoice;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, opts: { rate?: number } = {}) {
  if (!ttsSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // stop overlapping utterances

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = LANG;
  utter.rate = opts.rate ?? 0.95;
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

// Voices load asynchronously in Chrome; prewarm on mount so the first tap is quick.
export function prewarmVoices() {
  if (!ttsSupported()) return;
  const synth = window.speechSynthesis;
  // Trigger initial load
  synth.getVoices();
  synth.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
    pickVoice();
  });
}
