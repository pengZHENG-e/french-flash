"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeNext, isMastered, type Quality } from "@/lib/srs";
import { vocabulary } from "@/data/vocabulary";
import {
  xpForReview,
  computeUnlocks,
  levelFromXp,
  type Achievement,
  type AchievementStats,
} from "@/lib/xp";

// --- Types -----------------------------------------------------------------

export interface WordProgressSnapshot {
  correct_count: number;
  wrong_count: number;
  mastered: boolean;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string | null;
  last_answered_at: string | null;
}

export interface UnlockedAchievement {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface ReviewResult {
  correct_count: number;
  wrong_count: number;
  mastered: boolean;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  stats: {
    current_streak: number;
    today_count: number;
    today_new_count: number;
    daily_goal: number;
    daily_new_goal: number;
    goal_just_hit: boolean;
    new_goal_just_hit: boolean;
    total_xp: number;
    level: number;
  } | null;
  xp_earned: number;
  new_achievements: UnlockedAchievement[];
  prev_snapshot: WordProgressSnapshot | null;
  was_new: boolean;
}

// --- Helpers ---------------------------------------------------------------

function todayYmd(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

interface BumpStatsOutcome {
  stats: NonNullable<ReviewResult["stats"]>;
  current_streak: number;
  longest_streak: number;
  total_reviews: number;
  goals_hit_total: number;
  level_tests_taken: number;
}

async function bumpStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  wasNew: boolean,
  xpEarned: number
): Promise<BumpStatsOutcome> {
  const { data: existing } = await supabase
    .from("user_stats")
    .select(
      "current_streak, longest_streak, last_activity_date, daily_goal, today_count, today_date, total_reviews, daily_new_goal, today_new_count, total_xp, goals_hit_total, level_tests_taken"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const today = new Date();
  const todayStr = todayYmd(today);
  const yesterdayStr = todayYmd(new Date(today.getTime() - 86_400_000));

  const lastActivity = existing?.last_activity_date ?? null;
  const prevStreak = existing?.current_streak ?? 0;
  const prevLongest = existing?.longest_streak ?? 0;
  const dailyGoal = existing?.daily_goal ?? 20;
  const dailyNewGoal = existing?.daily_new_goal ?? 10;
  const onToday = existing?.today_date === todayStr;
  const prevTodayCount = onToday ? existing?.today_count ?? 0 : 0;
  const prevTodayNewCount = onToday ? existing?.today_new_count ?? 0 : 0;
  const totalReviews = (existing?.total_reviews ?? 0) + 1;
  const prevTotalXp = existing?.total_xp ?? 0;
  const prevGoalsHit = existing?.goals_hit_total ?? 0;

  let currentStreak = prevStreak;
  if (lastActivity === todayStr) {
    // already counted today
  } else if (lastActivity === yesterdayStr) {
    currentStreak = prevStreak + 1;
  } else {
    currentStreak = 1;
  }

  const todayCount = prevTodayCount + 1;
  const todayNewCount = prevTodayNewCount + (wasNew ? 1 : 0);
  const goalJustHit = prevTodayCount < dailyGoal && todayCount >= dailyGoal;
  const newGoalJustHit = wasNew && prevTodayNewCount < dailyNewGoal && todayNewCount >= dailyNewGoal;
  const goalsHitTotal = prevGoalsHit + (goalJustHit ? 1 : 0);
  const totalXp = prevTotalXp + xpEarned;
  const longest = Math.max(prevLongest, currentStreak);

  await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longest,
      last_activity_date: todayStr,
      today_count: todayCount,
      today_new_count: todayNewCount,
      today_date: todayStr,
      daily_goal: dailyGoal,
      daily_new_goal: dailyNewGoal,
      total_reviews: totalReviews,
      total_xp: totalXp,
      goals_hit_total: goalsHitTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return {
    stats: {
      current_streak: currentStreak,
      today_count: todayCount,
      today_new_count: todayNewCount,
      daily_goal: dailyGoal,
      daily_new_goal: dailyNewGoal,
      goal_just_hit: goalJustHit,
      new_goal_just_hit: newGoalJustHit,
      total_xp: totalXp,
      level: levelFromXp(totalXp),
    },
    current_streak: currentStreak,
    longest_streak: longest,
    total_reviews: totalReviews,
    goals_hit_total: goalsHitTotal,
    level_tests_taken: existing?.level_tests_taken ?? 0,
  };
}

async function checkAchievements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  stats: AchievementStats
): Promise<UnlockedAchievement[]> {
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("achievement")
    .eq("user_id", userId);
  const already = new Set((existing ?? []).map((r) => r.achievement));

  const newly = computeUnlocks(stats, already);
  if (newly.length === 0) return [];

  await supabase
    .from("user_achievements")
    .insert(newly.map((a) => ({ user_id: userId, achievement: a.key })));

  return newly.map(({ key, name, description, icon }: Achievement) => ({
    key,
    name,
    description,
    icon,
  }));
}

async function bumpDailyActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  isCorrect: boolean,
  xp: number
) {
  const day = todayYmd();
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("review_count, correct, wrong, xp_earned")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  const reviewCount = (existing?.review_count ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (isCorrect ? 1 : 0);
  const wrong = (existing?.wrong ?? 0) + (isCorrect ? 0 : 1);
  const xpEarned = (existing?.xp_earned ?? 0) + xp;
  await supabase
    .from("daily_activity")
    .upsert(
      { user_id: userId, day, review_count: reviewCount, correct, wrong, xp_earned: xpEarned },
      { onConflict: "user_id,day" }
    );
}

async function countMastered(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("word_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mastered", true);
  return count ?? 0;
}

// --- Public actions --------------------------------------------------------

export async function reviewWord(wordId: number, quality: Quality): Promise<ReviewResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("word_progress")
    .select(
      "correct_count, wrong_count, mastered, ease_factor, interval_days, repetitions, next_review_at, last_answered_at"
    )
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const wasNew = !existing;
  const prevSnapshot: WordProgressSnapshot | null = existing
    ? {
        correct_count: existing.correct_count ?? 0,
        wrong_count: existing.wrong_count ?? 0,
        mastered: existing.mastered ?? false,
        ease_factor: existing.ease_factor ?? 2.5,
        interval_days: existing.interval_days ?? 0,
        repetitions: existing.repetitions ?? 0,
        next_review_at: existing.next_review_at ?? null,
        last_answered_at: existing.last_answered_at ?? null,
      }
    : null;

  const isCorrect = quality >= 3;
  const correctCount = (existing?.correct_count ?? 0) + (isCorrect ? 1 : 0);
  const wrongCount = (existing?.wrong_count ?? 0) + (isCorrect ? 0 : 1);

  const next = computeNext(
    {
      ease_factor: existing?.ease_factor,
      interval_days: existing?.interval_days,
      repetitions: existing?.repetitions,
    },
    quality
  );
  const mastered = isMastered(next);

  const prevMastered = existing?.mastered ?? false;
  const becameMastered = mastered && !prevMastered;

  const xpEarned = xpForReview({ quality, wasNew, becameMastered });

  await supabase.from("word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      correct_count: correctCount,
      wrong_count: wrongCount,
      mastered,
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      next_review_at: next.next_review_at,
      last_answered_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );

  const [bumpOutcome] = await Promise.all([
    bumpStats(supabase, user.id, wasNew, xpEarned),
    bumpDailyActivity(supabase, user.id, isCorrect, xpEarned),
  ]);

  const masteredCount = await countMastered(supabase, user.id);
  const newAchievements = await checkAchievements(supabase, user.id, {
    current_streak: bumpOutcome.current_streak,
    longest_streak: bumpOutcome.longest_streak,
    total_reviews: bumpOutcome.total_reviews,
    mastered_count: masteredCount,
    total_xp: bumpOutcome.stats.total_xp,
    goals_hit_total: bumpOutcome.goals_hit_total,
    level_tests_taken: bumpOutcome.level_tests_taken,
  });

  return {
    correct_count: correctCount,
    wrong_count: wrongCount,
    mastered,
    ...next,
    stats: bumpOutcome.stats,
    xp_earned: xpEarned,
    new_achievements: newAchievements,
    prev_snapshot: prevSnapshot,
    was_new: wasNew,
  };
}

