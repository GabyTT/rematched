"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, FileText, Heart, ThumbsDown, ThumbsUp } from "lucide-react";

import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import { BuyerEmptyState } from "@/components/BuyerEmptyState";
import { InfoIconButton } from "@/components/InfoIconButton";
import { buyerCardActionClassName } from "@/lib/buyerCardActionStyles";
import { NotesModal } from "@/components/NotesModal";
import { TopPickLimitSheet } from "@/components/TopPickLimitSheet";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { isSavedListingVisible, isSoldListing } from "@/lib/matching";

export default function LikePage() {
  const mounted = useMounted();
  const {
    activeInventoryCars,
    carProgress,
    setCarState,
    replaceEarliestTopPick,
    updateCarNotes,
  } = useJourney();
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

  const reviewCars = activeInventoryCars.filter(
    (car) =>
      ["liked", "matched"].includes(carProgress[car.id]?.state ?? "") &&
      isSavedListingVisible(car),
  );
  const engagedCount = activeInventoryCars.filter(
    (car) =>
      carProgress[car.id]?.state === "matched" && !isSoldListing(car),
  ).length;
  const hasTopPicks = reviewCars.some(
    (car) => carProgress[car.id]?.state === "matched",
  );
  const canEngageMore = engagedCount < 3;
  const reviewTopPicksButtonClassName = hasTopPicks
    ? "app-button inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90 sm:px-5"
    : "inline-flex min-h-11 w-fit cursor-default items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/7 sm:px-5";
  const activeNotesCar = activeNotesCarId
    ? activeInventoryCars.find((car) => car.id === activeNotesCarId) ?? null
    : null;
  const activeDetailsCar = activeDetailsCarId
    ? activeInventoryCars.find((car) => car.id === activeDetailsCarId) ?? null
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
        {reviewCars.length ? (
          <section className="page-panel motion-rise-fade motion-delay-0 rounded-[26px] border border-input bg-panel p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="max-w-3xl">
                <h1 className="flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
                  <ThumbsUp
                    size={28}
                    strokeWidth={0}
                    className="shrink-0 fill-current text-slate-200"
                    aria-hidden="true"
                  />
                  Your Liked Cars
                  <InfoIconButton
                    onClick={() => setIsLikedHelpOpen((current) => !current)}
                    aria-expanded={isLikedHelpOpen}
                    aria-label="How Liked cars work"
                  >
                    <span aria-hidden="true" className="font-serif text-[1.3rem] font-bold italic leading-none">
                      i
                    </span>
                  </InfoIconButton>
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
                  These caught your eye. Compare them, make notes, and move your best ones to Top Picks.
                </p>
              </div>
              <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3">
                <Link
                  href="/discover"
                  className="app-button inline-flex min-h-11 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl border border-white/18 px-2 py-2 text-sm font-semibold text-white transition hover:bg-white/6 sm:gap-2 sm:px-4"
                >
                  <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
                  Back to Discover
                </Link>
                <Link
                  href="/match"
                  aria-disabled={!hasTopPicks}
                  tabIndex={hasTopPicks ? undefined : -1}
                  onClick={(event) => {
                    if (!hasTopPicks) {
                      event.preventDefault();
                    }
                  }}
                  className={`ml-auto shrink-0 whitespace-nowrap ${reviewTopPicksButtonClassName} ${
                    shouldPulseReviewTopPicks ? "liked-review-top-picks-pulse" : ""
                  }`}
                >
                  Review Top Picks
                  <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
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

            <div className="mt-5">
              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reviewCars.map((car) => {
                  const isInTopPicks = carProgress[car.id]?.state === "matched";
                  const isSold = isSoldListing(car);

                  return (
                    <CarCard
                      key={car.id}
                      {...car}
                      topPickCount={engagedCount}
                      status={isSold ? "sold" : isInTopPicks ? "engaged" : "liked"}
                      overlay={
                        !isSold &&
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
                            className={buyerCardActionClassName("secondary")}
                          >
                            <Eye size={20} strokeWidth={2.4} className="text-slate-200" />
                            View Details
                          </button>
                          {!isSold ? <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.55fr)_minmax(0,0.9fr)] gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                            <button
                              type="button"
                              onClick={() => setCarState(car.id, "rejected")}
                              aria-label={`Pass on ${car.name}`}
                              className={`w-full whitespace-nowrap !gap-1.5 !px-1.5 sm:w-auto sm:!gap-2 sm:!px-4 ${buyerCardActionClassName("liked-reversal")}`}
                            >
                              <ThumbsDown
                                size={20}
                                strokeWidth={0}
                                className="fill-current text-slate-400"
                              />
                              <span>Pass</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTopPickAction(car.id, isInTopPicks)}
                              className={`min-w-0 w-full whitespace-nowrap !gap-1.5 !px-3 sm:w-auto sm:!gap-2 sm:!px-4 ${
                                isInTopPicks
                                  ? buyerCardActionClassName("secondary")
                                  : canEngageMore || replacementCandidateCarId === car.id
                                    ? buyerCardActionClassName("liked-primary")
                                    : buyerCardActionClassName("neutral")
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
                                ? "Unpick"
                                : canEngageMore
                                  ? "Top Pick?"
                                  : "Top Pick full"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveNotesCarId(car.id)}
                              className={`w-full whitespace-nowrap !gap-1.5 !px-1.5 sm:w-auto sm:!gap-2 sm:!px-4 ${buyerCardActionClassName("liked-tertiary")}`}
                            >
                              <FileText size={20} strokeWidth={2.4} className="text-slate-400" />
                              Notes
                            </button>
                          </div> : null}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="page-panel motion-rise-fade motion-delay-0 overflow-hidden rounded-[26px] border border-input bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <BuyerEmptyState illustrationIcon={ThumbsUp} illustrationLabel="Liked">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Your liked cars · 0
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  Nothing saved yet
                </h1>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
                  Explore cars that catch your eye, then like your favourites to keep them here for comparison.
                </p>
                <Link
                  href="/discover"
                  className="app-button mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
              <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
              Go to Discover
                </Link>
            </BuyerEmptyState>
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
