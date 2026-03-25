import Link from "next/link";

export default function MovingOnPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-12">
        <section className="page-panel motion-rise-fade motion-delay-1 interactive-panel rounded-[28px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            MOVING ON
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Help your car find its next match.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            When it&apos;s time to move on, RevMatched helps you prepare your car
            for sale, create a stronger listing, and place it in front of
            buyers already looking for the right fit.
          </p>
          <Link
            href="/moving-on"
            className="app-button mt-6 inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          >
            List Your Car
          </Link>
        </section>
      </div>
    </main>
  );
}
