"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { vocabulary, VocabWord } from "@/data/vocabulary";
import { createClient } from "@/lib/supabase/client";
import {
  reviewWord,
  markWordMastered,
  undoLastReview,
  signOut,
  type ReviewResult,
  type WordProgressSnapshot,
} from "@/app/actions";
import { QUALITY, type Quality } from "@/lib/srs";
import {
  pickType,
  pickEnglishChoices,
  pickFrenchChoices,
  checkTyped,
  type QuestionType,
} from "@/lib/quiz_types";
import { speak, ttsSupported, prewarmVoices } from "@/lib/tts";
import AudioButton from "@/components/AudioButton";
import type { User } from "@supabase/supabase-js";

type AnswerState = "unanswered" | "correct" | "wrong" | "accent";

export interface QuizStats {
  current_streak: number;
  longest_streak: number;
  daily_goal: number;
  daily_new_goal: number;
  today_count: number;
  today_new_count: number;
}

interface QuizCardProps {
  initialQueue?: number[] | null;
  queueLabel?: string | null;
  initialStats?: QuizStats | null;
  initialSeenIds?: number[];
}

interface LastAction {
  wordId: number;
  french: string;
  snapshot: WordProgressSnapshot | null;
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
  { quality: QUALITY.Again, label: "Again", sub: "<10m",  key: "1", cls: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
  { quality: QUALITY.Hard,  label: "Hard",  sub: "short", key: "2", cls: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { quality: QUALITY.Good,  label: "Good",  sub: "keep",  key: "3", cls: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
  { quality: QUALITY.Easy,  label: "Easy",  sub: "long",  key: "4", cls: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" },
];

export default function QuizCard({
  initialQueue,
  queueLabel,
  initialStats,
  initialSeenIds,
}: QuizCardProps) {
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [qType, setQType] = useState<QuestionType>("mc_fr_en");
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showExample, setShowExample] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set(initialSeenIds ?? []));
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(initialStats ?? null);
  const [rating, setRating] = useState(false);
  const [queueIdx, setQueueIdx] = useState(0);
  const [queueDone, setQueueDone] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const vocabById = useRef<Map<number, VocabWord>>(new Map());
  const ttsOk = useRef<boolean>(false);

  useEffect(() => {
    vocabById.current = new Map(vocabulary.map((w) => [w.id, w]));
    prewarmVoices();
    ttsOk.current = ttsSupported();
  }, []);

  // Auth + mastered-IDs + seen-IDs bootstrap.
  useEffect(() => {
    const supabase = createClient();

    async function init(userId: string | undefined) {
      if (userId) {
        const { data } = await supabase
          .from("word_progress")
          .select("word_id, mastered")
          .eq("user_id", userId);
        setMasteredIds(new Set((data ?? []).filter((r) => r.mastered).map((r) => r.word_id)));
        setSeenIds(new Set((data ?? []).map((r) => r.word_id)));
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

  // Can learn more new words today?
  const newQuotaExhausted = useMemo(() => {
    if (!stats) return false;
    return stats.daily_new_goal > 0 && stats.today_new_count >= stats.daily_new_goal;
  }, [stats]);

  const pickRandom = useCallback(
    (currentMasteredIds: Set<number>, blockNew: boolean): VocabWord | null => {
      const baseExclude = (w: VocabWord) =>
        currentMasteredIds.has(w.id) || usedIds.has(w.id);
      const newFilter = (w: VocabWord) => !blockNew || seenIds.has(w.id);

      let available = vocabulary.filter((w) => !baseExclude(w) && newFilter(w));
      if (available.length === 0) {
        // exhausted "unused" pool — restart within allowed pool
        available = vocabulary.filter(
          (w) => !currentMasteredIds.has(w.id) && newFilter(w)
        );
        setUsedIds(new Set());
        if (available.length === 0) {
          // quota blocked everything — allow unseen fallback
          available = vocabulary.filter((w) => !currentMasteredIds.has(w.id));
        }
        if (available.length === 0) available = vocabulary;
      }
      return available[Math.floor(Math.random() * available.length)] ?? null;
    },
    [usedIds, seenIds]
  );

  const prepareWord = useCallback((word: VocabWord) => {
    // Crude heuristic: the client only knows whether it's been seen. The
    // server owns the real SM-2 state. Unseen → always teach (mc_fr_en).
    // Seen → treat as rep>=3 so every question type is eligible.
    const knownRep = seenIds.has(word.id) ? 3 : 0;
    const chosenType = pickType(knownRep, ttsOk.current);
    setQType(chosenType);

    if (chosenType === "mc_fr_en" || chosenType === "listen") {
      setChoices(pickEnglishChoices(word, vocabulary));
    } else if (chosenType === "mc_en_fr") {
      setChoices(pickFrenchChoices(word, vocabulary));
    } else {
      setChoices([]);
    }
    setSelected(null);
    setTypedInput("");
    setAnswerState("unanswered");
    setShowExample(false);
    setShowMnemonic(false);
    setCurrentWord(word);

    // Auto-play for listening type.
    if (chosenType === "listen") {
      setTimeout(() => speak(word.french), 150);
    }
  }, [seenIds]);

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
        word = pickRandom(excluded, newQuotaExhausted);
      }

      if (!word) {
        setQueueDone(true);
        return;
      }
      prepareWord(word);
      setUsedIds((prev) => new Set([...prev, word!.id]));
    },
    [masteredIds, initialQueue, queueIdx, pickRandom, prepareWord, newQuotaExhausted]
  );

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    if (initialQueue && initialQueue.length === 0) {
      setQueueDone(true);
      return;
    }

    if (initialQueue && initialQueue.length > 0) {
      const id = initialQueue[0];
      const word = vocabById.current.get(id);
      if (word) {
        prepareWord(word);
        setQueueIdx(0);
      }
    } else {
      loadNewWord(masteredIds, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masteredIds]);

  // --- Answer handlers -----------------------------------------------------

  const finalizeAnswer = useCallback((isCorrect: boolean, accentOnly = false) => {
    setAnswerState(accentOnly ? "accent" : isCorrect ? "correct" : "wrong");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  }, []);

  const handleChoice = useCallback(
    (choice: string) => {
      if (answerState !== "unanswered" || !currentWord) return;
      setSelected(choice);
      const target = qType === "mc_en_fr" ? currentWord.french : currentWord.english;
      finalizeAnswer(choice === target);
    },
    [answerState, currentWord, qType, finalizeAnswer]
  );

  const handleTypedSubmit = useCallback(() => {
    if (answerState !== "unanswered" || !currentWord) return;
    const result = checkTyped(typedInput, currentWord.french);
    if (result === "wrong") finalizeAnswer(false);
    else finalizeAnswer(true, result === "accent_only");
  }, [answerState, currentWord, typedInput, finalizeAnswer]);

  const handleRate = useCallback(
    async (quality: Quality) => {
      if (!currentWord || rating) return;
      setRating(true);

      if (user) {
        const result: ReviewResult | null = await reviewWord(currentWord.id, quality);
        if (result) {
          if (result.stats) {
            setStats({
              current_streak: result.stats.current_streak,
              longest_streak: Math.max(result.stats.current_streak, stats?.longest_streak ?? 0),
              daily_goal: result.stats.daily_goal,
              daily_new_goal: result.stats.daily_new_goal,
              today_count: result.stats.today_count,
              today_new_count: result.stats.today_new_count,
            });
          }
          if (result.mastered) {
            setMasteredIds((prev) => new Set([...prev, currentWord.id]));
          }
          if (result.was_new) {
            setSeenIds((prev) => new Set([...prev, currentWord.id]));
          }
          setLastAction({
            wordId: currentWord.id,
            french: currentWord.french,
            snapshot: result.prev_snapshot,
          });
        }
      }

      setRating(false);
      loadNewWord();
    },
    [currentWord, user, rating, stats, loadNewWord]
  );

  const handleUndo = useCallback(async () => {
    if (!lastAction || !user) return;
    const restored = await undoLastReview(lastAction.wordId, lastAction.snapshot);
    if (restored) {
      // If we had added it to mastered locally via isMastered(next), roll back.
      if (lastAction.snapshot === null || !lastAction.snapshot.mastered) {
        setMasteredIds((prev) => {
          const next = new Set(prev);
          next.delete(lastAction.wordId);
          return next;
        });
      }
      if (lastAction.snapshot === null) {
        setSeenIds((prev) => {
          const next = new Set(prev);
          next.delete(lastAction.wordId);
          return next;
        });
      }
    }
    setLastAction(null);
  }, [lastAction, user]);

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

  // --- Keyboard shortcuts --------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTextInput = tag === "INPUT" || tag === "TEXTAREA";

      if (answerState === "unanswered") {
        // Question phase.
        if (qType === "type") {
          if (isTextInput && e.key === "Enter") {
            e.preventDefault();
            handleTypedSubmit();
          }
          return;
        }
        if (isTextInput) return;
        if (e.key.toLowerCase() === "s" && (qType === "listen" || qType === "mc_fr_en")) {
          if (currentWord) speak(currentWord.french);
          e.preventDefault();
          return;
        }
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx >= 0 && idx < choices.length) {
          e.preventDefault();
          handleChoice(choices[idx]);
          return;
        }
        if (e.key.toLowerCase() === "m") {
          e.preventDefault();
          handleMarkMastered();
        }
        return;
      }

      // Answered phase.
      if (isTextInput) return;
      if (e.key.toLowerCase() === "s" && currentWord) {
        speak(currentWord.french);
        e.preventDefault();
        return;
      }
      if (user) {
        const opt = RATING_OPTIONS.find((r) => r.key === e.key);
        if (opt) {
          e.preventDefault();
          handleRate(opt.quality);
          return;
        }
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleRate(answerState === "wrong" ? QUALITY.Again : QUALITY.Good);
        }
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleGuestNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    answerState,
    qType,
    choices,
    currentWord,
    user,
    handleChoice,
    handleTypedSubmit,
    handleRate,
    handleGuestNext,
    handleMarkMastered,
  ]);

