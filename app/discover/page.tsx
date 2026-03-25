"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CarBrowseActions } from "@/components/CarBrowseActions";
import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import {
  SwipeDeck,
} from "@/components/SwipeDeck";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars, type Car } from "@/lib/cars";
import {
  carIsAvailable,
  carMatchesBudgetRange,
  getDiscoverableCars,
  hasUsablePreferences,
  hasValidBudgetRange,
} from "@/lib/matching";

const budgetFormatter = new Intl.NumberFormat("en-US");
const normalizeValue = (value: string) => value.trim().toLowerCase();
const formatBudgetRange = (minBudget: number | null, maxBudget: number | null) =>
  minBudget !== null && maxBudget !== null
    ? `${budgetFormatter.format(minBudget)}-${budgetFormatter.format(maxBudget)} TTD`
    : "No range set yet";
const formatVehicleTypeLabel = (vehicleType: string) => {
  const normalizedType = normalizeValue(vehicleType);

  switch (normalizedType) {
    case "suv":
      return "More SUVs";
    case "sedan":
      return "More sedans";
    case "pickup":
      return "More pickups";
    case "hatchback":
      return "More hatchbacks";
    case "luxury":
      return "More luxury vehicles";
    default: {
      if (!normalizedType) {
        return "";
      }

      const capitalized =
        vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1).toLowerCase();
      return `More ${capitalized}s`;
    }
  }
};

type ExploreView =
  | "keep-exploring"
  | "brand"
  | "type"
  | "budget"
  | "second-chances";

