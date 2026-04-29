"use client";

import { useEffect, useState } from "react";

interface Row {
  keys: string[];
  desc: string;
}

const ROWS: { title: string; rows: Row[] }[] = [
  {
    title: "Answering",
    rows: [
      { keys: ["1", "2", "3", "4"], desc: "Pick choice 1–4" },
      { keys: ["Enter"], desc: "Submit typed answer" },
      { keys: ["S"], desc: "Replay audio" },
      { keys: ["T"], desc: "Switch to multiple choice" },
      { keys: ["M"], desc: "I already know this — skip forever" },
    ],
  },
  {
    title: "After answering",
    rows: [
      { keys: ["1"], desc: "Rate Again (forgot)" },
      { keys: ["2"], desc: "Rate Hard" },
      { keys: ["3"], desc: "Rate Good" },
      { keys: ["4"], desc: "Rate Easy" },
      { keys: ["Space", "Enter"], desc: "Continue (defaults to Good)" },
      { keys: ["S"], desc: "Replay audio" },
    ],
  },
  {
    title: "Anywhere",
    rows: [{ keys: ["?"], desc: "Open this help" }],
  },
];

export default function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-keyboard-help", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-keyboard-help", onOpen);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Keyboard shortcuts</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          {ROWS.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </p>
              <ul className="space-y-1.5">
                {section.rows.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">{r.desc}</span>
                    <span className="flex gap-1 shrink-0">
                      {r.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-5 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">?</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