  // --- Styles --------------------------------------------------------------

  const getChoiceStyle = (choice: string) => {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200 ";
    if (answerState === "unanswered") {
      return (
        base +
        "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 active:scale-95 cursor-pointer"
      );
    }
    const target = qType === "mc_en_fr" ? currentWord?.french : currentWord?.english;
    if (choice === target) return base + "border-green-500 bg-green-50 text-green-800";
    if (choice === selected && answerState === "wrong")
      return base + "border-red-500 bg-red-50 text-red-800";
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
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold"
                title={`Longest streak: ${stats.longest_streak}`}
              >
                🔥 {stats.current_streak}
              </span>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"
                title="Today's review goal"
              >
                🎯 {stats.today_count}/{stats.daily_goal}
              </span>
              {stats.daily_new_goal > 0 && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold"
                  title="Today's new-word goal"
                >
                  ✨ {stats.today_new_count}/{stats.daily_new_goal}
                </span>
              )}
            </div>
          )}
          <div className="hidden md:flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <span className="text-green-600 font-bold">{score.correct}</span>
            <span>/</span>
            <span>{score.total}</span>
          </div>
          {user ? (
            <>
              <Link href="/review" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline">Review</Link>
              <Link href="/import" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden md:inline">Import</Link>
              <Link href="/vocabulary" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline">Browse</Link>
              <Link href="/progress" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Progress</Link>
              <form action={signOut}>
                <button className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/vocabulary" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline">Browse</Link>
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Sign in</Link>
            </>
          )}
        </div>
      </header>

      {/* Undo bar (only visible when lastAction exists) */}
      {lastAction && user && (
        <div className="bg-slate-900 text-white text-sm flex items-center justify-center gap-3 py-2 px-4">
          <span>Rated &ldquo;{lastAction.french}&rdquo;.</span>
          <button
            onClick={handleUndo}
            className="font-bold text-blue-300 hover:text-blue-100 underline underline-offset-2"
          >
            Undo
          </button>
          <button
            onClick={() => setLastAction(null)}
            className="text-slate-400 hover:text-white ml-2"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Queue-done state */}
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
              <Link href="/" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm">
                Learn new words →
              </Link>
              <Link href="/review" className="w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-all text-sm">
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
            {/* Question prompt */}
            <QuestionPrompt
              word={currentWord}
              qType={qType}
              answered={answerState !== "unanswered"}
              isMastered={isAlreadyMastered}
              remainingCount={initialQueue ? null : remainingCount}
              queuePosition={initialQueue ? { idx: queueIdx, total: initialQueue.length } : null}
            />

            {/* Answer area varies by type */}
            {qType === "type" ? (
              <TypeAnswerArea
                word={currentWord}
                input={typedInput}
                setInput={setTypedInput}
                answerState={answerState}
                onSubmit={handleTypedSubmit}
              />
            ) : (
              <ChoicesArea
                choices={choices}
                answerState={answerState}
                selected={selected}
                getChoiceStyle={getChoiceStyle}
                onSelect={handleChoice}
              />
            )}

            {/* Mark-as-known (before answering, non-queue mode) */}
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
              <FeedbackPanel
                word={currentWord}
                answerState={answerState}
                qType={qType}
                showExample={showExample}
                setShowExample={setShowExample}
                showMnemonic={showMnemonic}
                setShowMnemonic={setShowMnemonic}
                signedIn={!!user}
                newGoalHit={stats ? stats.today_new_count >= stats.daily_new_goal && stats.daily_new_goal > 0 : false}
              />
            )}

            {/* Rating buttons for logged-in users */}
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

            {/* Guest next */}
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

