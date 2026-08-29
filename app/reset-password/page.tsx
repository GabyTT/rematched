"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
        setErrorMessage(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      // Keep this response account-neutral to avoid exposing registered emails.
      setSuccessMessage("If an account exists for that email, a password reset link is on its way.");
    }

    setIsSubmitting(false);
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Choose a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Password updated. You can now sign in with your new password.");
    setIsSubmitting(false);
    window.setTimeout(() => router.replace("/sign-in"), 1200);
  };

  const inputClassName =
    "app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base text-white outline-none placeholder:text-slate-500";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12 sm:px-8 lg:px-12">
        <section className="page-panel rounded-[32px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Password reset</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isRecoverySession ? "Choose a new password" : "Reset your password"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            {isRecoverySession
              ? "Set a new password for your RevMatched account."
              : "Enter your email and we’ll send a secure password reset link."}
          </p>

          {errorMessage ? <p className="mt-5 rounded-[22px] border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm text-red-100">{errorMessage}</p> : null}
          {successMessage ? <p className="mt-5 rounded-[22px] border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100">{successMessage}</p> : null}
          {successMessage && !isRecoverySession && process.env.NODE_ENV === "development" ? (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Local development emails are captured in{" "}
              <a
                href="http://127.0.0.1:54324"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-white underline underline-offset-4 hover:text-accent"
              >
                Inbucket
              </a>
              , not delivered to Gmail.
            </p>
          ) : null}

          {isRecoverySession ? (
            <form onSubmit={updatePassword} className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">New password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" className={inputClassName} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Confirm password</span>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} autoComplete="new-password" className={inputClassName} />
              </label>
              <button type="submit" disabled={isSubmitting} className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className={inputClassName} />
              </label>
              <button type="submit" disabled={isSubmitting} className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          )}

          <button type="button" onClick={() => router.push("/sign-in")} className="mt-5 text-left text-sm font-semibold text-slate-300 transition hover:text-white">
            Back to sign in
          </button>
        </section>
      </div>
    </main>
  );
}
