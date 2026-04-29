"use client";

import { useEffect } from "react";

export type ToastKind = "error" | "info" | "success";

export default function Toast({
  message,
  kind = "info",
  onDismiss,
  durationMs = 3500,
}: {
  message: string | null;
  kind?: ToastKind;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  const tone =
    kind === "error"
      ? "bg-red-600 text-white"
      : kind === "success"
      ? "bg-green-600 text-white"
      : "bg-slate-900 text-white";

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-sm pointer-events-none"
      aria-live="polite"
    >
      <div
        className={`${tone} rounded-xl shadow-lg px-4 py-3 text-sm flex items-start gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200`}
      >
        <span className="flex-1">{message}</span>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
