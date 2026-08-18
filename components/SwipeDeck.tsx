"use client";

import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, ThumbsDown, ThumbsUp } from "lucide-react";
import TinderCard from "react-tinder-card";

import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import type { Car } from "@/lib/cars";
import { trackGuestDetailsOpened } from "@/lib/guestEngagement";

export type { CarJourneyState } from "@/components/JourneyProvider";

type SwipeDeckProps = {
  cars: Car[];
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  onKeepExploring?: () => void;
  preferenceChips?: string[];
};

type SwipeDirection = "left" | "right" | "up" | "down";

type TinderCardHandle = {
  swipe: (direction?: SwipeDirection) => Promise<void>;
  restoreCard: () => Promise<void>;
};

export function SwipeDeck({
  cars,
  emptyStateTitle = "No new matches",
  emptyStateMessage = "No matches found for your current preferences. Try widening your range or removing a filter.",
  onKeepExploring,
  preferenceChips = [],
}: SwipeDeckProps) {
  const mounted = useMounted();
  const { carProgress, isAuthenticated, setCarState } = useJourney();
  const likedCount = Object.values(carProgress).filter(
    (value) => value.state === "liked",
  ).length;
  const hasLikedCars = likedCount > 0;
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [buttonSwipeDirection, setButtonSwipeDirection] = useState<
    "left" | "right" | null
  >(null);
  const incomingDeckSignature = useMemo(
    () => cars.map((car) => car.id).join("|"),
    [cars],
  );
  const [discoverDeck, setDiscoverDeck] = useState(cars);
  const [initialDiscoverDeckSize, setInitialDiscoverDeckSize] = useState(
    cars.length,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNudgeActive, setIsNudgeActive] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [activeDetailsCar, setActiveDetailsCar] = useState<Car | null>(null);
  const [isHelpSheetOpen, setIsHelpSheetOpen] = useState(false);
  const [passToastMessage, setPassToastMessage] = useState<string | null>(null);
  const [shouldShakeReviewLiked, setShouldShakeReviewLiked] = useState(false);
  const nudgeTimerRef = useRef<number | null>(null);
  const nudgeResetTimerRef = useRef<number | null>(null);
  const helpSheetPointerStartYRef = useRef<number | null>(null);
  const passToastTimeoutRef = useRef<number | null>(null);
  const reviewLikedShakeTimeoutRef = useRef<number | null>(null);
  const hasTriggeredCompletionShakeRef = useRef(false);
  const activeDeckSignatureRef = useRef(incomingDeckSignature);
  const nudgeCountRef = useRef(0);
  const childRefs = useMemo(
    () => discoverDeck.map(() => createRef<TinderCardHandle>()),
    [discoverDeck],
  );

  const currentCar = discoverDeck[currentIndex];
  const visibleCards = discoverDeck.slice(currentIndex, currentIndex + 3);
  const cardsSeen = Math.min(currentIndex, initialDiscoverDeckSize);
  const currentCardNumber = Math.min(currentIndex + 1, initialDiscoverDeckSize);
  const progressWidth = initialDiscoverDeckSize
    ? `${(cardsSeen / initialDiscoverDeckSize) * 100}%`
    : "0%";
  const reviewLikedButtonClassName = hasLikedCars
    ? "app-button inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
    : "inline-flex cursor-default items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white/7";
  const inlineReviewLikedButtonClassName = hasLikedCars
    ? "app-button inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
    : "inline-flex w-fit cursor-default items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/7";

  useEffect(() => {
    if (activeDeckSignatureRef.current === incomingDeckSignature) {
      return;
    }

    if (currentIndex !== 0) {
      return;
    }

    activeDeckSignatureRef.current = incomingDeckSignature;
    hasTriggeredCompletionShakeRef.current = false;
    setDiscoverDeck(cars);
    setInitialDiscoverDeckSize(cars.length);
    setCurrentIndex(0);
  }, [cars, currentIndex, incomingDeckSignature]);

  const clearNudgeTimers = useCallback(() => {
    if (nudgeTimerRef.current !== null) {
      window.clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }

    if (nudgeResetTimerRef.current !== null) {
      window.clearTimeout(nudgeResetTimerRef.current);
      nudgeResetTimerRef.current = null;
    }
  }, []);

  const stopNudgeHint = useCallback(() => {
    clearNudgeTimers();
    setIsNudgeActive(false);
    setHasUserInteracted(true);
  }, [clearNudgeTimers]);

  useEffect(() => {
    clearNudgeTimers();
    const resetFrameId = window.requestAnimationFrame(() => {
      setIsNudgeActive(false);
    });
    nudgeCountRef.current = 0;

    if (!currentCar || hasUserInteracted) {
      return () => {
        window.cancelAnimationFrame(resetFrameId);
        clearNudgeTimers();
      };
    }

    const scheduleNudge = (delay: number) => {
      nudgeTimerRef.current = window.setTimeout(() => {
        if (nudgeCountRef.current >= 3) {
          return;
        }

        nudgeCountRef.current += 1;
        setIsNudgeActive(true);
        nudgeResetTimerRef.current = window.setTimeout(() => {
          setIsNudgeActive(false);

          if (nudgeCountRef.current < 3) {
            scheduleNudge(8000);
          }
        }, 560);
      }, delay);
    };

    scheduleNudge(2600);

    return () => {
      window.cancelAnimationFrame(resetFrameId);
      clearNudgeTimers();
    };
  }, [clearNudgeTimers, currentCar, hasUserInteracted]);

  useEffect(() => {
    if (currentCar || !hasLikedCars || hasTriggeredCompletionShakeRef.current) {
      return undefined;
    }

    hasTriggeredCompletionShakeRef.current = true;
    reviewLikedShakeTimeoutRef.current = window.setTimeout(() => {
      setShouldShakeReviewLiked(true);
      reviewLikedShakeTimeoutRef.current = window.setTimeout(() => {
        setShouldShakeReviewLiked(false);
        reviewLikedShakeTimeoutRef.current = null;
      }, 640);
    }, 360);

    return () => {
      if (reviewLikedShakeTimeoutRef.current !== null) {
        window.clearTimeout(reviewLikedShakeTimeoutRef.current);
        reviewLikedShakeTimeoutRef.current = null;
      }
    };
  }, [currentCar, hasLikedCars]);

  useEffect(() => {
    if (!isHelpSheetOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsHelpSheetOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isHelpSheetOpen]);

  useEffect(
    () => () => {
      if (passToastTimeoutRef.current !== null) {
        window.clearTimeout(passToastTimeoutRef.current);
      }
    },
    [],
  );

  if (!mounted) {
    return null;
  }

  const handleDecision = (direction: "left" | "right") => {
    if (!currentCar) {
      return;
    }

    if (direction === "right") {
      setCarState(currentCar.id, "liked");
      return;
    }

    setCarState(currentCar.id, "rejected");
    setPassToastMessage("Moved to Second Chances");

    if (passToastTimeoutRef.current !== null) {
      window.clearTimeout(passToastTimeoutRef.current);
    }

    passToastTimeoutRef.current = window.setTimeout(() => {
      setPassToastMessage(null);
      passToastTimeoutRef.current = null;
    }, 1800);
  };

  const handleSave = () => {
    handleDecision("right");
  };

  const handlePass = () => {
    handleDecision("left");
  };

  const handleSwipe = (direction: string, car: Car) => {
    if (car.id !== currentCar?.id) {
      return;
    }

    stopNudgeHint();
    setButtonSwipeDirection(null);

    if (direction === "right") {
      handleSave();
    }

    if (direction === "left") {
      handlePass();
    }

    if (direction === "left" || direction === "right") {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const triggerButtonSwipe = (direction: "left" | "right") => {
    if (!childRefs[currentIndex]?.current || buttonSwipeDirection) {
      return;
    }

    stopNudgeHint();
    setSwipeDirection(direction);
    setButtonSwipeDirection(direction);

    window.setTimeout(() => {
      childRefs[currentIndex]?.current?.swipe(direction);
    }, 140);
  };

  if (!cars.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-input bg-panel/70 p-8 text-center">
        <h3 className="text-xl font-semibold text-white">{emptyStateTitle}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {emptyStateMessage}
        </p>
      </div>
    );
  }

  if (!currentCar) {
    return (
      <div className="matches-completion-card rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_100%)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.26)] sm:p-8">
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="matches-completion-progress h-full rounded-full bg-emerald-400" />
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
              ✓
            </div>
            <h3 className="text-2xl font-semibold text-white">
              You’ve met today’s lineup — we’ll bring you more tomorrow.
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Want to take another look or explore more?
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Link
              href="/like"
              aria-disabled={!hasLikedCars}
              tabIndex={hasLikedCars ? undefined : -1}
              onClick={(event) => {
                if (!hasLikedCars) {
                  event.preventDefault();
                }
              }}
              className={`${reviewLikedButtonClassName} ${
                shouldShakeReviewLiked ? "matches-review-liked-shake" : ""
              }`}
            >
              Review Liked
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onKeepExploring}
              className="app-button inline-flex justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10"
            >
              Keep Exploring
            </button>
            <Link
              href="/find-the-one"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
              Refine Preferences
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="matches-swipe-deck space-y-2"
      onClickCapture={stopNudgeHint}
      onKeyDownCapture={stopNudgeHint}
      onPointerDownCapture={stopNudgeHint}
    >
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 text-xl font-semibold text-white sm:text-2xl">
            <span aria-hidden="true">🔍</span>
            <span>Your Matches · {currentCardNumber} of {initialDiscoverDeckSize}</span>
            <button
              type="button"
              onClick={() => setIsHelpSheetOpen(true)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-[0_10px_24px_rgba(209,19,58,0.28)] transition hover:scale-105 hover:brightness-110 hover:shadow-[0_14px_30px_rgba(209,19,58,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-95"
              aria-label="How Like and Pass work"
            >
              <span aria-hidden="true" className="font-serif text-[1.3rem] font-bold italic leading-none">
                i
              </span>
            </button>
          </div>
          <Link
            href="/like"
            aria-disabled={!hasLikedCars}
            tabIndex={hasLikedCars ? undefined : -1}
            onClick={(event) => {
              if (!hasLikedCars) {
                event.preventDefault();
              }
            }}
            className={inlineReviewLikedButtonClassName}
          >
            Review Liked
            <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
        {preferenceChips.length ? (
          <div className="flex flex-wrap gap-2">
            {preferenceChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:bg-white/10"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        <div className="h-1 rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-emerald-500/80 transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[33rem]">
        <div className="grid">
          {visibleCards
            .slice()
            .reverse()
            .map((car, stackIndex) => {
              const isTopCard = car.id === currentCar.id;
              const stackOffset = visibleCards.length - stackIndex - 1;
              const cardIndex = currentIndex + stackOffset;

              return (
                <TinderCard
                  ref={childRefs[cardIndex]}
                  key={car.id}
                  onSwipe={(direction) => handleSwipe(direction, car)}
                  onSwipeRequirementFulfilled={(direction) =>
                    setSwipeDirection(direction)
                  }
                  onSwipeRequirementUnfulfilled={() => setSwipeDirection(null)}
                  onCardLeftScreen={() => {
                    setSwipeDirection(null);
                    setButtonSwipeDirection(null);
                  }}
                  preventSwipe={["up", "down"]}
                  swipeRequirementType="position"
                  swipeThreshold={35}
                  className="col-start-1 row-start-1"
                >
                  <div
                    className={`${
                      isTopCard ? "z-10" : ""
                    } relative select-none swipe-card transition-transform`}
                    style={{
                      transform: `${buttonSwipeDirection && isTopCard ? `translateX(${buttonSwipeDirection === "right" ? "42px" : "-42px"}) rotate(${buttonSwipeDirection === "right" ? "8deg" : "-8deg"}) ` : ""}translateY(${stackOffset * 12}px) scale(${1 - stackOffset * 0.02})`,
                      transitionDuration:
                        buttonSwipeDirection && isTopCard ? "140ms" : undefined,
                      touchAction: "pan-y",
                    }}
                  >
                    <div
                      className={`relative ${
                        isTopCard && isNudgeActive ? "swipe-card-nudge" : ""
                      }`}
                    >
                      {isTopCard && swipeDirection === "right" ? (
                        <div className="absolute right-6 top-6 z-20 text-4xl font-bold text-green-500 opacity-80">
                          LIKE
                        </div>
                      ) : null}
                      {isTopCard && swipeDirection === "left" ? (
                        <div className="absolute left-6 top-6 z-20 text-4xl font-bold text-red-500 opacity-80">
                          PASS
                        </div>
                      ) : null}
                      <CarCard
                        {...car}
                        variant="light"
                        footer={
                          <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  trackGuestDetailsOpened();
                                }

                                setActiveDetailsCar(car);
                              }}
                              className="pointer-events-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#D9E0E7] bg-white px-4 py-2.5 text-sm font-semibold text-[#16212B] transition duration-200 hover:border-accent hover:bg-accent hover:text-white"
                            >
                              <Eye
                                size={20}
                                strokeWidth={2.4}
                                className="text-[#6B7A89]"
                              />
                              View Details
                            </button>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => triggerButtonSwipe("left")}
                                className="pointer-events-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#D9E0E7] bg-white px-4 py-2.5 text-sm font-semibold text-[#16212B] transition duration-200 hover:border-accent"
                              >
                                <ThumbsDown
                                  size={20}
                                  strokeWidth={0}
                                  className="fill-current text-[#6B7A89]"
                                />
                                Pass
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerButtonSwipe("right")}
                                className="pointer-events-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:brightness-110"
                              >
                                <ThumbsUp
                                  size={20}
                                  strokeWidth={0}
                                  className="fill-current text-white"
                                />
                                Like
                              </button>
                            </div>
                          </div>
                        }
                      />
                    </div>
                  </div>
                </TinderCard>
              );
            })}
        </div>
      </div>

      {activeDetailsCar ? (
        <CarDetailsModal
          car={activeDetailsCar}
          onClose={() => setActiveDetailsCar(null)}
        />
      ) : null}

      {passToastMessage ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#101d26]/95 px-4 py-2 text-sm font-semibold text-slate-100 shadow-[0_16px_36px_rgba(0,0,0,0.36)] backdrop-blur">
          {passToastMessage}
        </div>
      ) : null}

      {isHelpSheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsHelpSheetOpen(false)}
            aria-label="Close help"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="matches-help-title"
            className="matches-help-sheet relative z-10 w-full max-w-xl rounded-t-[28px] border border-white/10 bg-[#07141d] p-5 shadow-[0_-22px_52px_rgba(0,0,0,0.42)] sm:mb-6 sm:rounded-[28px]"
            onPointerDown={(event) => {
              helpSheetPointerStartYRef.current = event.clientY;
            }}
            onPointerUp={(event) => {
              const startY = helpSheetPointerStartYRef.current;
              helpSheetPointerStartYRef.current = null;

              if (startY !== null && event.clientY - startY > 48) {
                setIsHelpSheetOpen(false);
              }
            }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            <h3 id="matches-help-title" className="text-2xl font-semibold text-white">
              How this works
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <ThumbsUp size={19} strokeWidth={0} className="fill-current" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">Like</p>
                  <p className="mt-1 text-base leading-7 text-slate-300">
                    Save it to your Liked cars so you can review it later.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                  <ThumbsDown size={19} strokeWidth={0} className="fill-current" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">Pass</p>
                  <p className="mt-1 text-base leading-7 text-slate-300">
                    We’ll hide it for now — you can still find it again in Second Chances.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-base font-medium leading-7 text-slate-400">
              Nothing is lost — you can always revisit your options.
            </p>
            <button
              type="button"
              onClick={() => setIsHelpSheetOpen(false)}
              className="app-button mt-5 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/12"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
