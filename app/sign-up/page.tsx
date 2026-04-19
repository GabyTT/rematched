"use client";

import { useRouter } from "next/navigation";

import { useJourney } from "@/components/JourneyProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { markAuthenticated } = useJourney();

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
            This MVP entry point marks the session as signed in so you can keep
            testing the guest gate and follow-up experience without leaving the
            app.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                markAuthenticated();
                router.push("/discover");
              }}
              className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => router.push("/discover")}
              className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
            >
              Back to browsing
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
