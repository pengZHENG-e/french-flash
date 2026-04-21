import type { VocabWord } from "@/data/vocabulary";

export type QuestionType = "mc_fr_en" | "mc_en_fr" | "listen" | "type" | "cloze";

export const QUESTION_LABELS: Record<QuestionType, string> = {
  mc_fr_en: "French → English",
  mc_en_fr: "English → French",
  listen:   "Listen & pick",
  type:     "Type the French",
  cloze:    "Fill in the blank",
};

/**
 * Choose a question type. New words always start with MC fr→en to teach
 * recognition. As repetitions accrue we rotate through harder types.
 */
export function pickType(
  repetitions: number,
  ttsSupported: boolean,
  rng: () => number = Math.random
): QuestionType {
  if (repetitions <= 1) return "mc_fr_en";

  const pool: QuestionType[] = ["mc_fr_en", "mc_en_fr", "cloze"];
  if (ttsSupported) pool.push("listen");
  if (repetitions >= 3) pool.push("type");

  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

export function pickEnglishChoices(correct: VocabWord, all: VocabWord[]): string[] {
  const others = all.filter((w) => w.id !== correct.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...shuffled.map((w) => w.english), correct.english].sort(() => Math.random() - 0.5);
}

export function pickFrenchChoices(correct: VocabWord, all: VocabWord[]): string[] {
  const others = all.filter((w) => w.id !== correct.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...shuffled.map((w) => w.french), correct.french].sort(() => Math.random() - 0.5);
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.,!?;:]+$/g, "");
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export type TypedResult = "correct" | "accent_only" | "wrong";

/**
 * Evaluate typed French input against the target word.
 * "accent_only" means the input matches if we ignore accents —
 * the app can accept it as correct but flag the missing accents.
 */
export function checkTyped(input: string, target: string): TypedResult {
  const ni = normalize(input);
  const nt = normalize(target);
  if (!ni) return "wrong";
  if (ni === nt) return "correct";
  if (stripAccents(ni) === stripAccents(nt)) return "accent_only";
  return "wrong";
}

/**
 * Mask the target word inside an example sentence for cloze questions.
 * Returns null if the word cannot be found verbatim (caller should fall
 * back to another question type).
 *
 * The match is accent- and case-insensitive and respects word boundaries,
 * but the returned `masked` string preserves the original punctuation and
 * only replaces the matched run with an underline placeholder.
 */
export function buildCloze(wordFr: string, exampleFr: string): { masked: string; original: string } | null {
  const targetBare = stripAccents(wordFr.toLowerCase());
  if (!targetBare) return null;

  // Walk tokens, comparing accent-insensitive forms.
  const tokenRe = /[\p{L}\p{M}'’\-]+|[^\p{L}\p{M}'’\-]+/gu;
  const matches = [...exampleFr.matchAll(tokenRe)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const tok = m[0];
    if (!/\p{L}/u.test(tok)) continue;
    if (stripAccents(tok.toLowerCase()) === targetBare) {
      const before = exampleFr.slice(0, m.index!);
      const after = exampleFr.slice(m.index! + tok.length);
      return { masked: before + "____" + after, original: exampleFr };
    }
  }
  return null;
}
