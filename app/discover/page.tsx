"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, DollarSign, Grid2x2, RotateCcw, Search } from "lucide-react";

import { CarBrowseActions } from "@/components/CarBrowseActions";
import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import { BuyerEmptyState } from "@/components/BuyerEmptyState";
import { InfoIconButton } from "@/components/InfoIconButton";
import {
  SwipeDeck,
} from "@/components/SwipeDeck";
import { SponsorCard } from "@/components/SponsorCard";
import { TopPickLimitSheet } from "@/components/TopPickLimitSheet";
import {
  useJourney,
  type Preferences,
} from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars as mockCars, type Car } from "@/lib/cars";
import { loadInventoryWithFallback, type InventoryLoadResult } from "@/lib/inventoryProvider";
import {
  carMatchesBudgetRange,
  carMatchesNearBudgetRange,
  carMatchesPreferences,
  getDiscoverableCars,
  hasValidBudgetRange,
  hasUsablePreferences,
  isBuyerVisibleListing,
  isBroadExplorationEligible,
  isPrimaryDiscoveryEligible,
  isSoldListing,
} from "@/lib/matching";
import { sponsorAds } from "@/lib/sponsorAds";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSameDay } from "@/lib/date";
import {
  trackGuestDetailsOpened,
  trackGuestSessionCompleted,
} from "@/lib/guestEngagement";

const budgetFormatter = new Intl.NumberFormat("en-US");
const normalizeValue = (value: string) => value.trim().toLowerCase();
const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[-/]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
const normalizeCompactSearchText = (value: string) =>
  normalizeSearchText(value).replace(/\s+/g, "");
const formatBudgetRange = (minBudget: number | null, maxBudget: number | null) =>
  minBudget !== null && maxBudget !== null
    ? `${budgetFormatter.format(minBudget)}-${budgetFormatter.format(maxBudget)} TTD`
    : "No range set yet";

function RefinePreferencesLink() {
  return (
    <Link
      href="/find-the-one"
      className="app-button inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/6"
    >
      <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
      Refine Preferences
    </Link>
  );
}

const DISCOVER_PREFERENCES_HANDOFF_KEY =
  "revmatched.discover-preferences-handoff";

const isBudgetValue = (value: unknown): value is number | null =>
  value === null ||
  (typeof value === "number" && Number.isFinite(value));

const readDiscoverPreferencesHandoff = (): Preferences | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawHandoff = window.sessionStorage.getItem(
      DISCOVER_PREFERENCES_HANDOFF_KEY,
    );
    if (!rawHandoff) {
      return null;
    }

    const parsed = JSON.parse(rawHandoff) as Partial<Preferences>;
    const brands =
      Array.isArray(parsed.brand) &&
      parsed.brand.every((brand) => typeof brand === "string")
        ? parsed.brand
        : null;

    if (
      !isBudgetValue(parsed.minBudget) ||
      !isBudgetValue(parsed.maxBudget) ||
      typeof parsed.vehicleType !== "string" ||
      brands === null ||
      typeof parsed.model !== "string"
    ) {
      return null;
    }

    return {
      minBudget: parsed.minBudget,
      maxBudget: parsed.maxBudget,
      vehicleType: parsed.vehicleType,
      brand: brands,
      model: parsed.model,
    };
  } catch {
    return null;
  }
};

const parseSearchBudgetValue = (value: string) => {
  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)([km])?$/i);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount)) {
    return null;
  }

  if (match[2]?.toLowerCase() === "m") {
    return Math.round(amount * 1_000_000);
  }

  if (match[2]?.toLowerCase() === "k") {
    return Math.round(amount * 1_000);
  }

  return Math.round(amount);
};

const parseExploreSearchQuery = (query: string) => {
  let remaining = query.toLowerCase().replace(/,/g, " ");
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  const rangeMatch = remaining.match(
    /(\d+(?:\.\d+)?[km]?)\s*(?:-|to)\s*(\d+(?:\.\d+)?[km]?)/i,
  );

  if (rangeMatch) {
    minPrice = parseSearchBudgetValue(rangeMatch[1]);
    maxPrice = parseSearchBudgetValue(rangeMatch[2]);
    remaining = remaining.replace(rangeMatch[0], " ");
  }

  const underMatch = remaining.match(
    /\b(?:under|below|max|up to)\s*(\d+(?:\.\d+)?[km]?)/i,
  );

  if (underMatch) {
    maxPrice = parseSearchBudgetValue(underMatch[1]);
    remaining = remaining.replace(underMatch[0], " ");
  }

  const overMatch = remaining.match(
    /\b(?:over|above|min)\s*(\d+(?:\.\d+)?[km]?)/i,
  );

  if (overMatch) {
    minPrice = parseSearchBudgetValue(overMatch[1]);
    remaining = remaining.replace(overMatch[0], " ");
  }

  const standaloneNumberMatch = remaining.match(/^\s*(\d+(?:\.\d+)?[km]?)\s*$/i);

  if (standaloneNumberMatch && minPrice === null && maxPrice === null) {
    maxPrice = parseSearchBudgetValue(standaloneNumberMatch[1]);
    remaining = remaining.replace(standaloneNumberMatch[0], " ");
  }

  const textTokens = normalizeSearchText(remaining)
    .split(" ")
    .filter(Boolean);

  return {
    maxPrice,
    minPrice,
    normalizedTextQuery: normalizeSearchText(remaining),
    normalizedCompactTextQuery: normalizeCompactSearchText(remaining),
    textTokens,
  };
};

