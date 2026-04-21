// Server endpoint to send a web-push to a user's devices.
//
// Prerequisites (set in Vercel env):
//   VAPID_PUBLIC_KEY         - matches NEXT_PUBLIC_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT            - mailto:you@example.com
//   NOTIFY_CRON_SECRET       - shared secret for cron callers
//
// POST body: { userId: string, title: string, body: string, url?: string }
//
// This route uses `web-push` (optional dep). Install with:
//   bun add web-push
//   bun add -d @types/web-push
//
// Call this weekly/daily from a cron scheduler (Vercel Cron, Supabase pg_cron,
// cron-job.org, etc.) with header `Authorization: Bearer $NOTIFY_CRON_SECRET`.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.NOTIFY_CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { userId, title, body, url } = (await req.json()) as {
    userId?: string;
    title?: string;
    body?: string;
    url?: string;
  };
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured — required to read push_subscriptions" },
      { status: 500 }
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no subscriptions" });
  }

  // Dynamic import to avoid a hard dependency at build time.
  // Install with: `bun add web-push && bun add -d @types/web-push`
  let webpush: {
    setVapidDetails: (sub: string, pub: string, priv: string) => void;
    sendNotification: (sub: unknown, payload: string) => Promise<unknown>;
  };
  try {
    webpush = (await import(/* webpackIgnore: true */ "web-push" as string)) as never;
  } catch {
    return NextResponse.json(
      { error: "web-push package not installed. Run: bun add web-push" },
      { status: 500 }
    );
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY!;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY!;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      sent++;
    } catch (e: unknown) {
      // Common: subscription expired → delete row.
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }

  return NextResponse.json({ sent });
}