/**
 * Roll a word_progress row back to a previous snapshot (or delete the row
 * when the snapshot is null — meaning the word had never been reviewed).
 * We intentionally do NOT rewind user_stats/daily_activity — that keeps the
 * logic simple and avoids tricky streak edge cases.
 */
export async function undoLastReview(
  wordId: number,
  snapshot: WordProgressSnapshot | null
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (snapshot === null) {
    await supabase
      .from("word_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("word_id", wordId);
    return true;
  }

  await supabase.from("word_progress").upsert(
    { user_id: user.id, word_id: wordId, ...snapshot },
    { onConflict: "user_id,word_id" }
  );
  return true;
}

export async function setDailyGoal(goal: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clamped = Math.max(5, Math.min(200, Math.round(goal)));
  await supabase.from("user_stats").upsert(
    { user_id: user.id, daily_goal: clamped, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function setDailyNewGoal(goal: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clamped = Math.max(0, Math.min(50, Math.round(goal)));
  await supabase.from("user_stats").upsert(
    { user_id: user.id, daily_new_goal: clamped, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export interface OnboardingAnswer {
  word_id: number;
  correct: boolean;
}

export async function completeOnboarding(answers: OnboardingAnswer[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const future2d = new Date(now.getTime() + 2 * 86_400_000);

  const rows = answers.map((a) => ({
    user_id: user.id,
    word_id: a.word_id,
    correct_count: a.correct ? 1 : 0,
    wrong_count: a.correct ? 0 : 1,
    mastered: false,
    ease_factor: a.correct ? 2.5 : 2.3,
    interval_days: a.correct ? 2 : 0,
    repetitions: a.correct ? 1 : 0,
    next_review_at: (a.correct ? future2d : now).toISOString(),
    last_answered_at: now.toISOString(),
  }));

  if (rows.length > 0) {
    await supabase.from("word_progress").upsert(rows, { onConflict: "user_id,word_id" });
  }

  await supabase.from("user_stats").upsert(
    { user_id: user.id, onboarded: true, updated_at: now.toISOString() },
    { onConflict: "user_id" }
  );

  return {
    seeded: answers.filter((a) => a.correct).length,
    total: answers.length,
  };
}

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export interface LevelTestInput {
  answers: { word_id: number; level: CefrLevel; correct: boolean }[];
}

export interface LevelTestResult {
  level: CefrLevel | "PRE";
  correct: number;
  total: number;
  scores: Record<CefrLevel, { correct: number; total: number }>;
}

/**
 * Save a level-test result. Highest level where >=3/4 correct becomes the
 * detected CEFR level; "PRE" means the user didn't hit the threshold even at
 * A1. Also upserts word_progress so correct answers seed the SRS deck.
 */
export async function saveLevelTest(input: LevelTestInput): Promise<LevelTestResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  const scores: Record<CefrLevel, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
  };

  for (const a of input.answers) {
    if (!scores[a.level]) continue;
    scores[a.level].total += 1;
    if (a.correct) scores[a.level].correct += 1;
  }

  let detected: CefrLevel | "PRE" = "PRE";
  for (const l of levels) {
    const s = scores[l];
    if (s.total > 0 && s.correct / s.total >= 0.6) detected = l;
  }

  const correct = input.answers.filter((a) => a.correct).length;
  const total = input.answers.length;

  await supabase.from("level_tests").insert({
    user_id: user.id,
    level: detected,
    correct,
    total,
    scores,
  });

  // Seed SRS state from the answers (similar to onboarding).
  const now = new Date();
  const future2d = new Date(now.getTime() + 2 * 86_400_000);
  const rows = input.answers.map((a) => ({
    user_id: user.id,
    word_id: a.word_id,
    correct_count: a.correct ? 1 : 0,
    wrong_count: a.correct ? 0 : 1,
    mastered: false,
    ease_factor: a.correct ? 2.5 : 2.3,
    interval_days: a.correct ? 2 : 0,
    repetitions: a.correct ? 1 : 0,
    next_review_at: (a.correct ? future2d : now).toISOString(),
    last_answered_at: now.toISOString(),
  }));
  if (rows.length) {
    await supabase.from("word_progress").upsert(rows, { onConflict: "user_id,word_id" });
  }

  // Increment level_tests_taken + trigger achievement checks.
  const { data: stats } = await supabase
    .from("user_stats")
    .select(
      "current_streak, longest_streak, total_reviews, total_xp, goals_hit_total, level_tests_taken"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const newLtTaken = (stats?.level_tests_taken ?? 0) + 1;
  await supabase.from("user_stats").upsert(
    {
      user_id: user.id,
      level_tests_taken: newLtTaken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  const masteredCount = await countMastered(supabase, user.id);
  await checkAchievements(supabase, user.id, {
    current_streak: stats?.current_streak ?? 0,
    longest_streak: stats?.longest_streak ?? 0,
    total_reviews: stats?.total_reviews ?? 0,
    mastered_count: masteredCount,
    total_xp: stats?.total_xp ?? 0,
    goals_hit_total: stats?.goals_hit_total ?? 0,
    level_tests_taken: newLtTaken,
  });

  return { level: detected, correct, total, scores };
}

export async function skipOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_stats").upsert(
    { user_id: user.id, onboarded: true, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function markWordMastered(wordId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 10);

  await supabase.from("word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      mastered: true,
      repetitions: 10,
      ease_factor: 2.8,
      interval_days: 3650,
      next_review_at: farFuture.toISOString(),
      last_answered_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );
}

// --- AI mnemonic -----------------------------------------------------------

export interface MnemonicResult {
  mnemonic: string;
  cached: boolean;
}

export async function getMnemonic(wordId: number): Promise<MnemonicResult | null> {
  const supabase = await createClient();

  const { data: cached } = await supabase
    .from("word_hints")
    .select("mnemonic")
    .eq("word_id", wordId)
    .maybeSingle();
  if (cached?.mnemonic) return { mnemonic: cached.mnemonic, cached: true };

  const word = vocabulary.find((w) => w.id === wordId);
  if (!word) return null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      mnemonic:
        "AI mnemonics require setting ANTHROPIC_API_KEY. Tip: break the word into syllables and link each to a vivid image.",
      cached: false,
    };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `You are helping a Chinese speaker learn French. Write a memorable, vivid Chinese mnemonic (1–2 sentences) that links the sound or shape of the French word to its meaning. Be playful and concrete. No preamble.

Word: ${word.french}
Pronunciation: /${word.pronunciation}/
Meaning (English): ${word.english}
Part of speech: ${word.partOfSpeech}
Context: ${word.explanation}

Return ONLY the mnemonic in Chinese.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { mnemonic: "Mnemonic service is unavailable. Try again later.", cached: false };
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) return { mnemonic: "Could not generate mnemonic.", cached: false };

    await supabase.from("word_hints").upsert(
      { word_id: wordId, mnemonic: text, model: "claude-haiku-4-5" },
      { onConflict: "word_id" }
    );

    return { mnemonic: text, cached: false };
  } catch {
    return { mnemonic: "Mnemonic service error.", cached: false };
  }
}

// --- AI word lookup --------------------------------------------------------

export interface LookupResult {
  french: string;
  english: string;
  partOfSpeech: string;
  note?: string;
}

export async function lookupFrenchWord(word: string): Promise<LookupResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const clean = word.trim().toLowerCase();
  if (!clean || clean.length > 30) return null;
  if (!apiKey) {
    return {
      french: clean,
      english: "(set ANTHROPIC_API_KEY to enable AI lookup)",
      partOfSpeech: "—",
    };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Translate the French word "${clean}" to English. Return compact JSON with keys: "french" (dictionary form, lowercase, with accents), "english" (concise 1-6 word gloss), "partOfSpeech" (one of: noun (m), noun (f), verb, adjective, adverb, exclamation, preposition, conjunction, pronoun), "note" (optional 1-sentence usage hint). Return ONLY the JSON.`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as LookupResult;
    return parsed;
  } catch {
    return null;
  }
}

// --- Verb conjugations -----------------------------------------------------

export interface Conjugation {
  present: Record<string, string>;
  passe_compose: Record<string, string>;
  imparfait: Record<string, string>;
  futur: Record<string, string>;
  subjonctif: Record<string, string>;
}

export async function getConjugation(wordId: number): Promise<Conjugation | null> {
  const supabase = await createClient();

  const { data: cached } = await supabase
    .from("word_conjugations")
    .select("tenses")
    .eq("word_id", wordId)
    .maybeSingle();
  if (cached?.tenses) return cached.tenses as Conjugation;

  const word = vocabulary.find((w) => w.id === wordId);
  if (!word || !word.partOfSpeech.startsWith("verb")) return null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `Return conjugation tables for the French verb "${word.french}" in JSON. Schema:
{
  "present":       {"je":"...","tu":"...","il":"...","nous":"...","vous":"...","ils":"..."},
  "passe_compose": {"je":"j'ai ...","tu":"...","il":"...","nous":"...","vous":"...","ils":"..."},
  "imparfait":     {"je":"...","tu":"...","il":"...","nous":"...","vous":"...","ils":"..."},
  "futur":         {"je":"...","tu":"...","il":"...","nous":"...","vous":"...","ils":"..."},
  "subjonctif":    {"que je":"...","que tu":"...","qu'il":"...","que nous":"...","que vous":"...","qu'ils":"..."}
}

Rules: use elisions (j'ai not je ai). Use the actual verb form, not the verb name. Return ONLY JSON.`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as Conjugation;

    await supabase
      .from("word_conjugations")
      .upsert({ word_id: wordId, tenses: parsed, model: "claude-haiku-4-5" }, { onConflict: "word_id" });

    return parsed;
  } catch {
    return null;
  }
}

// --- Push notifications ----------------------------------------------------

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function savePushSubscription(sub: PushSubscriptionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "user_id,endpoint" }
  );

  await supabase.from("user_stats").upsert(
    { user_id: user.id, notifications_enabled: true, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function disablePushNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  await supabase.from("user_stats").upsert(
    { user_id: user.id, notifications_enabled: false, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function setWeeklyEmail(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_stats").upsert(
    { user_id: user.id, weekly_email_enabled: enabled, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

// --- Auth ------------------------------------------------------------------

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { success: "Account created! Check your email to confirm." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
