"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveWordProgress(wordId: number, isCorrect: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("word_progress")
    .select("correct_count, wrong_count")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .single();

  const correctCount = (existing?.correct_count ?? 0) + (isCorrect ? 1 : 0);
  const wrongCount = (existing?.wrong_count ?? 0) + (isCorrect ? 0 : 1);
  const mastered = correctCount >= 3;

  await supabase.from("word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      correct_count: correctCount,
      wrong_count: wrongCount,
      mastered,
      last_answered_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );

  return { correct_count: correctCount, wrong_count: wrongCount, mastered };
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

export async function markWordMastered(wordId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      mastered: true,
      last_answered_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
