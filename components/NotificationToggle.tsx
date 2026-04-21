"use client";

import { useEffect, useState } from "react";
import { savePushSubscription, disablePushNotifications } from "@/app/actions";

type State = "idle" | "unsupported" | "denied" | "subscribed" | "working";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr as Uint8Array<ArrayBuffer>;
}

export default function NotificationToggle() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") setState("denied");
    else {
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        if (sub) setState("subscribed");
      });
    }
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      alert("Push notifications are not configured yet (missing VAPID key).");
      return;
    }

    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      });
      setState("subscribed");
    } catch (e) {
      console.error(e);
      setState("idle");
    }
  }

  async function disable() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      await sub?.unsubscribe();
      await disablePushNotifications();
      setState("idle");
    } catch {
      setState("idle");
    }
  }

  if (state === "unsupported") {
    return <p className="text-xs text-slate-400">Push notifications not supported in this browser.</p>;
  }
  if (state === "denied") {
    return <p className="text-xs text-slate-400">Notifications are blocked in your browser settings.</p>;
  }

  return (
    <div className="flex items-center gap-3">
      {state === "subscribed" ? (
        <>
          <span className="text-sm text-slate-600">🔔 Daily reminders on</span>
          <button
            onClick={disable}
            disabled={state === ("working" as State)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Disable
          </button>
        </>
      ) : (
        <button
          onClick={enable}
          disabled={state === ("working" as State)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          🔔 Enable daily reminders
        </button>
      )}
    </div>
  );
}
