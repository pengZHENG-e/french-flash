"use client";

import { useEffect, useState } from "react";
import { getConjugation, type Conjugation } from "@/app/actions";

const TENSE_LABELS: { key: keyof Conjugation; label: string }[] = [
  { key: "present",       label: "Present" },
  { key: "passe_compose", label: "Passé composé" },
  { key: "imparfait",     label: "Imparfait" },
  { key: "futur",         label: "Futur" },
  { key: "subjonctif",    label: "Subjonctif" },
];

export default function ConjugationBox({ wordId }: { wordId: number }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "done"; data: Conjugation } | { kind: "error" }
  >({ kind: "idle" });

  async function load() {
    setState({ kind: "loading" });
    const r = await getConjugation(wordId);
    if (r) setState({ kind: "done", data: r });
    else setState({ kind: "error" });
  }

  if (state.kind === "idle") {
    return (
      <button
        onClick={load}
        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        ▸ Show conjugation ✨
      </button>
    );
  }
  if (state.kind === "loading") {
    return <p className="text-sm text-slate-400 italic">Generating conjugation…</p>;
  }
  if (state.kind === "error") {
    return (
      <div className="text-sm text-slate-400">
        Could not generate conjugation.{" "}
        <button onClick={load} className="text-indigo-600 hover:text-indigo-800 font-medium">
          Retry
        </button>
      </div>
    );
  }

  const data = state.data;
  return (
    <div className="space-y-3 bg-indigo-50 rounded-xl p-3 border border-indigo-200">
      {TENSE_LABELS.map(({ key, label }) => {
        const tense = data[key];
        if (!tense) return null;
        return (
          <div key={key}>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
              {label}
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm">
              {Object.entries(tense).map(([pronoun, form]) => (
                <div key={pronoun} className="flex gap-2">
                  <dt className="text-slate-500 w-16 shrink-0">{pronoun}</dt>
                  <dd className="text-slate-800 font-medium">{form}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
