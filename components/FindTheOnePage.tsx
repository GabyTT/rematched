"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  DollarSign,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useJourney, type Preferences } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { DEFAULT_BRANDS } from "@/lib/brands";

const parseBudget = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : null;
};
const formatBudgetInput = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly).toLocaleString("en-US") : "";
};
const formatCurrency = (value: number) =>
  `TT$${new Intl.NumberFormat("en-US").format(Math.round(value))}`;
const roundToNearestThousand = (value: number) =>
  Math.max(Math.round(value / 1000) * 1000, 0);
const sortBrands = (value: string[]) =>
  [...value].sort((left, right) => left.localeCompare(right));
const normalizeBrands = (value: string[]) =>
  sortBrands(value.map((item) => item.trim()).filter(Boolean));
const formLabelClassName =
  "mb-2.5 block text-[0.95rem] font-semibold tracking-[0.01em] text-[#314154]";

type PreferenceFormSnapshot = {
  minBudget: number | null;
  maxBudget: number | null;
  vehicleType: string;
  brands: string[];
  model: string;
};

const getSavedPreferenceSnapshot = (
  preferenceValues: Preferences,
): PreferenceFormSnapshot => ({
  minBudget: preferenceValues.minBudget,
  maxBudget: preferenceValues.maxBudget,
  vehicleType: preferenceValues.vehicleType.trim(),
  brands: normalizeBrands(preferenceValues.brand),
  model: preferenceValues.model.trim(),
});

type BuyerGuideStep = "intro" | "question-1" | "question-2" | "result";
type BuyerPriority = "practicality" | "style";
type BuyerNeed = "easy" | "room";
type BudgetHelperStep =
  | "intro"
  | "question-1"
  | "question-2"
  | "question-3"
  | "question-4"
  | "result";

type BuyerTypeResult = {
  type: string;
  body: string;
  suggestedType: "sedan" | "suv";
  suggestedTypeLabel: "Sedan" | "SUV";
  considering: string;
};

const buyerTypeResults: Record<`${BuyerPriority}-${BuyerNeed}`, BuyerTypeResult> =
  {
    "practicality-easy": {
      type: "Smart Compact",
      body: "You seem to want something practical, manageable, and easy to live with day to day. A smaller vehicle that feels sensible and straightforward may suit you best.",
      suggestedType: "sedan",
      suggestedTypeLabel: "Sedan",
      considering: "Hatchback, Compact Crossover",
    },
    "practicality-room": {
      type: "Utility-First",
      body: "You seem to value room, flexibility, and everyday usefulness. A vehicle with more space and versatility may be the best place to start.",
      suggestedType: "suv",
      suggestedTypeLabel: "SUV",
      considering: "Crossover, Pickup",
    },
    "style-easy": {
      type: "City Statement",
      body: "You seem to want something that feels sharp, stylish, and enjoyable without taking up more space than you need. A sleeker everyday vehicle may be your best fit.",
      suggestedType: "sedan",
      suggestedTypeLabel: "Sedan",
      considering: "Hatchback, Compact Crossover",
    },
    "style-room": {
      type: "Road Presence",
      body: "You seem to want comfort, space, and something with a stronger presence on the road. A roomier vehicle with a bigger feel may suit you best.",
      suggestedType: "suv",
      suggestedTypeLabel: "SUV",
      considering: "Crossover, Sedan",
    },
  };

const estimateLoanPrincipal = (
  monthlyPayment: number,
  termYears: number,
  annualInterestRate: number,
) => {
  const months = termYears * 12;
  const monthlyRate = annualInterestRate / 100 / 12;

  if (monthlyRate === 0) {
    return monthlyPayment * months;
  }

  return (
    monthlyPayment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate
  );
};

