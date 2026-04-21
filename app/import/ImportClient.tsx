"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { VocabWord } from "@/data/vocabulary";
import { lookupFrenchWord, type LookupResult } from "@/app/actions";

interface Props {
  vocabulary: VocabWord[];
  masteredIds: number[];
  seenIds: number[];
  signedIn: boolean;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalize(s: string): string {
  return stripAccents(s).toLowerCase();
}

const EXAMPLE_TEXT = `Hier soir, j'ai regardé un documentaire sur la transition énergétique. Le paradigme dominant doit évoluer si l'on veut tenir les objectifs climatiques. Franchement, c'est pas évident, mais il faut essayer quand même.`;

interface Token {
  text: string;
  match: VocabWord | null;
}

export default function ImportClient({ vocabulary, masteredIds, seenIds, signedIn }: Props) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lookups, setLookups] = useState<Record<string, LookupResult | "loading" | "error">>({});
  const [activeLookup, setActiveLookup] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const masteredSet = useMemo(() => new Set(masteredIds), [masteredIds]);
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);

  function lookup(raw: string) {
    const key = raw.toLowerCase();
    setActiveLookup(key);
    if (lookups[key] && lookups[key] !== "error") return;
    setLookups((prev) => ({ ...prev, [key]: "loading" }));
    startTransition(async () => {
      const result = await lookupFrenchWord(raw);
      setLookups((prev) => ({ ...prev, [key]: result ?? "error" }));
    });
  }

  const lookupMap = useMemo(() => {
    const m = new Map<string, VocabWord>();
    for (const w of vocabulary) {
      m.set(normalize(w.french), w);
    }
    return m;
  }, [vocabulary]);

  const tokens: Token[] = useMemo(() => {
    if (!submitted) return [];
    const parts = submitted.split(/(\s+|[.,!?;:«»"'(){}\[\]…—–\-])/g);
    return parts
      .filter((s) => s.length > 0)
      .map((part) => {
        if (/^\s+$/.test(part) || /^[.,!?;:«»"'(){}\[\]…—–\-]+$/.test(part)) {
          return { text: part, match: null };
        }
        // Handle apostrophe contractions: "j'ai" → try "ai", "l'homme" → try "homme"
        let candidate = part;
        const apoIdx = Math.max(candidate.indexOf("'"), candidate.indexOf("’"));
        if (apoIdx >= 0 && apoIdx < 3) {
          candidate = candidate.slice(apoIdx + 1);
        }
        const match = lookupMap.get(normalize(candidate)) ?? lookupMap.get(normalize(part)) ?? null;
        return { text: part, match };
      });
  }, [submitted, lookupMap]);

  const uniqueMatches = useMemo(() => {
    const seen = new Set<number>();
    const out: VocabWord[] = [];
    for (const t of tokens) {
      if (t.match && !seen.has(t.match.id)) {
        seen.add(t.match.id);
        out.push(t.match);
      }
    }
    return out;
  }, [tokens]);

  const unseenMatches = uniqueMatches.filter((w) => !seenSet.has(w.id) && !masteredSet.has(w.id));
  const learningMatches = uniqueMatches.filter((w) => seenSet.has(w.id) && !masteredSet.has(w.id));
  const masteredMatches = uniqueMatches.filter((w) => masteredSet.has(w.id));

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllUnseen = () => setSelected(new Set(unseenMatches.map((w) => w.id)));
  const clearSelection = () => setSelected(new Set());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/vocabulary" className="text-slate-600 hover:text-slate-900">Browse</Link>
          {signedIn && <Link href="/review" className="text-slate-600 hover:text-slate-900">Review</Link>}
          {signedIn && <Link href="/progress" className="text-blue-600 hover:text-blue-800 font-medium">Progress</Link>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Import text</h1>
          <p className="text-sm text-slate-500">
            Paste any French text (subtitles, news, lyrics, a message). Known vocab will light up.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste French text here…"
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubmitted(text)}
            disabled={!text.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm"
          >
            Analyze
          </button>
          <button
            onClick={() => {
              setText(EXAMPLE_TEXT);
              setSubmitted(EXAMPLE_TEXT);
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm"
          >
            Try example
          </button>
          {submitted && (
            <button
              onClick={() => {
                setSubmitted("");
                setSelected(new Set());
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {submitted && (
          <>
            {/* Annotated text */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="leading-relaxed text-slate-800">
                {tokens.map((t, i) => {
                  if (t.match) {
                    const isSel = selected.has(t.match.id);
                    const isMastered = masteredSet.has(t.match.id);
                    const isSeen = seenSet.has(t.match.id);
                    const cls = isMastered
                      ? "bg-green-100 text-green-900 border-green-300"
                      : isSeen
                      ? "bg-yellow-100 text-yellow-900 border-yellow-300"
                      : "bg-blue-100 text-blue-900 border-blue-300";
                    return (
                      <button
                        key={i}
                        onClick={() => toggle(t.match!.id)}
                        title={`${t.match.english} · ${t.match.partOfSpeech}`}
                        className={`inline-block mx-0.5 px-1 rounded border transition-all ${cls} ${
                          isSel ? "ring-2 ring-blue-500 ring-offset-1" : ""
                        }`}
                      >
                        {t.text}
                      </button>
                    );
                  }
                  // Unmatched: make word-like tokens clickable for AI lookup.
                  const isWordish = /^[\p{L}\p{M}'’\-]{2,}$/u.test(t.text);
                  if (!isWordish) return <span key={i}>{t.text}</span>;
                  const isActive = activeLookup === t.text.toLowerCase();
                  return (
                    <button
                      key={i}
                      onClick={() => lookup(t.text)}
                      title="Click for AI translation"
                      className={`inline-block mx-0.5 px-0.5 rounded border border-transparent hover:border-slate-300 hover:bg-slate-100 transition-all ${
                        isActive ? "bg-slate-100 border-slate-300" : ""
                      }`}
                    >
                      {t.text}
                    </button>
                  );
                })}
              </p>
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-200 border border-blue-300" /> New</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-200 border border-yellow-300" /> Learning</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-200 border border-green-300" /> Mastered</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-slate-100 border border-slate-300" /> Click = AI lookup</span>
              </div>
            </div>

            {/* AI lookup inline panel */}
            {activeLookup && (
              <LookupPanel
                word={activeLookup}
                state={lookups[activeLookup]}
                onClose={() => setActiveLookup(null)}
              />
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Summary label="Matched" value={uniqueMatches.length} color="slate-600" />
              <Summary label="New" value={unseenMatches.length} color="blue-600" />
              <Summary label="Mastered" value={masteredMatches.length} color="green-600" />
            </div>

            {/* Action */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  Build a quiz from this text
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={selectAllUnseen} className="text-blue-600 hover:text-blue-800 font-medium">
                    Select new ({unseenMatches.length})
                  </button>
                  <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600">
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">Click words in the text above to add. {selected.size} selected.</p>
              {selected.size > 0 && (
                <Link
                  href={`/?queue=${[...selected].join(",")}`}
                  className="block text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                >
                  Quiz {selected.size} selected word{selected.size === 1 ? "" : "s"} →
                </Link>
              )}
            </div>

            {/* Learning + mastered lists for context */}
            {(learningMatches.length + masteredMatches.length > 0) && (
              <div className="space-y-2">
                {learningMatches.length > 0 && (
                  <details className="bg-white rounded-xl border border-slate-100 p-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-yellow-700">
                      Already learning ({learningMatches.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-slate-600 text-xs">
                      {learningMatches.map((w) => (
                        <li key={w.id}><span className="font-semibold text-slate-800">{w.french}</span> — {w.english}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {masteredMatches.length > 0 && (
                  <details className="bg-white rounded-xl border border-slate-100 p-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-green-700">
                      Mastered ({masteredMatches.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-slate-600 text-xs">
                      {masteredMatches.map((w) => (
                        <li key={w.id}><span className="font-semibold text-slate-800">{w.french}</span> — {w.english}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-2xl font-bold text-${color}`}>{value}</p>
    </div>
  );
}

function LookupPanel({
  word,
  state,
  onClose,
}: {
  word: string;
  state: LookupResult | "loading" | "error" | undefined;
  onClose: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI lookup</p>
          <h3 className="text-2xl font-bold text-slate-900">{word}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
      </div>
      {(state === undefined || state === "loading") && (
        <p className="text-sm text-slate-400 italic">Looking up…</p>
      )}
      {state === "error" && (
        <p className="text-sm text-red-500">Could not look up this word.</p>
      )}
      {state && typeof state === "object" && (
        <div className="space-y-1">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{state.english}</span>
            <span className="text-xs text-slate-400 uppercase ml-2">{state.partOfSpeech}</span>
          </p>
          {state.note && <p className="text-xs text-slate-500">{state.note}</p>}
        </div>
      )}
    </div>
  );
}
