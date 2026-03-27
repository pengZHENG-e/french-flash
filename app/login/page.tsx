"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/actions";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = mode === "signin" ? await signIn(formData) : await signUp(formData);

    setLoading(false);
    if (result?.error) setError(result.error);
    if (result && "success" in result) setSuccess(result.success);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-2xl">🇫🇷</span>
          <h1 className="text-lg font-bold text-slate-800">French Vocab</h1>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {mode === "signin"
                ? "Sign in to track your vocabulary progress."
                : "Start tracking which words you've mastered."}
            </p>

            {/* Mode toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 text-sm"
              >
                {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
