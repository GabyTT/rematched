"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Eye, FileText, Heart, ThumbsDown, ThumbsUp } from "lucide-react";

import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import { NotesModal } from "@/components/NotesModal";
import { TopPickLimitSheet } from "@/components/TopPickLimitSheet";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";

export default function LikePage() {
  const mounted = useMounted();
  const { carProgress, setCarState, replaceEarliestTopPick, updateCarNotes } =
    useJourney();
  const [activeNotesCarId, setActiveNotesCarId] = useState<string | null>(null);
  const [activeDetailsCarId, setActiveDetailsCarId] = useState<string | null>(null);
  const [isLikedHelpOpen, setIsLikedHelpOpen] = useState(false);
  const [replacementCandidateCarId, setReplacementCandidateCarId] = useState<
    string | null
  >(null);
  const [shouldPulseReviewTopPicks, setShouldPulseReviewTopPicks] =
    useState(false);
  const previousTopPicksCountRef = useRef<number | null>(null);
  const reviewTopPicksPulseFrameRef = useRef<number | null>(null);
  const reviewTopPicksPulseTimeoutRef = useRef<number | null>(null);

  const reviewCars = cars.filter((car) =>
    ["liked", "matched"].includes(carProgress[car.id]?.state ?? ""),
  );
  const engagedCount = cars.filter(
    (car) => carProgress[car.id]?.state === "matched",
  ).length;
  const hasTopPicks = engagedCount > 0;
  const canEngageMore = engagedCount < 3;
  const reviewTopPicksButtonClassName = hasTopPicks
    ? "app-button inline-flex w-fit items-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
    : "inline-flex w-fit cursor-default items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/7";
  const activeNotesCar = activeNotesCarId
    ? cars.find((car) => car.id === activeNotesCarId) ?? null
    : null;
  const activeDetailsCar = activeDetailsCarId
    ? cars.find((car) => car.id === activeDetailsCarId) ?? null
    : null;

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const previousTopPicksCount = previousTopPicksCountRef.current;
    previousTopPicksCountRef.current = engagedCount;

    if (
      previousTopPicksCount === null ||
      engagedCount <= previousTopPicksCount ||
      engagedCount === 0
    ) {
      return undefined;
    }

    if (reviewTopPicksPulseTimeoutRef.current !== null) {
      window.clearTimeout(reviewTopPicksPulseTimeoutRef.current);
    }

    if (reviewTopPicksPulseFrameRef.current !== null) {
      window.cancelAnimationFrame(reviewTopPicksPulseFrameRef.current);
    }

    reviewTopPicksPulseFrameRef.current = window.requestAnimationFrame(() => {
      setShouldPulseReviewTopPicks(true);
      reviewTopPicksPulseFrameRef.current = null;
      reviewTopPicksPulseTimeoutRef.current = window.setTimeout(() => {
        setShouldPulseReviewTopPicks(false);
        reviewTopPicksPulseTimeoutRef.current = null;
      }, 900);
    });

    return undefined;
  }, [engagedCount, mounted]);

  useEffect(
    () => () => {
      if (reviewTopPicksPulseFrameRef.current !== null) {
        window.cancelAnimationFrame(reviewTopPicksPulseFrameRef.current);
      }

      if (reviewTopPicksPulseTimeoutRef.current !== null) {
        window.clearTimeout(reviewTopPicksPulseTimeoutRef.current);
      }
    },
    [],
  );

  const handleTopPickAction = (carId: string, isInTopPicks: boolean) => {
    if (isInTopPicks) {
      setCarState(carId, "liked");
      return;
    }

    if (canEngageMore) {
      setCarState(carId, "matched");
      return;
    }

    setReplacementCandidateCarId(carId);
  };

  if (!mounted) {
    return null;
  }

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
                  <button
                    type="button"
                    onClick={() => setIsLikedHelpOpen((current) => !current)}
                    aria-expanded={isLikedHelpOpen}
                    aria-label="How Liked cars work"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-[0_10px_24px_rgba(209,19,58,0.28)] transition hover:scale-105 hover:brightness-110 hover:shadow-[0_14px_30px_rgba(209,19,58,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-95"
                  >
                    <span aria-hidden="true" className="font-serif text-[1.3rem] font-bold italic leading-none">
                      i
                    </span>
                  </button>
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                  These caught your eye. Compare them, make notes, and move your best ones to Top Picks.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <Link
                  href="/match"
                  aria-disabled={!hasTopPicks}
                  tabIndex={hasTopPicks ? undefined : -1}
                  onClick={(event) => {
                    if (!hasTopPicks) {
                      event.preventDefault();
                    }
                  }}
                  className={`${reviewTopPicksButtonClassName} ${
                    shouldPulseReviewTopPicks ? "liked-review-top-picks-pulse" : ""
                  }`}
                >
                  Review Top Picks
                </Link>
              </div>
            </div>

            {isLikedHelpOpen ? (
              <div className="liked-help-panel mx-auto mt-5 w-full max-w-xl rounded-[28px] border border-white/10 bg-[#07141d] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
                <h2 className="text-2xl font-semibold text-white">
                  How this works
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                      <Heart size={19} strokeWidth={0} className="fill-current" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Top Pick
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-300">
                        Move up to 3 of your best cars to Top Picks when you want to narrow things down.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                      <FileText size={19} strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Notes
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-300">
                        Add quick notes so you remember what stood out or what to check later.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-base font-medium leading-7 text-slate-400">
                  Cars you liked stay here until you’re ready to decide.
                </p>
                <button
                  type="button"
                  onClick={() => setIsLikedHelpOpen(false)}
                  className="app-button mt-5 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/12"
                >
                  Got it
                </button>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                {reviewCars.map((car) => {
                  const isInTopPicks = carProgress[car.id]?.state === "matched";

                  return (
                    <CarCard
                      key={car.id}
                      {...car}
                      topPickCount={engagedCount}
                      status={isInTopPicks ? "engaged" : "liked"}
                      overlay={
                        replacementCandidateCarId === car.id && !canEngageMore ? (
                          <TopPickLimitSheet
                            onConfirm={() => {
                              replaceEarliestTopPick(car.id);
                              setReplacementCandidateCarId(null);
                            }}
                            onCancel={() => setReplacementCandidateCarId(null)}
                          />
                        ) : null
                      }
                      indicator={
                        carProgress[car.id]?.notes ? (
                          <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                            <FileText size={20} strokeWidth={2.4} className="text-slate-300" />
                            Notes added
                          </p>
                        ) : null
                      }
                      footer={
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveDetailsCarId(car.id)}
                            className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/18 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/6 hover:text-white"
                          >
                            <Eye size={20} strokeWidth={2.4} className="text-slate-200" />
                            View Details
                          </button>
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
                              onClick={() => handleTopPickAction(car.id, isInTopPicks)}
                              className={`app-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                                isInTopPicks
                                  ? "border-white/18 bg-transparent text-slate-100 hover:border-white/35 hover:bg-white/6 hover:text-white"
                                  : canEngageMore || replacementCandidateCarId === car.id
                                    ? "border-accent bg-accent text-white hover:brightness-110"
                                    : "border-white/18 bg-white/7 text-white hover:bg-white/10"
                              }`}
                            >
                              <Heart
                                size={20}
                                strokeWidth={0}
                                className={`fill-current ${
                                  isInTopPicks ||
                                  canEngageMore ||
                                  replacementCandidateCarId === car.id
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
              These caught your eye. Compare them, make notes, and move your best ones to Top Picks.
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

        {activeDetailsCar ? (
          <CarDetailsModal
            car={activeDetailsCar}
            onClose={() => setActiveDetailsCarId(null)}
          />
        ) : null}
      </div>
    </main>
  );
}
