"use client";

import { useEffect, useState } from "react";
import type { UnlockedAchievement } from "@/app/actions";

/**
 * Shows a queue of achievement unlock toasts. Each toast auto-dismisses
 * after ~4.5s but users can also dismiss manually.
 */
export default function AchievementToast({
  queue,
  onDismiss,
}: {
  queue: UnlockedAchievement[];
  onDismiss: (key: string) => void;
}) {
  const current = queue[0] ?? null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!current) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(current.key), 250);
    }, 4500);
    return () => clearTimeout(t);
  }, [current, onDismiss]);

  if (!current) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-sm transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-yellow-300/30 p-4 flex items-center gap-3">
        <span className="text-3xl">{current.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-yellow-300">
            Achievement unlocked
          </p>
          <p className="font-bold truncate">{current.name}</p>
          <p className="text-xs text-slate-300 truncate">{current.description}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss(current.key), 250);
          }}
          className="text-slate-400 hover:text-white text-xl leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
