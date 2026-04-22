import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import AppShell from "@/components/AppShell";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let masteredIds: number[] = [];
  let seenIds: number[] = [];
  let stats = null;
  if (user) {
    const [{ data: progress }, { data: s }] = await Promise.all([
      supabase.from("word_progress").select("word_id, mastered").eq("user_id", user.id),
      supabase
        .from("user_stats")
        .select("current_streak, longest_streak, daily_goal, daily_new_goal, today_count, today_new_count, today_date")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    masteredIds = progress?.filter((r) => r.mastered).map((r) => r.word_id) ?? [];
    seenIds = progress?.map((r) => r.word_id) ?? [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const onToday = s?.today_date === todayStr;
    stats = {
      current_streak: s?.current_streak ?? 0,
      longest_streak: s?.longest_streak ?? 0,
      daily_goal: s?.daily_goal ?? 20,
      daily_new_goal: s?.daily_new_goal ?? 10,
      today_count: onToday ? s?.today_count ?? 0 : 0,
      today_new_count: onToday ? s?.today_new_count ?? 0 : 0,
    };
  }

  return (
    <AppShell signedIn={!!user} initialStats={stats}>
      <ImportClient
        vocabulary={vocabulary}
        masteredIds={masteredIds}
        seenIds={seenIds}
        signedIn={!!user}
      />
    </AppShell>
  );
}
