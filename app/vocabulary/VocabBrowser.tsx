"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { VocabWord } from "@/data/vocabulary";
import { LEVEL_RANGES, LEVELS, getLevel, type Level } from "@/data/levels";
import AudioButton from "@/components/AudioButton";
import ConjugationBox from "@/components/ConjugationBox";

type MasteryFilter = "all" | "unseen" | "learning" | "mastered";
type Tab = "all" | "due" | "mistakes";

const POS_BUCKETS: { key: string; label: string; match: (pos: string) => boolean }[] = [
  { key: "noun",        label: "Nouns",       match: (p) => p.startsWith("noun")   },
  { key: "verb",        label: "Verbs",       match: (p) => p === "verb"           },
  { key: "adjective",   label: "Adjectives",  match: (p) => p === "adjective"      },
  { key: "adverb",      label: "Adverbs",     match: (p) => p === "adverb"         },
  { key: "exclamation", label: "Expressions", match: (p) => p === "exclamation"    },
];

interface Props {
  words: VocabWord[];
  masteredIds: number[];
  seenIds: number[];
  dueIds: number[];
  wrongWords: { word_id: number; wrong_count: number; correct_count: number }[];
  signedIn: boolean;
  initialTab: Tab;
}

export default function VocabBrowser({
  words,
  masteredIds,
  seenIds,
  dueIds,
  wrongWords,
  signedIn,
  initialTab,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const wordById = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const masteredSet = useMemo(() => new Set(masteredIds), [masteredIds]);
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);

  const dueWords = dueIds.map((id) => wordById.get(id)).filter(Boolean) as VocabWord[];
  const wrongList = wrongWords
    .map((w) => ({ word: wordById.get(w.word_id), wrong: w.wrong_count, correct: w.correct_count }))
    .filter((r) => r.word) as { word: VocabWord; wrong: number; correct: number }[];

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
      {/* Tabs */}
      <nav className="flex items-center gap-1 bg-white/70 backdrop-blur rounded-xl border border-slate-200 p-1">
        <TabButton active={tab === "all"} onClick={() => setTab("all")} label="All words" count={words.length} />
        {signedIn && (
          <>
            <TabButton active={tab === "due"} onClick={() => setTab("due")} label="Due today" count={dueWords.length} highlight={dueWords.length > 0} />
            <TabButton active={tab === "mistakes"} onClick={() => setTab("mistakes")} label="Mistakes" count={wrongList.length} />
          </>
        )}
      </nav>

      {tab === "all" && (
        <AllTab words={words} masteredSet={masteredSet} seenSet={seenSet} signedIn={signedIn} />
      )}
      {tab === "due" && signedIn && <DueTab words={dueWords} />}
      {tab === "mistakes" && signedIn && <MistakesTab items={wrongList} />}
    </div>
  );
}

function TabButton({ active, onClick, label, count, highlight }: { active: boolean; onClick: () => void; label: string; count: number; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : highlight
          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {label}
      <span className={`ml-1.5 text-xs ${active ? "opacity-80" : "opacity-60"}`}>{count}</span>
    </button>
  );
}

// --- ALL TAB ---------------------------------------------------------------

