"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { vocabulary, VocabWord } from "@/data/vocabulary";
import { createClient } from "@/lib/supabase/client";
import {
  reviewWord,
  markWordMastered,
  undoLastReview,
  type ReviewResult,
  type WordProgressSnapshot,
} from "@/app/actions";
import { QUALITY, type Quality } from "@/lib/srs";
import {
  pickType,
  pickEnglishChoices,
  pickFrenchChoices,
  checkTyped,
  buildCloze,
  type QuestionType,
} from "@/lib/quiz_types";
import { speak, hasFrenchVoice, prewarmVoices } from "@/lib/tts";
import AudioButton from "@/components/AudioButton";
import { useStats } from "@/components/AppShell";
import AchievementToast from "@/components/AchievementToast";
import ComboFlash from "@/components/ComboFlash";
import Toast from "@/components/Toast";
import DailyGoalCelebration, {
  type DailyGoalSummary,
} from "@/components/DailyGoalCelebration";
import type { UnlockedAchievement } from "@/app/actions";
import type { User } from "@supabase/supabase-js";

type AnswerState = "unanswered" | "correct" | "wrong" | "accent";

interface QuizCardProps {
  initialQueue?: number[] | null;
  queueLabel?: string | null;
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
  { quality: QUALITY.Again, label: "Again", sub: "<10m",  key: "1", cls: "border-red-200 bg-red-50 text-red-700 dark:text-red-200 hover:bg-red-100" },
  { quality: QUALITY.Hard,  label: "Hard",  sub: "short", key: "2", cls: "border-orange-200 bg-orange-50 text-orange-700 dark:text-orange-200 hover:bg-orange-100" },
  { quality: QUALITY.Good,  label: "Good",  sub: "keep",  key: "3", cls: "border-green-200 bg-green-50 text-green-700 dark:text-green-200 hover:bg-green-100" },
  { quality: QUALITY.Easy,  label: "Easy",  sub: "long",  key: "4", cls: "border-blue-200 bg-blue-50 text-blue-700 dark:text-blue-200 hover:bg-blue-100" },
];

/** Look up the vocab entry whose visible label matches a chosen string. */
function findChoiceWord(text: string, qType: QuestionType): VocabWord | undefined {
  if (qType === "mc_en_fr" || qType === "cloze") {
    return vocabulary.find((w) => w.french === text);
  }
  return vocabulary.find((w) => w.english === text);
}

