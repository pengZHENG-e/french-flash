import QuizCard from "@/components/QuizCard";
import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { LEVEL_RANGES, type Level } from "@/data/levels";

type RawSearchParams = { [k: string]: string | string[] | undefined };

interface QueueInfo {
  ids: number[];
  label: string | null;
}

async function buildQueue(params: RawSearchParams): Promise<QueueInfo> {
  const mode = typeof params.mode === "string" ? params.mode : undefined;
  const level = typeof params.level === "string" ? (params.level as Level) : undefined;
  const queue = typeof params.queue === "string" ? params.queue : undefined;

  if (queue) {
    const ids = queue
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length) return { ids, label: "Custom set" };
  }

  if (level) {
    const range = LEVEL_RANGES.find((r) => r.level === level);
    if (range) {
      const ids = vocabulary
        .filter((w) => w.id >= range.startId && w.id <= range.endId)
        .map((w) => w.id);
      return { ids, label: range.label };
    }
  }

  if (mode === "due" || mode === "wrong") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ids: [], label: null };

    if (mode === "due") {
      const { data } = await supabase
        .from("word_progress")
        .select("word_id, next_review_at")
        .eq("user_id", user.id)
        .eq("mastered", false)
        .lte("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(100);
      return { ids: data?.map((r) => r.word_id) ?? [], label: "Due today" };
    }

    const { data } = await supabase
      .from("word_progress")
      .select("word_id, last_answered_at, wrong_count")
      .eq("user_id", user.id)
      .gt("wrong_count", 0)
      .order("last_answered_at", { ascending: false })
      .limit(50);
    return { ids: data?.map((r) => r.word_id) ?? [], label: "Recent mistakes" };
  }

  return { ids: [], label: null };
}

async function loadServerState() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { stats: null, seenIds: [] as number[] };

  const [{ data: stats }, { data: progressRows }] = await Promise.all([
    supabase
      .from("user_stats")
      .select(
        "current_streak, longest_streak, daily_goal, daily_new_goal, today_count, today_new_count, today_date"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("word_progress").select("word_id").eq("user_id", user.id),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const onToday = stats?.today_date === todayStr;

  return {
    stats: {
      current_streak: stats?.current_streak ?? 0,
      longest_streak: stats?.longest_streak ?? 0,
      daily_goal: stats?.daily_goal ?? 20,
      daily_new_goal: stats?.daily_new_goal ?? 10,
      today_count: onToday ? stats?.today_count ?? 0 : 0,
      today_new_count: onToday ? stats?.today_new_count ?? 0 : 0,
    },
    seenIds: progressRows?.map((r) => r.word_id) ?? [],
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const [queue, server] = await Promise.all([buildQueue(params), loadServerState()]);

  return (
    <QuizCard
      initialQueue={queue.ids.length ? queue.ids : null}
      queueLabel={queue.label}
      initialStats={server.stats}
      initialSeenIds={server.seenIds}
    />
  );
}
