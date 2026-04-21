import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut, setDailyGoal } from "@/app/actions";
import { getLevel, LEVEL_RANGES } from "@/data/levels";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: progressRows }, { data: stats }] = await Promise.all([
    supabase
      .from("word_progress")
      .select("word_id, correct_count, wrong_count, mastered, repetitions, next_review_at")
      .eq("user_id", user.id),
    supabase
      .from("user_stats")
      .select("current_streak, longest_streak, daily_goal, today_count, today_date, total_reviews")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const progressMap = new Map(progressRows?.map((r) => [r.word_id, r]) ?? []);
  const mastered = vocabulary.filter((w) => progressMap.get(w.id)?.mastered);
  const learning = vocabulary.filter((w) => progressMap.has(w.id) && !progressMap.get(w.id)?.mastered);
  const unseen = vocabulary.filter((w) => !progressMap.has(w.id));
  const masteredPct = Math.round((mastered.length / vocabulary.length) * 100);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = stats?.today_date === todayStr ? stats?.today_count ?? 0 : 0;
  const dailyGoal = stats?.daily_goal ?? 20;
  const streak = stats?.current_streak ?? 0;
  const longestStreak = stats?.longest_streak ?? 0;
  const totalReviews = stats?.total_reviews ?? 0;

  // Per-level breakdown.
  const levelStats = LEVEL_RANGES.map((range) => {
    const words = vocabulary.filter((w) => w.id >= range.startId && w.id <= range.endId);
    const m = words.filter((w) => progressMap.get(w.id)?.mastered).length;
    return { ...range, total: words.length, mastered: m };
  });

  async function updateGoal(formData: FormData) {
    "use server";
    const v = Number(formData.get("daily_goal"));
    if (!Number.isFinite(v)) return;
    await setDailyGoal(v);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/vocabulary" className="text-slate-600 hover:text-slate-900">Browse</Link>
          <Link href="/review" className="text-slate-600 hover:text-slate-900">Review</Link>
          <form action={signOut}>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Streak + daily goal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Streak</p>
              <p className="text-3xl font-bold text-orange-600">🔥 {streak}</p>
              <p className="text-xs text-slate-400 mt-0.5">Longest: {longestStreak}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</p>
              <p className="text-3xl font-bold text-blue-600">
                {todayCount}<span className="text-slate-300 text-xl">/{dailyGoal}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Total reviews: {totalReviews}</p>
            </div>
          </div>

          <form action={updateGoal} className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <label className="text-xs text-slate-500">Daily goal</label>
            <input
              type="number"
              name="daily_goal"
              defaultValue={dailyGoal}
              min={5}
              max={200}
              step={5}
              className="w-20 px-2 py-1 rounded-md border border-slate-200 text-sm text-center"
            />
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">Save</button>
          </form>
        </div>

        {/* Overall progress */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm text-slate-500 mb-1">Overall progress</p>
          <p className="text-3xl font-bold text-slate-900 mb-4">
            {mastered.length}{" "}
            <span className="text-slate-400 font-normal text-xl">/ {vocabulary.length} mastered</span>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${masteredPct}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <span className="text-slate-600">{mastered.length} mastered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
              <span className="text-slate-600">{learning.length} learning</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
              <span className="text-slate-600">{unseen.length} new</span>
            </span>
          </div>
        </div>

        {/* Per-level breakdown */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            By level
          </h2>
          <div className="space-y-2">
            {levelStats.map((lvl) => {
              const pct = Math.round((lvl.mastered / Math.max(1, lvl.total)) * 100);
              return (
                <Link
                  key={lvl.level}
                  href={`/?level=${lvl.level}`}
                  className="block bg-white rounded-xl p-3 border border-slate-100 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 text-sm">{lvl.label}</span>
                    <span className="text-xs text-slate-500">
                      {lvl.mastered} / {lvl.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* All words */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            All words
          </h2>
          <div className="space-y-2">
            {vocabulary.map((word) => {
              const p = progressMap.get(word.id);
              const isMastered = p?.mastered ?? false;
              const isSeen = !!p;
              const rep = p?.repetitions ?? 0;

              return (
                <div
                  key={word.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    isMastered
                      ? "bg-green-50 border-green-200"
                      : isSeen
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">
                      {getLevel(word.id)}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{word.french}</span>
                      <span className="text-slate-400 text-sm ml-2">{word.english}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isMastered ? (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Mastered
                      </span>
                    ) : isSeen ? (
                      <span className="text-xs text-yellow-700">rep {rep}</span>
                    ) : (
                      <span className="text-xs text-slate-400">New</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