export default function DiscoverPage() {
  const mounted = useMounted();
  const [deckKey, setDeckKey] = useState(0);
  const [activeDetailsCar, setActiveDetailsCar] = useState<Car | null>(null);
  const exploreTabsRef = useRef<HTMLDivElement | null>(null);
  const { carProgress, preferences, setCarState } = useJourney();
  const hasPreferences = hasUsablePreferences(preferences);
  const discoverCars = getDiscoverableCars(cars, preferences, carProgress);
  const hasBudgetRange = hasValidBudgetRange(preferences);
  const selectedBrands = preferences.brand;
  const hasSelectedBrands = selectedBrands.length > 0;
  const selectedVehicleType = preferences.vehicleType.trim();
  const hasSpecificVehicleType =
    normalizeValue(selectedVehicleType) !== "" &&
    normalizeValue(selectedVehicleType) !== "all";
  const normalizedModel = preferences.model.trim();
  const vehicleTypeLabel = hasSpecificVehicleType
    ? formatVehicleTypeLabel(selectedVehicleType)
    : "";
  const defaultExploreView: ExploreView = hasSelectedBrands
    ? "brand"
    : hasSpecificVehicleType
      ? "type"
    : hasBudgetRange
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
    () =>
      sortByMostRecent(
        cars.filter(
          (car) => carIsAvailable(car) && carProgress[car.id]?.state === null,
        ),
      ),
    [carProgress, sortByMostRecent],
  );

  const brandCars = useMemo(
    () =>
      hasSelectedBrands
        ? sortByMostRecent(
            cars.filter(
              (car) =>
                carIsAvailable(car) &&
                carProgress[car.id]?.state === null &&
                selectedBrands.some(
                  (brand) => normalizeValue(car.brand) === normalizeValue(brand),
                ),
            ),
          )
        : [],
    [carProgress, hasSelectedBrands, selectedBrands, sortByMostRecent],
  );

  const typeCars = useMemo(
    () =>
      hasSpecificVehicleType
        ? sortByMostRecent(
            cars.filter(
              (car) =>
                carIsAvailable(car) &&
                carProgress[car.id]?.state === null &&
                normalizeValue(car.vehicleType) ===
                  normalizeValue(selectedVehicleType),
            ),
          )
        : [],
    [
      carProgress,
      hasSpecificVehicleType,
      selectedVehicleType,
      sortByMostRecent,
    ],
  );

  const budgetCars = useMemo(
    () =>
      hasBudgetRange
        ? sortByMostRecent(
            cars.filter(
              (car) =>
                carIsAvailable(car) &&
                carProgress[car.id]?.state === null &&
                carMatchesBudgetRange(car, preferences),
            ),
          )
        : [],
    [carProgress, hasBudgetRange, preferences, sortByMostRecent],
  );

  const secondChanceCars = useMemo(
    () =>
      sortByMostRecent(
        cars.filter(
          (car) =>
            carIsAvailable(car) && carProgress[car.id]?.state === "rejected",
        ),
      ),
    [carProgress, sortByMostRecent],
  );

  const currentExploreView =
    activeExploreView === "brand" && !hasSelectedBrands
      ? defaultExploreView
      : activeExploreView === "type" && !hasSpecificVehicleType
        ? defaultExploreView
      : activeExploreView === "budget" && !hasBudgetRange
        ? defaultExploreView
      : activeExploreView;

  const exploreCars =
    currentExploreView === "brand"
      ? brandCars
      : currentExploreView === "type"
        ? typeCars
      : currentExploreView === "budget"
        ? budgetCars
      : currentExploreView === "second-chances"
        ? secondChanceCars
        : keepExploringCars;
  const exploreHelperText =
    currentExploreView === "brand"
      ? "See more cars from the brands you selected, even if they don’t match every other preference."
      : currentExploreView === "type"
        ? "See more cars in the vehicle type you selected, even if they don’t match every other preference."
      : currentExploreView === "budget"
        ? "Explore cars within your price range, even if they fall outside your preferred brands or models."
        : currentExploreView === "second-chances"
          ? "Revisit cars you passed in case one deserves another look."
          : "Browse unrated cars that are still in play.";
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              DISCOVER stage
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Swipe through your best-fit cars
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              RevMatched is using your saved preferences to surface vehicles
              that fit your current search.
            </p>
            {activePreferenceChips.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activePreferenceChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex rounded-full border border-input bg-input px-3 py-1 text-xs font-medium text-slate-200"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="page-panel motion-rise-fade motion-delay-1 space-y-5 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Swipe matches
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Your Matches
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {discoverCars.length
                  ? "We found vehicles that match your current preferences."
                  : "No new matches fit your current preferences right now."}
              </p>
            </div>
            <Link
              href="/like"
              className="app-button inline-flex w-fit items-center rounded-full border border-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
            >
              View shortlist
            </Link>
          </div>

          <SwipeDeck
            key={deckKey}
            cars={discoverCars}
            emptyStateTitle="No new matches"
            emptyStateMessage={
              hasPreferences
                ? "No new matches fit your current preferences right now. Try widening your range, removing a filter, or explore more options below."
                : "Add at least one preference to find matches."
            }
          />
        </section>

        <section className="space-y-5">
          <div className="page-panel motion-rise-fade motion-delay-2 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Explore different angles
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  More ways to find the right fit
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {exploreHelperText}
                </p>
              </div>
              <div className="inline-flex w-fit items-center rounded-full border border-input bg-input px-4 py-2 text-sm font-medium text-slate-300">
                {exploreCars.length} cars in view
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                Explore using
              </p>
              <div className="overflow-hidden">
                <div
                  ref={exploreTabsRef}
                  className="scrollbar-hidden -mb-4 flex flex-nowrap gap-3 overflow-x-auto px-1 pt-1 pb-4"
                >
                  {hasSelectedBrands ? (
                    <button
                      type="button"
                      onClick={() => setActiveExploreView("brand")}
                      data-active-tab={currentExploreView === "brand"}
                      className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                        currentExploreView === "brand"
                          ? "border-accent bg-accent text-white"
                          : "border-input bg-input text-slate-300 hover:border-accent"
                      }`}
                    >
                      From your brands
                    </button>
                  ) : null}
                  {hasSpecificVehicleType ? (
                    <button
                      type="button"
                      onClick={() => setActiveExploreView("type")}
                      data-active-tab={currentExploreView === "type"}
                      className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                        currentExploreView === "type"
                          ? "border-accent bg-accent text-white"
                          : "border-input bg-input text-slate-300 hover:border-accent"
                      }`}
                    >
                      {vehicleTypeLabel}
                    </button>
                  ) : null}
                  {hasBudgetRange ? (
                    <button
                      type="button"
                      onClick={() => setActiveExploreView("budget")}
                      data-active-tab={currentExploreView === "budget"}
                      className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                        currentExploreView === "budget"
                          ? "border-accent bg-accent text-white"
                          : "border-input bg-input text-slate-300 hover:border-accent"
                      }`}
                    >
                      In your budget
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setActiveExploreView("keep-exploring")}
                    data-active-tab={currentExploreView === "keep-exploring"}
                    className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                      currentExploreView === "keep-exploring"
                        ? "border-accent bg-accent text-white"
                        : "border-input bg-input text-slate-300 hover:border-accent"
                    }`}
                  >
                    Keep Exploring
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveExploreView("second-chances")}
                    data-active-tab={currentExploreView === "second-chances"}
                    className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                      currentExploreView === "second-chances"
                        ? "border-accent bg-accent text-white"
                        : "border-input bg-input text-slate-300 hover:border-accent"
                    }`}
                  >
                    Second Chances
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {exploreCars.map((car) => (
              <CarCard
                key={car.id}
                {...car}
                footer={
                  <CarBrowseActions
                    onViewDetails={() => setActiveDetailsCar(car)}
                    onLike={() => setCarState(car.id, "liked")}
                    onPass={() => setCarState(car.id, "rejected")}
                  />
                }
              />
            ))}
          </div>

          {!exploreCars.length ? (
            <div className="rounded-[24px] border border-dashed border-input bg-input/60 p-5 text-sm leading-6 text-slate-300">
              {currentExploreView === "second-chances"
                ? "No passed cars to revisit right now."
                : currentExploreView === "brand"
                  ? "No available cars from your selected brands are waiting for a decision right now."
                : currentExploreView === "type"
                  ? "No available cars in your selected vehicle type are waiting for a decision right now."
                : currentExploreView === "budget"
                  ? "No available cars in your selected range are waiting for a decision right now."
                  : "No available cars are waiting for a decision right now."}
            </div>
          ) : null}
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
