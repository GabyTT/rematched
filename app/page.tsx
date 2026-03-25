import Link from "next/link";
import { ArrowRightLeft, Heart, Wrench } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-input bg-[radial-gradient(circle_at_top_left,rgba(209,19,58,0.16),transparent_28%),linear-gradient(180deg,#011118_0%,#000000_72%)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-16">
          <div className="max-w-3xl">
            <span
              className="motion-rise-fade motion-delay-0 inline-flex rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300"
            >
              REVMATCHED
            </span>
            <h1
              className="motion-rise-fade motion-delay-1 mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Good looks matter. So does real compatibility.
            </h1>
            <p
              className="motion-rise-fade motion-delay-2 mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg"
            >
              RevMatched helps you find a car that fits your budget, your
              routine, and the road ahead — not just your wish list.
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-4 lg:items-end">
            <Link
              href="/find-the-one"
              className="motion-rise-fade motion-delay-3 card-cta app-button inline-flex min-h-15 w-full items-center justify-center rounded-full bg-accent px-8 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(209,19,58,0.28)] hover:brightness-110 lg:w-auto"
            >
              Enter Find The One
            </Link>
            <p
              className="motion-rise-fade motion-delay-4 text-sm text-slate-400 lg:max-w-xs lg:text-right"
            >
              Start with Define, then move through Discover, Like, and Engage.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-3 lg:items-stretch lg:px-12 lg:py-10">
        <section className="home-stage-card page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6 lg:h-full">
          <div className="flex h-full flex-col">
            <div className="max-w-sm flex-1">
              <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-400">
                <Heart size={18} strokeWidth={2} className="stage-icon" />
                FIND THE ONE
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Start with the spark
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Some cars catch your eye. The right one fits your life. Set
                your preferences, discover matches, and save the ones worth a
                closer look.
              </p>
            </div>
            <Link
              href="/find-the-one"
              className="card-cta app-button mt-auto inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
            >
              Enter Find The One
            </Link>
          </div>
        </section>

        <section className="home-stage-card page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6 lg:h-full">
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-400">
                <Wrench size={18} strokeWidth={2} className="stage-icon" />
                LIFE TOGETHER
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">When it gets serious</h2>
              <p className="mt-2 text-sm text-slate-300">
                Once you&apos;ve found the right car, real life kicks in. Life
                Together is for the practical side of the relationship —
                upkeep, reminders, and keeping things running smoothly.
              </p>
            </div>
            <Link
              href="/life-together"
              className="card-cta app-button mt-auto inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
            >
              Enter Life Together
            </Link>
          </div>
        </section>

        <section className="home-stage-card page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6 lg:h-full">
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-400">
                <ArrowRightLeft size={18} strokeWidth={2} className="stage-icon" />
                MOVING ON
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Know when it&apos;s time
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Not every car is forever. Moving On helps you handle the next
                chapter with more clarity, less guesswork, and a better sense
                of what comes next.
              </p>
            </div>
            <Link
              href="/moving-on"
              className="card-cta app-button mt-auto inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
            >
              Enter Moving On
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
