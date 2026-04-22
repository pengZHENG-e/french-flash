import type { Quality } from "@/lib/srs";

// --- Level curve ----------------------------------------------------------
// level = floor(sqrt(xp / 50))
// xp_for_level(n) = 50 * n^2
//   1 →    50    |   5 →  1250
//   2 →   200    |  10 →  5000
//   3 →   450    |  20 → 20000
//   4 →   800    |  50 →125000

export function levelFromXp(xp: number): number {
  return Math.max(0, Math.floor(Math.sqrt(Math.max(0, xp) / 50)));
}

export function xpForLevel(level: number): number {
  return 50 * level * level;
}

export function levelProgress(xp: number): { level: number; intoLevel: number; needForNext: number; pct: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const intoLevel = xp - base;
  const needForNext = next - base;
  return {
    level,
    intoLevel,
    needForNext,
    pct: needForNext > 0 ? Math.round((intoLevel / needForNext) * 100) : 100,
  };
}

// --- Per-review XP --------------------------------------------------------

export interface XpInput {
  quality: Quality;
  wasNew: boolean;
  becameMastered: boolean;
}

export function xpForReview({ quality, wasNew, becameMastered }: XpInput): number {
  const base = quality === 0 ? 2 : quality === 3 ? 5 : quality === 4 ? 10 : 15;
  let bonus = 0;
  if (wasNew && quality >= 3) bonus += 5;
  if (becameMastered) bonus += 50;
  return base + bonus;
}

// --- Achievements ---------------------------------------------------------

export interface AchievementStats {
  current_streak: number;
  longest_streak: number;
  total_reviews: number;
  mastered_count: number;
  total_xp: number;
  goals_hit_total: number;
  level_tests_taken: number;
}

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlock: (s: AchievementStats) => boolean;
  category: "reviews" | "streak" | "mastery" | "xp" | "milestone";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Reviews
  { key: "reviews_10",   category: "reviews",  icon: "🌱", name: "Premier pas",       description: "Answer 10 questions",        unlock: (s) => s.total_reviews >= 10 },
  { key: "reviews_100",  category: "reviews",  icon: "💯", name: "Centaine",          description: "Answer 100 questions",       unlock: (s) => s.total_reviews >= 100 },
  { key: "reviews_500",  category: "reviews",  icon: "📖", name: "Assidu",            description: "Answer 500 questions",       unlock: (s) => s.total_reviews >= 500 },
  { key: "reviews_1000", category: "reviews",  icon: "🏅", name: "Millier",           description: "Answer 1000 questions",      unlock: (s) => s.total_reviews >= 1000 },

  // Streaks
  { key: "streak_3",   category: "streak", icon: "🔥",    name: "Trois jours", description: "3-day streak",   unlock: (s) => s.longest_streak >= 3   || s.current_streak >= 3   },
  { key: "streak_7",   category: "streak", icon: "🔥",    name: "Une semaine", description: "7-day streak",   unlock: (s) => s.longest_streak >= 7   || s.current_streak >= 7   },
  { key: "streak_30",  category: "streak", icon: "🔥🔥",  name: "Un mois",     description: "30-day streak",  unlock: (s) => s.longest_streak >= 30  || s.current_streak >= 30  },
  { key: "streak_100", category: "streak", icon: "🔥🔥🔥", name: "Cent jours", description: "100-day streak", unlock: (s) => s.longest_streak >= 100 || s.current_streak >= 100 },

  // Mastery
  { key: "mastered_10",  category: "mastery", icon: "🎓", name: "Dix mots",     description: "Master 10 words",   unlock: (s) => s.mastered_count >= 10  },
  { key: "mastered_50",  category: "mastery", icon: "🎓", name: "Cinquante",    description: "Master 50 words",   unlock: (s) => s.mastered_count >= 50  },
  { key: "mastered_100", category: "mastery", icon: "🎓", name: "Centurion",    description: "Master 100 words",  unlock: (s) => s.mastered_count >= 100 },
  { key: "mastered_250", category: "mastery", icon: "📚", name: "Vocabulaire",  description: "Master 250 words",  unlock: (s) => s.mastered_count >= 250 },
  { key: "mastered_500", category: "mastery", icon: "📚", name: "Lexique",      description: "Master 500 words",  unlock: (s) => s.mastered_count >= 500 },

  // XP
  { key: "xp_500",    category: "xp", icon: "⭐",    name: "Apprenti",   description: "Earn 500 XP",    unlock: (s) => s.total_xp >=   500 },
  { key: "xp_2000",   category: "xp", icon: "⭐⭐",  name: "Élève",      description: "Earn 2,000 XP",  unlock: (s) => s.total_xp >=  2000 },
  { key: "xp_10000",  category: "xp", icon: "⭐⭐⭐", name: "Maître",    description: "Earn 10,000 XP", unlock: (s) => s.total_xp >= 10000 },

  // Milestones
  { key: "goal_hit_1",  category: "milestone", icon: "🎯", name: "Première cible", description: "Hit your daily goal once",      unlock: (s) => s.goals_hit_total >= 1  },
  { key: "goal_hit_7",  category: "milestone", icon: "🎯", name: "Discipliné",     description: "Hit your daily goal 7 times",   unlock: (s) => s.goals_hit_total >= 7  },
  { key: "goal_hit_30", category: "milestone", icon: "🎯", name: "Routine",        description: "Hit your daily goal 30 times",  unlock: (s) => s.goals_hit_total >= 30 },
  { key: "level_test",  category: "milestone", icon: "📝", name: "Évaluation",     description: "Complete a level test",         unlock: (s) => s.level_tests_taken >= 1 },
];

export function computeUnlocks(stats: AchievementStats, alreadyUnlocked: Set<string>): Achievement[] {
  const out: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(a.key)) continue;
    if (a.unlock(stats)) out.push(a);
  }
  return out;
}
