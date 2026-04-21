"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeOnboarding, skipOnboarding, type OnboardingAnswer } from "@/app/actions";
import AudioButton from "@/components/AudioButton";

interface Question {
  level: string;
  levelLabel: string;
  word_id: number;
  french: string;
  pronunciation: string;
  partOfSpeech: string;
  english: string;
  choices: string[];
}

type Phase = "intro" | "quiz" | "done" | "submitting";

export default function OnboardingClient({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);

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
    const a: OnboardingAnswer = { word_id: current.word_id, correct };
    setAnswers((prev) => [...prev, a]);
    // Advance after a short beat.
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setPhase("done");
      } else {
        setIdx(idx + 1);
        setSelected(null);
      }
    }, 900);
  }

  async function finish() {
    setPhase("submitting");
    await completeOnboarding(answers);
    router.replace("/");
    router.refresh();
  }

  async function skip() {
    setPhase("submitting");
    await skipOnboarding();
    router.replace("/");
    router.refresh();
  }

  const correctCount = answers.filter((a) => a.correct).length;

  // --- Intro ---
  if (phase === "intro") {
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 text-center">
          <div className="text-5xl">🎯</div>
          <h1 className="text-2xl font-bold text-slate-900">Quick placement test</h1>
          <p className="text-slate-500 text-sm">
            10 questions across all levels (A1–C1). We'll seed your spaced-repetition
            deck so you start with the right difficulty. Takes 2 minutes.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setPhase("quiz")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm"
            >
              Start test →
            </button>
            <button
              onClick={skip}
              className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm"
            >
              Skip — start from scratch
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // --- Done ---
  if (phase === "done" || phase === "submitting") {
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-slate-900">
            {correctCount} / {questions.length}
          </h1>
          <p className="text-slate-500 text-sm">
            {correctCount} words seeded as familiar.{" "}
            {questions.length - correctCount} went into your review queue to learn.
          </p>
          <div className="grid grid-cols-5 gap-1 pt-2">
            {["A1", "A2", "B1", "B2", "C1"].map((lvl) => {
              const levelAnswers = answers.filter((_, i) => questions[i]?.level === lvl);
              const levelCorrect = levelAnswers.filter((a) => a.correct).length;
              const ok = levelCorrect >= levelAnswers.length - 0;
              return (
                <div key={lvl} className="text-center">
                  <div
                    className={`text-xs font-semibold rounded-full py-1 ${
                      levelCorrect === levelAnswers.length
                        ? "bg-green-100 text-green-700"
                        : levelCorrect > 0
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                    title={`${levelCorrect}/${levelAnswers.length} correct`}
                  >
                    {lvl}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {levelCorrect}/{levelAnswers.length}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={finish}
            disabled={phase === "submitting"}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all text-sm"
          >
            {phase === "submitting" ? "Saving…" : "Start learning →"}
          </button>
        </div>
      </Shell>
    );
  }

  // --- Quiz ---
  if (!current) return null;
  const isCorrect = selected === current.english;

  const choiceStyle = (choice: string) => {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200";
    if (selected === null)
      return `${base} border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer`;
    if (choice === current.english) return `${base} border-green-500 bg-green-50 text-green-800`;
    if (choice === selected) return `${base} border-red-500 bg-red-50 text-red-800`;
    return `${base} border-slate-200 bg-white text-slate-400`;
  };

  return (
    <Shell>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
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
              {selected !== null && choice === current.english && (
                <span className="text-green-600">✓</span>
              )}
              {selected !== null && choice === selected && !isCorrect && (
                <span className="text-red-500">✗</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={skip}
        className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 text-center py-2"
      >
        Skip placement test
      </button>
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
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
