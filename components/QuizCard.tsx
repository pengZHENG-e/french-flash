"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabulary, getRandomChoices, VocabWord } from "@/data/vocabulary";

type AnswerState = "unanswered" | "correct" | "wrong";

export default function QuizCard() {
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showExample, setShowExample] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());

  const loadNewWord = useCallback(() => {
    let available = vocabulary.filter((w) => !usedIds.has(w.id));
    if (available.length === 0) {
      setUsedIds(new Set());
      available = vocabulary;
    }
    const word = available[Math.floor(Math.random() * available.length)];
    setCurrentWord(word);
    setChoices(getRandomChoices(word, vocabulary));
    setSelected(null);
    setAnswerState("unanswered");
    setShowExample(false);
    setUsedIds((prev) => new Set([...prev, word.id]));
  }, [usedIds]);

  useEffect(() => {
    loadNewWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (choice: string) => {
    if (answerState !== "unanswered") return;
    setSelected(choice);
    if (choice === currentWord?.english) {
      setAnswerState("correct");
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setAnswerState("wrong");
      setScore((s) => ({ ...s, total: s.total + 1 }));
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          <span className="text-green-600 font-bold">{score.correct}</span>
          <span>/</span>
          <span>{score.total}</span>
          <span className="ml-1">correct</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5">

          {/* Word Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {currentWord.partOfSpeech}
            </p>
            <h2 className="text-5xl font-bold text-slate-900 mb-2">{currentWord.french}</h2>
            <p className="text-slate-400 text-sm font-mono">/{currentWord.pronunciation}/</p>
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
                <p className={`font-semibold ${answerState === "correct" ? "text-green-800" : "text-orange-800"}`}>
                  {answerState === "correct" ? "Correct!" : `Correct answer: ${currentWord.english}`}
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
                  <p className="text-slate-800 font-medium text-sm italic">"{currentWord.example.french}"</p>
                  <p className="text-slate-500 text-sm">"{currentWord.example.english}"</p>
                </div>
              )}
            </div>
          )}

          {/* Next button */}
          {answerState !== "unanswered" && (
            <button
              onClick={loadNewWord}
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