// --- Sub-components --------------------------------------------------------

function QuestionPrompt({
  word,
  qType,
  answered,
  isMastered,
  remainingCount,
  queuePosition,
}: {
  word: VocabWord;
  qType: QuestionType;
  answered: boolean;
  isMastered: boolean;
  remainingCount: number | null;
  queuePosition: { idx: number; total: number } | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center relative">
      {isMastered && (
        <span className="absolute top-3 right-3 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          Mastered
        </span>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {qType === "mc_en_fr" ? "Pick the French word" : qType === "listen" ? "Listen & pick the meaning" : qType === "type" ? "Type the French" : word.partOfSpeech}
      </p>

      {/* Body varies by type */}
      {qType === "mc_fr_en" && (
        <>
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-5xl font-bold text-slate-900">{word.french}</h2>
            <AudioButton text={word.french} size="md" />
          </div>
          <p className="text-slate-400 text-sm font-mono">/{word.pronunciation}/</p>
        </>
      )}

      {qType === "mc_en_fr" && (
        <>
          <h2 className="text-3xl font-bold text-slate-900 mb-1 leading-snug">{word.english}</h2>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{word.partOfSpeech}</p>
          {answered && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-2xl font-bold text-slate-700">{word.french}</span>
              <AudioButton text={word.french} size="sm" />
              <span className="text-xs font-mono text-slate-400">/{word.pronunciation}/</span>
            </div>
          )}
        </>
      )}

      {qType === "listen" && (
        <>
          <div className="flex items-center justify-center gap-3 mb-2">
            <AudioButton text={word.french} size="lg" />
          </div>
          <p className="text-xs text-slate-400">Tap 🔊 or press <kbd className="px-1 bg-slate-100 rounded">S</kbd> to replay</p>
          {answered && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-2xl font-bold text-slate-700">{word.french}</span>
              <span className="text-xs font-mono text-slate-400">/{word.pronunciation}/</span>
            </div>
          )}
        </>
      )}

      {qType === "type" && (
        <>
          <h2 className="text-3xl font-bold text-slate-900 mb-1 leading-snug">{word.english}</h2>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{word.partOfSpeech}</p>
          {answered && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-2xl font-bold text-slate-700">{word.french}</span>
              <AudioButton text={word.french} size="sm" />
              <span className="text-xs font-mono text-slate-400">/{word.pronunciation}/</span>
            </div>
          )}
        </>
      )}

      {remainingCount !== null && (
        <p className="text-xs text-slate-300 mt-3">{remainingCount} words left to learn</p>
      )}
      {queuePosition && (
        <p className="text-xs text-slate-300 mt-3">
          {queuePosition.idx + 1} / {queuePosition.total}
        </p>
      )}
    </div>
  );
}

