"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { VocabWord } from "@/data/vocabulary";
import { LEVEL_RANGES, LEVELS, getLevel, type Level } from "@/data/levels";

type MasteryFilter = "all" | "unseen" | "learning" | "mastered";

const POS_BUCKETS: { key: string; label: string; match: (pos: string) => boolean }[] = [
  { key: "noun",        label: "Nouns",        match: (p) => p.startsWith("noun")   },
  { key: "verb",        label: "Verbs",        match: (p) => p === "verb"           },
  { key: "adjective",   label: "Adjectives",   match: (p) => p === "adjective"      },
  { key: "adverb",      label: "Adverbs",      match: (p) => p === "adverb"         },
  { key: "exclamation", label: "Expressions",  match: (p) => p === "exclamation"    },
];

interface Props {
  words: VocabWord[];
  masteredIds: number[];
  seenIds: number[];
  signedIn: boolean;
}

export default function VocabBrowser({ words, masteredIds, seenIds, signedIn }: Props) {
  const [query, setQuery] = useState("");
  const [levels, setLevels] = useState<Set<Level>>(new Set(LEVELS));
  const [posKeys, setPosKeys] = useState<Set<string>>(new Set(POS_BUCKETS.map((p) => p.key)));
  const [mastery, setMastery] = useState<MasteryFilter>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const masteredSet = useMemo(() => new Set(masteredIds), [masteredIds]);
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (!levels.has(getLevel(w.id, w.level))) return false;

      const bucket = POS_BUCKETS.find((b) => b.match(w.partOfSpeech));
      if (bucket && !posKeys.has(bucket.key)) return false;
      if (!bucket) {
        // fall back: treat unclassified as exclamation bucket
      }

      if (mastery === "mastered" && !masteredSet.has(w.id)) return false;
      if (mastery === "learning" && (!seenSet.has(w.id) || masteredSet.has(w.id))) return false;
      if (mastery === "unseen" && seenSet.has(w.id)) return false;

      if (q) {
        const hay = `${w.french} ${w.english} ${w.explanation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [words, levels, posKeys, mastery, query, masteredSet, seenSet]);

  const toggleLevel = (lvl: Level) => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });
  };
  const togglePos = (k: string) => {
    setPosKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const quizHref = (() => {
    if (filtered.length === 0) return null;
    if (filtered.length > 100) return null; // too many — let user narrow first
    return `/?queue=${filtered.map((w) => w.id).join(",")}`;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            Quiz
          </Link>
          {signedIn && (
            <Link href="/review" className="text-slate-600 hover:text-slate-900">
              Review
            </Link>
          )}
          {signedIn && (
            <Link href="/progress" className="text-blue-600 hover:text-blue-800 font-medium">
              Progress
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Search + action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search French or English..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
          {quizHref ? (
            <Link
              href={quizHref}
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm text-center whitespace-nowrap"
            >
              Quiz these {filtered.length} →
            </Link>
          ) : (
            <span className="px-4 py-3 rounded-xl bg-slate-100 text-slate-400 text-sm text-center whitespace-nowrap">
              {filtered.length > 100 ? "Narrow to ≤100 to quiz" : "Nothing to quiz"}
            </span>
          )}
        </div>

        {/* Level filter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Level</p>
          <div className="flex flex-wrap gap-2">
            {LEVEL_RANGES.map((r) => (
              <button
                key={r.level}
                onClick={() => toggleLevel(r.level)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  levels.has(r.level)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* POS filter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Part of speech
          </p>
          <div className="flex flex-wrap gap-2">
            {POS_BUCKETS.map((p) => (
              <button
                key={p.key}
                onClick={() => togglePos(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  posKeys.has(p.key)
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mastery filter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {(["all", "unseen", "learning", "mastered"] as MasteryFilter[]).map((m) => (
              <button
                key={m}
                onClick={() => setMastery(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                  mastery === m
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {!signedIn && mastery !== "all" && (
            <p className="text-xs text-slate-400 mt-1">
              <Link href="/login" className="text-blue-500 hover:text-blue-700">
                Sign in
              </Link>{" "}
              to filter by learning status.
            </p>
          )}
        </div>

        {/* Results */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            {filtered.length} {filtered.length === 1 ? "word" : "words"}
          </p>
          {filtered.map((w) => {
            const level = getLevel(w.id, w.level);
            const isMastered = masteredSet.has(w.id);
            const isSeen = seenSet.has(w.id);
            const isOpen = expanded === w.id;
            return (
              <div
                key={w.id}
                className={`rounded-xl border transition-all ${
                  isMastered
                    ? "bg-green-50 border-green-200"
                    : isSeen
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">{level}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{w.french}</span>
                      <span className="text-slate-500 text-sm ml-2">{w.english}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isMastered && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Mastered
                      </span>
                    )}
                    {!isMastered && isSeen && (
                      <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Learning
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">{isOpen ? "▾" : "▸"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-mono">/{w.pronunciation}/</span>
                      <span className="uppercase tracking-wider">{w.partOfSpeech}</span>
                    </div>
                    <p className="text-slate-700">{w.explanation}</p>
                    <div className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="italic text-slate-800">&ldquo;{w.example.french}&rdquo;</p>
                      <p className="text-slate-500">&ldquo;{w.example.english}&rdquo;</p>
                    </div>
                    <Link
                      href={`/?queue=${w.id}`}
                      className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Quiz this word →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No words match your filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
