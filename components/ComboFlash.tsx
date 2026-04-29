"use client";

interface Tier {
  min: number;
  label: string;
  emoji: string;
  cls: string;
}

const TIERS: Tier[] = [
  { min: 3,  label: "On a roll!",   emoji: "🔥", cls: "bg-orange-500 text-white" },
  { min: 5,  label: "Combo x{n}!",  emoji: "⚡", cls: "bg-yellow-400 text-yellow-900" },
  { min: 10, label: "Unstoppable!", emoji: "💎", cls: "bg-blue-500 text-white" },
  { min: 20, label: "Legendary!",   emoji: "👑", cls: "bg-purple-600 text-white" },
];

function tierFor(n: number): Tier | null {
  let chosen: Tier | null = null;
  for (const t of TIERS) if (n >= t.min) chosen = t;
  return chosen;
}

/**
 * Renders a celebratory flash whenever `combo` reaches a tier threshold.
 * Auto-fades via CSS animation and re-triggers on each `combo` change via the
 * keyed remount.
 */
export default function ComboFlash({ combo }: { combo: number }) {
  const tier = tierFor(combo);
  if (!tier) return null;

  return (
    <div
      key={combo}
      className="fixed top-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none combo-flash"
      aria-live="polite"
    >
      <div
        className={`${tier.cls} px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2`}
      >
        <span className="text-base">{tier.emoji}</span>
        <span>{tier.label.replace("{n}", String(combo))}</span>
      </div>
    </div>
  );
}
