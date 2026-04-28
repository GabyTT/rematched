"use client";

import type { FormEvent } from "react";
import Image from "next/image";
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
const helperSecondaryButtonClass =
  "inline-flex min-h-14 justify-center rounded-full border-2 border-[#D1133A] bg-white px-6 py-3.5 text-sm font-semibold text-[#111827] transition hover:bg-[rgba(209,19,58,0.05)]";
const helperPrimaryButtonClass =
  "inline-flex min-h-14 justify-center rounded-full border border-transparent bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
const helperOptionButtonClass =
  "inline-flex min-h-16 justify-center rounded-full border-2 border-[#D1133A] bg-white px-5 py-4 text-base font-semibold text-[#111827] transition hover:bg-[rgba(209,19,58,0.05)]";
const helperNeutralPillClass =
  "inline-flex items-center gap-2 rounded-full border-2 border-[#D1133A] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[rgba(209,19,58,0.05)]";
const BUDGET_SLIDER_MIN = 50000;
const BUDGET_SLIDER_MAX = 500000;
const BUDGET_SLIDER_STEP = 5000;
const DEFAULT_MIN_BUDGET = 80000;
const DEFAULT_MAX_BUDGET = 300000;
const formatBudgetSliderValue = (value: number) =>
  `TT$${new Intl.NumberFormat("en-US").format(value)}`;

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
type DefineAttentionTarget = "budget" | "vehicle-type" | "brands";

