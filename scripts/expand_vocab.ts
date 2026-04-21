#!/usr/bin/env bun
/**
 * Vocab expansion via Claude API.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... bun scripts/expand_vocab.ts --level A2 --count 100
 *   ANTHROPIC_API_KEY=sk-ant-... bun scripts/expand_vocab.ts --level B1 --count 50 --theme "daily life"
 *
 * Flags:
 *   --level A1|A2|B1|B2|C1      CEFR level to generate (required)
 *   --count N                    How many words to add (default 50)
 *   --theme "..."                Optional semantic theme
 *   --batch N                    Words per API call (default 25)
 *   --model MODEL                Override model (default claude-haiku-4-5)
 *
 * Output: merges new entries into data/vocabulary_generated.ts, skipping any
 * french words that already exist (in either the hand-curated array or the
 * generated file). Safe to re-run — accumulates over time.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type Seed = {
  french: string;
  pronunciation: string;
  english: string;
  partOfSpeech: string;
  example: { french: string; english: string };
  explanation: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
};

// --- CLI ------------------------------------------------------------------

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return def;
  return process.argv[i + 1];
}

const level = arg("level") as Seed["level"] | undefined;
const count = Number(arg("count", "50"));
const theme = arg("theme");
const batch = Math.min(Number(arg("batch", "25")), 30);
const model = arg("model", "claude-haiku-4-5")!;

if (!level || !["A1", "A2", "B1", "B2", "C1"].includes(level)) {
  console.error("Missing or invalid --level. Use A1|A2|B1|B2|C1.");
  process.exit(1);
}
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is required.");
  process.exit(1);
}

// --- Read existing vocab ---------------------------------------------------

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vocabFile = resolve(ROOT, "data/vocabulary.ts");
const genFile = resolve(ROOT, "data/vocabulary_generated.ts");

const vocabText = readFileSync(vocabFile, "utf-8");
const existingFrench = new Set<string>();
for (const m of vocabText.matchAll(/^\s*french:\s*"([^"]+)"/gm)) {
  existingFrench.add(m[1].toLowerCase());
}

let generated: Seed[] = [];
if (existsSync(genFile)) {
  const genText = readFileSync(genFile, "utf-8");
  // Try to eval the embedded JSON array. We look for the first `[` after
  // the `generatedSeed` export and parse until the matching `]`.
  const m = genText.match(/generatedSeed\s*:\s*VocabSeed\[\]\s*=\s*(\[[\s\S]*\]);/m);
  if (m) {
    try {
      // This file contains TS with comments; use a safe eval trick.
      // Wrap in a function to strip trailing semicolons / comments.
      generated = JSON.parse(
        m[1]
          .replace(/\/\/.*$/gm, "")
          .replace(/,\s*([\]}])/g, "$1")
      );
    } catch {
      console.warn("Could not parse existing vocabulary_generated.ts; will overwrite.");
    }
  }
}
for (const g of generated) existingFrench.add(g.french.toLowerCase());

// --- Claude call -----------------------------------------------------------

async function callClaude(n: number): Promise<Seed[]> {
  const exclude = [...existingFrench].slice(0, 400).join(", ");
  const themeClause = theme ? ` focused on the theme "${theme}"` : "";

  const prompt = `You are curating a subtitle-frequency French vocabulary deck for English-speaking learners.

Generate EXACTLY ${n} new high-frequency French words at CEFR level ${level}${themeClause}. Pick words that appear often in French TV subtitles and natural conversation.

CRITICAL: avoid any of these already-present words:
${exclude}

For each word, return a JSON object with EXACTLY these fields:
- french: string (lowercase, dictionary form; include accents)
- pronunciation: string (IPA without slashes, e.g. "bɔ̃.ʒuʁ")
- english: string (concise 1–6 word gloss with brief sense disambiguation in parens if needed)
- partOfSpeech: one of "noun (m)", "noun (f)", "verb", "adjective", "adverb", "exclamation", "preposition", "conjunction", "pronoun"
- example: { french: "...", english: "..." } — a natural sentence using the word verbatim
- explanation: 2–3 sentences: register, common collocations, learner pitfalls
- level: "${level}"

Return ONLY a JSON array of exactly ${n} objects. No prose, no markdown fences.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";

  // Extract the JSON array (strip any accidental prose).
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) throw new Error(`No JSON array in response: ${text.slice(0, 200)}`);
  const json = text.slice(start, end + 1);

  const parsed = JSON.parse(json) as Seed[];
  return parsed.filter((s) => s && s.french && s.english && s.example?.french);
}

// --- Main loop -------------------------------------------------------------

const newSeeds: Seed[] = [];
let remaining = count;
let batchIdx = 0;

while (remaining > 0) {
  batchIdx++;
  const n = Math.min(batch, remaining);
  console.log(`Batch ${batchIdx}: requesting ${n} words at ${level}${theme ? ` (${theme})` : ""}…`);
  try {
    const seeds = await callClaude(n);
    let added = 0;
    for (const s of seeds) {
      const key = s.french.toLowerCase();
      if (existingFrench.has(key)) continue;
      existingFrench.add(key);
      newSeeds.push(s);
      added++;
    }
    console.log(`  → ${added} unique new entries (${seeds.length - added} skipped as dupes)`);
    remaining -= added;
    if (added === 0 && seeds.length > 0) {
      console.log("  Model is returning only duplicates; stopping early.");
      break;
    }
  } catch (e) {
    console.error(`  Batch failed: ${(e as Error).message}`);
    break;
  }
}

// --- Write output ---------------------------------------------------------

const finalArray = [...generated, ...newSeeds];

const body = finalArray
  .map((s) => {
    const esc = (x: string) => JSON.stringify(x);
    return `  {
    french: ${esc(s.french)},
    pronunciation: ${esc(s.pronunciation)},
    english: ${esc(s.english)},
    partOfSpeech: ${esc(s.partOfSpeech)},
    example: {
      french: ${esc(s.example.french)},
      english: ${esc(s.example.english)},
    },
    explanation: ${esc(s.explanation)},
    level: ${esc(s.level)},
  }`;
  })
  .join(",\n");

const out = `// Auto-appended by scripts/expand_vocab.ts.
// Do not edit by hand — re-run the script to regenerate.
import type { VocabSeed } from "./vocabulary";

export const generatedSeed: VocabSeed[] = [
${body}${finalArray.length ? "," : ""}
];
`;

writeFileSync(genFile, out, "utf-8");
console.log(`\nDone. ${newSeeds.length} new entries written. Total generated: ${finalArray.length}.`);
console.log(`File: ${genFile}`);
