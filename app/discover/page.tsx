"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CarBrowseActions } from "@/components/CarBrowseActions";
import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import {
  SwipeDeck,
} from "@/components/SwipeDeck";
import { SponsorCard } from "@/components/SponsorSupportLine";
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
  | "budget";

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
    () => sortByMostRecent(cars.filter((car) => carIsAvailable(car))),
    [sortByMostRecent],
  );

  const brandCars = useMemo(
    () =>
      hasSelectedBrands
        ? sortByMostRecent(
            cars.filter(
              (car) =>
                carIsAvailable(car) &&
                selectedBrands.some(
                  (brand) => normalizeValue(car.brand) === normalizeValue(brand),
                ),
            ),
          )
        : [],
    [hasSelectedBrands, selectedBrands, sortByMostRecent],
  );

  const typeCars = useMemo(
    () =>
      hasSpecificVehicleType
        ? sortByMostRecent(
            cars.filter(
              (car) =>
                carIsAvailable(car) &&
                normalizeValue(car.vehicleType) ===
                  normalizeValue(selectedVehicleType),
            ),
          )
        : [],
    [
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
                carMatchesBudgetRange(car, preferences),
            ),
          )
        : [],
    [hasBudgetRange, preferences, sortByMostRecent],
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
        : keepExploringCars;
  const exploreSectionCopy = {
    label: "EXPLORE",
    title: "Explore more options",
    body: "See more cars beyond your exact filters.",
  };
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <section className="page-panel motion-rise-fade motion-delay-0 space-y-5 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                DISCOVER
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Your Matches
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {discoverCars.length
                  ? "Swipe through cars that match your preferences."
                  : "No new matches fit your current preferences right now."}
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
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <Link
                href="/like"
                className="app-button inline-flex w-fit items-center rounded-full border border-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
              >
                View liked
              </Link>
            </div>
          </div>

          <SponsorCard
            sponsor="summit-bank"
            title="Plan your next move"
            description="Estimate your monthly payment with ease"
            cta="Estimate Payment"
          />

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

        <section className="page-panel motion-rise-fade motion-delay-2 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                {exploreSectionCopy.label}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {exploreSectionCopy.title}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {exploreSectionCopy.body}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <div className="inline-flex w-fit items-center rounded-full border border-input bg-input px-4 py-2 text-sm font-medium text-slate-300">
                {exploreCars.length} cars in view
              </div>
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
                        ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#E1144F]"
                        : "nav-pill-inactive border-input bg-input text-slate-300"
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
                        ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#E1144F]"
                        : "nav-pill-inactive border-input bg-input text-slate-300"
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
                        ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#E1144F]"
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
                  className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                    currentExploreView === "keep-exploring"
                      ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#E1144F]"
                      : "nav-pill-inactive border-input bg-input text-slate-300"
                  }`}
                >
                  Keep Exploring
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0.005)_100%)] p-1.5 sm:p-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {exploreCars.map((car) => {
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
                  <CarCard
                    key={car.id}
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
                );
              })}
            </div>

            {!exploreCars.length ? (
              <div className="rounded-[24px] border border-dashed border-input bg-input/60 p-5 text-sm leading-6 text-slate-300">
                {currentExploreView === "brand"
                  ? "No available cars from your selected brands are in view right now."
                  : currentExploreView === "type"
                    ? "No available cars in your selected vehicle type are in view right now."
                    : currentExploreView === "budget"
                      ? "No available cars in your selected range are in view right now."
                      : "No available cars are in view right now."}
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
