// Supabase Edge Function — weekly-digest
// Sends a weekly email via Resend to users who opted in.
//
// Deploy:
//   supabase functions deploy weekly-digest
//
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set EMAIL_FROM="French Vocab <hello@yourdomain.com>"
//
// Schedule weekly (Sundays 19:00 UTC, say):
//   select cron.schedule('weekly-digest', '0 19 * * SUN',
//     $$ select net.http_post(
//          url:='https://<project>.functions.supabase.co/weekly-digest',
//          headers:='{"Authorization":"Bearer <anon-or-secret>"}'::jsonb
//        ) $$);

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — this file runs in Deno, not Node; TS checker on Node will complain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "French Vocab <hello@example.com>";

  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Users who opted in.
  const { data: users, error } = await supabase
    .from("user_stats")
    .select("user_id, current_streak, total_reviews, daily_goal")
    .eq("weekly_email_enabled", true);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = new Date();
  const weekAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);

  let sent = 0;
  for (const u of users ?? []) {
    // Auth email lookup.
    const { data: authUser } = await supabase.auth.admin.getUserById(u.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    // Week activity.
    const { data: activity } = await supabase
      .from("daily_activity")
      .select("day, review_count, correct, wrong")
      .eq("user_id", u.user_id)
      .gte("day", weekAgoIso);

    const totalReviews = (activity ?? []).reduce((a, b: any) => a + (b.review_count ?? 0), 0);
    const totalCorrect = (activity ?? []).reduce((a, b: any) => a + (b.correct ?? 0), 0);
    const totalWrong = (activity ?? []).reduce((a, b: any) => a + (b.wrong ?? 0), 0);
    const activeDays = (activity ?? []).filter((a: any) => (a.review_count ?? 0) > 0).length;
    const accuracy =
      totalReviews > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : null;

    // Top 3 missed words this week.
    const { data: missed } = await supabase
      .from("word_progress")
      .select("word_id, wrong_count, last_answered_at")
      .eq("user_id", u.user_id)
      .gt("wrong_count", 0)
      .gte("last_answered_at", new Date(now.getTime() - 7 * 86_400_000).toISOString())
      .order("wrong_count", { ascending: false })
      .limit(3);

    const html = `
      <div style="font-family: -apple-system, system-ui, Segoe UI, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
        <h1 style="font-size: 20px;">Your French week 🇫🇷</h1>
        <p>Here's how you did this week:</p>
        <ul>
          <li><strong>${totalReviews}</strong> reviews across <strong>${activeDays}</strong> day${activeDays === 1 ? "" : "s"}</li>
          <li>Accuracy: <strong>${accuracy ?? "—"}${accuracy === null ? "" : "%"}</strong></li>
          <li>Current streak: <strong>🔥 ${u.current_streak}</strong></li>
        </ul>
        ${missed && missed.length ? `<p>Words to revisit: <strong>${missed.map((m: any) => `#${m.word_id}`).join(", ")}</strong></p>` : ""}
        <p><a href="https://${Deno.env.get("APP_HOST") ?? "your-app.vercel.app"}/review">Start today's review →</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Disable weekly digests from your account settings.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Your French week — summary",
        html,
      }),
    });
    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent, total: users?.length ?? 0 }), {
    headers: { "content-type": "application/json" },
  });
});
