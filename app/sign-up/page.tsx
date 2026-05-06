"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useJourney } from "@/components/JourneyProvider";
import {
  readCurrentUserProfile,
  saveProfileForAuthUser,
  type ProfileInput,
} from "@/lib/phase1ProfilePreferences";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown profile error.";
}

export default function SignUpPage() {
  const router = useRouter();
  const { markAuthenticated } = useJourney();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ensureProfile = async (authUserId: string, profile: ProfileInput) => {
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const savedProfile = await saveProfileForAuthUser(
          supabase,
          authUserId,
          profile,
        );
        const confirmedProfile = await readCurrentUserProfile(supabase);

        if (confirmedProfile?.auth_user_id !== authUserId) {
          throw new Error("Profile verification failed after sign-up.");
        }

        return savedProfile;
      } catch (profileError) {
        lastError = profileError;

        if (attempt < 2) {
          await supabase.auth.refreshSession();
          await wait(250 * (attempt + 1));
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Profile could not be created after sign-up.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const normalizedEmail = email.trim();
    const normalizedUserName = userName.trim();

    if (!normalizedUserName) {
      setErrorMessage("Choose a user name to continue.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const authUserId = data.user?.id;

    if (!authUserId) {
      setErrorMessage("Your account was created, but Supabase did not return a user id.");
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      await supabase.auth.setSession(data.session);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setErrorMessage(signInError.message);
        setIsSubmitting(false);
        return;
      }
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user || session.user.id !== authUserId) {
      setErrorMessage(
        sessionError?.message ??
          "Your account was created, but a signed-in Supabase session was not available.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await ensureProfile(authUserId, {
        display_name: normalizedUserName,
        phone: null,
        whatsapp_enabled: false,
      });
    } catch (profileError) {
      console.error(profileError);
      setErrorMessage(
        `Your account was created, but the profile could not be prepared yet. ${getErrorMessage(profileError)}`,
      );
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
            Sign up
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Unlock alerts
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Create a local Supabase account so your Define preferences can be
            saved and loaded during development.
          </p>

          {errorMessage ? (
            <p className="mt-5 rounded-[22px] border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm text-red-100">
              {errorMessage}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                User name
              </span>
              <input
                type="text"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                required
                autoComplete="username"
                className="app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base text-white outline-none placeholder:text-slate-500"
              />
            </label>
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
                minLength={6}
                autoComplete="new-password"
                className="app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
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
              onClick={() => router.push("/sign-in")}
              className="text-left text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Already have an account? Sign in
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
