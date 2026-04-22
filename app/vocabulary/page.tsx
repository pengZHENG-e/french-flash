import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import AppShell from "@/components/AppShell";
import VocabBrowser from "./VocabBrowser";

type SearchParams = { [k: string]: string | string[] | undefined };

async function loadShellStats(supabase: Awaited<ReturnType<typeof createClient>>, userId: string | null) {
  if (!userId) return null;
  const { data: stats } = await supabase
    .from("user_stats")
    .select(
      "current_streak, longest_streak, daily_goal, daily_new_goal, today_count, today_new_count, today_date"
    )
    .eq("user_id", userId)
    .maybeSingle();
  const todayStr = new Date().toISOString().slice(0, 10);
  const onToday = stats?.today_date === todayStr;
  return {
    current_streak: stats?.current_streak ?? 0,
    longest_streak: stats?.longest_streak ?? 0,
    daily_goal: stats?.daily_goal ?? 20,
    daily_new_goal: stats?.daily_new_goal ?? 10,
    today_count: onToday ? stats?.today_count ?? 0 : 0,
    today_new_count: onToday ? stats?.today_new_count ?? 0 : 0,
  };
}

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const rawTab = typeof params.tab === "string" ? params.tab : null;
  const initialTab =
    rawTab === "due" || rawTab === "mistakes" || rawTab === "all" ? rawTab : "all";

  let masteredIds: number[] = [];
  let seenIds: number[] = [];
  let dueIds: number[] = [];
  let wrongWords: { word_id: number; wrong_count: number; correct_count: number }[] = [];

  if (user) {
    const nowIso = new Date().toISOString();
    const [progress, due, wrongs] = await Promise.all([
      supabase.from("word_progress").select("word_id, mastered").eq("user_id", user.id),
      supabase
        .from("word_progress")
        .select("word_id, next_review_at")
        .eq("user_id", user.id)
        .eq("mastered", false)
        .lte("next_review_at", nowIso)
        .order("next_review_at", { ascending: true })
        .limit(200),
      supabase
        .from("word_progress")
        .select("word_id, wrong_count, correct_count, last_answered_at")
        .eq("user_id", user.id)
        .gt("wrong_count", 0)
        .order("last_answered_at", { ascending: false })
        .limit(50),
    ]);
    masteredIds = progress.data?.filter((r) => r.mastered).map((r) => r.word_id) ?? [];
    seenIds = progress.data?.map((r) => r.word_id) ?? [];
    dueIds = due.data?.map((r) => r.word_id) ?? [];
    wrongWords = wrongs.data ?? [];
  }

  const stats = await loadShellStats(supabase, user?.id ?? null);

  return (
    <AppShell signedIn={!!user} initialStats={stats}>
      <VocabBrowser
        words={vocabulary}
        masteredIds={masteredIds}
        seenIds={seenIds}
        dueIds={dueIds}
        wrongWords={wrongWords}
        signedIn={!!user}
        initialTab={initialTab}
      />
    </AppShell>
  );
}
