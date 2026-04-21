// 365-day activity grid, GitHub-style. Input: Map<YMD, count>.

interface Props {
  activity: Record<string, number>; // "YYYY-MM-DD" -> count
  days?: number;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bucket(n: number): number {
  if (n <= 0) return 0;
  if (n < 5) return 1;
  if (n < 15) return 2;
  if (n < 30) return 3;
  return 4;
}

const LEVEL_CLASSES = [
  "bg-slate-100",
  "bg-green-200",
  "bg-green-400",
  "bg-green-500",
  "bg-green-700",
];

export default function Heatmap({ activity, days = 182 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Align to start of week (Mon=0) `days` ago.
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const startDay = (start.getDay() + 6) % 7; // Mon = 0
  start.setDate(start.getDate() - startDay);

  const weeks: { date: Date; count: number }[][] = [];
  let cur = new Date(start);
  while (cur <= today) {
    const col: { date: Date; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(cur);
      day.setDate(cur.getDate() + i);
      const key = ymd(day);
      const count = day > today ? -1 : activity[key] ?? 0;
      col.push({ date: day, count });
    }
    weeks.push(col);
    cur = new Date(cur);
    cur.setDate(cur.getDate() + 7);
  }

  const total = Object.values(activity).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(activity).filter((n) => n > 0).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{activeDays} active days · {total} reviews</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <span key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => {
                if (cell.count < 0) {
                  return <div key={di} className="w-3 h-3" />;
                }
                const cls = LEVEL_CLASSES[bucket(cell.count)];
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${cls}`}
                    title={`${ymd(cell.date)}: ${cell.count} reviews`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
