import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { getLevel } from "@/data/levels";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const vocabById = new Map(vocabulary.map((w) => [w.id, w]));
  const nowIso = new Date().toISOString();

  const [{ data: dueRows }, { data: wrongRows }, { data: stats }] = await Promise.all([
    supabase
      .from("word_progress")
      .select("word_id, next_review_at, interval_days, repetitions")
      .eq("user_id", user.id)
      .eq("mastered", false)
      .lte("next_review_at", nowIso)
      .order("next_review_at", { ascending: true })
      .limit(100),
    supabase
      .from("word_progress")
      .select("word_id, wrong_count, correct_count, last_answered_at")
      .eq("user_id", user.id)
      .gt("wrong_count", 0)
      .order("last_answered_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_stats")
      .select("current_streak, longest_streak, daily_goal, today_count, today_date, total_reviews")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = stats?.today_date === todayStr ? stats?.today_count ?? 0 : 0;
  const dailyGoal = stats?.daily_goal ?? 20;
  const streak = stats?.current_streak ?? 0;
  const longestStreak = stats?.longest_streak ?? 0;
  const totalReviews = stats?.total_reviews ?? 0;
  const goalPct = Math.min(100, Math.round((todayCount / Math.max(1, dailyGoal)) * 100));

  const dueList = (dueRows ?? []).map((r) => ({ row: r, word: vocabById.get(r.word_id)! })).filter((x) => x.word);
  const wrongList = (wrongRows ?? []).map((r) => ({ row: r, word: vocabById.get(r.word_id)! })).filter((x) => x.word);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/vocabulary" className="text-slate-600 hover:text-slate-900">Browse</Link>
          <Link href="/progress" className="text-blue-600 hover:text-blue-800 font-medium">Progress</Link>
          <form action={signOut}>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Streak + daily goal card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current streak</p>
              <p className="text-3xl font-bold text-orange-600">🔥 {streak}</p>
              <p className="text-xs text-slate-400 mt-0.5">Longest: {longestStreak} · Total reviews: {totalReviews}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</p>
              <p className="text-3xl font-bold text-blue-600">{todayCount}<span className="text-slate-300 text-xl">/{dailyGoal}</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/?mode=due"
            className={`rounded-2xl p-4 border-2 flex flex-col items-start transition-all ${
              dueList.length > 0
                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 border-slate-200 text-slate-400 pointer-events-none"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Due today</span>
            <span className="text-3xl font-bold mt-1">{dueList.length}</span>
            <span className="text-xs opacity-80 mt-1">
              {dueList.length === 0 ? "Nothing due — come back later" : "Start SRS review →"}
            </span>
          </Link>
          <Link
            href="/?mode=wrong"
            className={`rounded-2xl p-4 border-2 flex flex-col items-start transition-all ${
              wrongList.length > 0
                ? "bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
                : "bg-slate-100 border-slate-200 text-slate-400 pointer-events-none"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Recent mistakes</span>
            <span className="text-3xl font-bold mt-1">{wrongList.length}</span>
            <span className="text-xs opacity-80 mt-1">
              {wrongList.length === 0 ? "No errors yet" : "Focus on weak spots →"}
            </span>
          </Link>
        </div>

        <Link
          href="/"
          className="block text-center py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-all text-sm"
        >
          Learn new words →
        </Link>

        {/* Due list preview */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Due today
          </h2>
          {dueList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nothing due right now ✨</p>
          ) : (
            <div className="space-y-1">
              {dueList.slice(0, 20).map(({ word, row }) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between rounded-xl px-4 py-2 bg-white border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">{getLevel(word.id, word.level)}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{word.french}</span>
                      <span className="text-slate-500 text-sm ml-2 truncate">{word.english}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">rep {row.repetitions ?? 0}</span>
                </div>
              ))}
              {dueList.length > 20 && (
                <p className="text-xs text-slate-400 text-center mt-2">+ {dueList.length - 20} more</p>
              )}
            </div>
          )}
        </section>

        {/* Recent mistakes list */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Recent mistakes
          </h2>
          {wrongList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No mistakes tracked yet.</p>
          ) : (
            <div className="space-y-1">
              {wrongList.slice(0, 20).map(({ word, row }) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between rounded-xl px-4 py-2 bg-white border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">{getLevel(word.id, word.level)}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{word.french}</span>
                      <span className="text-slate-500 text-sm ml-2 truncate">{word.english}</span>
                    </div>
                  </div>
                  <span className="text-xs text-red-500 shrink-0">
                    {row.wrong_count}✗ · {row.correct_count}✓
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
