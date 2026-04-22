"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveLevelTest, type CefrLevel, type LevelTestResult } from "@/app/actions";
import AudioButton from "@/components/AudioButton";

interface Question {
  level: CefrLevel;
  levelLabel: string;
  word_id: number;
  french: string;
  pronunciation: string;
  partOfSpeech: string;
  english: string;
  choices: string[];
}

interface HistoryRow {
  level: string;
  correct: number;
  total: number;
  taken_at: string;
}

type Phase = "intro" | "quiz" | "submitting" | "done";

const LEVEL_META: Record<string, { emoji: string; label: string; desc: string }> = {
  PRE: { emoji: "🌱", label: "Pre-A1", desc: "You're just starting — everyone begins here." },
  A1:  { emoji: "🌱", label: "A1 Beginner", desc: "Basic greetings, numbers, introductions." },
  A2:  { emoji: "📚", label: "A2 Elementary", desc: "Everyday conversations on familiar topics." },
  B1:  { emoji: "💬", label: "B1 Intermediate", desc: "Clear expression on work, school, hobbies." },
  B2:  { emoji: "🎯", label: "B2 Upper-intermediate", desc: "Complex texts and abstract topics." },
  C1:  { emoji: "🏆", label: "C1 Advanced", desc: "Nuanced, spontaneous, fluent expression." },
};

export default function LevelTestClient({
  questions,
  history,
}: {
  questions: Question[];
  history: HistoryRow[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    { word_id: number; level: CefrLevel; correct: boolean }[]
  >([]);
  const [result, setResult] = useState<LevelTestResult | null>(null);

  // Keyboard shortcuts during quiz.
  useEffect(() => {
    if (phase !== "quiz") return;
    const onKey = (e: KeyboardEvent) => {
      if (selected !== null) return;
      const q = questions[idx];
      if (!q) return;
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i >= 0 && i < q.choices.length) {
        e.preventDefault();
        choose(q.choices[i]);
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        // audio button handles the actual speak
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, selected]);

  const current = questions[idx];

  function choose(choice: string) {
    if (selected !== null || !current) return;
    setSelected(choice);
    const correct = choice === current.english;
    const entry = { word_id: current.word_id, level: current.level, correct };
    setAnswers((prev) => [...prev, entry]);

    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        finish([...answers, entry]);
      } else {
        setIdx(idx + 1);
        setSelected(null);
      }
    }, 850);
  }

  async function finish(all: typeof answers) {
    setPhase("submitting");
    const r = await saveLevelTest({ answers: all });
    setResult(r);
    setPhase("done");
    router.refresh();
  }

  if (phase === "intro") {
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 text-center">
          <div className="text-5xl">📝</div>
          <h1 className="text-2xl font-bold text-slate-900">French level test</h1>
          <p className="text-slate-500 text-sm">
            {questions.length} questions across all CEFR levels (A1–C1). No time limit.
            You'll get a level verdict, a per-level accuracy breakdown, and the words
            you answered will seed your review queue.
          </p>
          <button
            onClick={() => setPhase("quiz")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm"
          >
            Start test →
          </button>
          {history.length > 0 && (
            <details className="text-left pt-2">
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-700">
                Past results ({history.length})
              </summary>
              <ul className="mt-2 space-y-1 text-xs">
                {history.map((h, i) => {
                  const meta = LEVEL_META[h.level] ?? LEVEL_META.PRE;
                  return (
                    <li key={i} className="flex items-center justify-between py-1">
                      <span className="text-slate-700">
                        {meta.emoji} {meta.label} · {h.correct}/{h.total}
                      </span>
                      <span className="text-slate-400">
                        {new Date(h.taken_at).toLocaleDateString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "submitting") {
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-slate-500">Scoring…</p>
        </div>
      </Shell>
    );
  }

  if (phase === "done" && result) {
    const meta = LEVEL_META[result.level] ?? LEVEL_META.PRE;
    const ordered: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 text-center">
          <div className="text-6xl">{meta.emoji}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your level</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">{meta.label}</h1>
            <p className="text-sm text-slate-500 mt-1">{meta.desc}</p>
            <p className="text-2xl font-bold text-slate-700 mt-3">
              {result.correct} <span className="text-slate-400 font-normal text-base">/ {result.total} correct</span>
            </p>
          </div>

          <div className="text-left space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Per level</p>
            {ordered.map((lvl) => {
              const s = result.scores[lvl];
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const passing = s.total > 0 && s.correct / s.total >= 0.6;
              return (
                <div key={lvl} className="flex items-center gap-3 text-sm">
                  <span className="w-8 font-semibold text-slate-600">{lvl}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        passing ? "bg-green-500" : s.correct > 0 ? "bg-yellow-400" : "bg-red-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-xs text-slate-500 text-right">
                    {s.correct}/{s.total}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
            We've seeded your review deck: correct answers get a 2-day interval,
            missed ones go into today's queue.
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/vocabulary?tab=due"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm"
            >
              Review missed words →
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-all text-sm"
            >
              Start learning
            </Link>
            <Link
              href="/progress"
              className="text-xs text-slate-400 hover:text-slate-700 py-1"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // Quiz phase
  if (!current) return null;
  const answered = selected !== null;
  const isCorrect = answered && selected === current.english;

  const choiceStyle = (choice: string) => {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200";
    if (!answered)
      return `${base} border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer`;
    if (choice === current.english) return `${base} border-green-500 bg-green-50 text-green-800`;
    if (choice === selected) return `${base} border-red-500 bg-red-50 text-red-800`;
    return `${base} border-slate-200 bg-white text-slate-400`;
  };

  return (
    <Shell>
      <div className="flex items-center gap-1 mb-4">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < idx
                ? answers[i]?.correct
                  ? "bg-green-500"
                  : "bg-red-400"
                : i === idx
                ? "bg-blue-500"
                : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400 text-center mb-3">
        {idx + 1} / {questions.length} · <span className="font-semibold">{current.levelLabel}</span>
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {current.partOfSpeech}
        </p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-4xl font-bold text-slate-900">{current.french}</h2>
          <AudioButton text={current.french} size="md" />
        </div>
        <p className="text-slate-400 text-sm font-mono">/{current.pronunciation}/</p>
      </div>

      <div className="space-y-3">
        {current.choices.map((choice, i) => (
          <button key={i} className={choiceStyle(choice)} onClick={() => choose(choice)}>
            <span className="inline-flex items-center gap-3">
              <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <span className="flex-1">{choice}</span>
              {answered && choice === current.english && <span className="text-green-600">✓</span>}
              {answered && choice === selected && !isCorrect && <span className="text-red-500">✗</span>}
            </span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
        <Link href="/progress" className="text-xs text-slate-400 hover:text-slate-700">
          Exit
        </Link>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