function AllTab({ words, masteredSet, seenSet, signedIn }: {
  words: VocabWord[];
  masteredSet: Set<number>;
  seenSet: Set<number>;
  signedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [levels, setLevels] = useState<Set<Level>>(new Set(LEVELS));
  const [posKeys, setPosKeys] = useState<Set<string>>(new Set(POS_BUCKETS.map((p) => p.key)));
  const [mastery, setMastery] = useState<MasteryFilter>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (!levels.has(getLevel(w.id, w.level))) return false;

      const bucket = POS_BUCKETS.find((b) => b.match(w.partOfSpeech));
      if (bucket && !posKeys.has(bucket.key)) return false;

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
      next.has(lvl) ? next.delete(lvl) : next.add(lvl);
      return next;
    });
  };
  const togglePos = (k: string) => {
    setPosKeys((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const quizHref =
    filtered.length === 0 || filtered.length > 100
      ? null
      : `/?queue=${filtered.map((w) => w.id).join(",")}`;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search French or English..."
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        />
        {quizHref ? (
          <Link href={quizHref} className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm text-center whitespace-nowrap">
            Quiz these {filtered.length} →
          </Link>
        ) : (
          <span className="px-4 py-3 rounded-xl bg-slate-100 text-slate-400 text-sm text-center whitespace-nowrap">
            {filtered.length > 100 ? "Narrow to ≤100 to quiz" : "Nothing to quiz"}
          </span>
        )}
      </div>

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

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Part of speech</p>
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
            <Link href="/login" className="text-blue-500 hover:text-blue-700">Sign in</Link> to filter by status.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400">
          {filtered.length} {filtered.length === 1 ? "word" : "words"}
        </p>
        {filtered.map((w) => (
          <WordRow
            key={w.id}
            word={w}
            isMastered={masteredSet.has(w.id)}
            isSeen={seenSet.has(w.id)}
            isOpen={expanded === w.id}
            onToggle={() => setExpanded(expanded === w.id ? null : w.id)}
            signedIn={signedIn}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No words match your filters.</div>
        )}
      </div>
    </>
  );
}

// --- DUE TAB ---------------------------------------------------------------

function DueTab({ words }: { words: VocabWord[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center space-y-3">
        <p className="text-sm text-slate-500">Spaced-repetition queue</p>
        <p className="text-3xl font-bold text-slate-900">
          {words.length} word{words.length === 1 ? "" : "s"}{" "}
          <span className="text-slate-400 font-normal text-base">ready</span>
        </p>
        {words.length > 0 ? (
          <Link
            href="/?mode=due"
            className="inline-block px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
          >
            Start review →
          </Link>
        ) : (
          <p className="text-slate-400 text-sm">Nothing due right now. Check back later ✨</p>
        )}
      </div>

      {words.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Queue</p>
          {words.slice(0, 30).map((w) => (
            <WordRow
              key={w.id}
              word={w}
              isMastered={false}
              isSeen
              isOpen={expanded === w.id}
              onToggle={() => setExpanded(expanded === w.id ? null : w.id)}
              signedIn
            />
          ))}
          {words.length > 30 && (
            <p className="text-xs text-slate-400 text-center py-2">+ {words.length - 30} more in queue</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- MISTAKES TAB ----------------------------------------------------------

function MistakesTab({ items }: { items: { word: VocabWord; wrong: number; correct: number }[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center space-y-3">
        <p className="text-sm text-slate-500">Words you've missed recently</p>
        <p className="text-3xl font-bold text-slate-900">
          {items.length} word{items.length === 1 ? "" : "s"}
        </p>
        {items.length > 0 ? (
          <Link
            href="/?mode=wrong"
            className="inline-block px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
          >
            Practice mistakes →
          </Link>
        ) : (
          <p className="text-slate-400 text-sm">No mistakes tracked yet.</p>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(({ word, wrong, correct }) => (
            <div key={word.id}>
              <WordRow
                word={word}
                isMastered={false}
                isSeen
                isOpen={expanded === word.id}
                onToggle={() => setExpanded(expanded === word.id ? null : word.id)}
                signedIn
                meta={
                  <span className="text-xs text-red-500">
                    {wrong}✗ · {correct}✓
                  </span>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Shared row ------------------------------------------------------------

function WordRow({
  word,
  isMastered,
  isSeen,
  isOpen,
  onToggle,
  signedIn,
  meta,
}: {
  word: VocabWord;
  isMastered: boolean;
  isSeen: boolean;
  isOpen: boolean;
  onToggle: () => void;
  signedIn: boolean;
  meta?: React.ReactNode;
}) {
  const level = getLevel(word.id, word.level);
  return (
    <div
      className={`rounded-xl border transition-all ${
        isMastered
          ? "bg-green-50 border-green-200"
          : isSeen
          ? "bg-yellow-50 border-yellow-200"
          : "bg-white border-slate-200"
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">{level}</span>
          <div className="min-w-0">
            <span className="font-semibold text-slate-900">{word.french}</span>
            <span className="text-slate-500 text-sm ml-2">{word.english}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {meta}
          {isMastered && !meta && (
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              Mastered
            </span>
          )}
          {!isMastered && isSeen && !meta && (
            <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Learning</span>
          )}
          <span className="text-slate-400 text-xs">{isOpen ? "▾" : "▸"}</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">/{word.pronunciation}/</span>
            <span className="uppercase tracking-wider">{word.partOfSpeech}</span>
            <AudioButton text={word.french} size="sm" />
          </div>
          <p className="text-slate-700">{word.explanation}</p>
          <div className="bg-white rounded-lg p-2 border border-slate-200">
            <div className="flex items-start gap-2">
              <p className="italic text-slate-800 flex-1">&ldquo;{word.example.french}&rdquo;</p>
              <AudioButton text={word.example.french} size="sm" />
            </div>
            <p className="text-slate-500">&ldquo;{word.example.english}&rdquo;</p>
          </div>
          {word.partOfSpeech === "verb" && signedIn && (
            <div className="pt-1"><ConjugationBox wordId={word.id} /></div>
          )}
          <Link href={`/?queue=${word.id}`} className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-800">
            Quiz this word →
          </Link>
        </div>
      )}
    </div>
  );
}
