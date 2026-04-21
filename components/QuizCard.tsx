"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { vocabulary, getRandomChoices, VocabWord } from "@/data/vocabulary";
import { createClient } from "@/lib/supabase/client";
import { reviewWord, markWordMastered, signOut, type ReviewResult } from "@/app/actions";
import { QUALITY, type Quality } from "@/lib/srs";
import type { User } from "@supabase/supabase-js";

type AnswerState = "unanswered" | "correct" | "wrong";

export interface QuizStats {
  current_streak: number;
  longest_streak: number;
  daily_goal: number;
  today_count: number;
}

interface QuizCardProps {
  initialQueue?: number[] | null;
  queueLabel?: string | null;
  initialStats?: QuizStats | null;
}

const MASTERED_LS_KEY = "french_mastered_ids";

function getLocalMastered(): Set<number> {
  try {
    const raw = localStorage.getItem(MASTERED_LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLocalMastered(ids: Set<number>) {
  localStorage.setItem(MASTERED_LS_KEY, JSON.stringify([...ids]));
}

const RATING_OPTIONS: { quality: Quality; label: string; sub: string; key: string; cls: string }[] = [
  { quality: QUALITY.Again, label: "Again",  sub: "<10m",  key: "1", cls: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
  { quality: QUALITY.Hard,  label: "Hard",   sub: "short", key: "2", cls: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { quality: QUALITY.Good,  label: "Good",   sub: "keep",  key: "3", cls: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
  { quality: QUALITY.Easy,  label: "Easy",   sub: "long",  key: "4", cls: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" },
];

export default function QuizCard({ initialQueue, queueLabel, initialStats }: QuizCardProps) {
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showExample, setShowExample] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(initialStats ?? null);
  const [rating, setRating] = useState(false);
  const [queueIdx, setQueueIdx] = useState(0);
  const [queueDone, setQueueDone] = useState(false);

  // Lookup table for queue mode.
  const vocabById = useRef<Map<number, VocabWord>>(new Map());
  useEffect(() => {
    vocabById.current = new Map(vocabulary.map((w) => [w.id, w]));
  }, []);

  // Auth state + mastered-IDs bootstrap.
  useEffect(() => {
    const supabase = createClient();

    async function init(userId: string | undefined) {
      if (userId) {
        const { data } = await supabase
          .from("word_progress")
          .select("word_id")
          .eq("user_id", userId)
          .eq("mastered", true);
        setMasteredIds(new Set(data?.map((r) => r.word_id) ?? []));
      } else {
        setMasteredIds(getLocalMastered());
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      init(data.user?.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      init(session?.user?.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const pickRandom = useCallback(
    (currentMasteredIds: Set<number>): VocabWord | null => {
      let available = vocabulary.filter(
        (w) => !currentMasteredIds.has(w.id) && !usedIds.has(w.id)
      );
      if (available.length === 0) {
        available = vocabulary.filter((w) => !currentMasteredIds.has(w.id));
        setUsedIds(new Set());
        if (available.length === 0) available = vocabulary;
      }
      return available[Math.floor(Math.random() * available.length)] ?? null;
    },
    [usedIds]
  );

  const loadNewWord = useCallback(
    (currentMasteredIds?: Set<number>, advanceQueue = true) => {
      const excluded = currentMasteredIds ?? masteredIds;
      let word: VocabWord | null = null;

      if (initialQueue && initialQueue.length > 0) {
        const nextIdx = advanceQueue ? queueIdx + 1 : queueIdx;
        if (nextIdx >= initialQueue.length) {
          setQueueDone(true);
          return;
        }
        const id = initialQueue[nextIdx];
        word = vocabById.current.get(id) ?? null;
        setQueueIdx(nextIdx);
      } else {
        word = pickRandom(excluded);
      }

      if (!word) {
        setQueueDone(true);
        return;
      }

      setCurrentWord(word);
      setChoices(getRandomChoices(word, vocabulary));
      setSelected(null);
      setAnswerState("unanswered");
      setShowExample(false);
      setReviewResult(null);
      setUsedIds((prev) => new Set([...prev, word!.id]));
    },
    [masteredIds, initialQueue, queueIdx, pickRandom]
  );

  // Load first word once mastered set is ready.
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    if (initialQueue && initialQueue.length === 0) {
      setQueueDone(true);
      return;
    }

    // First word of queue (or random).
    if (initialQueue && initialQueue.length > 0) {
      const id = initialQueue[0];
      const word = vocabById.current.get(id) ?? null;
      if (word) {
        setCurrentWord(word);
        setChoices(getRandomChoices(word, vocabulary));
        setQueueIdx(0);
      }
    } else {
      loadNewWord(masteredIds, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masteredIds]);

  const handleSelect = useCallback(
    (choice: string) => {
      if (answerState !== "unanswered" || !currentWord) return;
      setSelected(choice);
      const isCorrect = choice === currentWord.english;

      if (isCorrect) {
        setAnswerState("correct");
        setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      } else {
        setAnswerState("wrong");
        setScore((s) => ({ ...s, total: s.total + 1 }));
      }
    },
    [answerState, currentWord]
  );

  const handleRate = useCallback(
    async (quality: Quality) => {
      if (!currentWord || rating) return;
      setRating(true);

      if (user) {
        const result = await reviewWord(currentWord.id, quality);
        if (result) {
          setReviewResult(result);
          if (result.stats) {
            setStats({
              current_streak: result.stats.current_streak,
              longest_streak: Math.max(result.stats.current_streak, stats?.longest_streak ?? 0),
              daily_goal: result.stats.daily_goal,
              today_count: result.stats.today_count,
            });
          }
          if (result.mastered) {
            setMasteredIds((prev) => new Set([...prev, currentWord.id]));
          }
        }
      }

      setRating(false);
      loadNewWord();
    },
    [currentWord, user, rating, stats, loadNewWord]
  );

  const handleMarkMastered = useCallback(async () => {
    if (!currentWord) return;
    const newMastered = new Set([...masteredIds, currentWord.id]);
    setMasteredIds(newMastered);

    if (user) {
      await markWordMastered(currentWord.id);
    } else {
      saveLocalMastered(newMastered);
    }

    loadNewWord(newMastered);
  }, [currentWord, masteredIds, user, loadNewWord]);

  const handleGuestNext = useCallback(() => {
    loadNewWord();
  }, [loadNewWord]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Question phase: 1/2/3/4 selects a choice.
      if (answerState === "unanswered" && choices.length) {
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx >= 0 && idx < choices.length) {
          e.preventDefault();
          handleSelect(choices[idx]);
          return;
        }
        if (e.key.toLowerCase() === "m") {
          e.preventDefault();
          handleMarkMastered();
        }
        return;
      }

      // Answered phase.
      if (user) {
        const opt = RATING_OPTIONS.find((r) => r.key === e.key);
        if (opt) {
          e.preventDefault();
          handleRate(opt.quality);
          return;
        }
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleRate(answerState === "correct" ? QUALITY.Good : QUALITY.Again);
        }
      } else {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleGuestNext();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answerState, choices, handleSelect, handleRate, handleGuestNext, handleMarkMastered, user]);

  const getButtonStyle = (choice: string) => {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200 ";
    if (answerState === "unanswered") {
      return (
        base +
        "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 active:scale-95 cursor-pointer"
      );
    }
    if (choice === currentWord?.english) {
      return base + "border-green-500 bg-green-50 text-green-800";
    }
    if (choice === selected && answerState === "wrong") {
      return base + "border-red-500 bg-red-50 text-red-800";
    }
    return base + "border-slate-200 bg-white text-slate-400 cursor-default";
  };

  const isAlreadyMastered = currentWord ? masteredIds.has(currentWord.id) : false;
  const remainingCount = vocabulary.filter((w) => !masteredIds.has(w.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="text-2xl">🇫🇷</span>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">French Vocab</h1>
          </Link>
          {queueLabel && (
            <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {queueLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold"
                title={`Longest streak: ${stats.longest_streak}`}
              >
                🔥 {stats.current_streak}
              </span>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"
                title="Today's goal"
              >
                🎯 {stats.today_count}/{stats.daily_goal}
              </span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <span className="text-green-600 font-bold">{score.correct}</span>
            <span>/</span>
            <span>{score.total}</span>
          </div>
          {user ? (
            <>
              <Link
                href="/review"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline"
              >
                Review
              </Link>
              <Link
                href="/vocabulary"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline"
              >
                Browse
              </Link>
              <Link
                href="/progress"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Progress
              </Link>
              <form action={signOut}>
                <button className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/vocabulary"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline"
              >
                Browse
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Queue done state */}
      {queueDone && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
            <div className="text-5xl">✨</div>
            <h2 className="text-xl font-bold text-slate-900">
              {initialQueue && initialQueue.length === 0
                ? "Nothing to review right now"
                : "Session complete!"}
            </h2>
            <p className="text-slate-500 text-sm">
              {initialQueue && initialQueue.length === 0
                ? "No cards are due. Come back later or learn new words."
                : `You reviewed ${score.total} word${score.total === 1 ? "" : "s"}. Great work.`}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm"
              >
                Learn new words →
              </Link>
              <Link
                href="/review"
                className="w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-all text-sm"
              >
                Review hub
              </Link>
            </div>
          </div>
        </main>
      )}

      {/* Main content */}
      {!queueDone && currentWord && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-5">
            {/* Word card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center relative">
              {isAlreadyMastered && (
                <span className="absolute top-3 right-3 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Mastered
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {currentWord.partOfSpeech}
              </p>
              <h2 className="text-5xl font-bold text-slate-900 mb-2">{currentWord.french}</h2>
              <p className="text-slate-400 text-sm font-mono">/{currentWord.pronunciation}/</p>
              {!initialQueue && (
                <p className="text-xs text-slate-300 mt-3">{remainingCount} words left to learn</p>
              )}
              {initialQueue && initialQueue.length > 0 && (
                <p className="text-xs text-slate-300 mt-3">
                  {queueIdx + 1} / {initialQueue.length}
                </p>
              )}
            </div>

            {/* Choices */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Select the correct meaning
                <span className="hidden sm:inline ml-2 text-slate-300 font-normal normal-case">
                  (press 1–4)
                </span>
              </p>
              {choices.map((choice, i) => (
                <button
                  key={i}
                  className={getButtonStyle(choice)}
                  onClick={() => handleSelect(choice)}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {choice}
                    {answerState !== "unanswered" && choice === currentWord.english && (
                      <span className="ml-auto text-green-600">✓</span>
                    )}
                    {answerState === "wrong" &&
                      choice === selected &&
                      choice !== currentWord.english && (
                        <span className="ml-auto text-red-500">✗</span>
                      )}
                  </span>
                </button>
              ))}
            </div>

            {/* Mark-as-known button (only before answering, non-queue mode) */}
            {answerState === "unanswered" && !isAlreadyMastered && !initialQueue && (
              <button
                onClick={handleMarkMastered}
                className="w-full py-2.5 border-2 border-green-200 text-green-700 hover:bg-green-50 font-medium rounded-xl transition-all duration-200 text-sm"
              >
                I already know this word — skip forever ✓ <span className="text-xs text-green-500">(M)</span>
              </button>
            )}

            {/* Feedback panel */}
            {answerState !== "unanswered" && (
              <div
                className={`rounded-2xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  answerState === "correct"
                    ? "bg-green-50 border-green-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{answerState === "correct" ? "🎉" : "💡"}</span>
                  <p
                    className={`font-semibold ${
                      answerState === "correct" ? "text-green-800" : "text-orange-800"
                    }`}
                  >
                    {answerState === "correct"
                      ? "Correct!"
                      : `Correct answer: ${currentWord.english}`}
                  </p>
                </div>

                <p className="text-sm text-slate-600">{currentWord.explanation}</p>

                <button
                  onClick={() => setShowExample(!showExample)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {showExample ? "▾" : "▸"} Example sentence
                </button>

                {showExample && (
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
                    <p className="text-slate-800 font-medium text-sm italic">
                      &ldquo;{currentWord.example.french}&rdquo;
                    </p>
                    <p className="text-slate-500 text-sm">
                      &ldquo;{currentWord.example.english}&rdquo;
                    </p>
                  </div>
                )}

                {reviewResult?.stats?.goal_just_hit && (
                  <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-blue-800">
                      🎯 Daily goal reached! Streak: 🔥 {reviewResult.stats.current_streak}
                    </p>
                  </div>
                )}

                {!user && (
                  <p className="text-xs text-slate-400 border-t border-slate-200 pt-3">
                    <Link href="/login" className="text-blue-500 hover:text-blue-700 font-medium">
                      Sign in
                    </Link>{" "}
                    to track streaks and enable spaced-repetition review.
                  </p>
                )}
              </div>
            )}

            {/* Rating buttons (logged in) — each one both rates and advances */}
            {answerState !== "unanswered" && user && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                  How well did you know it?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleRate(opt.quality)}
                      disabled={rating}
                      className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${opt.cls}`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                          {opt.key}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                      <div className="text-[10px] opacity-70 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Guest: plain Next */}
            {answerState !== "unanswered" && !user && (
              <button
                onClick={handleGuestNext}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all duration-200 text-base shadow-md shadow-blue-200"
              >
                Next Word → <span className="text-xs opacity-70">(Space)</span>
              </button>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
