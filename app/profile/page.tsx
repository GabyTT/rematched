"use client";

import Link from "next/link";

import { useJourney } from "@/components/JourneyProvider";

export default function ProfilePage() {
  const { resetJourneyData } = useJourney();

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
          <button
            type="button"
            onClick={resetJourneyData}
            className="app-button mt-3 inline-flex rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
          >
            Reset journey
          </button>
        </section>
      </div>
    </main>
  );
}
