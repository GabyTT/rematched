"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";

import { useJourney, type Preferences } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";

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
type BudgetHelperStep = "intro" | "input" | "result";

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
  const availableBrands = useMemo(
    () => [...new Set(cars.map((car) => car.brand))].sort((left, right) => left.localeCompare(right)),
    [],
  );
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
  const budgetHelperValidationMessage = !monthlyPaymentIsValid
    ? "Enter a monthly payment greater than 0."
    : !downPaymentIsValid
      ? "Enter a down payment of TT$0 or more."
      : !loanTermIsValid
        ? "Choose a loan term."
        : !interestRateIsValid
          ? "Enter an interest rate greater than 0."
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

  const toggleBrand = (brand: string) => {
    setFormConfirmation(null);
    setBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    updatePreferences({
      minBudget: currentFormValues.minBudget,
      maxBudget: currentFormValues.maxBudget,
      vehicleType: currentFormValues.vehicleType,
      brand: currentFormValues.brands,
      model: currentFormValues.model,
    });
    wasDirtyRef.current = false;
    setIsDirtyPopActive(false);
    router.push("/discover");
  };

  const helperResult =
    buyerPriority && buyerNeed
      ? buyerTypeResults[`${buyerPriority}-${buyerNeed}`]
      : null;
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
    setBudgetHelperStep("input");
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
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-input bg-[radial-gradient(circle_at_top_left,rgba(209,19,58,0.16),transparent_28%),linear-gradient(180deg,#011118_0%,#000000_72%)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-16">
          <div className="max-w-3xl">
            <span className="motion-rise-fade motion-delay-0 inline-flex rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              DEFINE your journey
            </span>
            <h1 className="motion-rise-fade motion-delay-1 mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find the car that fits your life and your range.
            </h1>
            <p className="motion-rise-fade motion-delay-2 mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Start by setting your preferred range and ideal vehicle details.
              RevMatched uses those choices to surface the cars worth swiping
              next.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-10">
        <section className="page-panel motion-rise-fade motion-delay-1 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Preference setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Define your preferences
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Your price range shapes the initial matches, while vehicle type,
              brands, and model make the results feel personal.
            </p>
          </div>

          {formConfirmation ? (
            <p className="mt-4 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-slate-200">
              {formConfirmation}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  What price range feels right?
                </span>
                <input
                  value={minBudgetInput}
                  onChange={(event) =>
                    setMinBudgetInput(formatBudgetInput(event.target.value))
                  }
                  placeholder="Min budget"
                  inputMode="numeric"
                  className="app-input min-h-14 w-full rounded-2xl border border-input bg-input px-4 text-base text-white outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  &nbsp;
                </span>
                <input
                  value={maxBudgetInput}
                  onChange={(event) =>
                    setMaxBudgetInput(formatBudgetInput(event.target.value))
                  }
                  placeholder="Max budget"
                  inputMode="numeric"
                  className="app-input min-h-14 w-full rounded-2xl border border-input bg-input px-4 text-base text-white outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            {budgetValidationMessage ? (
              <p className="md:col-span-2 text-sm text-red-300">
                {budgetValidationMessage}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Vehicle type
              </span>
              <select
                value={vehicleType}
                onChange={(event) => setVehicleType(event.target.value)}
                className="app-input min-h-14 w-full appearance-none rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
              >
                <option value="">All vehicle types</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="pickup">Pickup</option>
                <option value="luxury">Luxury</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Brands
              </span>
              <div className="rounded-2xl border border-input bg-input p-3">
                <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-input bg-panel/60 px-4">
                  <SearchIcon size={16} className="text-slate-400" />
                  <input
                    value={brandQuery}
                    onChange={(event) => setBrandQuery(event.target.value)}
                    placeholder="Search brands..."
                    className="app-input w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-400"
                  />
                </div>

                {brands.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleBrand(brand)}
                        className="nav-pill inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-white"
                      >
                        {brand}
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">
                    Pick one or more brands that feel like a fit.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {filteredBrands.map((brand) => {
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleBrand(brand)}
                        className="nav-pill inline-flex items-center rounded-full border border-input bg-panel px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-accent"
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>
                {!filteredBrands.length && brands.length !== availableBrands.length ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No matching brands left to add.
                  </p>
                ) : null}
              </div>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Model
              </span>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Hilux, Sportage, X3..."
                className="app-input min-h-14 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                data-dirty={isDirty ? "true" : "false"}
                data-pop={isDirtyPopActive ? "true" : "false"}
                className={`app-button inline-flex min-h-14 items-center justify-center rounded-2xl border border-transparent bg-accent px-6 text-sm font-semibold text-white transition duration-200 hover:brightness-110 ${
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
          <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
            {helperStep === "intro" ? (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Not sure where to start?
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Find your buyer type
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Answer 2 quick questions and we&apos;ll suggest a good starting
                  point for your search.
                </p>
                <button
                  type="button"
                  onClick={() => setHelperStep("question-1")}
                  className="app-button mt-6 inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
                >
                  Start quick guide
                </button>
              </div>
            ) : null}

            {helperStep === "question-1" ? (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Question 1 of 2
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Which matters more for this car?
                </h2>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerPriority("practicality");
                      setHelperStep("question-2");
                    }}
                    className="app-button inline-flex justify-center rounded-2xl border border-input bg-input px-5 py-4 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    Practicality and value
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerPriority("style");
                      setHelperStep("question-2");
                    }}
                    className="app-button inline-flex justify-center rounded-2xl border border-input bg-input px-5 py-4 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    Style and presence
                  </button>
                </div>
              </div>
            ) : null}

            {helperStep === "question-2" ? (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Question 2 of 2
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  What would help you more day to day?
                </h2>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerNeed("easy");
                      setHelperStep("result");
                    }}
                    className="app-button inline-flex justify-center rounded-2xl border border-input bg-input px-5 py-4 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    Something easier to park and move around
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerNeed("room");
                      setHelperStep("result");
                    }}
                    className="app-button inline-flex justify-center rounded-2xl border border-input bg-input px-5 py-4 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    More room for people or things
                  </button>
                </div>
              </div>
            ) : null}

            {helperStep === "result" && helperResult ? (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Your buyer type
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {helperResult.type}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {helperResult.body}
                </p>
                <div className="mt-5 rounded-3xl border border-input bg-input/70 p-4">
                  <p className="text-sm text-slate-400">Suggested starting type</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {helperResult.suggestedTypeLabel}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    Also worth considering
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {helperResult.considering}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleApplySuggestedType}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {helperPrimaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={resetHelper}
                    className="app-button inline-flex justify-center rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
            {budgetHelperStep === "intro" ? (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Need help with budget?
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Start with the monthly payment you can live with
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Tell us what feels comfortable month to month, how much you
                  can put down upfront, and how long you&apos;d be willing to pay
                  — then we&apos;ll suggest a price range to start with.
                </p>
                <button
                  type="button"
                  onClick={startBudgetHelper}
                  className="app-button mt-6 inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
                >
                  Start budget helper
                </button>
              </div>
            ) : null}

            {budgetHelperStep === "input" ? (
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Budget helper
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Start with the monthly payment you can live with
                </h2>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      What monthly payment feels comfortable?
                    </span>
                    <input
                      value={monthlyPaymentInput}
                      onChange={(event) =>
                        setMonthlyPaymentInput(
                          formatBudgetInput(event.target.value),
                        )
                      }
                      placeholder="TT$3,000"
                      inputMode="numeric"
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none placeholder:text-slate-400"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[2000, 3000, 4000, 5000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() =>
                            setMonthlyPaymentInput(
                              amount.toLocaleString("en-US"),
                            )
                          }
                          className="nav-pill inline-flex rounded-full border border-input bg-input px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-accent"
                        >
                          {formatCurrency(amount)}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      How much can you put down upfront?
                    </span>
                    <input
                      value={downPaymentInput}
                      onChange={(event) =>
                        setDownPaymentInput(
                          formatBudgetInput(event.target.value),
                        )
                      }
                      placeholder="TT$20,000"
                      inputMode="numeric"
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none placeholder:text-slate-400"
                    />
                  </label>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      For how long would you be willing to pay that monthly
                      amount?
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[3, 4, 5, 6, 7].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setLoanTermYears(term)}
                          className={`nav-pill inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                            loanTermYears === term
                              ? "border-accent bg-accent text-white"
                              : "border-input bg-input text-slate-300 hover:border-accent"
                          }`}
                        >
                          {term} years
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Interest rate for estimate
                    </span>
                    <input
                      value={interestRateInput}
                      onChange={(event) =>
                        setInterestRateInput(event.target.value)
                      }
                      inputMode="decimal"
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none placeholder:text-slate-400"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Pre-filled for guidance. Change it if you already know the
                      rate you may get.
                    </p>
                  </label>
                </div>

                {budgetHelperValidationMessage ? (
                  <p className="mt-4 text-sm text-red-300">
                    {budgetHelperValidationMessage}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setBudgetHelperStep("result")}
                    disabled={!budgetHelperInputsValid}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    See suggested range
                  </button>
                  <button
                    type="button"
                    onClick={resetBudgetHelper}
                    className="app-button inline-flex justify-center rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    Close
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
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Your starting budget
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  A monthly payment of {formatCurrency(monthlyPayment)} could
                  point to a car budget around{" "}
                  {formatCurrency(suggestedMinBudget)}-
                  {formatCurrency(suggestedMaxBudget)}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This estimate is based on what you&apos;re comfortable paying
                  monthly, how much you can put down upfront, how long you&apos;d
                  be willing to pay, and the interest rate used for planning.
                </p>

                <div className="mt-5 rounded-3xl border border-input bg-input/70 p-4">
                  <p className="text-sm text-slate-400">Monthly payment</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatCurrency(monthlyPayment)}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Down payment</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatCurrency(downPayment)}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Term</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {loanTermYears} years
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Interest rate</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {interestRateInput}%
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleApplyBudgetRange}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {currentBudgetRangeExists
                      ? "Replace current budget range"
                      : "Use this range in Define"}
                  </button>
                  <button
                    type="button"
                    onClick={resetBudgetHelper}
                    className="app-button inline-flex justify-center rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
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
