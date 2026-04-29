"use client";

export interface DailyGoalSummary {
  todayCount: number;
  goal: number;
  newCount: number;
  newGoal: number;
  streak: number;
  correctSession: number;
  totalSession: number;
}

/**
 * Full-card celebration shown the moment the user crosses their daily review
 * goal. Parent is responsible for clearing `summary` (timer + tap-to-close).
 */
export default function DailyGoalCelebration({
  summary,
  onDismiss,
}: {
  summary: DailyGoalSummary | null;
  onDismiss: () => void;
}) {
  if (!summary) return null;
  const accuracy =
    summary.totalSession > 0
      ? Math.round((summary.correctSession / summary.totalSession) * 100)
      : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-yellow-200 max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl">🎯</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daily goal hit!</h2>
          <p className="text-sm text-slate-500 mt-1">
            {summary.todayCount} reviews today · {summary.streak}-day streak
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="font-bold text-blue-700 dark:text-blue-200 text-base">
              {summary.todayCount}
            </p>
            <p className="text-blue-600/70">reviews</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2">
            <p className="font-bold text-purple-700 dark:text-purple-200 text-base">
              {summary.newCount}
            </p>
            <p className="text-purple-600/70">new words</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="font-bold text-green-700 dark:text-green-200 text-base">
              {accuracy === null ? "—" : `${accuracy}%`}
            </p>
            <p className="text-green-600/70">accuracy</p>
          </div>
        </div>

        <p className="text-xs text-slate-400">Tap anywhere to keep going</p>
      </div>
    </div>
  );
}
