"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeNext, isMastered, type Quality } from "@/lib/srs";

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
    daily_goal: number;
    goal_just_hit: boolean;
  } | null;
}

// Compute streak & daily-goal state. Called inside reviewWord so a single
// answer updates both word_progress and user_stats.
async function bumpStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ReviewResult["stats"]> {
  const { data: existing } = await supabase
    .from("user_stats")
    .select("current_streak, longest_streak, last_activity_date, daily_goal, today_count, today_date, total_reviews")
    .eq("user_id", userId)
    .maybeSingle();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);

  const lastActivity = existing?.last_activity_date ?? null;
  const prevStreak = existing?.current_streak ?? 0;
  const prevLongest = existing?.longest_streak ?? 0;
  const dailyGoal = existing?.daily_goal ?? 20;
  const prevTodayCount = existing?.today_date === todayStr ? existing?.today_count ?? 0 : 0;
  const totalReviews = (existing?.total_reviews ?? 0) + 1;

  let currentStreak = prevStreak;
  if (lastActivity === todayStr) {
    // already counted today — streak stays
  } else if (lastActivity === yesterdayStr) {
    currentStreak = prevStreak + 1;
  } else {
    currentStreak = 1;
  }

  const todayCount = prevTodayCount + 1;
  const goalJustHit = prevTodayCount < dailyGoal && todayCount >= dailyGoal;

  await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: Math.max(prevLongest, currentStreak),
      last_activity_date: todayStr,
      today_count: todayCount,
      today_date: todayStr,
      daily_goal: dailyGoal,
      total_reviews: totalReviews,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return {
    current_streak: currentStreak,
    today_count: todayCount,
    daily_goal: dailyGoal,
    goal_just_hit: goalJustHit,
  };
}

export async function reviewWord(wordId: number, quality: Quality): Promise<ReviewResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("word_progress")
    .select("correct_count, wrong_count, ease_factor, interval_days, repetitions")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

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

  const stats = await bumpStats(supabase, user.id);

  return {
    correct_count: correctCount,
    wrong_count: wrongCount,
    mastered,
    ...next,
    stats,
  };
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

export async function markWordMastered(wordId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Push the review date far into the future so the card won't resurface.
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