function HelperStepHeader({
  label,
  onBack,
  onClose,
}: {
  label: string;
  onBack?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c4d0da] bg-[#eef3f7] text-[#2E3C4A] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
          aria-label="Go to previous question"
        >
          <ArrowLeft size={18} strokeWidth={2.1} />
        </button>
      ) : onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c4d0da] bg-[#eef3f7] text-[#2E3C4A] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
          aria-label="Close helper"
        >
          <X size={18} strokeWidth={2.1} />
        </button>
      ) : null}
      <p className="text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] sm:text-[1.45rem]">
        {label}
      </p>
    </div>
  );
}

export function FindTheOnePage() {
  const mounted = useMounted();
  const router = useRouter();
  const { preferences, updatePreferences } = useJourney();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formConfirmation, setFormConfirmation] = useState<string | null>(null);
  const [isDirtyPopActive, setIsDirtyPopActive] = useState(false);
  const [minBudgetInput, setMinBudgetInput] = useState(
    preferences.minBudget ? preferences.minBudget.toLocaleString("en-US") : "",
  );
  const [maxBudgetInput, setMaxBudgetInput] = useState(
    preferences.maxBudget ? preferences.maxBudget.toLocaleString("en-US") : "",
  );
  const [vehicleType, setVehicleType] = useState(preferences.vehicleType);
  const [brands, setBrands] = useState(preferences.brand);
  const [brandQuery, setBrandQuery] = useState("");
  const [model, setModel] = useState(preferences.model);
  const [helperStep, setHelperStep] = useState<BuyerGuideStep>("intro");
  const [buyerPriority, setBuyerPriority] = useState<BuyerPriority | null>(null);
  const [buyerNeed, setBuyerNeed] = useState<BuyerNeed | null>(null);
  const [budgetHelperStep, setBudgetHelperStep] =
    useState<BudgetHelperStep>("intro");
  const [monthlyPaymentInput, setMonthlyPaymentInput] = useState("");
  const [downPaymentInput, setDownPaymentInput] = useState("");
  const [loanTermYears, setLoanTermYears] = useState<number | null>(null);
  const [interestRateInput, setInterestRateInput] = useState("7.5");
  const wasDirtyRef = useRef(false);
  const availableBrandsScrollRef = useRef<HTMLDivElement | null>(null);
  const [showBrandScrollCue, setShowBrandScrollCue] = useState(false);
  const [showBrandLeftFade, setShowBrandLeftFade] = useState(false);
  const availableBrands = useMemo(() => DEFAULT_BRANDS, []);
  const filteredBrands = availableBrands.filter((brand) =>
    !brands.includes(brand) &&
    brand.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  );

  const minBudget = parseBudget(minBudgetInput);
  const maxBudget = parseBudget(maxBudgetInput);
  const hasAnyBudgetInput = minBudgetInput !== "" || maxBudgetInput !== "";
  const budgetRangeIsComplete = minBudget !== null && maxBudget !== null;
  const budgetRangeIsValid =
    !hasAnyBudgetInput || (budgetRangeIsComplete && minBudget <= maxBudget);
  const budgetValidationMessage =
    hasAnyBudgetInput && !budgetRangeIsComplete
      ? "Enter both a minimum and maximum budget to use a range."
      : budgetRangeIsComplete && minBudget! > maxBudget!
        ? "Minimum budget cannot be higher than maximum budget."
        : null;
  const currentBudgetRangeExists =
    minBudget !== null && maxBudget !== null && minBudget <= maxBudget;
  const monthlyPayment = parseBudget(monthlyPaymentInput);
  const downPayment = parseBudget(downPaymentInput);
  const interestRate = Number(interestRateInput);
  const monthlyPaymentIsValid = monthlyPayment !== null && monthlyPayment > 0;
  const downPaymentIsValid = downPayment !== null && downPayment >= 0;
  const loanTermIsValid =
    loanTermYears !== null && [3, 4, 5, 6, 7].includes(loanTermYears);
  const interestRateIsValid =
    Number.isFinite(interestRate) && interestRate > 0;
  const budgetHelperInputsValid =
    monthlyPaymentIsValid &&
    downPaymentIsValid &&
    loanTermIsValid &&
    interestRateIsValid;
  const estimatedPrincipal =
    budgetHelperInputsValid && monthlyPayment && loanTermYears
      ? estimateLoanPrincipal(monthlyPayment, loanTermYears, interestRate)
      : null;
  const estimatedVehicleBudget =
    estimatedPrincipal !== null && downPayment !== null
      ? estimatedPrincipal + downPayment
      : null;
  const suggestedMinBudget =
    estimatedVehicleBudget !== null
      ? roundToNearestThousand(estimatedVehicleBudget * 0.9)
      : null;
  const suggestedMaxBudget =
    estimatedVehicleBudget !== null
      ? roundToNearestThousand(estimatedVehicleBudget * 1.05)
      : null;
  const currentFormValues = useMemo(
    () => ({
      minBudget: budgetRangeIsComplete ? minBudget : null,
      maxBudget: budgetRangeIsComplete ? maxBudget : null,
      vehicleType: vehicleType.trim(),
      brands: sortBrands(brands),
      model: model.trim(),
    }),
    [
      budgetRangeIsComplete,
      brands,
      maxBudget,
      minBudget,
      model,
      vehicleType,
    ],
  );
  const savedFormValues = useMemo(
    () => getSavedPreferenceSnapshot(preferences),
    [preferences],
  );
  const isDirty =
    JSON.stringify(currentFormValues) !== JSON.stringify(savedFormValues);

  useEffect(() => {
    if (isDirty && !wasDirtyRef.current) {
      const frameId = window.requestAnimationFrame(() => {
        setIsDirtyPopActive(true);
      });
      const timeoutId = window.setTimeout(() => {
        setIsDirtyPopActive(false);
      }, 440);

      wasDirtyRef.current = true;
      return () => {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
      };
    }

    if (!isDirty) {
      wasDirtyRef.current = false;
      const frameId = window.requestAnimationFrame(() => {
        setIsDirtyPopActive(false);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    return undefined;
  }, [isDirty]);

  useEffect(() => {
    const element = availableBrandsScrollRef.current;

    if (!element) {
      return;
    }

    const updateScrollState = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      const canScroll = maxScrollLeft > 8;
      setShowBrandScrollCue(canScroll && element.scrollLeft < maxScrollLeft - 12);
      setShowBrandLeftFade(canScroll && element.scrollLeft > 12);
    };

    updateScrollState();
    element.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [filteredBrands]);

  const toggleBrand = (brand: string) => {
    setFormConfirmation(null);
    setBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand],
    );
  };

  const handleSaveAndDiscover = useCallback(() => {
    if (isSubmitting || !budgetRangeIsValid) {
      return false;
    }

    setIsSubmitting(true);

    if (isDirty) {
      updatePreferences({
        minBudget: currentFormValues.minBudget,
        maxBudget: currentFormValues.maxBudget,
        vehicleType: currentFormValues.vehicleType,
        brand: currentFormValues.brands,
        model: currentFormValues.model,
      });
    }

    wasDirtyRef.current = false;
    setIsDirtyPopActive(false);
    router.push("/discover");
    return true;
  }, [
    currentFormValues.brands,
    currentFormValues.maxBudget,
    currentFormValues.minBudget,
    currentFormValues.model,
    currentFormValues.vehicleType,
    isDirty,
    isSubmitting,
    budgetRangeIsValid,
    router,
    updatePreferences,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSaveAndDiscover();
  };

  useEffect(() => {
    const handleRoadmapDiscover = () => {
      handleSaveAndDiscover();
    };

    window.addEventListener(
      "revmatched:save-and-discover",
      handleRoadmapDiscover,
    );

    return () => {
      window.removeEventListener(
        "revmatched:save-and-discover",
        handleRoadmapDiscover,
      );
    };
  }, [handleSaveAndDiscover]);

  const helperResult =
    buyerPriority && buyerNeed
      ? buyerTypeResults[`${buyerPriority}-${buyerNeed}`]
      : null;
  const answeredBuyerQuestions =
    (buyerPriority ? 1 : 0) + (buyerNeed ? 1 : 0);
  const buyerGuideProgressWidth =
    answeredBuyerQuestions === 0
      ? "0%"
      : answeredBuyerQuestions === 1
        ? "50%"
        : "100%";
  const answeredBudgetQuestions =
    budgetHelperStep === "result"
      ? 4
      : budgetHelperStep === "question-4"
        ? 3
        : budgetHelperStep === "question-3"
          ? 2
          : budgetHelperStep === "question-2"
            ? 1
            : 0;
  const budgetGuideProgressWidth = `${(answeredBudgetQuestions / 4) * 100}%`;
  const hasSpecificVehicleType =
    vehicleType.trim() !== "" && vehicleType.trim().toLowerCase() !== "all";
  const helperPrimaryLabel = helperResult
    ? hasSpecificVehicleType && vehicleType !== helperResult.suggestedType
      ? `Replace current type with ${helperResult.suggestedTypeLabel}`
      : `Use ${helperResult.suggestedTypeLabel} as a starting point`
    : "";

  const handleApplySuggestedType = () => {
    if (!helperResult) {
      return;
    }

    const isReplacingType =
      hasSpecificVehicleType && vehicleType !== helperResult.suggestedType;

    setVehicleType(helperResult.suggestedType);
    setFormConfirmation(
      isReplacingType
        ? `${helperResult.suggestedTypeLabel} replaced your current Define type`
        : `${helperResult.suggestedTypeLabel} added to your Define preferences`,
    );
  };

  const resetHelper = () => {
    setHelperStep("intro");
    setBuyerPriority(null);
    setBuyerNeed(null);
  };

  const startBudgetHelper = () => {
    setBudgetHelperStep("question-1");
  };

  const resetBudgetHelper = () => {
    setBudgetHelperStep("intro");
    setMonthlyPaymentInput("");
    setDownPaymentInput("");
    setLoanTermYears(null);
    setInterestRateInput("7.5");
  };

  const handleApplyBudgetRange = () => {
    if (suggestedMinBudget === null || suggestedMaxBudget === null) {
      return;
    }

    setMinBudgetInput(suggestedMinBudget.toLocaleString("en-US"));
    setMaxBudgetInput(suggestedMaxBudget.toLocaleString("en-US"));
    setFormConfirmation(
      currentBudgetRangeExists
        ? "Budget range replaced in your Define preferences"
        : "Budget range added to your Define preferences",
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(225,20,79,0.16),transparent_24%),linear-gradient(180deg,#011118_0%,#000000_44%,#04121a_100%)] text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-5 sm:px-8 lg:grid-cols-[1.18fr_0.82fr] lg:px-12 lg:py-6">
        <section className="page-panel motion-rise-fade motion-delay-1 rounded-[32px] border border-[#d9e0e7] bg-white p-6 text-[#17212b] shadow-[0_8px_24px_rgba(0,0,0,0.15)] sm:p-8">
          <div>
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6]">
                <SlidersHorizontal size={24} strokeWidth={2.2} />
              </span>
              <p className="text-[1.12rem] font-semibold uppercase tracking-[0.16em] text-[#2E3C4A] sm:text-[1.2rem]">
                DEFINE
              </p>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-semibold leading-tight text-[#17212b] sm:text-[2rem]">
                What are you looking for?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#536a7d] sm:text-base">
                Tell us what matters—we&apos;ll find your matches.
              </p>
            </div>
          </div>

          {formConfirmation ? (
            <p className="mt-5 rounded-[22px] border border-accent/25 bg-accent/6 px-5 py-3.5 text-sm text-[#314154]">
              {formConfirmation}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className={formLabelClassName}>
                  What price range feels right?
                </span>
                <input
                  value={minBudgetInput}
                  onChange={(event) =>
                    setMinBudgetInput(formatBudgetInput(event.target.value))
                  }
                  placeholder="Min budget"
                  inputMode="numeric"
                  className="app-input min-h-16 w-full rounded-[22px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                />
              </label>

              <label className="block">
                <span className={formLabelClassName}>
                  &nbsp;
                </span>
                <input
                  value={maxBudgetInput}
                  onChange={(event) =>
                    setMaxBudgetInput(formatBudgetInput(event.target.value))
                  }
                  placeholder="Max budget"
                  inputMode="numeric"
                  className="app-input min-h-16 w-full rounded-[22px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                />
              </label>
            </div>

            {budgetValidationMessage ? (
              <p className="md:col-span-2 text-sm text-red-600">
                {budgetValidationMessage}
              </p>
            ) : null}

            <label className="block">
              <span className={formLabelClassName}>
                Vehicle type
              </span>
              <select
                value={vehicleType}
                onChange={(event) => setVehicleType(event.target.value)}
                className="app-input min-h-16 w-full appearance-none rounded-[22px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 text-base text-[#17212b] outline-none"
              >
                <option value="">All vehicle types</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="pickup">Pickup</option>
                <option value="luxury">Luxury</option>
              </select>
            </label>

            <label className="block">
              <span className={formLabelClassName}>
                Model
              </span>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Hilux, Sportage, X3..."
                className="app-input min-h-16 w-full rounded-[22px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
              />
            </label>

            <label className="block md:col-span-2">
              <span className={formLabelClassName}>
                Brands
              </span>
              <div className="rounded-[24px] border border-[#d9e0e7] bg-[#f5f7fa] p-4">
                <div className="flex min-h-16 items-center gap-3 rounded-[20px] border border-[#d9e0e7] bg-white px-4">
                  <SearchIcon size={16} className="text-[#7d8f9d]" />
                  <input
                    value={brandQuery}
                    onChange={(event) => setBrandQuery(event.target.value)}
                    placeholder="Search brands..."
                    className="app-input w-full bg-transparent py-4 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                  />
                </div>

                {brands.length ? (
                  <div className="scrollbar-hidden mt-3 overflow-x-auto">
                    <div className="flex min-w-max gap-2 pb-1">
                      {brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleBrand(brand)}
                          className="nav-pill inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white"
                        >
                          {brand}
                          <X size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#647789]">
                    Pick one or more brands that feel like a fit.
                  </p>
                )}

                <div className="relative mt-3">
                  {showBrandLeftFade ? (
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f5f7fa] via-[#f5f7fa]/88 to-transparent" />
                  ) : null}
                  {showBrandScrollCue ? (
                    <>
                      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f5f7fa] via-[#f5f7fa]/92 to-transparent" />
                      <div className="pointer-events-none absolute right-3 top-1/2 z-20 -translate-y-1/2 text-lg font-semibold text-[#7d8f9d]">
                        &rarr;
                      </div>
                    </>
                  ) : null}
                  <div
                    ref={availableBrandsScrollRef}
                    className="scrollbar-hidden overflow-x-auto"
                  >
                    <div className="flex min-w-max gap-2 pb-1 pr-20">
                      {filteredBrands.map((brand) => {
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => toggleBrand(brand)}
                            className="nav-pill inline-flex min-h-11 items-center rounded-full border border-[#d9e0e7] bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-[#314154] transition hover:border-accent"
                          >
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {!filteredBrands.length && brands.length !== availableBrands.length ? (
                  <p className="mt-3 text-sm text-[#647789]">
                    No matching brands left to add.
                  </p>
                ) : null}
              </div>
            </label>

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                data-dirty={isDirty ? "true" : "false"}
                data-pop={isDirtyPopActive ? "true" : "false"}
                className={`app-button inline-flex min-h-16 items-center justify-center rounded-full border border-transparent bg-accent px-8 text-base font-semibold text-white transition duration-200 hover:brightness-110 ${
                  isDirty ? "save-discover-dirty" : ""
                } ${isDirtyPopActive ? "save-discover-pop" : ""}`}
                disabled={isSubmitting || !budgetRangeIsValid}
              >
                {isSubmitting ? "Opening Discover..." : "Save and Discover"}
              </button>
            </div>
          </form>
        </section>

        <div className="motion-rise-fade motion-delay-2 space-y-6">
          <section
            className={`page-panel home-stage-card group rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,24,0.92)_0%,rgba(7,14,20,0.9)_100%)] p-6 text-slate-100 shadow-[0_16px_36px_rgba(0,0,0,0.2)] sm:p-8 ${
              helperStep === "intro" ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (helperStep === "intro") {
                setHelperStep("question-1");
              }
            }}
            role={helperStep === "intro" ? "button" : undefined}
            tabIndex={helperStep === "intro" ? 0 : undefined}
            onKeyDown={(event) => {
              if (
                helperStep === "intro" &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                setHelperStep("question-1");
              }
            }}
          >
            {helperStep === "intro" ? (
              <div>
                <div className="inline-flex w-full items-center gap-3">
                  <span className="home-stage-icon-shell inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#E1144F] group-hover:bg-[#E1144F] group-hover:text-white group-focus-within:border-[#E1144F] group-focus-within:bg-[#E1144F] group-focus-within:text-white">
                    <CarFront size={18} strokeWidth={2.1} className="stage-icon" />
                  </span>
                  <p className="home-stage-label flex-1 text-[1.12rem] font-semibold uppercase tracking-[0.16em] text-slate-200 transition-colors duration-300 group-hover:text-[#E1144F] group-focus-within:text-[#E1144F] sm:text-[1.2rem]">
                    Need help with Car Type?
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold leading-tight text-white">
                  Answer 2 quick questions and we&apos;ll suggest a good starting
                  point for your search.
                </p>
                <div className="mt-7 flex justify-end text-slate-400 transition-colors duration-300 group-hover:text-[#E1144F]">
                  <span className="text-sm font-semibold uppercase tracking-[0.14em]">
                    Start quick guide
                  </span>
                </div>
              </div>
            ) : null}

            {helperStep === "question-1" ? (
              <div>
                <HelperStepHeader label="Question 1 of 2" onClose={resetHelper} />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  Which matters more for this car?
                </h2>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerPriority("practicality");
                      setHelperStep("question-2");
                    }}
                    className="app-button inline-flex min-h-16 justify-center rounded-[22px] border border-[#c4d0da] bg-[#eef3f7] px-5 py-4 text-base font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Practicality and value
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerPriority("style");
                      setHelperStep("question-2");
                    }}
                    className="app-button inline-flex min-h-16 justify-center rounded-[22px] border border-[#c4d0da] bg-[#eef3f7] px-5 py-4 text-base font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Style and presence
                  </button>
                </div>
              </div>
            ) : null}

            {helperStep === "question-2" ? (
              <div>
                <HelperStepHeader
                  label="Question 2 of 2"
                  onBack={() => setHelperStep("question-1")}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  What would help you more day to day?
                </h2>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerNeed("easy");
                      setHelperStep("result");
                    }}
                    className="app-button inline-flex min-h-16 justify-center rounded-[22px] border border-[#c4d0da] bg-[#eef3f7] px-5 py-4 text-base font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Something easier to park and move around
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerNeed("room");
                      setHelperStep("result");
                    }}
                    className="app-button inline-flex min-h-16 justify-center rounded-[22px] border border-[#c4d0da] bg-[#eef3f7] px-5 py-4 text-base font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    More room for people or things
                  </button>
                </div>
              </div>
            ) : null}

            {helperStep === "result" && helperResult ? (
              <div>
                <p className="text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] sm:text-[1.45rem]">
                  Your car type
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  {helperResult.type}
                </h2>
                <p className="mt-3 text-[1.7rem] font-normal leading-10 text-[#425466] sm:text-[1.85rem]">
                  {helperResult.body}
                </p>
                <div className="mt-6 rounded-[24px] border border-[#d3dde6] bg-[#f2f6f9] p-5">
                  <p className="text-sm text-[#5f7384]">Suggested starting type</p>
                  <p className="mt-2 text-lg font-semibold text-[#17212b]">
                    {helperResult.suggestedTypeLabel}
                  </p>
                  <p className="mt-3 text-sm text-[#5f7384]">
                    Also worth considering
                  </p>
                  <p className="mt-1 text-sm text-[#425466]">
                    {helperResult.considering}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleApplySuggestedType}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {helperPrimaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={resetHelper}
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section
            className={`page-panel home-stage-card group rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,24,0.92)_0%,rgba(7,14,20,0.9)_100%)] p-6 text-slate-100 shadow-[0_16px_36px_rgba(0,0,0,0.2)] sm:p-8 ${
              budgetHelperStep === "intro" ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (budgetHelperStep === "intro") {
                startBudgetHelper();
              }
            }}
            role={budgetHelperStep === "intro" ? "button" : undefined}
            tabIndex={budgetHelperStep === "intro" ? 0 : undefined}
            onKeyDown={(event) => {
              if (
                budgetHelperStep === "intro" &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                startBudgetHelper();
              }
            }}
          >
            {budgetHelperStep === "intro" ? (
              <div>
                <div className="inline-flex w-full items-center gap-3">
                  <span className="home-stage-icon-shell inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#E1144F] group-hover:bg-[#E1144F] group-hover:text-white group-focus-within:border-[#E1144F] group-focus-within:bg-[#E1144F] group-focus-within:text-white">
                    <DollarSign size={18} strokeWidth={2.1} className="stage-icon" />
                  </span>
                  <p className="home-stage-label flex-1 text-[1.12rem] font-semibold uppercase tracking-[0.16em] text-slate-200 transition-colors duration-300 group-hover:text-[#E1144F] group-focus-within:text-[#E1144F] sm:text-[1.2rem]">
                    Need help with budget?
                  </p>
                </div>
                <h2 className="mt-6 text-2xl font-semibold leading-tight text-white">
                  Start with the monthly payment you can live with
                </h2>
                <div className="mt-7 flex justify-end text-slate-400 transition-colors duration-300 group-hover:text-[#E1144F]">
                  <span className="text-sm font-semibold uppercase tracking-[0.14em]">
                    Start budget helper
                  </span>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-1" ? (
              <div>
                <HelperStepHeader
                  label="Question 1 of 4"
                  onClose={resetBudgetHelper}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  What monthly payment feels comfortable?
                </h2>

                <div className="mt-6 space-y-4">
                  <input
                    value={monthlyPaymentInput}
                    onChange={(event) =>
                      setMonthlyPaymentInput(
                        formatBudgetInput(event.target.value),
                      )
                    }
                    placeholder="TT$3,000"
                    inputMode="numeric"
                    className="app-input min-h-14 w-full rounded-[22px] border border-[#d3dde6] bg-[#f2f6f9] px-5 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[2000, 3000, 4000, 5000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() =>
                          setMonthlyPaymentInput(
                            amount.toLocaleString("en-US"),
                          )
                        }
                        className="nav-pill inline-flex min-h-11 rounded-full border border-[#c4d0da] bg-[#eef3f7] px-4 py-2 text-sm font-medium text-[#1c3141] hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {!monthlyPaymentIsValid && monthlyPaymentInput !== "" ? (
                  <p className="mt-4 text-sm text-red-600">
                    Enter a monthly payment greater than 0.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      if (monthlyPaymentIsValid) {
                        setBudgetHelperStep("question-2");
                      }
                    }}
                    disabled={!monthlyPaymentIsValid}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next question
                  </button>
                  <button
                    type="button"
                    onClick={resetBudgetHelper}
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-2" ? (
              <div>
                <HelperStepHeader
                  label="Question 2 of 4"
                  onBack={() => setBudgetHelperStep("question-1")}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  How much can you put down upfront?
                </h2>

                <div className="mt-6">
                  <input
                    value={downPaymentInput}
                    onChange={(event) =>
                      setDownPaymentInput(
                        formatBudgetInput(event.target.value),
                      )
                    }
                    placeholder="TT$20,000"
                    inputMode="numeric"
                    className="app-input min-h-14 w-full rounded-[22px] border border-[#d3dde6] bg-[#f2f6f9] px-5 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                  />
                </div>

                {!downPaymentIsValid && downPaymentInput !== "" ? (
                  <p className="mt-4 text-sm text-red-600">
                    Enter a down payment of TT$0 or more.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setBudgetHelperStep("question-1")}
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (downPaymentIsValid) {
                        setBudgetHelperStep("question-3");
                      }
                    }}
                    disabled={!downPaymentIsValid}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next question
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-3" ? (
              <div>
                <HelperStepHeader
                  label="Question 3 of 4"
                  onBack={() => setBudgetHelperStep("question-2")}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  How long would you be willing to pay that monthly amount?
                </h2>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[3, 4, 5, 6, 7].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setLoanTermYears(term)}
                      className={`nav-pill inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        loanTermYears === term
                          ? "border-accent bg-accent text-white"
                          : "border-[#c4d0da] bg-[#eef3f7] text-[#1c3141] hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                      }`}
                    >
                      {term} years
                    </button>
                  ))}
                </div>

                {!loanTermIsValid ? (
                  <p className="mt-4 text-sm text-red-600">
                    Choose a loan term.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setBudgetHelperStep("question-2")}
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (loanTermIsValid) {
                        setBudgetHelperStep("question-4");
                      }
                    }}
                    disabled={!loanTermIsValid}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next question
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-4" ? (
              <div>
                <HelperStepHeader
                  label="Question 4 of 4"
                  onBack={() => setBudgetHelperStep("question-3")}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  What interest rate should we use for the estimate?
                </h2>

                <div className="mt-6">
                  <input
                    value={interestRateInput}
                    onChange={(event) =>
                      setInterestRateInput(event.target.value)
                    }
                    inputMode="decimal"
                    className="app-input min-h-14 w-full rounded-[22px] border border-[#d3dde6] bg-[#f2f6f9] px-5 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                  />
                  <p className="mt-2 text-xs leading-5 text-[#5f7384]">
                    Pre-filled for guidance. Change it if you already know the
                    rate you may get.
                  </p>
                </div>

                {!interestRateIsValid ? (
                  <p className="mt-4 text-sm text-red-600">
                    Enter an interest rate greater than 0.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setBudgetHelperStep("question-3")}
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (interestRateIsValid && budgetHelperInputsValid) {
                        setBudgetHelperStep("result");
                      }
                    }}
                    disabled={!interestRateIsValid || !budgetHelperInputsValid}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    See suggested range
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "result" &&
            suggestedMinBudget !== null &&
            suggestedMaxBudget !== null &&
            monthlyPayment !== null &&
            downPayment !== null &&
            loanTermYears !== null ? (
              <div>
                <p className="text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] sm:text-[1.45rem]">
                  Your starting budget
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#17212b]">
                  A monthly payment of {formatCurrency(monthlyPayment)} could
                  point to a car budget around{" "}
                  {formatCurrency(suggestedMinBudget)}-
                  {formatCurrency(suggestedMaxBudget)}
                </h2>
                <p className="mt-3 text-[1.7rem] font-normal leading-10 text-[#425466] sm:text-[1.85rem]">
                  This estimate is based on
                </p>

                <div className="mt-6 rounded-[24px] border border-[#d3dde6] bg-[#f2f6f9] p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-lg text-[#5f7384]">Monthly payment</p>
                    <p className="text-lg font-medium text-[#17212b]">
                      {formatCurrency(monthlyPayment)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <p className="text-lg text-[#5f7384]">Down payment</p>
                    <p className="text-lg font-medium text-[#17212b]">
                      {formatCurrency(downPayment)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <p className="text-lg text-[#5f7384]">Term</p>
                    <p className="text-lg font-medium text-[#17212b]">
                      {loanTermYears} years
                    </p>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <p className="text-lg text-[#5f7384]">Interest rate</p>
                    <p className="text-lg font-medium text-[#17212b]">
                      {interestRateInput}%
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleApplyBudgetRange}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {currentBudgetRangeExists
                      ? "Replace current budget range"
                      : "Use this range in Define"}
                  </button>
                  <button
                    type="button"
                    onClick={resetBudgetHelper}
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#E1144F] hover:bg-[#E1144F] hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
