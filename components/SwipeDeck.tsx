"use client";

import { createRef, useMemo, useState } from "react";
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
};

type SwipeDirection = "left" | "right" | "up" | "down";

type TinderCardHandle = {
  swipe: (direction?: SwipeDirection) => Promise<void>;
};

export function SwipeDeck({
  cars,
  emptyStateTitle = "No new matches",
  emptyStateMessage = "No matches found for your current preferences. Try widening your range or removing a filter.",
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
            <p className="mt-2 text-sm leading-6 text-slate-300">
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-input bg-panel px-5 py-4">
        <div className="min-w-0 flex-1">
          <span className="text-sm text-slate-300">
            Card {cardsSeen + 1} of {initialDiscoverDeckSize}
          </span>
          <div className="mt-3 h-2 rounded-full bg-input">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
        <div className="flex gap-2 text-sm text-slate-300">
          <span className="rounded-full border border-input bg-input px-3 py-1.5">
            Remaining {cars.length}
          </span>
          <span className="rounded-full border border-input bg-input px-3 py-1.5">
            Saved {likedCount}
          </span>
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
                  style={{ touchAction: "pan-y" }}
                >
                  <div
                    className={`${
                      isTopCard ? "z-10" : ""
                    } relative select-none swipe-card transition-transform`}
                    style={{
                      transform: `${buttonSwipeDirection && isTopCard ? `translateX(${buttonSwipeDirection === "right" ? "42px" : "-42px"}) rotate(${buttonSwipeDirection === "right" ? "8deg" : "-8deg"}) ` : ""}translateY(${stackOffset * 12}px) scale(${1 - stackOffset * 0.02})`,
                      transitionDuration:
                        buttonSwipeDirection && isTopCard ? "140ms" : undefined,
                    }}
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
                            <ThumbsDown size={18} className="text-[#6B7A89]" />
                            Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerButtonSwipe("right")}
                            className="pointer-events-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:brightness-110"
                          >
                            <ThumbsUp size={18} className="text-white" />
                            Like
                          </button>
                        </div>
                      }
                    />
                  </div>
                </TinderCard>
              );
            })}
        </div>
      </div>
    </div>
  );
}