function ChoicesArea({
  choices,
  answerState,
  selected,
  getChoiceStyle,
  onSelect,
}: {
  choices: string[];
  answerState: AnswerState;
  selected: string | null;
  getChoiceStyle: (c: string) => string;
  onSelect: (c: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
        Select the correct answer
        <span className="hidden sm:inline ml-2 text-slate-300 font-normal normal-case">(press 1–4)</span>
      </p>
      {choices.map((choice, i) => (
        <button key={i} className={getChoiceStyle(choice)} onClick={() => onSelect(choice)}>
          <span className="inline-flex items-center gap-3">
            <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0">{choice}</span>
            {answerState !== "unanswered" && choice === selected && selected !== null && (
              <span className="ml-auto">
                {answerState === "correct" || answerState === "accent" ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-500">✗</span>
                )}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function TypeAnswerArea({
  word,
  input,
  setInput,
  answerState,
  onSubmit,
}: {
  word: VocabWord;
  input: string;
  setInput: (v: string) => void;
  answerState: AnswerState;
  onSubmit: () => void;
}) {
  const disabled = answerState !== "unanswered";
  return (
    <div className="space-y-3">
      <input
        autoFocus
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        placeholder="Type the French word..."
        className={`w-full px-4 py-4 rounded-xl border-2 text-lg text-center font-medium transition-all outline-none ${
          disabled
            ? answerState === "wrong"
              ? "border-red-400 bg-red-50 text-red-800"
              : answerState === "accent"
              ? "border-yellow-400 bg-yellow-50 text-yellow-900"
              : "border-green-400 bg-green-50 text-green-800"
            : "border-slate-200 bg-white focus:border-blue-400"
        }`}
      />
      {!disabled && (
        <button
          onClick={onSubmit}
          disabled={!input.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all text-sm"
        >
          Check ↵
        </button>
      )}
      {disabled && answerState === "wrong" && (
        <p className="text-center text-sm text-slate-500">
          Correct: <span className="font-bold text-slate-900">{word.french}</span>
        </p>
      )}
      {disabled && answerState === "accent" && (
        <p className="text-center text-xs text-yellow-700 bg-yellow-50 rounded-md py-1 px-2">
          Right word, watch the accents: <span className="font-bold">{word.french}</span>
        </p>
      )}
    </div>
  );
}

function FeedbackPanel({
  word,
  answerState,
  qType,
  showExample,
  setShowExample,
  showMnemonic,
  setShowMnemonic,
  signedIn,
  newGoalHit,
}: {
  word: VocabWord;
  answerState: AnswerState;
  qType: QuestionType;
  showExample: boolean;
  setShowExample: (v: boolean) => void;
  showMnemonic: boolean;
  setShowMnemonic: (v: boolean) => void;
  signedIn: boolean;
  newGoalHit: boolean;
}) {
  const isPositive = answerState === "correct" || answerState === "accent";
  const label =
    answerState === "correct"
      ? "Correct!"
      : answerState === "accent"
      ? "Close — missing accents"
      : qType === "mc_en_fr"
      ? `Correct answer: ${word.french}`
      : qType === "type"
      ? `Correct: ${word.french}`
      : `Correct answer: ${word.english}`;

  return (
    <div
      className={`rounded-2xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isPositive ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{isPositive ? "🎉" : "💡"}</span>
        <p className={`font-semibold ${isPositive ? "text-green-800" : "text-orange-800"}`}>{label}</p>
      </div>

      <p className="text-sm text-slate-600">{word.explanation}</p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowExample(!showExample)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          {showExample ? "▾" : "▸"} Example
        </button>
        {signedIn && (
          <button
            onClick={() => setShowMnemonic(!showMnemonic)}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
          >
            {showMnemonic ? "▾" : "▸"} Mnemonic ✨
          </button>
        )}
      </div>

      {showExample && (
        <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
          <p className="text-slate-800 font-medium text-sm italic">&ldquo;{word.example.french}&rdquo;</p>
          <p className="text-slate-500 text-sm">&ldquo;{word.example.english}&rdquo;</p>
        </div>
      )}

      {showMnemonic && signedIn && <MnemonicBox wordId={word.id} />}

      {newGoalHit && (
        <p className="text-xs text-purple-600 bg-purple-50 rounded-md py-1 px-2">
          ✨ Daily new-word quota hit. You'll keep reviewing — come back tomorrow for more fresh words.
        </p>
      )}

      {!signedIn && (
        <p className="text-xs text-slate-400 border-t border-slate-200 pt-3">
          <Link href="/login" className="text-blue-500 hover:text-blue-700 font-medium">Sign in</Link>{" "}
          to track streaks and enable spaced-repetition review.
        </p>
      )}
    </div>
  );
}

function MnemonicBox({ wordId }: { wordId: number }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "done"; text: string } | { kind: "error" }
  >({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    import("@/app/actions").then(({ getMnemonic }) =>
      getMnemonic(wordId).then((r) => {
        if (cancelled) return;
        if (r?.mnemonic) setState({ kind: "done", text: r.mnemonic });
        else setState({ kind: "error" });
      })
    );
    return () => {
      cancelled = true;
    };
  }, [wordId]);

  return (
    <div className="bg-white rounded-xl p-3 border border-purple-200">
      {state.kind === "loading" && (
        <p className="text-xs text-slate-400 italic">Generating mnemonic…</p>
      )}
      {state.kind === "error" && (
        <p className="text-xs text-slate-400">No mnemonic available.</p>
      )}
      {state.kind === "done" && (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{state.text}</p>
      )}
    </div>
  );
}
