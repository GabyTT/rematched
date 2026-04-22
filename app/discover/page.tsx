"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { CarBrowseActions } from "@/components/CarBrowseActions";
import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import {
  SwipeDeck,
} from "@/components/SwipeDeck";
import { SponsorCard } from "@/components/SponsorCard";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars, type Car } from "@/lib/cars";
import {
  carIsAvailable,
  carMatchesBudgetRange,
  carMatchesNearBudgetRange,
  getDiscoverableCars,
  hasValidBudgetRange,
} from "@/lib/matching";
import { sponsorAds } from "@/lib/sponsorAds";

const budgetFormatter = new Intl.NumberFormat("en-US");
const normalizeValue = (value: string) => value.trim().toLowerCase();
const formatBudgetRange = (minBudget: number | null, maxBudget: number | null) =>
  minBudget !== null && maxBudget !== null
    ? `${budgetFormatter.format(minBudget)}-${budgetFormatter.format(maxBudget)} TTD`
    : "No range set yet";
type ExploreView =
  | "keep-exploring"
  | "budget"
  | "second-chances"
  | "all";

export default function DiscoverPage() {
  const mounted = useMounted();
  const [deckKey, setDeckKey] = useState(0);
  const [activeDetailsCar, setActiveDetailsCar] = useState<Car | null>(null);
  const exploreTabsRef = useRef<HTMLDivElement | null>(null);
  const { carProgress, preferences, setCarState } = useJourney();
  const discoverCars = getDiscoverableCars(cars, preferences, carProgress);
  const hasBudgetRange = hasValidBudgetRange(preferences);
  const selectedBrands = preferences.brand;
  const selectedVehicleType = preferences.vehicleType.trim();
  const hasSpecificVehicleType =
    normalizeValue(selectedVehicleType) !== "" &&
    normalizeValue(selectedVehicleType) !== "all";
  const normalizedModel = preferences.model.trim();
  const defaultExploreView: ExploreView = hasBudgetRange
    ? "budget"
    : "keep-exploring";
  const [activeExploreView, setActiveExploreView] = useState<ExploreView>(() =>
    defaultExploreView,
  );

  const sortByMostRecent = useMemo(
    () => (carsToSort: Car[]) =>
      [...carsToSort].sort((left, right) => {
        if (right.year !== left.year) {
          return right.year - left.year;
        }

        return cars.findIndex((car) => car.id === left.id) -
          cars.findIndex((car) => car.id === right.id);
      }),
    [],
  );

  const keepExploringCars = useMemo(
    () => sortByMostRecent(cars.filter((car) => carIsAvailable(car))),
    [sortByMostRecent],
  );

  const budgetCars = useMemo(
    () =>
      hasBudgetRange
        ? sortByMostRecent(
            cars.filter(
              (car) =>
                carIsAvailable(car) &&
                (carMatchesBudgetRange(car, preferences) ||
                  carMatchesNearBudgetRange(car, preferences)),
            ),
          )
        : [],
    [hasBudgetRange, preferences, sortByMostRecent],
  );
  const secondChanceCars = useMemo(
    () =>
      sortByMostRecent(
        cars.filter(
          (car) => carIsAvailable(car) && carProgress[car.id]?.state === "rejected",
        ),
      ),
    [carProgress, sortByMostRecent],
  );
  const allCars = useMemo(
    () => sortByMostRecent(cars.filter((car) => carIsAvailable(car))),
    [sortByMostRecent],
  );
  const exploreExclusionIds = useMemo(() => {
    const excludedIds = new Set(discoverCars.map((car) => car.id));

    Object.entries(carProgress).forEach(([carId, value]) => {
      if (["liked", "rejected", "matched"].includes(value.state ?? "")) {
        excludedIds.add(carId);
      }
    });

    return excludedIds;
  }, [carProgress, discoverCars]);

  const currentExploreView =
    activeExploreView === "budget" && !hasBudgetRange
      ? defaultExploreView
      : activeExploreView;

  const rawExploreCars =
    currentExploreView === "budget"
        ? budgetCars
        : currentExploreView === "second-chances"
          ? secondChanceCars
          : currentExploreView === "all"
            ? allCars
            : keepExploringCars;
  const exploreCars = useMemo(
    () =>
      currentExploreView === "all" || currentExploreView === "second-chances"
        ? rawExploreCars
        : rawExploreCars.filter((car) => !exploreExclusionIds.has(car.id)),
    [currentExploreView, exploreExclusionIds, rawExploreCars],
  );
  const activePreferenceChips = [
    ...(hasBudgetRange
      ? [
          `Range ${formatBudgetRange(
            preferences.minBudget,
            preferences.maxBudget,
          )}`,
        ]
      : []),
    ...selectedBrands,
    ...(hasSpecificVehicleType
      ? [selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)]
      : []),
    ...(normalizedModel ? [normalizedModel] : []),
  ];
  const topPickCount = Object.values(carProgress).filter(
    (value) => value.state === "matched",
  ).length;

  useEffect(() => {
    const handleRefreshDiscover = () => {
      setDeckKey((prev) => prev + 1);
    };

    window.addEventListener("revmatched:refresh-discover", handleRefreshDiscover);

    return () => {
      window.removeEventListener(
        "revmatched:refresh-discover",
        handleRefreshDiscover,
      );
    };
  }, []);

  useEffect(() => {
    const activeTab = exploreTabsRef.current?.querySelector<HTMLElement>(
      '[data-active-tab="true"]',
    );

    activeTab?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [currentExploreView]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:px-12 lg:py-5">
        <section className="page-panel motion-rise-fade motion-delay-0 space-y-2.5 rounded-[28px] border border-input bg-panel p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-5">
          {discoverCars.length ? (
            <SwipeDeck
              key={deckKey}
              cars={discoverCars}
              preferenceChips={activePreferenceChips}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                No matches right now — try widening your range or explore below.
              </p>
              <Link
                href="/like"
                className="app-button inline-flex w-fit items-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
              >
                Review Liked
              </Link>
            </div>
          )}
        </section>

        <section className="page-panel motion-rise-fade motion-delay-2 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold text-white">
                Explore More
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:bg-white/10">
                {exploreCars.length} cars in view
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="overflow-hidden">
              <div
                ref={exploreTabsRef}
                className="scrollbar-hidden -mb-3 flex flex-nowrap gap-3 overflow-x-auto px-1 pt-1 pb-3"
              >
                {hasBudgetRange ? (
                  <button
                    type="button"
                    onClick={() => setActiveExploreView("budget")}
                    data-active-tab={currentExploreView === "budget"}
                    className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                      currentExploreView === "budget"
                        ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                        : "nav-pill-inactive border-input bg-input text-slate-300"
                    }`}
                  >
                    In your budget
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveExploreView("keep-exploring")}
                  data-active-tab={currentExploreView === "keep-exploring"}
                  className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                    currentExploreView === "keep-exploring"
                      ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                      : "nav-pill-inactive border-input bg-input text-slate-300"
                  }`}
                >
                  Keep exploring
                </button>
                <button
                  type="button"
                  onClick={() => setActiveExploreView("second-chances")}
                  data-active-tab={currentExploreView === "second-chances"}
                  className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                    currentExploreView === "second-chances"
                      ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                      : "nav-pill-inactive border-input bg-input text-slate-300"
                  }`}
                >
                  Second chances
                </button>
                <button
                  type="button"
                  onClick={() => setActiveExploreView("all")}
                  data-active-tab={currentExploreView === "all"}
                  className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                    currentExploreView === "all"
                      ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                      : "nav-pill-inactive border-input bg-input text-slate-300"
                  }`}
                >
                  All
                </button>
              </div>
            </div>
            {currentExploreView === "all" ? (
              <p className="mt-1 text-xs text-slate-500">
                Includes cars you’ve already seen.
              </p>
            ) : null}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0.005)_100%)] p-1.5 sm:p-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {exploreCars.map((car, index) => {
                const carState = carProgress[car.id]?.state;
                const cardStatus =
                  carState === "liked"
                    ? "liked"
                    : carState === "matched"
                      ? "engaged"
                      : carState === "rejected"
                        ? "passed"
                        : undefined;

                return (
                  <Fragment key={car.id}>
                    <CarCard
                      {...car}
                      variant="dark"
                      topPickCount={topPickCount}
                      status={cardStatus}
                      footer={
                        <CarBrowseActions
                          variant="dark"
                          status={cardStatus}
                          onViewDetails={() => setActiveDetailsCar(car)}
                          onLike={() => setCarState(car.id, "liked")}
                          onTopPick={() => setCarState(car.id, "matched")}
                          onPass={() => setCarState(car.id, "rejected")}
                        />
                      }
                    />
                    {(index + 1) % 4 === 0 &&
                    sponsorAds[Math.floor(index / 4)] ? (
                      <SponsorCard ad={sponsorAds[Math.floor(index / 4)]} />
                    ) : null}
                  </Fragment>
                );
              })}
            </div>

            {!exploreCars.length ? (
              <div className="rounded-[24px] border border-dashed border-input bg-input/60 p-5">
                <p className="text-sm font-semibold text-slate-300">
                  No more cars here right now.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try another angle.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {activeDetailsCar ? (
        <CarDetailsModal
          car={activeDetailsCar}
          onClose={() => setActiveDetailsCar(null)}
        />
      ) : null}
    </main>
  );
}
