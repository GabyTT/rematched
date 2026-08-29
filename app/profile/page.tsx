"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useJourney } from "@/components/JourneyProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, resetBuyerJourney } = useJourney();
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const isDevelopment = process.env.NODE_ENV === "development";

  const handleResetBuyerJourney = async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      await resetBuyerJourney();
      router.replace("/find-the-one");
      router.refresh();
    } catch (error) {
      setResetError(
        error instanceof Error ? error.message : "Unable to reset this buyer journey.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-12">
        <section className="page-panel motion-rise-fade motion-delay-1 interactive-panel rounded-[28px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Your preferences and journey settings.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Profile is ready for future account details, saved settings, and
            personalization controls. Your current journey preferences continue
            to power Find The One.
          </p>
          <Link
            href="/find-the-one"
            className="app-button mt-6 inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          >
            Review Find The One
          </Link>
        </section>

        {isDevelopment ? (
          <section className="page-panel rounded-[28px] border border-amber-300/30 bg-amber-300/5 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">
              Developer / Test Tools
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Reset Buyer Journey
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Clear this test account&apos;s preferences, Likes, Passes, Top Picks,
              notes, and Discover progress. Its account, roles, listings, and
              credentials remain unchanged.
            </p>

            {!isAuthenticated ? (
              <p className="mt-4 text-sm font-semibold text-amber-100">
                Sign in with a test account to reset its buyer journey.
              </p>
            ) : isResetConfirmationOpen ? (
              <div className="mt-5 rounded-2xl border border-amber-300/30 bg-black/15 p-4">
                <p className="font-semibold text-white">Reset this buyer journey?</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  This will clear preferences, Likes, Passes, Top Picks, Notes,
                  and Discover progress for this test account.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmationOpen(false)}
                    disabled={isResetting}
                    className="app-button inline-flex rounded-xl border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResetBuyerJourney()}
                    disabled={isResetting}
                    className="app-button inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResetting ? "Resetting…" : "Reset Buyer Journey"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResetConfirmationOpen(true)}
                className="app-button mt-5 inline-flex rounded-xl border border-amber-300/50 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/20"
              >
                Reset Buyer Journey
              </button>
            )}

            {resetError ? (
              <p className="mt-4 text-sm font-semibold text-red-200" role="alert">
                {resetError}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
