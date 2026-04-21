"use client";

import { useEffect, useState } from "react";
import { speak, ttsSupported, prewarmVoices } from "@/lib/tts";

interface Props {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AudioButton({ text, className = "", size = "md" }: Props) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    prewarmVoices();
    setSupported(ttsSupported());
  }, []);

  if (!supported) return null;

  const sizeCls =
    size === "sm" ? "w-7 h-7 text-sm" : size === "lg" ? "w-12 h-12 text-2xl" : "w-9 h-9 text-lg";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={`Play pronunciation for ${text}`}
      className={`${sizeCls} inline-flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-all active:scale-90 ${className}`}
    >
      🔊
    </button>
  );
}
