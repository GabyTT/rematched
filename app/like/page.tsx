"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Heart, ThumbsDown, ThumbsUp } from "lucide-react";

import { CarCard } from "@/components/CarCard";
import { NotesModal } from "@/components/NotesModal";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";

export default function LikePage() {
  const mounted = useMounted();
  const { carProgress, setCarState, updateCarNotes } = useJourney();
  const [activeNotesCarId, setActiveNotesCarId] = useState<string | null>(null);

  if (!mounted) {
    return null;
  }

  const reviewCars = cars.filter((car) =>
    ["liked", "matched"].includes(carProgress[car.id]?.state ?? ""),
  );
  const engagedCount = cars.filter(
    (car) => carProgress[car.id]?.state === "matched",
  ).length;
  const canEngageMore = engagedCount < 3;
  const engageCtaText =
    engagedCount === 1 ? "Review The One" : "Compare Top Picks";
  const activeNotesCar = activeNotesCarId
    ? cars.find((car) => car.id === activeNotesCarId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        {reviewCars.length ? (
          <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <h1 className="flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
                  <ThumbsUp
                    size={28}
                    strokeWidth={0}
                    className="shrink-0 fill-current text-slate-200"
                    aria-hidden="true"
                  />
                  Your Liked Cars
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                  These caught your eye—review them before choosing your top picks.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <Link
                  href="/match"
                  className="app-button inline-flex w-fit items-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
                >
                  {engageCtaText}
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0.005)_100%)] p-1.5 sm:p-2">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {reviewCars.map((car) => {
                  const isInTopPicks = carProgress[car.id]?.state === "matched";

                  return (
                    <CarCard
                      key={car.id}
                      {...car}
                      topPickCount={engagedCount}
                      status={isInTopPicks ? "engaged" : "liked"}
                      indicator={
                        carProgress[car.id]?.notes ? (
                          <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                            <FileText size={20} strokeWidth={2.4} className="text-slate-300" />
                            Notes added
                          </p>
                        ) : null
                      }
                      footer={
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setCarState(car.id, "rejected")}
                            aria-label={`Pass on ${car.name}`}
                            className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-white/20 hover:bg-white/4 hover:text-slate-200 sm:flex-none"
                          >
                            <ThumbsDown
                              size={20}
                              strokeWidth={0}
                              className="fill-current text-slate-300"
                            />
                            <span className="sm:sr-only">Pass</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCarState(
                                car.id,
                                isInTopPicks ? "liked" : "matched",
                              );
                            }}
                            disabled={!isInTopPicks && !canEngageMore}
                            className={`app-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                              isInTopPicks
                                ? "border-white/18 bg-transparent text-slate-100 hover:border-white/35 hover:bg-white/6 hover:text-white"
                                : canEngageMore
                                  ? "border-accent bg-accent text-white hover:brightness-110"
                                  : "cursor-not-allowed border-white/12 bg-white/8 text-slate-500"
                            }`}
                          >
                            <Heart
                              size={20}
                              strokeWidth={0}
                              className={`fill-current ${
                                isInTopPicks || canEngageMore
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            />
                            {isInTopPicks
                              ? "Back to Liked"
                              : canEngageMore
                                ? "Top Pick?"
                                : "Top Pick full"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveNotesCarId(car.id)}
                            className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/18 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/6 hover:text-white sm:flex-none"
                          >
                            <FileText size={20} strokeWidth={2.4} className="text-slate-200" />
                            Notes
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-dashed border-input bg-panel p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <h1 className="flex items-center justify-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
              <ThumbsUp
                size={28}
                strokeWidth={0}
                className="shrink-0 fill-current text-slate-200"
                aria-hidden="true"
              />
              Your Liked Cars
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              These caught your eye—review them before choosing your top picks.
            </p>
            <h2 className="mt-6 text-2xl font-semibold text-white">
              Your liked cars are empty
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              Like a few cars in Discover and come back here to review them.
            </p>
            <Link
              href="/discover"
              className="app-button mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Go to Discover
            </Link>
          </section>
        )}

        {activeNotesCar ? (
          <NotesModal
            carName={activeNotesCar.name}
            initialNotes={carProgress[activeNotesCar.id]?.notes ?? ""}
            onClose={() => setActiveNotesCarId(null)}
            onSave={(notes) => updateCarNotes(activeNotesCar.id, notes)}
          />
        ) : null}
      </div>
    </main>
  );
}
