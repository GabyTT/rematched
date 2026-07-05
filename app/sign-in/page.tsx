"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useJourney } from "@/components/JourneyProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const { markAuthenticated } = useJourney();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    markAuthenticated();
    router.push("/discover");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12 sm:px-8 lg:px-12">
        <section className="page-panel rounded-[32px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Sign in
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Sign in to keep your Define preferences synced while you continue
            testing the flow.
          </p>

          {errorMessage ? (
            <p className="mt-5 rounded-[22px] border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm text-red-100">
              {errorMessage}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/discover")}
                className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
              >
                Back to browsing
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/sign-up")}
              className="text-left text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Need an account? Create one
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
