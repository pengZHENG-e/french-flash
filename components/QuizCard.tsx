"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { vocabulary, getRandomChoices, VocabWord } from "@/data/vocabulary";
import { createClient } from "@/lib/supabase/client";
import { saveWordProgress, markWordMastered, signOut } from "@/app/actions";
import type { User } from "@supabase/supabase-js";

type AnswerState = "unanswered" | "correct" | "wrong";

interface WordProgress {
  correct_count: number;
  wrong_count: number;
  mastered: boolean;
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

export default function QuizCard() {
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showExample, setShowExample] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [wordProgress, setWordProgress] = useState<WordProgress | null>(null);
  const [savedProgress, setSavedProgress] = useState<WordProgress | null>(null);
  const [markingMastered, setMarkingMastered] = useState(false);

  // Auth state + load mastered IDs
  useEffect(() => {
    const supabase = createClient();

    async function init(userId: string | undefined) {
      if (userId) {
        // Load mastered IDs from DB
        const { data } = await supabase
          .from("word_progress")
          .select("word_id")
          .eq("user_id", userId)
          .eq("mastered", true);
        setMasteredIds(new Set(data?.map((r) => r.word_id) ?? []));
      } else {
        // Load from localStorage for guests
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

  // Load progress for current word
  useEffect(() => {
    if (!user || !currentWord) {
      setWordProgress(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("word_progress")
      .select("correct_count, wrong_count, mastered")
      .eq("user_id", user.id)
      .eq("word_id", currentWord.id)
      .single()
      .then(({ data }) => setWordProgress(data ?? null));
  }, [user, currentWord]);

  const loadNewWord = useCallback((currentMasteredIds?: Set<number>) => {
    const excluded = currentMasteredIds ?? masteredIds;
    let available = vocabulary.filter((w) => !excluded.has(w.id) && !usedIds.has(w.id));
    if (available.length === 0) {
      // All non-mastered words have been used — reset usedIds
      available = vocabulary.filter((w) => !excluded.has(w.id));
      setUsedIds(new Set());
      if (available.length === 0) {
        // All words are mastered — show all anyway
        available = vocabulary;
      }
    }
    const word = available[Math.floor(Math.random() * available.length)];
    setCurrentWord(word);
    setChoices(getRandomChoices(word, vocabulary));
    setSelected(null);
    setAnswerState("unanswered");
    setShowExample(false);
    setSavedProgress(null);
    setUsedIds((prev) => new Set([...prev, word.id]));
  }, [masteredIds, usedIds]);

  // Load first word once masteredIds is ready
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      loadNewWord(masteredIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masteredIds]);

  const handleSelect = async (choice: string) => {
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

    if (user) {
      const result = await saveWordProgress(currentWord.id, isCorrect);
      if (result) setSavedProgress(result);
    }
  };

  const handleMarkMastered = async () => {
    if (!currentWord) return;
    setMarkingMastered(true);

    const newMastered = new Set([...masteredIds, currentWord.id]);
    setMasteredIds(newMastered);

    if (user) {
      await markWordMastered(currentWord.id);
    } else {
      saveLocalMastered(newMastered);
    }

    setMarkingMastered(false);
    loadNewWord(newMastered);
  };

  const getButtonStyle = (choice: string) => {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200 ";
    if (answerState === "unanswered") {
      return base + "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 active:scale-95 cursor-pointer";
    }
    if (choice === currentWord?.english) {
      return base + "border-green-500 bg-green-50 text-green-800";
    }
    if (choice === selected && answerState === "wrong") {
      return base + "border-red-500 bg-red-50 text-red-800";
    }
    return base + "border-slate-200 bg-white text-slate-400 cursor-default";
  };

  if (!currentWord) return null;

  const progressAfterAnswer = savedProgress ?? wordProgress;
  const justMastered = savedProgress?.mastered && !wordProgress?.mastered;
  const isAlreadyMastered = masteredIds.has(currentWord.id);
  const remainingCount = vocabulary.filter((w) => !masteredIds.has(w.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <span className="text-green-600 font-bold">{score.correct}</span>
            <span>/</span>
            <span>{score.total}</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/progress" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                My Progress
              </Link>
              <span className="text-slate-200">|</span>
              <form action={signOut}>
                <button className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Sign out</button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5">

          {/* Word Card */}
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
            <p className="text-xs text-slate-300 mt-3">{remainingCount} words left to learn</p>
          </div>

          {/* Choices */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Select the correct meaning
            </p>
            {choices.map((choice, i) => (
              <button key={i} className={getButtonStyle(choice)} onClick={() => handleSelect(choice)}>
                <span className="inline-flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                  {answerState !== "unanswered" && choice === currentWord.english && (
                    <span className="ml-auto text-green-600">✓</span>
                  )}
                  {answerState === "wrong" && choice === selected && choice !== currentWord.english && (
                    <span className="ml-auto text-red-500">✗</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Mark as mastered button — always visible before answering */}
          {answerState === "unanswered" && !isAlreadyMastered && (
            <button
              onClick={handleMarkMastered}
              disabled={markingMastered}
              className="w-full py-2.5 border-2 border-green-200 text-green-700 hover:bg-green-50 font-medium rounded-xl transition-all duration-200 text-sm"
            >
              I already know this word — skip forever ✓
            </button>
          )}

          {/* Feedback panel */}
          {answerState !== "unanswered" && (
            <div
              className={`rounded-2xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                answerState === "correct" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{answerState === "correct" ? "🎉" : "💡"}</span>
                  <p className={`font-semibold ${answerState === "correct" ? "text-green-800" : "text-orange-800"}`}>
                    {answerState === "correct" ? "Correct!" : `Correct answer: ${currentWord.english}`}
                  </p>
                </div>
                {user && progressAfterAnswer && (
                  <div className="text-right">
                    {justMastered ? (
                      <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                        Word Mastered!
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {progressAfterAnswer.correct_count}/3 to master
                      </span>
                    )}
                  </div>
                )}
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
                  <p className="text-slate-800 font-medium text-sm italic">"{currentWord.example.french}"</p>
                  <p className="text-slate-500 text-sm">"{currentWord.example.english}"</p>
                </div>
              )}

              {!isAlreadyMastered && (
                <button
                  onClick={handleMarkMastered}
                  disabled={markingMastered}
                  className="w-full py-2 border border-green-300 text-green-700 hover:bg-green-100 text-sm font-medium rounded-xl transition-all"
                >
                  I know this word — skip forever ✓
                </button>
              )}

              {!user && (
                <p className="text-xs text-slate-400 border-t border-slate-200 pt-3">
                  <Link href="/login" className="text-blue-500 hover:text-blue-700 font-medium">Sign in</Link>{" "}
                  to sync your progress across devices.
                </p>
              )}
            </div>
          )}

          {/* Next button */}
          {answerState !== "unanswered" && (
            <button
              onClick={() => loadNewWord()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all duration-200 text-base shadow-md shadow-blue-200"
            >
              Next Word →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