const getCarSearchableTerms = (car: Car) => {
  const searchableText = normalizeSearchText(
    [
      car.year,
      car.brand,
      car.make,
      car.model,
      car.name,
      car.category,
      car.vehicleType,
      car.priceValue,
      car.price,
    ].join(" "),
  );

  return {
    searchableCompactText: normalizeCompactSearchText(searchableText),
    searchableText,
  };
};

const carMatchesExploreSearchDirect = (car: Car, query: string) => {
  if (!query.trim()) {
    return true;
  }

  const {
    minPrice,
    maxPrice,
    normalizedCompactTextQuery,
    normalizedTextQuery,
    textTokens,
  } = parseExploreSearchQuery(query);

  if (minPrice !== null && car.priceValue < minPrice) {
    return false;
  }

  if (maxPrice !== null && car.priceValue > maxPrice) {
    return false;
  }

  if (!textTokens.length) {
    return true;
  }

  const { searchableCompactText, searchableText } = getCarSearchableTerms(car);

  if (
    normalizedTextQuery &&
    (searchableText.includes(normalizedTextQuery) ||
      (normalizedCompactTextQuery &&
        searchableCompactText.includes(normalizedCompactTextQuery)))
  ) {
    return true;
  }

  return textTokens.every((token) => {
    const compactToken = normalizeCompactSearchText(token);

    return (
      searchableText.includes(token) ||
      (compactToken !== "" && searchableCompactText.includes(compactToken))
    );
  });
};

const filterAllExploreCars = (carsToFilter: Car[], query: string) => {
  if (!query.trim()) {
    return carsToFilter;
  }

  return carsToFilter.filter((car) => carMatchesExploreSearchDirect(car, query));
};

type ExploreView =
  | "keep-exploring"
  | "budget"
  | "second-chances"
  | "all";

const exploreViewDescriptions: Record<ExploreView, string> = {
  budget:
    "Cars that fit your price range, even if they don’t match every preference.",
  "keep-exploring":
    "More cars to explore, even if they don’t match your preferences.",
  "second-chances":
    "Cars you passed before, in case you want another look.",
  all: "All available cars, including ones you’ve already liked or passed.",
};

