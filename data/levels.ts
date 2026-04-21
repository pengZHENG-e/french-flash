// CEFR-style levels derived from the section boundaries in vocabulary.ts.
// Keep in sync if you reorder or insert words in data/vocabulary.ts.

export type Level = "A1" | "A2" | "B1" | "B2" | "C1";

interface LevelRange {
  level: Level;
  label: string;
  startId: number; // inclusive
  endId: number;   // inclusive
}

export const LEVEL_RANGES: LevelRange[] = [
  { level: "A1", label: "Core (A1)",           startId: 1,   endId: 25  },
  { level: "A2", label: "Extended (A2)",       startId: 26,  endId: 86  },
  { level: "B1", label: "Intermediate (B1)",   startId: 87,  endId: 141 },
  { level: "B2", label: "Advanced (B2)",       startId: 142, endId: 171 },
  { level: "C1", label: "Upper Advanced (C1)", startId: 172, endId: 234 },
];

export function getLevel(id: number): Level {
  for (const r of LEVEL_RANGES) {
    if (id >= r.startId && id <= r.endId) return r.level;
  }
  return "C1";
}

export function getLevelLabel(level: Level): string {
  return LEVEL_RANGES.find((r) => r.level === level)?.label ?? level;
}

export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"];