type DefineCardBounds = {
  bottomOffset: number;
  height: number;
  left: number;
  top: number;
  width: number;
};

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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e0e6] bg-[#f3f6f8] text-[#111827] transition hover:bg-[#eceff3]"
          aria-label="Go to previous question"
        >
          <ArrowLeft size={20} strokeWidth={2.4} />
        </button>
      ) : onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e0e6] bg-[#f3f6f8] text-[#111827] transition hover:bg-[#eceff3]"
          aria-label="Close helper"
        >
          <X size={20} strokeWidth={2.4} />
        </button>
      ) : null}
      <p className="text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-[#6b7280] sm:text-[0.88rem]">
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
  const [isDefineHelpOpen, setIsDefineHelpOpen] = useState(false);
  const [defineCardBounds, setDefineCardBounds] =
    useState<DefineCardBounds | null>(null);
  const [shouldAnchorDefineHelp, setShouldAnchorDefineHelp] = useState(false);
  const [minBudgetInput, setMinBudgetInput] = useState(
    (preferences.minBudget ?? DEFAULT_MIN_BUDGET).toLocaleString("en-US"),
  );
  const [maxBudgetInput, setMaxBudgetInput] = useState(
    (preferences.maxBudget ?? DEFAULT_MAX_BUDGET).toLocaleString("en-US"),
  );
  const [activeBudgetHandle, setActiveBudgetHandle] = useState<"min" | "max" | null>(null);
  const [vehicleType, setVehicleType] = useState(preferences.vehicleType);
  const [brands, setBrands] = useState(preferences.brand);
  const [brandQuery, setBrandQuery] = useState("");
  const [model, setModel] = useState(preferences.model);
  const [helperStep, setHelperStep] = useState<BuyerGuideStep>("intro");
  const [buyerPriority, setBuyerPriority] = useState<BuyerPriority | null>(null);
  const [buyerNeed, setBuyerNeed] = useState<BuyerNeed | null>(null);
  const [helperPendingSelection, setHelperPendingSelection] = useState<string | null>(null);
  const [helperTransitioning, setHelperTransitioning] = useState(false);
  const [budgetHelperStep, setBudgetHelperStep] =
    useState<BudgetHelperStep>("intro");
  const [budgetPendingSelection, setBudgetPendingSelection] = useState<string | null>(null);
  const [budgetTransitioning, setBudgetTransitioning] = useState(false);
  const [defineAttentionTarget, setDefineAttentionTarget] =
    useState<DefineAttentionTarget | null>(null);
  const [monthlyPaymentInput, setMonthlyPaymentInput] = useState("");
  const [downPaymentInput, setDownPaymentInput] = useState("");
  const [loanTermYears, setLoanTermYears] = useState<number | null>(null);
  const [interestRateInput, setInterestRateInput] = useState("7.5");
  const wasDirtyRef = useRef(false);
  const dirtyShakeTimeoutRef = useRef<number | null>(null);
  const dirtyShakeResetTimeoutRef = useRef<number | null>(null);
  const helperTransitionTimeoutRef = useRef<number | null>(null);
  const budgetTransitionTimeoutRef = useRef<number | null>(null);
  const budgetSelectionTimeoutRef = useRef<number | null>(null);
  const defineAttentionTimeoutRef = useRef<number | null>(null);
  const defineHelpPointerStartYRef = useRef<number | null>(null);
  const defineCardRef = useRef<HTMLElement | null>(null);
  const minBudgetFieldRef = useRef<HTMLInputElement | null>(null);
  const vehicleTypeFieldRef = useRef<HTMLSelectElement | null>(null);
  const brandSearchFieldRef = useRef<HTMLInputElement | null>(null);
  const availableBrandsScrollRef = useRef<HTMLDivElement | null>(null);
  const [showBrandScrollCue, setShowBrandScrollCue] = useState(false);
  const [showBrandLeftFade, setShowBrandLeftFade] = useState(false);
  const availableBrands = useMemo(() => DEFAULT_BRANDS, []);
  const filteredBrands = availableBrands.filter((brand) =>
    !brands.includes(brand) &&
    brand.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  );

  const updateDefineCardBounds = useCallback(() => {
    const card = defineCardRef.current;

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    setShouldAnchorDefineHelp(window.innerWidth >= 640);
    setDefineCardBounds({
      bottomOffset: Math.max(window.innerHeight - rect.bottom, 0),
      height: rect.height,
      left: rect.left,
      top: rect.top,
      width: rect.width,
    });
  }, []);

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
  const sliderMinBudget = minBudget ?? DEFAULT_MIN_BUDGET;
  const sliderMaxBudget = maxBudget ?? DEFAULT_MAX_BUDGET;
  const budgetSliderPercentRange = BUDGET_SLIDER_MAX - BUDGET_SLIDER_MIN;
  const minBudgetPercent =
    ((sliderMinBudget - BUDGET_SLIDER_MIN) / budgetSliderPercentRange) * 100;
  const maxBudgetPercent =
    ((sliderMaxBudget - BUDGET_SLIDER_MIN) / budgetSliderPercentRange) * 100;
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
  const defineAttentionClassName = defineAttentionTarget
    ? "define-card-attention"
    : "";
  const getAttentionFieldClassName = (target: DefineAttentionTarget) =>
    defineAttentionTarget === target ? "define-field-attention" : "";

  const clearDirtyShakeTimers = useCallback(() => {
    if (dirtyShakeTimeoutRef.current !== null) {
      window.clearTimeout(dirtyShakeTimeoutRef.current);
      dirtyShakeTimeoutRef.current = null;
    }

    if (dirtyShakeResetTimeoutRef.current !== null) {
      window.clearTimeout(dirtyShakeResetTimeoutRef.current);
      dirtyShakeResetTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearDirtyShakeTimers();
    const resetFrameId = window.requestAnimationFrame(() => {
      setIsDirtyPopActive(false);
    });

    if (!isDirty) {
      wasDirtyRef.current = false;

      return () => {
        window.cancelAnimationFrame(resetFrameId);
        clearDirtyShakeTimers();
      };
    }

    wasDirtyRef.current = true;
    dirtyShakeTimeoutRef.current = window.setTimeout(() => {
      setIsDirtyPopActive(true);
      dirtyShakeResetTimeoutRef.current = window.setTimeout(() => {
        setIsDirtyPopActive(false);
      }, 720);
    }, 2000);

    return () => {
      window.cancelAnimationFrame(resetFrameId);
      clearDirtyShakeTimers();
    };
  }, [clearDirtyShakeTimers, currentFormValues, isDirty]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (window.sessionStorage.getItem("revmatched.define-attention") !== "true") {
      return undefined;
    }

    window.sessionStorage.removeItem("revmatched.define-attention");
    const target: DefineAttentionTarget =
      minBudgetInput === "" && maxBudgetInput === ""
        ? "budget"
        : vehicleType.trim() === "" || vehicleType.trim().toLowerCase() === "all"
          ? "vehicle-type"
          : "brands";
    const frameId = window.requestAnimationFrame(() => {
      setDefineAttentionTarget(target);
      const fieldToFocus =
        target === "budget"
          ? minBudgetFieldRef.current
          : target === "vehicle-type"
            ? vehicleTypeFieldRef.current
            : brandSearchFieldRef.current;

      fieldToFocus?.focus({ preventScroll: true });
      defineAttentionTimeoutRef.current = window.setTimeout(() => {
        setDefineAttentionTarget(null);
        defineAttentionTimeoutRef.current = null;
      }, 1700);
    });

    return () => {
      window.cancelAnimationFrame(frameId);

      if (defineAttentionTimeoutRef.current !== null) {
        window.clearTimeout(defineAttentionTimeoutRef.current);
        defineAttentionTimeoutRef.current = null;
      }
    };
  }, [brands.length, maxBudgetInput, minBudgetInput, vehicleType]);

  useEffect(() => {
    if (!isDefineHelpOpen) {
      return undefined;
    }

    const boundsFrameId = window.requestAnimationFrame(updateDefineCardBounds);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDefineHelpOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateDefineCardBounds();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.cancelAnimationFrame(boundsFrameId);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [isDefineHelpOpen, updateDefineCardBounds]);

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

  const handleMinBudgetSliderChange = (value: number) => {
    const nextValue = Math.min(value, sliderMaxBudget - BUDGET_SLIDER_STEP);
    setFormConfirmation(null);
    setMinBudgetInput(nextValue.toLocaleString("en-US"));
  };

  const handleMaxBudgetSliderChange = (value: number) => {
    const nextValue = Math.max(value, sliderMinBudget + BUDGET_SLIDER_STEP);
    setFormConfirmation(null);
    setMaxBudgetInput(nextValue.toLocaleString("en-US"));
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
    clearDirtyShakeTimers();
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
    clearDirtyShakeTimers,
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
  const helperCardBaseClassName =
    "relative rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white p-5 text-[#111827] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-[background-color,color,box-shadow] duration-200 sm:p-6";
  const helperIntroCardClassName =
    "lg:flex-1 lg:min-h-[200px] lg:max-h-[280px]";
  const isHelperWizardOpen =
    helperStep !== "intro" || budgetHelperStep !== "intro";

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
    resetHelper();
  };

  const resetHelper = () => {
    if (helperTransitionTimeoutRef.current !== null) {
      window.clearTimeout(helperTransitionTimeoutRef.current);
      helperTransitionTimeoutRef.current = null;
    }
    setHelperStep("intro");
    setBuyerPriority(null);
    setBuyerNeed(null);
    setHelperPendingSelection(null);
    setHelperTransitioning(false);
  };

  const runHelperTransition = useCallback(
    (selection: string, advance: () => void) => {
      if (helperTransitioning) {
        return;
      }

      setHelperPendingSelection(selection);
      setHelperTransitioning(true);

      helperTransitionTimeoutRef.current = window.setTimeout(() => {
        advance();
        setHelperPendingSelection(null);
        setHelperTransitioning(false);
        helperTransitionTimeoutRef.current = null;
      }, 480);
    },
    [helperTransitioning],
  );

  useEffect(() => {
    return () => {
      if (helperTransitionTimeoutRef.current !== null) {
        window.clearTimeout(helperTransitionTimeoutRef.current);
        helperTransitionTimeoutRef.current = null;
      }
      if (budgetTransitionTimeoutRef.current !== null) {
        window.clearTimeout(budgetTransitionTimeoutRef.current);
        budgetTransitionTimeoutRef.current = null;
      }
      if (budgetSelectionTimeoutRef.current !== null) {
        window.clearTimeout(budgetSelectionTimeoutRef.current);
        budgetSelectionTimeoutRef.current = null;
      }
    };
  }, []);

  const startBudgetHelper = () => {
    setBudgetHelperStep("question-1");
  };

  const resetBudgetHelper = () => {
    if (budgetTransitionTimeoutRef.current !== null) {
      window.clearTimeout(budgetTransitionTimeoutRef.current);
      budgetTransitionTimeoutRef.current = null;
    }
    if (budgetSelectionTimeoutRef.current !== null) {
      window.clearTimeout(budgetSelectionTimeoutRef.current);
      budgetSelectionTimeoutRef.current = null;
    }
    setBudgetHelperStep("intro");
    setMonthlyPaymentInput("");
    setDownPaymentInput("");
    setLoanTermYears(null);
    setInterestRateInput("7.5");
    setBudgetPendingSelection(null);
    setBudgetTransitioning(false);
  };

  const runBudgetTransition = useCallback(
    (advance: () => void, selection?: string) => {
      if (budgetTransitioning) {
        return;
      }

      if (selection) {
        setBudgetPendingSelection(selection);
      }
      setBudgetTransitioning(true);

      budgetTransitionTimeoutRef.current = window.setTimeout(() => {
        advance();
        setBudgetPendingSelection(null);
        setBudgetTransitioning(false);
        budgetTransitionTimeoutRef.current = null;
      }, 480);
    },
    [budgetTransitioning],
  );

  const pulseBudgetSelection = useCallback((selection: string) => {
    if (budgetSelectionTimeoutRef.current !== null) {
      window.clearTimeout(budgetSelectionTimeoutRef.current);
      budgetSelectionTimeoutRef.current = null;
    }

    setBudgetPendingSelection(selection);
    budgetSelectionTimeoutRef.current = window.setTimeout(() => {
      setBudgetPendingSelection((current) =>
        current === selection ? null : current,
      );
      budgetSelectionTimeoutRef.current = null;
    }, 300);
  }, []);

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
    resetBudgetHelper();
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(209,19,58,0.16),transparent_24%),linear-gradient(180deg,#011118_0%,#000000_44%,#04121a_100%)] text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-5 sm:px-8 lg:grid-cols-[1.18fr_0.82fr] lg:px-12 lg:py-6">
        <section
          ref={defineCardRef}
          className={`page-panel motion-rise-fade motion-delay-1 rounded-[32px] border border-[#d9e0e7] p-5 text-[#17212b] transition sm:p-6 lg:p-5 ${
            isHelperWizardOpen
              ? "bg-[#dfe5eb] opacity-[0.78] shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
              : "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
          } ${defineAttentionClassName}`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  size={28}
                  strokeWidth={2.4}
                  className="shrink-0 text-[#2E3C4A]"
                  aria-hidden="true"
                />
                <h2 className="text-2xl font-semibold leading-tight text-[#17212b] sm:text-[2rem]">
                  Define What Matters
                </h2>
                <button
                  type="button"
                  onClick={() => setIsDefineHelpOpen(true)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-[0_10px_24px_rgba(209,19,58,0.24)] transition hover:scale-105 hover:brightness-110 hover:shadow-[0_14px_30px_rgba(209,19,58,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
                  aria-label="How Define preferences work"
                >
                  <span aria-hidden="true" className="font-serif text-[1.7rem] font-bold italic leading-none">
                    i
                  </span>
                </button>
              </div>
              <button
                type="submit"
                form="define-preferences-form"
                data-dirty={isDirty ? "true" : "false"}
                data-pop={isDirtyPopActive ? "true" : "false"}
                className={`app-button inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] md:text-base disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDirty
                    ? "border-transparent bg-accent hover:brightness-110 save-discover-dirty"
                    : "save-discover-idle border-[#aebac5] bg-[#8a98a6] hover:bg-[#7b8996] hover:brightness-105"
                } ${isDirtyPopActive ? "save-discover-pop" : ""}`}
                disabled={isSubmitting || !budgetRangeIsValid}
              >
                {isSubmitting ? "Opening Discover..." : "Save and Discover"}
              </button>
            </div>
            <div>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#425466] md:text-lg">
                Tell us what matters—we&apos;ll find your matches.
              </p>
            </div>
          </div>

          {formConfirmation ? (
            <p className="mt-4 rounded-[22px] border border-accent/25 bg-accent/6 px-5 py-3 text-sm text-[#314154]">
              {formConfirmation}
            </p>
          ) : null}

          <form
            id="define-preferences-form"
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 lg:gap-3 md:grid-cols-2"
          >
            <div
              className={`md:col-span-2 rounded-[24px] ${getAttentionFieldClassName("budget")}`}
            >
              <label className="block">
                <span className={formLabelClassName}>
                  What price range feels right?
                </span>
                <div className="rounded-[24px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 py-4 sm:px-6 lg:py-3.5">
                  <div className="relative pt-10 pb-11 lg:pt-9 lg:pb-10">
                    <div className="absolute left-0 right-0 top-12 lg:top-11 h-2 rounded-full bg-[#d8e0e6]" />
                    <div
                      className="absolute top-12 lg:top-11 h-2 rounded-full bg-[#D1133A]"
                      style={{
                        left: `${minBudgetPercent}%`,
                        width: `${Math.max(maxBudgetPercent - minBudgetPercent, 0)}%`,
                      }}
                    />

                    <div
                      className="absolute top-[3.95rem] lg:top-[3.6rem] -translate-x-1/2"
                      style={{ left: `${minBudgetPercent}%` }}
                    >
                      <div className="rounded-full border border-[#f3c1cc] bg-white px-3 py-1 text-sm font-semibold text-[#17212b] shadow-[0_10px_20px_rgba(15,23,42,0.12)] whitespace-nowrap">
                        {formatBudgetSliderValue(sliderMinBudget)}
                      </div>
                    </div>
                    <div
                      className="absolute top-0 -translate-x-1/2"
                      style={{ left: `${maxBudgetPercent}%` }}
                    >
                      <div className="rounded-full border border-[#f3c1cc] bg-white px-3 py-1 text-sm font-semibold text-[#17212b] shadow-[0_10px_20px_rgba(15,23,42,0.12)] whitespace-nowrap">
                        {formatBudgetSliderValue(sliderMaxBudget)}
                      </div>
                    </div>

                    <input
                      ref={minBudgetFieldRef}
                      type="range"
                      min={BUDGET_SLIDER_MIN}
                      max={BUDGET_SLIDER_MAX}
                      step={BUDGET_SLIDER_STEP}
                      value={sliderMinBudget}
                      onChange={(event) =>
                        handleMinBudgetSliderChange(Number(event.target.value))
                      }
                      onPointerDown={() => setActiveBudgetHandle("min")}
                      onPointerUp={() => setActiveBudgetHandle(null)}
                      onKeyDown={() => setActiveBudgetHandle("min")}
                      onKeyUp={() => setActiveBudgetHandle(null)}
                      aria-label="Minimum budget"
                      className={`budget-range-input budget-range-input-min ${
                        activeBudgetHandle === "min" ? "budget-range-input-active" : ""
                      }`}
                    />
                    <input
                      type="range"
                      min={BUDGET_SLIDER_MIN}
                      max={BUDGET_SLIDER_MAX}
                      step={BUDGET_SLIDER_STEP}
                      value={sliderMaxBudget}
                      onChange={(event) =>
                        handleMaxBudgetSliderChange(Number(event.target.value))
                      }
                      onPointerDown={() => setActiveBudgetHandle("max")}
                      onPointerUp={() => setActiveBudgetHandle(null)}
                      onKeyDown={() => setActiveBudgetHandle("max")}
                      onKeyUp={() => setActiveBudgetHandle(null)}
                      aria-label="Maximum budget"
                      className={`budget-range-input budget-range-input-max ${
                        activeBudgetHandle === "max" ? "budget-range-input-active" : ""
                      }`}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-medium text-[#647789]">
                    <span>{formatBudgetSliderValue(BUDGET_SLIDER_MIN)}</span>
                    <span>{formatBudgetSliderValue(BUDGET_SLIDER_MAX)}</span>
                  </div>
                </div>
              </label>
            </div>

            {budgetValidationMessage ? (
              <p className="md:col-span-2 text-sm text-red-600">
                {budgetValidationMessage}
              </p>
            ) : null}

            <label
              className={`block rounded-[24px] ${getAttentionFieldClassName("vehicle-type")}`}
            >
              <span className={formLabelClassName}>
                Vehicle type
              </span>
              <select
                ref={vehicleTypeFieldRef}
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

            <label
              className={`block rounded-[24px] md:col-span-2 ${getAttentionFieldClassName("brands")}`}
            >
              <span className={formLabelClassName}>
                Brands
              </span>
              <div className="rounded-[24px] border border-[#d9e0e7] bg-[#f5f7fa] p-3 lg:p-[0.875rem]">
                <div className="flex min-h-14 items-center gap-3 rounded-[20px] border border-[#d9e0e7] bg-white px-4 lg:min-h-[3.35rem]">
                  <SearchIcon size={20} strokeWidth={2.4} className="text-[#7d8f9d]" />
                  <input
                    ref={brandSearchFieldRef}
                    value={brandQuery}
                    onChange={(event) => setBrandQuery(event.target.value)}
                    placeholder="Search brands..."
                    className="app-input w-full bg-transparent py-3 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                  />
                </div>

                {brands.length ? (
                  <div className="scrollbar-hidden mt-2.5 overflow-x-auto">
                    <div className="flex min-w-max gap-2 pb-1">
                      {brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleBrand(brand)}
                          className="nav-pill inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-white backdrop-blur-sm"
                        >
                          {brand}
                          <X size={20} strokeWidth={2.4} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2.5 text-sm text-[#647789]">
                    Pick one or more brands that feel like a fit.
                  </p>
                )}

                <div className="relative mt-2.5">
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
                            className="nav-pill inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9e0e7] bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-[#314154] transition hover:border-accent"
                          >
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {!filteredBrands.length && brands.length !== availableBrands.length ? (
                  <p className="mt-2.5 text-sm text-[#647789]">
                    No matching brands left to add.
                  </p>
                ) : null}
              </div>
            </label>

          </form>
        </section>

        <div
          className={`motion-rise-fade motion-delay-2 space-y-6 lg:flex lg:flex-col lg:gap-5 lg:space-y-0 lg:overflow-visible ${
            isHelperWizardOpen ? "lg:h-auto lg:max-h-none" : "lg:h-[calc(100vh-140px)] lg:max-h-[660px]"
          }`}
        >
          <section
            className={
              helperStep === "intro"
                ? `helper-intro-card relative ${helperIntroCardClassName} cursor-pointer rounded-[24px] border p-[1px] text-slate-100`
                : `${helperCardBaseClassName} relative z-50`
            }
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
              <div className="helper-intro-card-inner flex min-h-[15.25rem] flex-col overflow-hidden rounded-[23px] lg:h-full">
                <div className="helper-intro-strip relative h-[80px] min-h-[76px] max-h-[88px] overflow-hidden bg-[linear-gradient(180deg,rgba(14,24,34,0.96)_0%,rgba(8,16,23,0.94)_100%)]">
                  <Image
                    src="/car-type-helper-lineup.png"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 28vw, 100vw"
                    className="object-cover object-center opacity-[0.42] brightness-[0.82] contrast-[1.04] saturate-[0.38]"
                    aria-hidden="true"
                  />
                  <div className="helper-intro-strip-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,16,0.16)_0%,rgba(4,10,16,0.28)_44%,rgba(7,14,20,0.78)_100%)]" />
                </div>
                <div className="flex flex-1 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-4 sm:px-6 sm:py-5">
                  <div className="inline-flex w-full items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D1133A]/35 bg-[#D1133A] text-white shadow-[0_0_14px_rgba(209,19,58,0.18)]">
                      <CarFront size={16} strokeWidth={2.4} />
                    </span>
                    <p className="helper-intro-kicker flex-1 text-[0.9rem] font-semibold uppercase tracking-[0.15em] text-slate-200 sm:text-[0.98rem]">
                      Need help with Car Type?
                    </p>
                  </div>
                  <p className="helper-intro-body mt-3 max-w-[16.5rem] text-[1.18rem] font-semibold leading-[1.18] text-white sm:text-[1.34rem]">
                    Choose the type of vehicle that fits your lifestyle best.
                  </p>
                  <div className="mt-auto flex justify-end pt-4">
                    <span className="helper-intro-cta text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[0.82rem]">
                      Start car type guide
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {helperStep === "question-1" ? (
              <div className={`text-[#17212b] ${helperTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
                <HelperStepHeader label="Question 1 of 2" onClose={resetHelper} />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
                  Which matters more for this car?
                </h2>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    disabled={helperTransitioning}
                    onClick={() => {
                      setBuyerPriority("practicality");
                      runHelperTransition("practicality", () => setHelperStep("question-2"));
                    }}
                    className={`${helperOptionButtonClass} ${
                      helperPendingSelection === "practicality"
                        ? "helper-option-selected scale-95 border-transparent bg-[#D1133A] text-white ring-2 ring-red-300"
                        : helperTransitioning
                          ? "opacity-55"
                          : ""
                    }`}
                  >
                    Practicality and value
                  </button>
                  <button
                    type="button"
                    disabled={helperTransitioning}
                    onClick={() => {
                      setBuyerPriority("style");
                      runHelperTransition("style", () => setHelperStep("question-2"));
                    }}
                    className={`${helperOptionButtonClass} ${
                      helperPendingSelection === "style"
                        ? "helper-option-selected scale-95 border-transparent bg-[#D1133A] text-white ring-2 ring-red-300"
                        : helperTransitioning
                          ? "opacity-55"
                          : ""
                    }`}
                  >
                    Style and presence
                  </button>
                </div>
              </div>
            ) : null}

            {helperStep === "question-2" ? (
              <div className={`text-[#17212b] ${helperTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
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
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
                  What would help you more day to day?
                </h2>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    disabled={helperTransitioning}
                    onClick={() => {
                      setBuyerNeed("easy");
                      runHelperTransition("easy", () => setHelperStep("result"));
                    }}
                    className={`${helperOptionButtonClass} ${
                      helperPendingSelection === "easy"
                        ? "helper-option-selected scale-95 border-transparent bg-[#D1133A] text-white ring-2 ring-red-300"
                        : helperTransitioning
                          ? "opacity-55"
                          : ""
                    }`}
                  >
                    Something easier to park and move around
                  </button>
                  <button
                    type="button"
                    disabled={helperTransitioning}
                    onClick={() => {
                      setBuyerNeed("room");
                      runHelperTransition("room", () => setHelperStep("result"));
                    }}
                    className={`${helperOptionButtonClass} ${
                      helperPendingSelection === "room"
                        ? "helper-option-selected scale-95 border-transparent bg-[#D1133A] text-white ring-2 ring-red-300"
                        : helperTransitioning
                          ? "opacity-55"
                          : ""
                    }`}
                  >
                    More room for people or things
                  </button>
                </div>
              </div>
            ) : null}

            {helperStep === "result" && helperResult ? (
              <div className="helper-question-enter text-[#17212b]">
                <p className="text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] sm:text-[1.45rem]">
                  Your car type
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
                  {helperResult.type}
                </h2>
                <p className="mt-3 text-[1.7rem] font-normal leading-10 text-[#4B5563] sm:text-[1.85rem]">
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
                    className={helperPrimaryButtonClass}
                  >
                    {helperPrimaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={resetHelper}
                    className={helperSecondaryButtonClass}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section
            className={
              budgetHelperStep === "intro"
                ? `helper-intro-card relative rounded-[24px] ${helperIntroCardClassName} cursor-pointer border p-[1px] text-slate-100`
                : `${helperCardBaseClassName} relative z-50`
            }
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
              <div className="helper-intro-card-inner flex min-h-[16.5rem] flex-col overflow-hidden rounded-[23px] lg:h-full">
                <div className="helper-intro-strip relative h-[80px] min-h-[76px] max-h-[88px] overflow-hidden bg-[linear-gradient(180deg,#10202c_0%,#09131b_100%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(255,255,255,0.06),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.12)_100%)]" />
                  <div className="absolute inset-x-6 top-[52%] h-px -translate-y-1/2 bg-white/18" />
                  <div className="absolute inset-x-6 top-[52%] h-px -translate-y-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(209,19,58,0.55)_56%,rgba(255,255,255,0.06)_100%)]" />
                  <div className="absolute left-[58%] top-[52%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff8aa2]/50 bg-[#D1133A] shadow-[0_0_20px_rgba(209,19,58,0.24)]" />
                  <div className="absolute left-[13%] top-[18%] rounded-full border border-white/12 bg-white/6 px-3 py-1 text-sm font-medium text-white/70 backdrop-blur-sm">
                    $120k
                  </div>
                  <div className="absolute left-[38%] top-[10%] rounded-full border border-white/12 bg-white/7 px-3 py-1 text-sm font-medium text-white/74 backdrop-blur-sm">
                    $180k
                  </div>
                  <div className="absolute right-[14%] top-[18%] rounded-full border border-white/14 bg-white/9 px-3 py-1 text-sm font-semibold text-white/86 shadow-[0_0_20px_rgba(209,19,58,0.18)] backdrop-blur-sm">
                    $250k
                  </div>
                  <div className="absolute right-[10%] bottom-[16%] rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/64 backdrop-blur-sm">
                    ?
                  </div>
                  <div className="absolute left-[18%] bottom-[18%] flex items-end gap-1.5 opacity-30">
                    <span className="h-3 w-1.5 rounded-full bg-white/60" />
                    <span className="h-5 w-1.5 rounded-full bg-white/70" />
                    <span className="h-8 w-1.5 rounded-full bg-white/80" />
                    <span className="h-6 w-1.5 rounded-full bg-white/65" />
                  </div>
                  <svg
                    viewBox="0 0 180 70"
                    className="absolute inset-x-8 bottom-3 h-8 w-[calc(100%-4rem)] opacity-18"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 54C24 52 33 38 49 38C67 38 73 48 92 48C114 48 121 22 141 22C154 22 163 29 176 32"
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeDasharray="2 6"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-4 sm:px-6 sm:py-5">
                  <div className="inline-flex w-full items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D1133A]/35 bg-[#D1133A] text-white shadow-[0_0_14px_rgba(209,19,58,0.18)]">
                      <DollarSign size={16} strokeWidth={2.4} />
                    </span>
                    <p className="helper-intro-kicker flex-1 text-[0.9rem] font-semibold uppercase tracking-[0.15em] text-slate-200 sm:text-[0.98rem]">
                      Need help with budget?
                    </p>
                  </div>
                  <h2 className="helper-intro-body mt-3 max-w-[16.5rem] text-[1.18rem] font-semibold leading-[1.18] text-white sm:text-[1.34rem]">
                    Start with a price range that feels right
                  </h2>
                  <div className="mt-auto flex justify-end pt-4">
                    <span className="helper-intro-cta text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[0.82rem]">
                      Start budget helper
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-1" ? (
              <div className={`text-[#17212b] ${budgetTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
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
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
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
                        onClick={() => {
                          pulseBudgetSelection(`amount-${amount}`);
                          setMonthlyPaymentInput(amount.toLocaleString("en-US"));
                        }}
                        className={`${helperNeutralPillClass} ${
                          budgetPendingSelection === `amount-${amount}` ||
                          monthlyPaymentInput === amount.toLocaleString("en-US")
                            ? "helper-option-selected border-transparent bg-[#D1133A] text-white"
                            : ""
                        }`}
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
                        runBudgetTransition(() => setBudgetHelperStep("question-2"));
                      }
                    }}
                    disabled={!monthlyPaymentIsValid}
                    className={helperPrimaryButtonClass}
                  >
                    Next question
                  </button>
                  <button
                    type="button"
                    onClick={resetBudgetHelper}
                    className={helperSecondaryButtonClass}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-2" ? (
              <div className={`text-[#17212b] ${budgetTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
                <HelperStepHeader
                  label="Question 2 of 4"
                  onBack={() => runBudgetTransition(() => setBudgetHelperStep("question-1"))}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
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
                    onClick={() => runBudgetTransition(() => setBudgetHelperStep("question-1"))}
                    className={helperSecondaryButtonClass}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (downPaymentIsValid) {
                        runBudgetTransition(() => setBudgetHelperStep("question-3"));
                      }
                    }}
                    disabled={!downPaymentIsValid}
                    className={helperPrimaryButtonClass}
                  >
                    Next question
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-3" ? (
              <div className={`text-[#17212b] ${budgetTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
                <HelperStepHeader
                  label="Question 3 of 4"
                  onBack={() => runBudgetTransition(() => setBudgetHelperStep("question-2"))}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
                  How long would you be willing to pay that monthly amount?
                </h2>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[3, 4, 5, 6, 7].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        pulseBudgetSelection(`term-${term}`);
                        setLoanTermYears(term);
                      }}
                        className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-semibold transition ${
                          budgetPendingSelection === `term-${term}` || loanTermYears === term
                          ? "border-transparent bg-accent text-white"
                          : "border-[#D1133A] bg-white text-[#111827] hover:bg-[rgba(209,19,58,0.05)]"
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
                    onClick={() => runBudgetTransition(() => setBudgetHelperStep("question-2"))}
                    className={helperSecondaryButtonClass}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (loanTermIsValid) {
                        runBudgetTransition(() => setBudgetHelperStep("question-4"));
                      }
                    }}
                    disabled={!loanTermIsValid}
                    className={helperPrimaryButtonClass}
                  >
                    Next question
                  </button>
                </div>
              </div>
            ) : null}

            {budgetHelperStep === "question-4" ? (
              <div className={`text-[#17212b] ${budgetTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
                <HelperStepHeader
                  label="Question 4 of 4"
                  onBack={() => runBudgetTransition(() => setBudgetHelperStep("question-3"))}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: budgetGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
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
                  <p className="mt-2 text-xs leading-5 text-[#4B5563]">
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
                    onClick={() => runBudgetTransition(() => setBudgetHelperStep("question-3"))}
                    className={helperSecondaryButtonClass}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (interestRateIsValid && budgetHelperInputsValid) {
                        runBudgetTransition(() => setBudgetHelperStep("result"));
                      }
                    }}
                    disabled={!interestRateIsValid || !budgetHelperInputsValid}
                    className={helperPrimaryButtonClass}
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
              <div className="helper-question-enter text-[#17212b]">
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
                    className="app-button inline-flex justify-center rounded-full border border-[#8198ab] bg-[#e3edf5] px-6 py-3.5 text-sm font-semibold text-[#1c3141] transition hover:border-[#D1133A] hover:bg-[#D1133A] hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {isDefineHelpOpen ? (
        <div className="fixed inset-0 z-50 sm:block">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsDefineHelpOpen(false)}
            aria-label="Close Define help"
          />
          {defineCardBounds && shouldAnchorDefineHelp ? (
            <div
              className="pointer-events-none absolute hidden rounded-[32px] bg-white/12 ring-1 ring-white/20 sm:block"
              style={{
                height: defineCardBounds.height,
                left: defineCardBounds.left,
                top: defineCardBounds.top,
                width: defineCardBounds.width,
              }}
              aria-hidden="true"
            />
          ) : null}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="define-help-title"
            className="matches-help-sheet absolute bottom-0 left-0 z-10 w-full rounded-t-[28px] border border-white/10 bg-[#07141d] p-5 shadow-[0_-22px_52px_rgba(0,0,0,0.42)] sm:rounded-[28px]"
            style={
              defineCardBounds && shouldAnchorDefineHelp
                ? {
                    bottom: Math.max(defineCardBounds.bottomOffset - 20, 24),
                    left: defineCardBounds.left,
                    maxWidth: defineCardBounds.width,
                    width: defineCardBounds.width,
                  }
                : undefined
            }
            onPointerDown={(event) => {
              defineHelpPointerStartYRef.current = event.clientY;
            }}
            onPointerUp={(event) => {
              const startY = defineHelpPointerStartYRef.current;
              defineHelpPointerStartYRef.current = null;

              if (startY !== null && event.clientY - startY > 48) {
                setIsDefineHelpOpen(false);
              }
            }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            <h3 id="define-help-title" className="text-2xl font-semibold text-white">
              How this works
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <DollarSign size={19} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Set your budget
                  </p>
                  <p className="mt-1 text-base leading-7 text-slate-300">
                    Start with a range that feels comfortable — you can adjust it anytime.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                  <SlidersHorizontal size={19} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Choose what matters
                  </p>
                  <p className="mt-1 text-base leading-7 text-slate-300">
                    Pick a vehicle type, brands, or models you like.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                  <CarFront size={19} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">
                    We’ll do the rest
                  </p>
                  <p className="mt-1 text-base leading-7 text-slate-300">
                    We’ll match you with cars that fit your preferences.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-base font-medium leading-7 text-slate-400">
              You don’t need to get it perfect — you can refine as you go.
            </p>
            <button
              type="button"
              onClick={() => setIsDefineHelpOpen(false)}
              className="app-button mt-5 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/12"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
