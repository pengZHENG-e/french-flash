"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { signOut } from "@/app/actions";

// --- Stats context ---------------------------------------------------------

export interface QuizStats {
  current_streak: number;
  longest_streak: number;
  daily_goal: number;
  daily_new_goal: number;
  today_count: number;
  today_new_count: number;
  total_xp: number;
  level: number;
}

interface StatsCtxValue {
  stats: QuizStats | null;
  setStats: (s: QuizStats | null | ((prev: QuizStats | null) => QuizStats | null)) => void;
}

const StatsContext = createContext<StatsCtxValue | null>(null);

export function useStats(): StatsCtxValue {
  const ctx = useContext(StatsContext);
  if (!ctx) return { stats: null, setStats: () => {} };
  return ctx;
}

// --- Shell -----------------------------------------------------------------

interface AppShellProps {
  signedIn: boolean;
  initialStats: QuizStats | null;
  children: ReactNode;
}

export default function AppShell({ signedIn, initialStats, children }: AppShellProps) {
  const [stats, setStatsState] = useState<QuizStats | null>(initialStats);

  const setStats = useCallback<StatsCtxValue["setStats"]>((next) => {
    setStatsState((prev) =>
      typeof next === "function" ? (next as (p: QuizStats | null) => QuizStats | null)(prev) : next
    );
  }, []);

  return (
    <StatsContext.Provider value={{ stats, setStats }}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppHeader signedIn={signedIn} stats={stats} />
        <main className="flex-1 flex flex-col pb-24">{children}</main>
        <BottomTabBar signedIn={signedIn} />
      </div>
    </StatsContext.Provider>
  );
}

// --- Header ---------------------------------------------------------------

function AppHeader({ signedIn, stats }: { signedIn: boolean; stats: QuizStats | null }) {
  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
        <span className="text-2xl">🇫🇷</span>
        <h1 className="text-lg font-bold text-slate-800 hidden sm:block">French Vocab</h1>
      </Link>

      <div className="flex items-center gap-2">
        {stats && (
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold"
              title={`${stats.total_xp} XP total`}
            >
              ⚡ Lv{stats.level}
            </span>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold"
              title={`Longest streak: ${stats.longest_streak}`}
            >
              🔥 {stats.current_streak}
            </span>
            <span
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold"
              title="Today's review goal"
            >
              🎯 {stats.today_count}/{stats.daily_goal}
            </span>
            {stats.daily_new_goal > 0 && (
              <span
                className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold"
                title="Today's new-word goal"
              >
                ✨ {stats.today_new_count}/{stats.daily_new_goal}
              </span>
            )}
          </div>
        )}
        <ThemeToggle />
        {signedIn ? (
          <form action={signOut}>
            <button className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

// --- Bottom tab bar -------------------------------------------------------

interface Tab {
  href: string;
  label: string;
  icon: string;
  match: (path: string) => boolean;
  requireAuth?: boolean;
}

const TABS: Tab[] = [
  { href: "/",           label: "Today",  icon: "🏠", match: (p) => p === "/" },
  { href: "/vocabulary", label: "Words",  icon: "📚", match: (p) => p.startsWith("/vocabulary") || p.startsWith("/review") },
  { href: "/import",     label: "Import", icon: "📥", match: (p) => p.startsWith("/import") },
  { href: "/progress",   label: "Me",     icon: "👤", match: (p) => p.startsWith("/progress"), requireAuth: true },
];

function BottomTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const visible = TABS.filter((t) => !t.requireAuth || signedIn);
  const cols = visible.length;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      <ul
        className={`grid max-w-xl mx-auto`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {visible.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                  active
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span className={`text-xl leading-none ${active ? "scale-110" : ""} transition-transform`}>
                  {t.icon}
                </span>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
