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
import { ThumbsDown, ThumbsUp } from "lucide-react";
import TinderCard from "react-tinder-card";

import { CarCard } from "@/components/CarCard";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import type { Car } from "@/lib/cars";

export type { CarJourneyState } from "@/components/JourneyProvider";

type SwipeDeckProps = {
  cars: Car[];
  emptyStateTitle?: string;
  emptyStateMessage?: string;
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
  preferenceChips = [],
}: SwipeDeckProps) {
  const mounted = useMounted();
  const { carProgress, setCarState } = useJourney();
  const likedCount = Object.values(carProgress).filter(
    (value) => value.state === "liked",
  ).length;
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [buttonSwipeDirection, setButtonSwipeDirection] = useState<
    "left" | "right" | null
  >(null);
  const [discoverDeck] = useState(cars);
  const [initialDiscoverDeckSize] = useState(cars.length);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNudgeActive, setIsNudgeActive] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const nudgeTimerRef = useRef<number | null>(null);
  const nudgeResetTimerRef = useRef<number | null>(null);
  const nudgeCountRef = useRef(0);
  const childRefs = useMemo(
    () => discoverDeck.map(() => createRef<TinderCardHandle>()),
    [discoverDeck],
  );

  const currentCar = discoverDeck[currentIndex];
  const visibleCards = discoverDeck.slice(currentIndex, currentIndex + 3);
  const cardsSeen = Math.max(initialDiscoverDeckSize - cars.length, 0);
  const progressWidth = initialDiscoverDeckSize
    ? `${(cardsSeen / initialDiscoverDeckSize) * 100}%`
    : "0%";

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
      <div className="rounded-[28px] border border-input bg-panel p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              You reached the end of your matches
            </h3>
            <p className="mt-2 text-base leading-6 text-slate-300/90">
              Try another range to refresh the deck, or browse the full
              marketplace below.
            </p>
          </div>
          <Link
            href="/like"
            className="inline-flex w-fit rounded-full border border-accent px-4 py-2 text-sm text-white transition hover:bg-accent"
          >
            Review liked ({likedCount})
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-2.5"
      onClickCapture={stopNudgeHint}
      onKeyDownCapture={stopNudgeHint}
      onPointerDownCapture={stopNudgeHint}
    >
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
            <span aria-hidden="true">🔍</span>
            <span>Your Matches · {cardsSeen + 1} of {initialDiscoverDeckSize}</span>
          </div>
          <Link
            href="/like"
            className="app-button inline-flex w-fit items-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            Review Liked
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

      <div className="mx-auto max-w-xl">
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
                        <div className="absolute left-6 top-6 z-20 text-4xl font-bold text-green-500 opacity-80">
                          LIKE
                        </div>
                      ) : null}
                      {isTopCard && swipeDirection === "left" ? (
                        <div className="absolute right-6 top-6 z-20 text-4xl font-bold text-red-500 opacity-80">
                          PASS
                        </div>
                      ) : null}
                      <CarCard
                        {...car}
                        variant="light"
                        footer={
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
                        }
                      />
                    </div>
                  </div>
                </TinderCard>
              );
            })}
        </div>
      </div>
    </div>
  );
}
