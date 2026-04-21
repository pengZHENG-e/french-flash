"use client";

import { useTransition } from "react";
import { setWeeklyEmail } from "@/app/actions";
import NotificationToggle from "@/components/NotificationToggle";

export default function NotificationPrefs({ weeklyEnabled }: { weeklyEnabled: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggleWeekly() {
    startTransition(async () => {
      await setWeeklyEmail(!weeklyEnabled);
      // page revalidates via the enclosing server component on next nav.
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Reminders
      </h2>
      <NotificationToggle />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-sm text-slate-600">📧 Weekly email digest</span>
        <button
          onClick={toggleWeekly}
          disabled={pending}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            weeklyEnabled
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {weeklyEnabled ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