export default function DiscoverPage() {
  const mounted = useMounted();
  const router = useRouter();
  const [inventoryResult, setInventoryResult] = useState<InventoryLoadResult>({
    source: "mock",
    cars: mockCars,
  });
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [hasCompletedInitialInventoryLoad, setHasCompletedInitialInventoryLoad] =
    useState(false);
  const [deckKey, setDeckKey] = useState(0);
  const [activeDetailsCar, setActiveDetailsCar] = useState<Car | null>(null);
  const [replacementCandidateCarId, setReplacementCandidateCarId] = useState<
    string | null
  >(null);
  const [shouldPulseKeepExploringTab, setShouldPulseKeepExploringTab] =
    useState(false);
  const [isExploreHelpOpen, setIsExploreHelpOpen] = useState(false);
  const [allExploreSearchQuery, setAllExploreSearchQuery] = useState("");
  const exploreSectionRef = useRef<HTMLElement | null>(null);
  const exploreTabsRef = useRef<HTMLDivElement | null>(null);
  const keepExploringPulseTimeoutRef = useRef<number | null>(null);
  const lastInventoryLoadAuthKeyRef = useRef<string | null>(null);
  const hasManuallySelectedExploreViewRef = useRef(false);
  const {
    carProgress,
    preferences,
    setCarState,
    replaceEarliestTopPick,
    updateActiveInventoryCars,
    isAuthenticated,
  } = useJourney();
  const [discoverPreferencesHandoff, setDiscoverPreferencesHandoff] =
    useState<Preferences | null>(null);
  const [hasReadDiscoverPreferencesHandoff, setHasReadDiscoverPreferencesHandoff] =
    useState(false);

  useEffect(() => {
    setDiscoverPreferencesHandoff(readDiscoverPreferencesHandoff());
    setHasReadDiscoverPreferencesHandoff(true);
  }, []);

  // When the buyer comes directly from Define, use their just-saved choices
  // immediately instead of waiting for the shared journey state to catch up.
  const effectivePreferences = discoverPreferencesHandoff ?? preferences;
  const inventoryCars = inventoryResult.cars;
  const mockCarIds = useMemo(
    () => new Set(mockCars.map((car) => car.id)),
    [],
  );
  const inventoryCarProgress = useMemo(
    () =>
      inventoryCars.reduce<typeof carProgress>(
        (result, car) => {
          result[car.id] ??= {
            state: null,
            notes: "",
            matchedAt: null,
          };

          return result;
        },
        { ...carProgress },
      ),
    [carProgress, inventoryCars],
  );
  const discoverCars = useMemo(
    () =>
      getDiscoverableCars(
        inventoryCars,
      effectivePreferences,
        inventoryCarProgress,
      ),
  [effectivePreferences, inventoryCarProgress, inventoryCars],
  );
  const [matchDeckCars, setMatchDeckCars] = useState(() => discoverCars);
  const hasDefinePreferences = hasUsablePreferences(effectivePreferences);
  const hasBudgetRange = hasValidBudgetRange(effectivePreferences);
  const selectedBrands = effectivePreferences.brand;
  const selectedVehicleType = effectivePreferences.vehicleType.trim();
  const hasSpecificVehicleType =
    normalizeValue(selectedVehicleType) !== "" &&
    normalizeValue(selectedVehicleType) !== "all";
  const normalizedModel = effectivePreferences.model.trim();
  const [activeExploreView, setActiveExploreView] =
    useState<ExploreView>("keep-exploring");

  const sortByMostRecent = useMemo(
    () => (carsToSort: Car[]) =>
      [...carsToSort].sort((left, right) => {
        if (right.year !== left.year) {
          return right.year - left.year;
        }

        return inventoryCars.findIndex((car) => car.id === left.id) -
          inventoryCars.findIndex((car) => car.id === right.id);
      }),
    [inventoryCars],
  );

  const keepExploringCars = useMemo(
    () =>
      sortByMostRecent(
        inventoryCars.filter((car) => isBroadExplorationEligible(car)),
      ),
    [inventoryCars, sortByMostRecent],
  );

  const budgetCars = useMemo(
    () =>
      hasBudgetRange
        ? sortByMostRecent(
            inventoryCars.filter(
              (car) =>
                isBroadExplorationEligible(car) &&
              (carMatchesBudgetRange(car, effectivePreferences) ||
                carMatchesNearBudgetRange(car, effectivePreferences)),
            ),
          )
        : [],
  [hasBudgetRange, inventoryCars, effectivePreferences, sortByMostRecent],
  );
  const secondChanceCars = useMemo(
    () =>
      sortByMostRecent(
        inventoryCars.filter(
          (car) =>
            isBroadExplorationEligible(car) &&
            inventoryCarProgress[car.id]?.state === "rejected",
        ),
      ),
    [inventoryCarProgress, inventoryCars, sortByMostRecent],
  );
  const allCars = useMemo(
    () =>
      sortByMostRecent(inventoryCars.filter((car) => isBuyerVisibleListing(car))),
    [inventoryCars, sortByMostRecent],
  );
  const allPreferenceMatches = useMemo(
    () =>
      sortByMostRecent(
        inventoryCars.filter(
          (car) =>
            isPrimaryDiscoveryEligible(car) &&
          carMatchesPreferences(car, effectivePreferences),
        ),
      ),
  [inventoryCars, effectivePreferences, sortByMostRecent],
  );
  const exploreExclusionIds = useMemo(() => {
    const excludedIds = new Set(discoverCars.map((car) => car.id));

    Object.entries(inventoryCarProgress).forEach(([carId, value]) => {
      if (["liked", "rejected", "matched"].includes(value.state ?? "")) {
        excludedIds.add(carId);
      }
    });

    return excludedIds;
  }, [inventoryCarProgress, discoverCars]);

  const initialExploreViewCounts = useMemo(
    () => [
      ...(hasBudgetRange
        ? [
            {
              view: "budget" as const,
              count: budgetCars.filter((car) => !exploreExclusionIds.has(car.id))
                .length,
            },
          ]
        : []),
      {
        view: "keep-exploring" as const,
        count: keepExploringCars.filter(
          (car) => !exploreExclusionIds.has(car.id),
        ).length,
      },
      { view: "second-chances" as const, count: secondChanceCars.length },
      { view: "all" as const, count: allCars.length },
    ],
    [
      allCars,
      budgetCars,
      exploreExclusionIds,
      hasBudgetRange,
      keepExploringCars,
      secondChanceCars,
    ],
  );

const currentExploreView =
  activeExploreView === "budget" && !hasBudgetRange
    ? "keep-exploring"
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
      currentExploreView === "all"
        ? filterAllExploreCars(rawExploreCars, allExploreSearchQuery)
        : currentExploreView === "second-chances"
          ? rawExploreCars
          : rawExploreCars.filter((car) => !exploreExclusionIds.has(car.id)),
    [allExploreSearchQuery, currentExploreView, exploreExclusionIds, rawExploreCars],
  );
  const activePreferenceChips = [
    ...(hasBudgetRange
      ? [
          `Range ${formatBudgetRange(
          effectivePreferences.minBudget,
          effectivePreferences.maxBudget,
          )}`,
        ]
      : []),
    ...selectedBrands,
    ...(hasSpecificVehicleType
      ? [selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)]
      : []),
    ...(normalizedModel ? [normalizedModel] : []),
  ];
  const topPickCount = inventoryCars.filter(
    (car) => carProgress[car.id]?.state === "matched" && !isSoldListing(car),
  ).length;
  const canAddTopPick = topPickCount < 3;
  const likedCount = inventoryCars.filter(
    (car) => carProgress[car.id]?.state === "liked",
  ).length;
  const hasLikedCars = likedCount > 0;
  const reviewLikedButtonClassName = hasLikedCars
    ? "app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 sm:px-5"
    : "inline-flex min-h-11 cursor-default items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white/7 sm:px-5";
  const completionReviewLikedButtonClassName = isAuthenticated
    ? reviewLikedButtonClassName
    : hasLikedCars
      ? "app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10 sm:px-5"
      : reviewLikedButtonClassName;
  const matchingCars = allPreferenceMatches;
  const today = useMemo(() => new Date(), []);
  const hasActionToday = useCallback(
    (carId: string) => {
      const progress = inventoryCarProgress[carId];
      const actionTimestamps = [
        progress?.likedAt,
        progress?.passedAt,
        progress?.topPickedAt,
      ];

      return actionTimestamps.some((timestamp) => {
        if (!timestamp) {
          return false;
        }

        const actionDate = new Date(timestamp);

        return !Number.isNaN(actionDate.getTime()) && isSameDay(actionDate, today);
      });
    },
    [inventoryCarProgress, today],
  );
  const totalMatchingCars = matchingCars.length;
  const completedMatchingCars = matchingCars.filter((car) =>
    hasActionToday(car.id),
  ).length;
  const matchingCarsProgress =
    totalMatchingCars > 0 ? completedMatchingCars / totalMatchingCars : 0;
  const matchingCarsProgressPercent = `${Math.round(
    Math.min(matchingCarsProgress, 1) * 100,
  )}%`;
  const finishedTodaysLineup =
    hasDefinePreferences &&
    !discoverCars.length &&
    totalMatchingCars > 0 &&
    completedMatchingCars === totalMatchingCars;
  const hasNoMatches = hasDefinePreferences && totalMatchingCars === 0;
  const handleDefinePromptClick = () => {
    window.sessionStorage.setItem("revmatched.define-attention", "true");
    router.push("/find-the-one");
  };
  const handleExploreViewChange = useCallback((view: ExploreView) => {
    hasManuallySelectedExploreViewRef.current = true;
    setActiveExploreView(view);
  }, []);

  const handleKeepExploringShortcut = useCallback(() => {
    hasManuallySelectedExploreViewRef.current = true;
    setActiveExploreView("keep-exploring");
    setShouldPulseKeepExploringTab(true);

    if (keepExploringPulseTimeoutRef.current !== null) {
      window.clearTimeout(keepExploringPulseTimeoutRef.current);
    }

    window.requestAnimationFrame(() => {
      exploreSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    keepExploringPulseTimeoutRef.current = window.setTimeout(() => {
      setShouldPulseKeepExploringTab(false);
      keepExploringPulseTimeoutRef.current = null;
    }, 1200);
  }, [setActiveExploreView]);

  useEffect(() => {
    let isCancelled = false;
    const supabase = createSupabaseBrowserClient();

    const loadInventoryForAuthKey = async (
      authKey: string,
      options: { force?: boolean } = {},
    ) => {
    if (!options.force && lastInventoryLoadAuthKeyRef.current === authKey) {
      return;
    }

    if (options.force) {
      hasManuallySelectedExploreViewRef.current = false;
      setHasCompletedInitialInventoryLoad(false);
    }

    lastInventoryLoadAuthKeyRef.current = authKey;
      setIsInventoryLoading(true);

      try {
        const nextInventoryResult = await loadInventoryWithFallback(supabase);

        if (isCancelled) {
          return;
        }

        setInventoryResult(nextInventoryResult);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setInventoryResult({
          source: "mock",
          cars: mockCars,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load Supabase inventory.",
        });
      } finally {
      if (!isCancelled) {
        setHasCompletedInitialInventoryLoad(true);
        setIsInventoryLoading(false);
      }
      }
    };

    const loadInventoryForCurrentSession = async (options: { force?: boolean } = {}) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await loadInventoryForAuthKey(session?.user.id ?? "anonymous", options);
    };

    void loadInventoryForCurrentSession({ force: true });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "INITIAL_SESSION" &&
        event !== "SIGNED_IN" &&
        event !== "TOKEN_REFRESHED" &&
        event !== "SIGNED_OUT"
      ) {
        return;
      }

      const authKey = session?.user.id ?? "anonymous";

      window.setTimeout(() => {
        void loadInventoryForAuthKey(authKey);
      }, 0);
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, []);

useEffect(() => {
  if (
    isInventoryLoading ||
    !hasCompletedInitialInventoryLoad ||
    !hasReadDiscoverPreferencesHandoff ||
    hasManuallySelectedExploreViewRef.current
  ) {
    return;
  }

  const firstAvailableView = initialExploreViewCounts.find(
    ({ count }) => count > 0,
  );

  if (
    firstAvailableView &&
    currentExploreView !== firstAvailableView.view
  ) {
    setActiveExploreView(firstAvailableView.view);
  }
  }, [
    currentExploreView,
    hasCompletedInitialInventoryLoad,
    hasReadDiscoverPreferencesHandoff,
    initialExploreViewCounts,
    isInventoryLoading,
  ]);

useEffect(() => {
  if (!discoverPreferencesHandoff || !hasReadDiscoverPreferencesHandoff) {
      return;
    }

    try {
      window.sessionStorage.removeItem(DISCOVER_PREFERENCES_HANDOFF_KEY);
    } catch {
      // The in-memory handoff has already completed.
    }
}, [discoverPreferencesHandoff, hasReadDiscoverPreferencesHandoff]);

  useEffect(() => {
    setMatchDeckCars(discoverCars);
  }, [discoverCars]);

  useEffect(() => {
    updateActiveInventoryCars(inventoryCars);
  }, [inventoryCars, updateActiveInventoryCars]);

  useEffect(() => {
    if (!finishedTodaysLineup || isAuthenticated) {
      return;
    }

    trackGuestSessionCompleted(today);
  }, [finishedTodaysLineup, isAuthenticated, today]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("revmatched:discover-count", {
        detail: {
          count: discoverCars.length,
          source: inventoryResult.source,
        },
      }),
    );
  }, [discoverCars.length, inventoryResult.source]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const mockInventoryCars = inventoryCars.filter((car) =>
      mockCarIds.has(car.id),
    );
    const supabaseLikeInventoryCars = inventoryCars.filter(
      (car) => !mockCarIds.has(car.id),
    );

    console.info("[RevMatched Discover inventory]", {
      activeExploreView: currentExploreView,
      discoverCarsUsedAfterPreferenceFiltering: discoverCars.length,
      exploreCarsUsedAfterExploreFiltering: exploreCars.length,
      inventoryError: inventoryResult.error ?? null,
      inventoryLoading: isInventoryLoading,
      inventorySource: inventoryResult.source,
      journeyProviderOverwritingInventory: false,
      journeyProgressTrackedCars: Object.keys(carProgress).length,
      matchDeckCarsUsedBySwipeDeck: matchDeckCars.length,
      mockCarsInActiveInventory: mockInventoryCars.length,
      mockInventorySample: mockInventoryCars
        .slice(0, 5)
        .map((car) => car.name),
      supabaseLikeCarsInActiveInventory: supabaseLikeInventoryCars.length,
      supabaseLikeInventorySample: supabaseLikeInventoryCars
        .slice(0, 5)
        .map((car) => car.name),
      totalCarsReturnedByLoadInventoryWithFallback: inventoryCars.length,
    });
  }, [
    carProgress,
    currentExploreView,
    discoverCars,
    exploreCars,
    inventoryCars,
    inventoryResult.error,
    inventoryResult.source,
    isInventoryLoading,
    matchDeckCars,
    mockCarIds,
  ]);

  useEffect(() => {
    const handleRefreshDiscover = () => {
      setDeckKey((prev) => prev + 1);
      setMatchDeckCars(discoverCars);
    };

    window.addEventListener("revmatched:refresh-discover", handleRefreshDiscover);

    return () => {
      window.removeEventListener(
        "revmatched:refresh-discover",
        handleRefreshDiscover,
      );
    };
  }, [discoverCars]);

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

  useEffect(
    () => () => {
      if (keepExploringPulseTimeoutRef.current !== null) {
        window.clearTimeout(keepExploringPulseTimeoutRef.current);
      }
    },
    [],
  );

  const handleTopPickRequest = (carId: string) => {
    if (canAddTopPick) {
      setCarState(carId, "matched");
      return;
    }

    setReplacementCandidateCarId(carId);
  };
  const handleViewDetails = (car: Car) => {
    if (!isAuthenticated) {
      trackGuestDetailsOpened();
    }

    setActiveDetailsCar(car);
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3 sm:px-7 lg:px-10 lg:py-4">
        <section className="page-panel motion-rise-fade motion-delay-0 space-y-2.5 rounded-[28px] border border-input bg-panel p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-5">
          {isInventoryLoading && !hasCompletedInitialInventoryLoad ? (
            <p className="text-xs font-medium text-slate-500">
              Loading inventory...
            </p>
          ) : null}
          {matchDeckCars.length ? (
            <SwipeDeck
              key={deckKey}
              cars={matchDeckCars}
              onKeepExploring={handleKeepExploringShortcut}
              preferenceChips={activePreferenceChips}
            />
          ) : !hasDefinePreferences ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
                No matches yet —{" "}
                <button
                  type="button"
                  onClick={handleDefinePromptClick}
                  className="group inline-flex cursor-pointer items-center rounded-sm font-semibold text-[#ff496c] outline-none transition hover:text-[#ff6f8a] focus-visible:ring-2 focus-visible:ring-[#D1133A]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-[0.99]"
                >
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size,filter,text-shadow] duration-200 group-hover:bg-[length:100%_2px] group-hover:drop-shadow-[0_0_10px_rgba(209,19,58,0.32)]">
                    tell us what you like
                  </span>
                </button>{" "}
                and we’ll find them if they’re out there.
              </p>
              <Link
                href="/like"
                aria-disabled={!hasLikedCars}
                tabIndex={hasLikedCars ? undefined : -1}
                onClick={(event) => {
                  if (!hasLikedCars) {
                    event.preventDefault();
                  }
                }}
                className={reviewLikedButtonClassName}
              >
                Review Liked
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
          ) : finishedTodaysLineup ? (
            <div className="matches-completion-card rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_100%)] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.26)] sm:p-6">
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="matches-completion-progress matches-completion-progress-finish h-full rounded-full bg-emerald-400"
                  style={{ width: matchingCarsProgressPercent }}
                />
              </div>
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {isAuthenticated
                      ? "You’re all caught up for today."
                      : "Keep the matches coming"}
                  </h2>
                  <p className="mt-2 text-base leading-relaxed text-slate-300">
                    {isAuthenticated
                      ? "We’ll keep watching for new cars that match your preferences."
                      : "Sign up free and we’ll save your preferences, Likes and Top Picks — then show you new matches as cars are added."}
                  </p>
                  {!isAuthenticated ? (
                    <Link
                      href="/sign-up"
                      className="app-button mt-5 inline-flex w-fit justify-center rounded-xl border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Save My Matches
                    </Link>
                  ) : null}
                </div>
                <div className="flex flex-nowrap items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 [&_a]:min-h-11 [&_a]:w-fit [&_a]:shrink-0 [&_a]:whitespace-nowrap [&_a]:justify-start [&_a]:gap-1.5 [&_a]:px-2 sm:[&_a]:gap-2 sm:[&_a]:px-4">
                    <RefinePreferencesLink />
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-3">
                    <Link
                      href="/like"
                      aria-disabled={!hasLikedCars}
                      tabIndex={hasLikedCars ? undefined : -1}
                      onClick={(event) => {
                        if (!hasLikedCars) {
                          event.preventDefault();
                        }
                      }}
                      className={`w-fit shrink-0 whitespace-nowrap ${completionReviewLikedButtonClassName}`}
                    >
                      Review Liked
                      <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleKeepExploringShortcut}
                      className="app-button inline-flex justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10"
                    >
                      Keep browsing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : hasNoMatches ? (
          <div className="rounded-[24px] border border-dashed border-input bg-slate-950/30 text-center lg:text-left">
            <BuyerEmptyState
              className="gap-3 p-3 sm:gap-8 sm:px-10 sm:py-10 lg:gap-10 lg:px-10 lg:py-10"
              compactOnMobile
              illustrationIcon={Search}
              illustrationLabel="Discover"
            >
            <div className="mx-auto max-w-2xl lg:mx-0">
              <div className="hidden h-20 w-20 place-items-center rounded-full border border-input bg-panel text-white sm:grid lg:mx-0">
                <Search size={36} strokeWidth={2.1} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-semibold text-white sm:mt-5">No new matches right now</h2>
      <p className="mt-1.5 text-base leading-relaxed text-slate-300 sm:mt-2 md:text-lg">
        Try widening your budget, vehicle type, or brands.
      </p>
      {hasLikedCars ? (
        <div className="mx-auto mt-4 flex w-full flex-nowrap items-center justify-between gap-2 sm:mt-6 sm:w-fit sm:gap-3 lg:mx-0">
          <Link
            href="/like"
            className="app-button order-2 ml-auto inline-flex min-h-11 shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90 sm:order-none sm:ml-0 sm:px-5"
          >
            Review Liked
            <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <Link
            href="/find-the-one"
            className="app-button order-1 inline-flex min-h-11 shrink-0 whitespace-nowrap items-center justify-start gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10 sm:order-none sm:gap-2 sm:px-5"
          >
            <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
            Go to Define
          </Link>
        </div>
      ) : (
        <Link
          href="/find-the-one"
          className="app-button mx-auto mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90 sm:mt-6 lg:mx-0"
        >
          <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
          Go to Define
        </Link>
      )}
            </div>
            </BuyerEmptyState>
          </div>
          ) : (
            <div className="space-y-4">
              <p className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                No new matches today — try widening your range or explore below.
              </p>
              <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0 [&_a]:min-h-11 [&_a]:shrink-0 [&_a]:whitespace-nowrap [&_a]:justify-start [&_a]:gap-1.5 [&_a]:px-2 sm:[&_a]:gap-2 sm:[&_a]:px-4">
                  <RefinePreferencesLink />
                </div>
                <Link
                  href="/like"
                  className="app-button ml-auto inline-flex min-h-11 shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90 sm:px-5"
                >
                  Review Liked
                  <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </section>

        <section
          id="explore-more"
          ref={exploreSectionRef}
          className="scroll-mt-32 page-panel motion-rise-fade motion-delay-2 rounded-[26px] border border-input bg-panel p-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-5"
        >
          <div className="flex flex-nowrap items-center justify-between gap-2 sm:items-start sm:gap-4">
            <div className="min-w-0 max-w-3xl">
              <h2 className="flex items-center gap-2 whitespace-nowrap text-2xl font-semibold text-white sm:gap-3">
                Explore More
                  <InfoIconButton
                    onClick={() => setIsExploreHelpOpen((current) => !current)}
                    aria-expanded={isExploreHelpOpen}
                    aria-label="How Explore More works"
                  >
                    <span aria-hidden="true" className="font-serif text-[1.3rem] font-bold italic leading-none">
                      i
                    </span>
                  </InfoIconButton>
              </h2>
            </div>
            <div className="flex shrink-0 items-center sm:justify-end">
              <div className="inline-flex w-fit whitespace-nowrap items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:bg-white/10 sm:px-4">
                {exploreCars.length} cars in view
              </div>
            </div>
          </div>

          {isExploreHelpOpen ? (
            <div className="liked-help-panel mx-auto mt-5 w-full max-w-xl rounded-[28px] border border-white/10 bg-[#07141d] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
              <h3 className="text-2xl font-semibold text-white">
                How this works
              </h3>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <DollarSign size={19} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Budget matches
                    </p>
                    <p className="mt-1 text-base leading-7 text-slate-300">
                      Cars that fit your price range, even if they don’t match every preference.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                    <Search size={19} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Keep exploring
                    </p>
                    <p className="mt-1 text-base leading-7 text-slate-300">
                      More cars to explore, even if they don’t match your preferences.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                    <RotateCcw size={19} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Second chances
                    </p>
                    <p className="mt-1 text-base leading-7 text-slate-300">
                      Cars you passed before, in case you want another look.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                    <Grid2x2 size={19} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      All
                    </p>
                    <p className="mt-1 text-base leading-7 text-slate-300">
                      All available cars, including ones you’ve already liked or passed.
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-base font-medium leading-7 text-slate-400">
                These tabs help you explore beyond your main matches.
              </p>
              <button
                type="button"
                onClick={() => setIsExploreHelpOpen(false)}
                className="app-button mt-5 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/12"
              >
                Got it
              </button>
            </div>
          ) : null}

          <div className="mt-3 space-y-3">
            <div
              ref={exploreTabsRef}
              className="flex flex-wrap items-start gap-3 px-1"
            >
              {hasBudgetRange ? (
                <button
                  type="button"
              onClick={() => handleExploreViewChange("budget")}
                  data-active-tab={currentExploreView === "budget"}
                  className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                    currentExploreView === "budget"
                      ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                      : "nav-pill-inactive border-input bg-input text-slate-300"
                  }`}
                >
                  <DollarSign size={16} strokeWidth={2.4} aria-hidden="true" />
                  Budget matches
                </button>
              ) : null}
              <button
                type="button"
            onClick={() => handleExploreViewChange("keep-exploring")}
                data-active-tab={currentExploreView === "keep-exploring"}
                className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                  currentExploreView === "keep-exploring"
                    ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                    : "nav-pill-inactive border-input bg-input text-slate-300"
                } ${
                  shouldPulseKeepExploringTab &&
                  currentExploreView === "keep-exploring"
                    ? "explore-tab-shortcut-pulse"
                    : ""
                }`}
              >
                <Search size={16} strokeWidth={2.4} aria-hidden="true" />
                Keep exploring
              </button>
              <button
                type="button"
            onClick={() => handleExploreViewChange("second-chances")}
                data-active-tab={currentExploreView === "second-chances"}
                className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                  currentExploreView === "second-chances"
                    ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                    : "nav-pill-inactive border-input bg-input text-slate-300"
                }`}
              >
                <RotateCcw size={16} strokeWidth={2.4} aria-hidden="true" />
                Second chances
              </button>
              <button
                type="button"
            onClick={() => handleExploreViewChange("all")}
                data-active-tab={currentExploreView === "all"}
                className={`nav-pill inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition ${
                  currentExploreView === "all"
                    ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                    : "nav-pill-inactive border-input bg-input text-slate-300"
                }`}
              >
                <Grid2x2 size={16} strokeWidth={2.4} aria-hidden="true" />
                All
              </button>
            </div>
            {currentExploreView === "all" ? (
              <div className="px-1">
                <div className="min-w-0 sm:max-w-[360px]">
                  <label className="sr-only" htmlFor="explore-all-search">
                    Search all cars
                  </label>
                  <div className="flex h-[42px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 backdrop-blur-sm transition focus-within:border-white/20 focus-within:bg-white/7">
                    <Search
                      size={16}
                      strokeWidth={2.4}
                      className="shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="explore-all-search"
                      value={allExploreSearchQuery}
                      onChange={(event) => setAllExploreSearchQuery(event.target.value)}
                      placeholder="Search all cars"
                      className="app-input w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <p className="mt-3 px-1 text-sm font-medium leading-6 text-slate-300">
              {exploreViewDescriptions[currentExploreView]}
            </p>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {exploreCars.map((car, index) => {
                const carState = inventoryCarProgress[car.id]?.state;
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
                      overlay={
                        replacementCandidateCarId === car.id && !canAddTopPick ? (
                          <TopPickLimitSheet
                            onConfirm={() => {
                              replaceEarliestTopPick(car.id);
                              setReplacementCandidateCarId(null);
                            }}
                            onCancel={() => setReplacementCandidateCarId(null)}
                          />
                        ) : null
                      }
                      footer={
                        <CarBrowseActions
                          variant="dark"
                          status={cardStatus}
                          onViewDetails={() => handleViewDetails(car)}
                          onLike={() => setCarState(car.id, "liked")}
                          onTopPick={() => handleTopPickRequest(car.id)}
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
              <div className="rounded-[32px] border border-dashed border-input bg-input/60 px-5 py-7 text-center shadow-[0_16px_40px_rgba(0,0,0,0.2)] sm:px-10 sm:py-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-100 shadow-lg">
                  <Search className="h-8 w-8" aria-hidden="true" />
                </div>
                {currentExploreView === "all" && allExploreSearchQuery.trim() ? (
                  <p className="mt-5 text-xl font-semibold text-white sm:text-2xl">
                    No cars match that search. Try another brand, model, type, or budget.
                  </p>
                ) : (
                  <>
                    <p className="mt-5 text-xl font-semibold text-white sm:text-2xl">
                      No more cars here right now.
                    </p>
                    <p className="mt-3 text-base leading-relaxed text-slate-300">
                      Try another angle.
                    </p>
                  </>
                )}
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
