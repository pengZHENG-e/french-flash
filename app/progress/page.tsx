import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut, setDailyGoal, setDailyNewGoal } from "@/app/actions";
import { getLevel, LEVEL_RANGES } from "@/data/levels";
import Heatmap from "@/components/Heatmap";
import NotificationPrefs from "@/components/NotificationPrefs";

const POS_BUCKETS: { key: string; label: string; match: (pos: string) => boolean }[] = [
  { key: "noun",        label: "Nouns",       match: (p) => p.startsWith("noun")   },
  { key: "verb",        label: "Verbs",       match: (p) => p === "verb"           },
  { key: "adjective",   label: "Adjectives",  match: (p) => p === "adjective"      },
  { key: "adverb",      label: "Adverbs",     match: (p) => p === "adverb"         },
  { key: "exclamation", label: "Expressions", match: (p) => p === "exclamation"    },
];

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 181);
  const sinceIso = sinceDate.toISOString().slice(0, 10);

  const [{ data: progressRows }, { data: stats }, { data: activityRows }] = await Promise.all([
    supabase
      .from("word_progress")
      .select("word_id, correct_count, wrong_count, mastered, repetitions, next_review_at")
      .eq("user_id", user.id),
    supabase
      .from("user_stats")
      .select(
        "current_streak, longest_streak, daily_goal, daily_new_goal, today_count, today_new_count, today_date, total_reviews, weekly_email_enabled"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("daily_activity")
      .select("day, review_count")
      .eq("user_id", user.id)
      .gte("day", sinceIso),
  ]);

  const progressMap = new Map(progressRows?.map((r) => [r.word_id, r]) ?? []);
  const mastered = vocabulary.filter((w) => progressMap.get(w.id)?.mastered);
  const learning = vocabulary.filter((w) => progressMap.has(w.id) && !progressMap.get(w.id)?.mastered);
  const unseen = vocabulary.filter((w) => !progressMap.has(w.id));
  const masteredPct = Math.round((mastered.length / vocabulary.length) * 100);

  const todayStr = new Date().toISOString().slice(0, 10);
  const onToday = stats?.today_date === todayStr;
  const todayCount = onToday ? stats?.today_count ?? 0 : 0;
  const todayNewCount = onToday ? stats?.today_new_count ?? 0 : 0;
  const dailyGoal = stats?.daily_goal ?? 20;
  const dailyNewGoal = stats?.daily_new_goal ?? 10;
  const streak = stats?.current_streak ?? 0;
  const longestStreak = stats?.longest_streak ?? 0;
  const totalReviews = stats?.total_reviews ?? 0;

  // Level breakdown
  const levelStats = LEVEL_RANGES.map((range) => {
    const words = vocabulary.filter((w) => w.id >= range.startId && w.id <= range.endId);
    const m = words.filter((w) => progressMap.get(w.id)?.mastered).length;
    return { ...range, total: words.length, mastered: m };
  });

  // POS accuracy
  const posAccuracy = POS_BUCKETS.map((b) => {
    const words = vocabulary.filter((w) => b.match(w.partOfSpeech));
    let correct = 0;
    let wrong = 0;
    for (const w of words) {
      const p = progressMap.get(w.id);
      correct += p?.correct_count ?? 0;
      wrong += p?.wrong_count ?? 0;
    }
    const total = correct + wrong;
    const pct = total === 0 ? null : Math.round((correct / total) * 100);
    return { ...b, total_words: words.length, answered: total, correct, wrong, pct };
  });

  // Heatmap activity map
  const activity: Record<string, number> = {};
  for (const row of activityRows ?? []) {
    activity[row.day] = row.review_count ?? 0;
  }

  async function updateGoal(formData: FormData) {
    "use server";
    const v = Number(formData.get("daily_goal"));
    if (Number.isFinite(v)) await setDailyGoal(v);
  }
  async function updateNewGoal(formData: FormData) {
    "use server";
    const v = Number(formData.get("daily_new_goal"));
    if (Number.isFinite(v)) await setDailyNewGoal(v);
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
          <Link href="/import" className="text-slate-600 hover:text-slate-900">Import</Link>
          <form action={signOut}>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Streak + goals */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Streak</p>
              <p className="text-3xl font-bold text-orange-600">🔥 {streak}</p>
              <p className="text-xs text-slate-400 mt-0.5">Longest: {longestStreak}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reviews today</p>
              <p className="text-3xl font-bold text-blue-600">
                {todayCount}<span className="text-slate-300 text-xl">/{dailyGoal}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Total: {totalReviews}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New today</p>
              <p className="text-3xl font-bold text-purple-600">
                {todayNewCount}<span className="text-slate-300 text-xl">/{dailyNewGoal}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Fresh words</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <form action={updateGoal} className="flex items-center gap-2">
              <label className="text-xs text-slate-500 flex-1">Review goal</label>
              <input type="number" name="daily_goal" defaultValue={dailyGoal} min={5} max={200} step={5} className="w-16 px-2 py-1 rounded-md border border-slate-200 text-sm text-center" />
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">Save</button>
            </form>
            <form action={updateNewGoal} className="flex items-center gap-2">
              <label className="text-xs text-slate-500 flex-1">New-word goal</label>
              <input type="number" name="daily_new_goal" defaultValue={dailyNewGoal} min={0} max={50} step={1} className="w-16 px-2 py-1 rounded-md border border-slate-200 text-sm text-center" />
              <button className="text-xs font-semibold text-purple-600 hover:text-purple-800">Save</button>
            </form>
          </div>
        </div>

        {/* Notification prefs */}
        <NotificationPrefs weeklyEnabled={stats?.weekly_email_enabled ?? false} />

        {/* Heatmap */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Activity (last 26 weeks)
          </h2>
          <Heatmap activity={activity} />
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
          <div className="flex flex-wrap gap-4 text-sm">
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

        {/* POS accuracy */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Accuracy by part of speech
          </h2>
          <div className="space-y-3">
            {posAccuracy.map((p) => (
              <div key={p.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{p.label}</span>
                  <span className="text-slate-500">
                    {p.pct === null ? "—" : `${p.pct}%`}
                    <span className="text-slate-300 text-xs ml-2">
                      {p.correct}✓ · {p.wrong}✗
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      p.pct === null
                        ? "bg-slate-200"
                        : p.pct >= 80
                        ? "bg-green-500"
                        : p.pct >= 60
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${p.pct ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-level */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">By level</h2>
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
                    <span className="text-xs text-slate-500">{lvl.mastered} / {lvl.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* All words */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">All words</h2>
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
                    <span className="text-xs font-semibold text-slate-400 w-8 shrink-0">{getLevel(word.id, word.level)}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{word.french}</span>
                      <span className="text-slate-400 text-sm ml-2">{word.english}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isMastered ? (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Mastered</span>
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
