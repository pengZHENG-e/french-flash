import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: progressRows } = await supabase
    .from("word_progress")
    .select("word_id, correct_count, wrong_count, mastered")
    .eq("user_id", user.id);

  const progressMap = new Map(progressRows?.map((r) => [r.word_id, r]) ?? []);

  const mastered = vocabulary.filter((w) => progressMap.get(w.id)?.mastered);
  const learning = vocabulary.filter(
    (w) => progressMap.has(w.id) && !progressMap.get(w.id)?.mastered
  );
  const unseen = vocabulary.filter((w) => !progressMap.has(w.id));

  const masteredPct = Math.round((mastered.length / vocabulary.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
        <form action={signOut}>
          <button className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            Sign out
          </button>
        </form>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-sm text-slate-500 mb-1">Overall progress</p>
          <p className="text-3xl font-bold text-slate-900 mb-4">
            {mastered.length} <span className="text-slate-400 font-normal text-xl">/ {vocabulary.length} mastered</span>
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

        {/* Word grid */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">All words</h2>
          <div className="space-y-2">
            {vocabulary.map((word) => {
              const p = progressMap.get(word.id);
              const isMastered = p?.mastered ?? false;
              const isSeen = !!p;
              const correctCount = p?.correct_count ?? 0;

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
                  <div>
                    <span className="font-semibold text-slate-900">{word.french}</span>
                    <span className="text-slate-400 text-sm ml-2">{word.english}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMastered ? (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Mastered
                      </span>
                    ) : isSeen ? (
                      <span className="text-xs text-yellow-700">
                        {correctCount}/3
                      </span>
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
