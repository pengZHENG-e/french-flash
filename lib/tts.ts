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

/** True only if the browser actually has a French voice loaded. */
export function hasFrenchVoice(): boolean {
  return ttsSupported() && pickVoice() !== null;
}

/**
 * Speak text. Resolves to `true` if utterance actually started, `false` on
 * any failure (no voice, blocked autoplay, error, never starts within 700ms).
 */
export function speak(text: string, opts: { rate?: number } = {}): Promise<boolean> {
  if (!ttsSupported() || !text.trim()) return Promise.resolve(false);
  const synth = window.speechSynthesis;
  synth.cancel(); // stop overlapping utterances

  return new Promise<boolean>((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG;
    utter.rate = opts.rate ?? 0.95;
    const voice = pickVoice();
    if (voice) utter.voice = voice;

    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    utter.onstart = () => settle(true);
    utter.onerror = () => settle(false);
    utter.onend = () => settle(true);
    setTimeout(() => settle(false), 700);
    try {
      synth.speak(utter);
    } catch {
      settle(false);
    }
  });
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