export default function QuizCard({
  initialQueue,
  queueLabel,
  initialSeenIds,
}: QuizCardProps) {
  const { stats, setStats } = useStats();
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [qType, setQType] = useState<QuestionType>("mc_fr_en");
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set(initialSeenIds ?? []));
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(false);
  const [xpFlash, setXpFlash] = useState<number | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<UnlockedAchievement[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [queueDone, setQueueDone] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [goalCelebration, setGoalCelebration] = useState<DailyGoalSummary | null>(null);

  useEffect(() => {
    if (!goalCelebration) return;
    const t = setTimeout(() => setGoalCelebration(null), 5500);
    return () => clearTimeout(t);
  }, [goalCelebration]);

  const vocabById = useRef<Map<number, VocabWord>>(new Map());
  const ttsOk = useRef<boolean>(false);

  useEffect(() => {
    vocabById.current = new Map(vocabulary.map((w) => [w.id, w]));
    prewarmVoices();
    ttsOk.current = hasFrenchVoice();
    // Recheck after voiceschanged (Chrome loads asynchronously).
    const recheck = () => {
      ttsOk.current = hasFrenchVoice();
    };
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener?.("voiceschanged", recheck);
      return () =>
        window.speechSynthesis.removeEventListener?.("voiceschanged", recheck);
    }
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

  const [clozeMasked, setClozeMasked] = useState<string | null>(null);

  const prepareWord = useCallback((word: VocabWord) => {
    const knownRep = seenIds.has(word.id) ? 3 : 0;
    let chosenType = pickType(knownRep, ttsOk.current);

    // Cloze falls back to mc_fr_en if the word isn't present verbatim in the example.
    let masked: string | null = null;
    if (chosenType === "cloze") {
      const cloze = buildCloze(word.french, word.example.french);
      if (cloze) masked = cloze.masked;
      else chosenType = "mc_fr_en";
    }

    setQType(chosenType);
    setClozeMasked(masked);

    if (chosenType === "mc_fr_en" || chosenType === "listen") {
      setChoices(pickEnglishChoices(word, vocabulary));
    } else if (chosenType === "mc_en_fr" || chosenType === "cloze") {
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

    if (chosenType === "listen") {
      setTimeout(() => {
        speak(word.french).then((ok) => {
          if (!ok) {
            // Silent failure (no voice, blocked autoplay) — fall back so the
            // user isn't stuck staring at a button that does nothing.
            ttsOk.current = false;
            setQType("mc_fr_en");
            setChoices(pickEnglishChoices(word, vocabulary));
            setClozeMasked(null);
            setInfoToast("Audio unavailable — switched to reading mode");
          }
        });
      }, 150);
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
    setCombo((c) => (isCorrect && !accentOnly ? c + 1 : 0));
    if (!isCorrect && !accentOnly) {
      // Auto-expand the mnemonic for words the user is struggling with —
      // they're the ones who need it most.
      setShowMnemonic(true);
    }
  }, []);

  const handleChoice = useCallback(
    (choice: string) => {
      if (answerState !== "unanswered" || !currentWord) return;
      setSelected(choice);
      const target =
        qType === "mc_en_fr" || qType === "cloze" ? currentWord.french : currentWord.english;
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

  /** Rate + load a new word. Wraps server call with error-toast fallback. */
  const handleRate = useCallback(
    async (quality: Quality) => {
      if (!currentWord || rating) return;
      setRating(true);

      if (user) {
        let result: ReviewResult | null = null;
        try {
          result = await reviewWord(currentWord.id, quality);
        } catch {
          result = null;
        }
        if (!result) {
          setErrorToast("Couldn't save your rating. Check your connection — we'll keep going.");
        } else {
          if (result.stats) {
            setStats({
              current_streak: result.stats.current_streak,
              longest_streak: Math.max(result.stats.current_streak, stats?.longest_streak ?? 0),
              daily_goal: result.stats.daily_goal,
              daily_new_goal: result.stats.daily_new_goal,
              today_count: result.stats.today_count,
              today_new_count: result.stats.today_new_count,
              total_xp: result.stats.total_xp,
              level: result.stats.level,
            });
            if (result.stats.goal_just_hit) {
              setGoalCelebration({
                todayCount: result.stats.today_count,
                goal: result.stats.daily_goal,
                newCount: result.stats.today_new_count,
                newGoal: result.stats.daily_new_goal,
                streak: result.stats.current_streak,
                correctSession: score.correct + (quality >= 3 ? 1 : 0),
                totalSession: score.total,
              });
            }
          }
          if (result.mastered) {
            setMasteredIds((prev) => new Set([...prev, currentWord.id]));
          }
          if (result.was_new) {
            setSeenIds((prev) => new Set([...prev, currentWord.id]));
          }
          if (result.xp_earned > 0) {
            setXpFlash(result.xp_earned);
            setTimeout(() => setXpFlash(null), 1400);
          }
          if (result.new_achievements?.length) {
            setAchievementQueue((prev) => [...prev, ...result.new_achievements]);
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
    [currentWord, user, rating, stats, score, loadNewWord, setStats]
  );

  /** Re-show the same word right away. Used by the "Try again" button. */
  const handleTryAgain = useCallback(async () => {
    if (!currentWord || rating) return;
    setRating(true);
    if (user) {
      try {
        const result = await reviewWord(currentWord.id, QUALITY.Again);
        if (result?.stats) {
          setStats({
            current_streak: result.stats.current_streak,
            longest_streak: Math.max(result.stats.current_streak, stats?.longest_streak ?? 0),
            daily_goal: result.stats.daily_goal,
            daily_new_goal: result.stats.daily_new_goal,
            today_count: result.stats.today_count,
            today_new_count: result.stats.today_new_count,
            total_xp: result.stats.total_xp,
            level: result.stats.level,
          });
        }
      } catch {
        setErrorToast("Couldn't save — but you can keep practicing.");
      }
    }
    setRating(false);
    prepareWord(currentWord);
  }, [currentWord, user, rating, stats, prepareWord, setStats]);

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
      try {
        await markWordMastered(currentWord.id);
      } catch {
        setErrorToast("Couldn't sync — marked as known locally.");
      }
    } else {
      saveLocalMastered(newMastered);
    }
    loadNewWord(newMastered);
  }, [currentWord, masteredIds, user, loadNewWord]);

  const handleGuestNext = useCallback(() => {
    loadNewWord();
  }, [loadNewWord]);

  // Switch to mc_fr_en without moving to the next word (e.g. no audio).
  const handleSwitchType = useCallback(() => {
    if (!currentWord || answerState !== "unanswered") return;
    setQType("mc_fr_en");
    setChoices(pickEnglishChoices(currentWord, vocabulary));
    setClozeMasked(null);
    setTypedInput("");
  }, [currentWord, answerState]);

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
        if (e.key.toLowerCase() === "t" && qType !== "mc_fr_en") {
          e.preventDefault();
          handleSwitchType();
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
    handleSwitchType,
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
    const target =
      qType === "mc_en_fr" || qType === "cloze" ? currentWord?.french : currentWord?.english;
    if (choice === target)
      return base + "border-green-500 bg-green-50 text-green-800 dark:text-green-200";
    if (choice === selected && answerState === "wrong")
      return base + "border-red-500 bg-red-50 text-red-800 dark:text-red-200";
    return base + "border-slate-200 bg-white text-slate-400 cursor-default";
  };

  const isAlreadyMastered = currentWord ? masteredIds.has(currentWord.id) : false;
  const masteredCount = masteredIds.size;
  const totalWords = vocabulary.length;

  // What progress bar to show above the question card.
  const progressBar = useMemo(() => {
    if (initialQueue && initialQueue.length > 0) {
      return {
        current: queueIdx + 1,
        total: initialQueue.length,
        label: "In set",
        tone: "blue" as const,
      };
    }
    if (stats && stats.daily_goal > 0) {
      return {
        current: Math.min(stats.today_count, stats.daily_goal),
        total: stats.daily_goal,
        label: "Today's goal",
        tone: "green" as const,
      };
    }
    return {
      current: masteredCount,
      total: totalWords,
      label: "Mastered",
      tone: "purple" as const,
    };
  }, [initialQueue, queueIdx, stats, masteredCount, totalWords]);

  return (
    <>
      {/* Floating XP flash */}
      {xpFlash !== null && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          aria-live="polite"
        >
          <div className="px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 font-bold text-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            +{xpFlash} XP ⚡
          </div>
        </div>
      )}

      <ComboFlash combo={combo} />

      <AchievementToast
        queue={achievementQueue}
        onDismiss={(key) => setAchievementQueue((prev) => prev.filter((a) => a.key !== key))}
      />

      <Toast
        message={errorToast}
        kind="error"
        onDismiss={() => setErrorToast(null)}
      />
      <Toast
        message={infoToast}
        kind="info"
        onDismiss={() => setInfoToast(null)}
      />

      <DailyGoalCelebration
        summary={goalCelebration}
        onDismiss={() => setGoalCelebration(null)}
      />

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

      {/* Top strip: queue label + progress bar + session score */}
      {!queueDone && (
        <div className="w-full max-w-lg mx-auto px-4 pt-4 space-y-2">
          <div className="flex items-center justify-between gap-2 min-h-[20px]">
            {queueLabel ? (
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {queueLabel}
              </span>
            ) : (
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                {progressBar.label}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {combo >= 3 && (
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  🔥 {combo}
                </span>
              )}
              {score.total > 0 && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  <span className="text-green-600 font-bold">{score.correct}</span>/
                  <span>{score.total}</span>
                </span>
              )}
            </div>
          </div>
          <ProgressBar
            current={progressBar.current}
            total={progressBar.total}
            tone={progressBar.tone}
          />
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
              <Link href="/vocabulary?tab=due" className="w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-all text-sm">
                See what&apos;s due
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
              clozeMasked={clozeMasked}
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

            {/* Switch question type (before answering, only for non-default types) */}
            {answerState === "unanswered" && qType !== "mc_fr_en" && (
              <button
                onClick={handleSwitchType}
                className="w-full py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium rounded-xl transition-all text-xs flex items-center justify-center gap-2"
              >
                <span>
                  {qType === "listen"
                    ? "🔇 No audio available — switch to reading"
                    : qType === "type"
                    ? "⌨️ Can't type right now — switch to multiple choice"
                    : "🔄 Switch to multiple choice"}
                </span>
                <span className="opacity-50">(T)</span>
              </button>
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
                selected={selected}
                showExample={showExample}
                setShowExample={setShowExample}
                showMnemonic={showMnemonic}
                setShowMnemonic={setShowMnemonic}
                signedIn={!!user}
                newGoalHit={stats ? stats.today_new_count >= stats.daily_new_goal && stats.daily_new_goal > 0 : false}
                onTryAgain={
                  answerState === "wrong" || answerState === "accent"
                    ? handleTryAgain
                    : null
                }
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
    </>
  );
}

// --- Sub-components --------------------------------------------------------

function ProgressBar({
  current,
  total,
  tone,
}: {
  current: number;
  total: number;
  tone: "blue" | "green" | "purple";
}) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const fill =
    tone === "blue"
      ? "bg-blue-500"
      : tone === "green"
      ? "bg-green-500"
      : "bg-purple-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full ${fill} transition-all duration-300 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
        {current}/{total}
      </span>
    </div>
  );
}

function QuestionPrompt({
  word,
  qType,
  answered,
  isMastered,
  clozeMasked,
}: {
  word: VocabWord;
  qType: QuestionType;
  answered: boolean;
  isMastered: boolean;
  clozeMasked: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center relative">
      {isMastered && (
        <span className="absolute top-3 right-3 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          Mastered
        </span>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {qType === "mc_en_fr"
          ? "Pick the French word"
          : qType === "listen"
          ? "Listen & pick the meaning"
          : qType === "type"
          ? "Type the French"
          : qType === "cloze"
          ? "Fill in the blank"
          : word.partOfSpeech}
      </p>

      {/* Body varies by type */}
      {qType === "mc_fr_en" && (
        <>
          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 break-words max-w-full">
              {word.french}
            </h2>
            <AudioButton text={word.french} size="md" />
          </div>
          <p className="text-slate-400 text-sm font-mono break-words">/{word.pronunciation}/</p>
        </>
      )}

      {qType === "mc_en_fr" && (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 leading-snug break-words">
            {word.english}
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{word.partOfSpeech}</p>
          {answered && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-700 break-words">
                {word.french}
              </span>
              <AudioButton text={word.french} size="sm" />
              <span className="text-xs font-mono text-slate-400 break-words">
                /{word.pronunciation}/
              </span>
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
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-700 break-words">
                {word.french}
              </span>
              <span className="text-xs font-mono text-slate-400 break-words">
                /{word.pronunciation}/
              </span>
            </div>
          )}
        </>
      )}

      {qType === "type" && (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 leading-snug break-words">
            {word.english}
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{word.partOfSpeech}</p>
          {answered && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-700 break-words">
                {word.french}
              </span>
              <AudioButton text={word.french} size="sm" />
              <span className="text-xs font-mono text-slate-400 break-words">
                /{word.pronunciation}/
              </span>
            </div>
          )}
        </>
      )}

      {qType === "cloze" && (
        <>
          <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed italic break-words">
            &ldquo;{answered ? word.example.french : clozeMasked ?? word.example.french}&rdquo;
          </p>
          <p className="text-xs text-slate-400 mt-2">Hint: {word.english}</p>
          {answered && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-700 break-words">
                {word.french}
              </span>
              <AudioButton text={word.french} size="sm" />
            </div>
          )}
        </>
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
            <span className="flex-1 min-w-0 break-words">{choice}</span>
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
              ? "border-red-400 bg-red-50 text-red-800 dark:text-red-200"
              : answerState === "accent"
              ? "border-yellow-400 bg-yellow-50 text-yellow-900 dark:text-yellow-100"
              : "border-green-400 bg-green-50 text-green-800 dark:text-green-200"
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
        <p className="text-center text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 rounded-md py-1 px-2">
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
  selected,
  showExample,
  setShowExample,
  showMnemonic,
  setShowMnemonic,
  signedIn,
  newGoalHit,
  onTryAgain,
}: {
  word: VocabWord;
  answerState: AnswerState;
  qType: QuestionType;
  selected: string | null;
  showExample: boolean;
  setShowExample: (v: boolean) => void;
  showMnemonic: boolean;
  setShowMnemonic: (v: boolean) => void;
  signedIn: boolean;
  newGoalHit: boolean;
  onTryAgain: (() => void) | null;
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

  // For wrong MC answers: show what the user's choice actually meant.
  const wrongChoiceWord =
    answerState === "wrong" &&
    selected &&
    qType !== "type" &&
    selected !== (qType === "mc_en_fr" || qType === "cloze" ? word.french : word.english)
      ? findChoiceWord(selected, qType)
      : undefined;

  return (
    <div
      className={`rounded-2xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isPositive ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{isPositive ? "🎉" : "💡"}</span>
        <p
          className={`font-semibold ${
            isPositive ? "text-green-800 dark:text-green-200" : "text-orange-800 dark:text-orange-200"
          }`}
        >
          {label}
        </p>
      </div>

      {wrongChoiceWord && (
        <div className="text-xs bg-white/70 border border-orange-200 rounded-lg px-3 py-2 text-slate-600">
          You picked{" "}
          <span className="font-semibold text-slate-900">
            {qType === "mc_en_fr" || qType === "cloze"
              ? wrongChoiceWord.french
              : wrongChoiceWord.english}
          </span>{" "}
          —{" "}
          <span className="text-slate-500">
            that means &ldquo;
            {qType === "mc_en_fr" || qType === "cloze"
              ? wrongChoiceWord.english
              : wrongChoiceWord.french}
            &rdquo;
          </span>
        </div>
      )}

      <p className="text-sm text-slate-600">{word.explanation}</p>

      <div className="flex items-center gap-4 flex-wrap">
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
        {onTryAgain && (
          <button
            onClick={onTryAgain}
            className="ml-auto text-sm font-semibold text-orange-700 hover:text-orange-900 bg-white border border-orange-300 hover:bg-orange-100 px-3 py-1 rounded-full transition-all"
          >
            ↻ Try again
          </button>
        )}
      </div>

      {showExample && (
        <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1">
          <div className="flex items-start gap-2">
            <p className="text-slate-800 font-medium text-sm italic flex-1">
              &ldquo;{word.example.french}&rdquo;
            </p>
            <AudioButton text={word.example.french} size="sm" />
          </div>
          <p className="text-slate-500 text-sm">&ldquo;{word.example.english}&rdquo;</p>
        </div>
      )}

      {showMnemonic && signedIn && <MnemonicBox wordId={word.id} />}

      {newGoalHit && (
        <p className="text-xs text-purple-600 bg-purple-50 rounded-md py-1 px-2">
          ✨ Daily new-word quota hit. You&apos;ll keep reviewing — come back tomorrow for more fresh words.
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
