"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  Check,
  DollarSign,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useJourney, type Preferences } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { DEFAULT_BRANDS } from "@/lib/brands";
import {
  readActivePreferenceProfile,
  replaceSelectedPreferenceBrands,
  saveActivePreferenceProfile,
} from "@/lib/phase1ProfilePreferences";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
const BUDGET_SLIDER_MIN = 5000;
const BUDGET_SLIDER_MAX = 2000000;
const BUDGET_SLIDER_STEP = 5000;
const DEFAULT_MIN_BUDGET = 80000;
const DEFAULT_MAX_BUDGET = 300000;
const formatBudgetSliderValue = (value: number) =>
  `TT$${new Intl.NumberFormat("en-US").format(value)}`;
const formatCompactBudgetSliderValue = (value: number) =>
  value >= 1000 ? `TT$${Math.round(value / 1000)}k` : `TT$${value}`;

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

type BuyerGuideStep = "intro" | "question" | "result";
type RecommendedCarType =
  | "sedan"
  | "hatchback"
  | "compact-suv"
  | "large-suv"
  | "pickup"
  | "van";
type HelperQuestionKey =
  | "people"
  | "driving"
  | "cargo"
  | "fuel"
  | "parking"
  | "style";
type HelperScores = Partial<Record<RecommendedCarType, number>>;
type HelperAnswerOption = {
  id: string;
  label: string;
  scores: HelperScores;
  insight: string;
};
type HelperQuestion = {
  key: HelperQuestionKey;
  prompt: string;
  options: HelperAnswerOption[];
};
type HelperAnswers = Record<HelperQuestionKey, string | null>;
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

type HelperRecommendationResult = {
  bestType: RecommendedCarType;
  bestTypeLabel: string;
  bestScore: number;
  confidencePercent: number;
  alsoConsider: RecommendedCarType;
  alsoConsiderLabel: string;
  defineValue: string;
  applyTypeLabel: string;
  bullets: string[];
};

const recommendedCarTypeMeta: Record<
  RecommendedCarType,
  {
    label: string;
    defineValue: string;
    applyTypeLabel: string;
  }
> = {
  sedan: { label: "Sedan", defineValue: "sedan", applyTypeLabel: "Sedan" },
  hatchback: {
    label: "Hatchback",
    defineValue: "hatchback",
    applyTypeLabel: "Hatchback",
  },
  "compact-suv": {
    label: "Compact SUV",
    defineValue: "suv",
    applyTypeLabel: "SUV",
  },
  "large-suv": {
    label: "Large SUV",
    defineValue: "suv",
    applyTypeLabel: "SUV",
  },
  pickup: { label: "Pickup", defineValue: "pickup", applyTypeLabel: "Pickup" },
  van: { label: "Van", defineValue: "van", applyTypeLabel: "Van" },
};

const recommendedCarTypeOrder: RecommendedCarType[] = [
  "sedan",
  "hatchback",
  "compact-suv",
  "large-suv",
  "pickup",
  "van",
];

const helperQuestions: HelperQuestion[] = [
  {
    key: "people",
    prompt: "How many people are usually in the car?",
    options: [
      {
        id: "just-me",
        label: "Just me",
        scores: { sedan: 2, hatchback: 3, "compact-suv": 1 },
        insight:
          "Your day-to-day passenger count stays light, so a smaller footprint can work in your favor.",
      },
      {
        id: "two-to-three",
        label: "2–3 people",
        scores: { sedan: 2, hatchback: 2, "compact-suv": 2 },
        insight:
          "You usually carry a small crew, which gives you room to balance comfort with efficiency.",
      },
      {
        id: "four-to-five",
        label: "4–5 people",
        scores: { sedan: 1, "compact-suv": 3, "large-suv": 2, van: 1 },
        insight:
          "Your typical passenger load points toward something that can stay comfortable when the seats fill up.",
      },
      {
        id: "five-plus",
        label: "5+ people",
        scores: { "compact-suv": 1, "large-suv": 3, van: 4 },
        insight:
          "You need real people space, so room and flexibility matter more than a compact footprint.",
      },
    ],
  },
  {
    key: "driving",
    prompt: "What kind of driving do you do most?",
    options: [
      {
        id: "city",
        label: "City / short trips",
        scores: {
          sedan: 2,
          hatchback: 3,
          "compact-suv": 1,
          "large-suv": -1,
          pickup: -1,
          van: -1,
        },
        insight:
          "Your routine leans toward shorter city runs, so agility and ease around town matter.",
      },
      {
        id: "highway",
        label: "Highway commuting",
        scores: { sedan: 3, hatchback: 1, "compact-suv": 2, "large-suv": 1 },
        insight:
          "You spend a lot of time cruising at speed, which rewards comfort, composure, and steady efficiency.",
      },
      {
        id: "mixed",
        label: "Mixed roads",
        scores: {
          sedan: 1,
          hatchback: 1,
          "compact-suv": 3,
          "large-suv": 2,
          pickup: 1,
        },
        insight:
          "Your driving mix calls for something versatile enough to feel confident on different roads.",
      },
      {
        id: "rough",
        label: "Rough roads",
        scores: {
          sedan: -1,
          hatchback: -1,
          "compact-suv": 3,
          "large-suv": 3,
          pickup: 4,
        },
        insight:
          "You deal with rougher surfaces, so strength, ride height, and toughness naturally move up the list.",
      },
    ],
  },
  {
    key: "cargo",
    prompt: "What do you usually carry?",
    options: [
      {
        id: "groceries",
        label: "Groceries / normal errands",
        scores: {
          sedan: 2,
          hatchback: 2,
          "compact-suv": 2,
          "large-suv": 1,
        },
        insight:
          "Your cargo needs are everyday and manageable, so you do not need to overbuy for occasional tasks.",
      },
      {
        id: "sports",
        label: "Sports / small equipment",
        scores: {
          sedan: 1,
          hatchback: 2,
          "compact-suv": 3,
          "large-suv": 2,
          pickup: 1,
        },
        insight:
          "You need a bit more flexibility for gear, which favors vehicles that can stretch without feeling oversized.",
      },
      {
        id: "tools",
        label: "Tools / heavy loads",
        scores: {
          sedan: -1,
          hatchback: -1,
          "compact-suv": 1,
          "large-suv": 2,
          pickup: 4,
          van: 2,
        },
        insight:
          "What you carry is heavier-duty, so cargo capability and toughness should pull more weight in the decision.",
      },
      {
        id: "family-items",
        label: "Large family items",
        scores: { "compact-suv": 2, "large-suv": 3, pickup: 1, van: 4 },
        insight:
          "Bulky family cargo points toward something that can handle bigger items without becoming stressful to pack.",
      },
    ],
  },
  {
    key: "fuel",
    prompt: "How important is fuel efficiency?",
    options: [
      {
        id: "very-important",
        label: "Very important",
        scores: {
          sedan: 3,
          hatchback: 4,
          "compact-suv": 1,
          "large-suv": -2,
          pickup: -2,
          van: -1,
        },
        insight:
          "You want the running costs to stay lean, so efficiency deserves a real seat at the table.",
      },
      {
        id: "balanced",
        label: "Balanced",
        scores: {
          sedan: 2,
          hatchback: 2,
          "compact-suv": 2,
          "large-suv": 1,
          pickup: 1,
          van: 1,
        },
        insight:
          "You are balancing running costs with day-to-day practicality instead of optimizing around one extreme.",
      },
      {
        id: "not-a-concern",
        label: "Not a concern",
        scores: { "compact-suv": 1, "large-suv": 2, pickup: 2, van: 1 },
        insight:
          "You have room to prioritize space, strength, or presence over maximizing fuel savings.",
      },
    ],
  },
  {
    key: "parking",
    prompt: "What matters more day to day?",
    options: [
      {
        id: "easy-parking",
        label: "Easy parking",
        scores: {
          sedan: 2,
          hatchback: 4,
          "compact-suv": 1,
          "large-suv": -2,
          pickup: -2,
          van: -1,
        },
        insight:
          "You want something that stays easy to place, park, and live with in tighter spaces.",
      },
      {
        id: "balanced-size",
        label: "Balanced size",
        scores: {
          sedan: 2,
          hatchback: 2,
          "compact-suv": 2,
          "large-suv": 1,
          pickup: 1,
          van: 1,
        },
        insight:
          "You are aiming for a middle ground that feels capable without being too bulky day to day.",
      },
      {
        id: "more-space",
        label: "More space / presence",
        scores: {
          hatchback: -1,
          "compact-suv": 2,
          "large-suv": 4,
          pickup: 3,
          van: 2,
        },
        insight:
          "You would rather have extra room and road presence than squeeze everything into the smallest package.",
      },
    ],
  },
  {
    key: "style",
    prompt: "Which style feels more like you?",
    options: [
      {
        id: "sleek",
        label: "Sleek / polished",
        scores: { sedan: 3, hatchback: 1, "compact-suv": 1, "large-suv": 1 },
        insight:
          "You are drawn to a cleaner, more polished look, which nudges the recommendation toward a more refined shape.",
      },
      {
        id: "small-practical",
        label: "Small / practical",
        scores: { sedan: 1, hatchback: 4, "compact-suv": 1 },
        insight:
          "You like things to feel practical and unfussy, which is a strong signal toward compact usability.",
      },
      {
        id: "rugged",
        label: "Rugged / strong",
        scores: { "compact-suv": 2, "large-suv": 2, pickup: 4 },
        insight:
          "You want something with strength and attitude, so a tougher shape naturally moves up.",
      },
      {
        id: "family-comfort",
        label: "Family / comfort",
        scores: { sedan: 1, "compact-suv": 3, "large-suv": 3, van: 4 },
        insight:
          "You are optimizing around comfort and family ease, which favors vehicles that make shared routines simpler.",
      },
    ],
  },
];

const helperInitialAnswers: HelperAnswers = {
  people: null,
  driving: null,
  cargo: null,
  fuel: null,
  parking: null,
  style: null,
};

const helperTieBreakOrder: HelperQuestionKey[] = [
  "people",
  "cargo",
  "driving",
  "fuel",
  "parking",
  "style",
];

const HELPER_CONFIDENCE_MAX_SCORE = 24;

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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formConfirmation, setFormConfirmation] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingSavedPreferences, setIsLoadingSavedPreferences] =
    useState(false);
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
  const [helperQuestionIndex, setHelperQuestionIndex] = useState(0);
  const [helperAnswers, setHelperAnswers] =
    useState<HelperAnswers>(helperInitialAnswers);
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
  const updatePreferencesRef = useRef(updatePreferences);
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

  const applyPreferenceValuesToForm = useCallback(
    (nextPreferences: Preferences) => {
      setMinBudgetInput(
        nextPreferences.minBudget === null
          ? ""
          : nextPreferences.minBudget.toLocaleString("en-US"),
      );
      setMaxBudgetInput(
        nextPreferences.maxBudget === null
          ? ""
          : nextPreferences.maxBudget.toLocaleString("en-US"),
      );
      setVehicleType(nextPreferences.vehicleType);
      setBrands(nextPreferences.brand);
      setModel(nextPreferences.model);
    },
    [],
  );

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
    updatePreferencesRef.current = updatePreferences;
  }, [updatePreferences]);

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
    if (isDirty) {
      return;
    }

    applyPreferenceValuesToForm(preferences);
  }, [applyPreferenceValuesToForm, isDirty, preferences]);

  useEffect(() => {
    let isActive = true;

    const loadSavedPreferences = async () => {
      setIsLoadingSavedPreferences(true);
      setFormError(null);

      try {
        const savedPreferenceProfile =
          await readActivePreferenceProfile(supabase);

        if (!isActive || !savedPreferenceProfile) {
          return;
        }

        const nextPreferences: Preferences = {
          minBudget: savedPreferenceProfile.budget_min,
          maxBudget: savedPreferenceProfile.budget_max,
          vehicleType: savedPreferenceProfile.vehicle_type ?? "",
          brand: normalizeBrands(
            savedPreferenceProfile.preference_profile_brands.map(
              (brand) => brand.brand_name,
            ),
          ),
          model: savedPreferenceProfile.model_query ?? "",
        };

        updatePreferencesRef.current(nextPreferences);
        applyPreferenceValuesToForm(nextPreferences);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error(error);
        setFormError("Saved preferences could not be loaded. Local preferences are still available.");
      } finally {
        if (isActive) {
          setIsLoadingSavedPreferences(false);
        }
      }
    };

    loadSavedPreferences();

    return () => {
      isActive = false;
    };
  }, [applyPreferenceValuesToForm, supabase]);

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

  const handleSaveAndDiscover = useCallback(async () => {
    if (isSubmitting || !budgetRangeIsValid) {
      return false;
    }

    setIsSubmitting(true);
    setFormError(null);

    const nextPreferences: Preferences = {
      minBudget: currentFormValues.minBudget,
      maxBudget: currentFormValues.maxBudget,
      vehicleType: currentFormValues.vehicleType,
      brand: currentFormValues.brands,
      model: currentFormValues.model,
    };

    if (isDirty) {
      updatePreferences(nextPreferences);
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error && error.name !== "AuthSessionMissingError") {
        throw error;
      }

      if (user) {
        const savedPreferenceProfile = await saveActivePreferenceProfile(
          supabase,
          {
            budget_min: nextPreferences.minBudget,
            budget_max: nextPreferences.maxBudget,
            vehicle_type: nextPreferences.vehicleType || null,
            model_query: nextPreferences.model || null,
          },
        );

        await replaceSelectedPreferenceBrands(
          supabase,
          savedPreferenceProfile.id,
          nextPreferences.brand,
        );
      }
    } catch (error) {
      console.error(error);
      setFormError("Preferences were saved locally, but Supabase could not save them yet.");
      setIsSubmitting(false);
      return false;
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
    supabase,
    updatePreferences,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSaveAndDiscover();
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

  const helperSelectedOptions = useMemo(
    () =>
      helperQuestions.reduce<
        Partial<Record<HelperQuestionKey, HelperAnswerOption>>
      >((result, question) => {
        const answerId = helperAnswers[question.key];
        if (!answerId) {
          return result;
        }

        const option = question.options.find((item) => item.id === answerId);
        if (option) {
          result[question.key] = option;
        }

        return result;
      }, {}),
    [helperAnswers],
  );
  const helperScores = useMemo(
    () =>
      helperQuestions.reduce<Record<RecommendedCarType, number>>(
        (result, question) => {
          const selectedOption = helperSelectedOptions[question.key];
          if (!selectedOption) {
            return result;
          }

          recommendedCarTypeOrder.forEach((type) => {
            result[type] += selectedOption.scores[type] ?? 0;
          });

          return result;
        },
        {
          sedan: 0,
          hatchback: 0,
          "compact-suv": 0,
          "large-suv": 0,
          pickup: 0,
          van: 0,
        },
      ),
    [helperSelectedOptions],
  );
  const helperQuestionScoreByType = useMemo(
    () =>
      helperQuestions.reduce<
        Record<HelperQuestionKey, Record<RecommendedCarType, number>>
      >((result, question) => {
        const selectedOption = helperSelectedOptions[question.key];
        result[question.key] = recommendedCarTypeOrder.reduce<
          Record<RecommendedCarType, number>
        >(
          (typeResult, type) => {
            typeResult[type] = selectedOption?.scores[type] ?? 0;
            return typeResult;
          },
          {
            sedan: 0,
            hatchback: 0,
            "compact-suv": 0,
            "large-suv": 0,
            pickup: 0,
            van: 0,
          },
        );
        return result;
      }, {} as Record<HelperQuestionKey, Record<RecommendedCarType, number>>),
    [helperSelectedOptions],
  );
  const sortedHelperTypes = useMemo(() => {
    const compareTypes = (
      left: RecommendedCarType,
      right: RecommendedCarType,
    ) => {
      const totalDifference = helperScores[right] - helperScores[left];
      if (totalDifference !== 0) {
        return totalDifference;
      }

      for (const questionKey of helperTieBreakOrder) {
        const questionDifference =
          helperQuestionScoreByType[questionKey][right] -
          helperQuestionScoreByType[questionKey][left];
        if (questionDifference !== 0) {
          return questionDifference;
        }
      }

      return (
        recommendedCarTypeOrder.indexOf(left) -
        recommendedCarTypeOrder.indexOf(right)
      );
    };

    return [...recommendedCarTypeOrder].sort(compareTypes);
  }, [helperQuestionScoreByType, helperScores]);
  const helperResult = useMemo<HelperRecommendationResult | null>(() => {
    const allAnswered = helperQuestions.every((question) =>
      Boolean(helperAnswers[question.key]),
    );
    if (!allAnswered) {
      return null;
    }

    const bestType = sortedHelperTypes[0];
    const alsoConsider = sortedHelperTypes[1] ?? sortedHelperTypes[0];
    const bestTypeMeta = recommendedCarTypeMeta[bestType];
    const alsoConsiderMeta = recommendedCarTypeMeta[alsoConsider];
    const bestScore = helperScores[bestType];
    const confidencePercent = Math.max(
      0,
      Math.min(
        100,
        Math.round((bestScore / HELPER_CONFIDENCE_MAX_SCORE) * 100),
      ),
    );
    const bullets = helperQuestions
      .map((question, index) => {
        const selectedOption = helperSelectedOptions[question.key];
        return {
          contribution: selectedOption?.scores[bestType] ?? 0,
          index,
          insight: selectedOption?.insight ?? "",
        };
      })
      .sort((left, right) => {
        const contributionDifference = right.contribution - left.contribution;
        if (contributionDifference !== 0) {
          return contributionDifference;
        }

        return left.index - right.index;
      })
      .filter((item) => item.insight)
      .slice(0, 3)
      .map((item) => item.insight);

    return {
      bestType,
      bestTypeLabel: bestTypeMeta.label,
      bestScore,
      confidencePercent,
      alsoConsider,
      alsoConsiderLabel: alsoConsiderMeta.label,
      defineValue: bestTypeMeta.defineValue,
      applyTypeLabel: bestTypeMeta.applyTypeLabel,
      bullets,
    };
  }, [helperAnswers, helperScores, helperSelectedOptions, sortedHelperTypes]);
  const answeredBuyerQuestions = helperQuestions.reduce(
    (count, question) => count + (helperAnswers[question.key] ? 1 : 0),
    0,
  );
  const buyerGuideProgressWidth = `${(answeredBuyerQuestions / helperQuestions.length) * 100}%`;
  const currentHelperQuestion =
    helperStep === "question" ? helperQuestions[helperQuestionIndex] : null;
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
  const helperPrimaryLabel = "Use this car type";
  const helperCardBaseClassName =
    "relative rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white p-5 text-[#111827] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-[background-color,color,box-shadow] duration-200 sm:p-6";
  const helperIntroCardClassName =
    "lg:flex-1 lg:min-h-[220px] lg:max-h-[300px]";
  const isHelperWizardOpen =
    helperStep !== "intro" || budgetHelperStep !== "intro";

  const handleApplySuggestedType = () => {
    if (!helperResult) {
      return;
    }

    const isReplacingType =
      hasSpecificVehicleType && vehicleType !== helperResult.defineValue;

    setVehicleType(helperResult.defineValue);
    setFormConfirmation(
      helperResult.applyTypeLabel !== helperResult.bestTypeLabel
        ? `${helperResult.applyTypeLabel} filter added based on your ${helperResult.bestTypeLabel} match`
        : isReplacingType
          ? `${helperResult.bestTypeLabel} replaced your current Define type`
          : `${helperResult.bestTypeLabel} added to your Define preferences`,
    );
    resetHelper();
  };

  const resetHelper = () => {
    if (helperTransitionTimeoutRef.current !== null) {
      window.clearTimeout(helperTransitionTimeoutRef.current);
      helperTransitionTimeoutRef.current = null;
    }
    setHelperStep("intro");
    setHelperQuestionIndex(0);
    setHelperAnswers(helperInitialAnswers);
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
      }, 250);
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
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(209,19,58,0.16),transparent_24%),linear-gradient(180deg,#011118_0%,#000000_44%,#04121a_100%)] text-foreground">
      <div className="mx-auto grid w-full max-w-full gap-6 px-5 py-5 sm:px-8 lg:max-w-7xl lg:grid-cols-[1.18fr_0.82fr] lg:px-12 lg:py-6">
        <section
          ref={defineCardRef}
          className={`page-panel motion-rise-fade motion-delay-1 rounded-[32px] border border-[#d9e0e7] p-5 text-[#17212b] transition sm:p-6 lg:p-5 ${
            isHelperWizardOpen
              ? "bg-[#dfe5eb] opacity-[0.78] shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
              : "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
          } ${defineAttentionClassName}`}
        >
          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
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
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-[0_10px_24px_rgba(209,19,58,0.24)] transition hover:scale-105 hover:brightness-110 hover:shadow-[0_14px_30px_rgba(209,19,58,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
                  aria-label="How Define preferences work"
                >
                  <span aria-hidden="true" className="font-serif text-[1.3rem] font-bold italic leading-none">
                    i
                  </span>
                </button>
              </div>
              <button
                type="submit"
                form="define-preferences-form"
                data-dirty={isDirty ? "true" : "false"}
                data-pop={isDirtyPopActive ? "true" : "false"}
                className={`app-button inline-flex w-full items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] sm:w-auto md:text-base disabled:cursor-not-allowed disabled:opacity-60 ${
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
          {isLoadingSavedPreferences ? (
            <p className="mt-4 rounded-[22px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 py-3 text-sm text-[#314154]">
              Loading saved preferences...
            </p>
          ) : null}
          {formError ? (
            <p className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
              {formError}
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
                <div className="w-full max-w-full overflow-hidden rounded-[24px] border border-[#d9e0e7] bg-[#f5f7fa] px-5 py-4 sm:px-6 lg:py-3.5">
                  <div className="relative w-full max-w-full overflow-hidden pt-10 pb-11 lg:pt-9 lg:pb-10">
                    <div className="absolute left-0 right-0 top-12 lg:top-11 h-2 rounded-full bg-[#d8e0e6]" />
                    <div
                      className="absolute top-12 lg:top-11 h-2 rounded-full bg-[#D1133A]"
                      style={{
                        left: `${minBudgetPercent}%`,
                        width: `${Math.max(maxBudgetPercent - minBudgetPercent, 0)}%`,
                      }}
                    />

                    <div
                      className="absolute top-[3.95rem] hidden -translate-x-1/2 sm:block lg:top-[3.6rem]"
                      style={{ left: `${minBudgetPercent}%` }}
                    >
                      <div className="rounded-full border border-[#f3c1cc] bg-white px-3 py-1 text-sm font-semibold text-[#17212b] shadow-[0_10px_20px_rgba(15,23,42,0.12)] whitespace-nowrap">
                        {formatBudgetSliderValue(sliderMinBudget)}
                      </div>
                    </div>
                    <div
                      className="absolute top-0 hidden -translate-x-1/2 sm:block"
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
                  <div className="mt-2 flex w-full max-w-full items-center justify-between rounded-2xl border border-[#d9e0e7] bg-white px-4 py-2 text-sm font-semibold text-[#17212b] sm:hidden">
                    <span>
                      Min: {formatCompactBudgetSliderValue(sliderMinBudget)}
                    </span>
                    <span>
                      Max: {formatCompactBudgetSliderValue(sliderMaxBudget)}
                    </span>
                  </div>
                  <div className="mt-3 flex w-full max-w-full items-center justify-between text-sm font-medium text-[#647789]">
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
                <option value="hatchback">Hatchback</option>
                <option value="suv">SUV</option>
                <option value="pickup">Pickup</option>
                <option value="van">Van</option>
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
                    className="app-input min-w-0 w-full bg-transparent py-3 text-base text-[#17212b] outline-none placeholder:text-[#7d8f9d]"
                  />
                </div>

                {brands.length ? (
                  <div className="mt-2.5 w-full max-w-full">
                    <div className="flex flex-wrap gap-2 pb-1">
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
                    className="w-full max-w-full overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 pb-1">
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
            data-card-root={helperStep === "intro" ? "true" : undefined}
            className={
              helperStep === "intro"
                ? `interactive-card-hover helper-intro-card relative ${helperIntroCardClassName} cursor-pointer rounded-[24px] border p-[1px] text-slate-100`
                : `${helperCardBaseClassName} relative z-50`
            }
            onClick={() => {
              if (helperStep === "intro") {
                setHelperQuestionIndex(0);
                setHelperStep("question");
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
                setHelperQuestionIndex(0);
                setHelperStep("question");
              }
            }}
          >
            {helperStep === "intro" ? (
              <div className="helper-intro-card-inner flex min-h-[16rem] flex-col overflow-hidden rounded-[23px] lg:h-full">
                <div className="relative flex min-h-[16rem] flex-1 overflow-hidden bg-[#091019]">
                  <Image
                    src="/define-helper-car-type.png"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 28vw, 100vw"
                    className="card-hover-image interactive-card-image object-cover object-center opacity-[0.98] brightness-[0.9] contrast-[1.04] saturate-[0.96]"
                    aria-hidden="true"
                  />
                  <div className="pointer-events-none helper-intro-strip-overlay absolute inset-0 bg-[linear-gradient(90deg,rgba(5,9,14,0.42)_0%,rgba(7,11,17,0.39)_28%,rgba(8,12,18,0.22)_52%,rgba(8,12,18,0.08)_74%,rgba(8,12,18,0.04)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,17,0.05)_0%,rgba(8,12,18,0.02)_36%,rgba(8,12,18,0.17)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(209,19,58,0.06),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(255,184,107,0.06),transparent_24%)]" />

                  <div className="relative z-10 flex w-full flex-col justify-between p-5 sm:p-6">
                    <div className="max-w-[15rem]">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D1133A]/35 bg-[#D1133A] text-white shadow-[0_0_18px_rgba(209,19,58,0.26)]">
                        <CarFront size={16} strokeWidth={2.4} />
                      </span>
                      <p className="helper-intro-kicker mt-4 text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-white/78 sm:text-[0.88rem]">
                        Need help with
                      </p>
                      <p className="mt-2 text-[2rem] font-semibold leading-[0.92] tracking-[0.02em] text-white sm:text-[2.2rem]">
                        CAR TYPE?
                      </p>
                      <div className="mt-4 h-[2px] w-10 rounded-full bg-[#D1133A]" />
                      <p className="mt-4 text-sm leading-6 text-white/82 sm:text-[0.95rem]">
                        Answer a few lifestyle questions and we&apos;ll recommend the best fit.
                      </p>
                    </div>
                    <div className="pt-6">
                      <span className="helper-intro-cta inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#D1133A] shadow-[0_12px_24px_rgba(0,0,0,0.22)] sm:text-[0.98rem]">
                        Start Car Type Guide
                        <span aria-hidden="true" className="text-base leading-none">
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {helperStep === "question" && currentHelperQuestion ? (
              <div className={`text-[#17212b] ${helperTransitioning ? "helper-question-exit" : "helper-question-enter"}`}>
                <HelperStepHeader
                  label={`Question ${helperQuestionIndex + 1} of ${helperQuestions.length}`}
                  onBack={
                    helperQuestionIndex === 0
                      ? undefined
                      : () => setHelperQuestionIndex((current) => Math.max(current - 1, 0))
                  }
                  onClose={helperQuestionIndex === 0 ? resetHelper : undefined}
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#111827]">
                  {currentHelperQuestion.prompt}
                </h2>
                <div className="mt-6 grid gap-3">
                  {currentHelperQuestion.options.map((option) => {
                    const isSelected =
                      helperPendingSelection === option.id ||
                      helperAnswers[currentHelperQuestion.key] === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={helperTransitioning}
                        onClick={() => {
                          const nextAnswers = {
                            ...helperAnswers,
                            [currentHelperQuestion.key]: option.id,
                          };
                          setHelperAnswers(nextAnswers);
                          runHelperTransition(option.id, () => {
                            if (helperQuestionIndex === helperQuestions.length - 1) {
                              setHelperStep("result");
                              return;
                            }

                            setHelperQuestionIndex((current) => current + 1);
                          });
                        }}
                        className={`${helperOptionButtonClass} ${
                          isSelected
                            ? "helper-option-selected scale-95 border-transparent bg-[#D1133A] text-white ring-2 ring-red-300"
                            : helperTransitioning
                              ? "opacity-55"
                              : ""
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <Check size={18} strokeWidth={2.6} className="shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {helperStep === "result" && helperResult ? (
              <div className="helper-question-enter text-[#17212b]">
                <HelperStepHeader label="Recommendation ready" onClose={resetHelper} />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#dbe5dc]">
                  <div
                    className="h-full rounded-full bg-[#5e8a72] transition-[width] duration-300"
                    style={{ width: buyerGuideProgressWidth }}
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full border border-[#d3dde6] bg-[#f2f6f9] px-4 py-2 text-sm font-semibold text-[#4B5563]">
                    Confidence {helperResult.confidencePercent}%
                  </span>
                  <span className="text-sm font-medium text-[#6b7280]">
                    Winning score {helperResult.bestScore} / {HELPER_CONFIDENCE_MAX_SCORE}
                  </span>
                </div>
                <div className="mt-5 rounded-[24px] border border-[#d3dde6] bg-[#f8fafc] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                    Your Best Match
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#111827]">
                    {helperResult.bestTypeLabel}
                  </h2>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                    Also Consider
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#17212b]">
                    {helperResult.alsoConsiderLabel}
                  </p>
                </div>
                <div className="mt-5 rounded-[24px] border border-[#d3dde6] bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                    Why it fits
                  </p>
                  <ul className="mt-4 space-y-3">
                    {helperResult.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-base leading-7 text-[#4B5563]">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D1133A]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 rounded-[24px] border border-[#d3dde6] bg-[#f2f6f9] p-5">
                  <p className="text-sm text-[#5f7384]">Apply to Define</p>
                  <p className="mt-2 text-lg font-semibold text-[#17212b]">
                    {helperResult.applyTypeLabel}
                  </p>
                  <p className="mt-3 text-sm text-[#425466]">
                    We&apos;ll use this as your starting filter in Define so your matches reflect the recommendation.
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
                    onClick={() => {
                      setHelperQuestionIndex(0);
                      setHelperStep("question");
                    }}
                    className={helperSecondaryButtonClass}
                  >
                    Adjust my answers
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section
            data-card-root={budgetHelperStep === "intro" ? "true" : undefined}
            className={
              budgetHelperStep === "intro"
                ? `interactive-card-hover helper-intro-card relative rounded-[24px] ${helperIntroCardClassName} cursor-pointer border p-[1px] text-slate-100`
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
                <div className="relative flex min-h-[16.5rem] flex-1 overflow-hidden bg-[#0a1018]">
                  <Image
                    src="/define-helper-budget.png"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 28vw, 100vw"
                    className="card-hover-image interactive-card-image object-cover object-center opacity-[0.98] brightness-[0.88] contrast-[1.04] saturate-[0.92]"
                    aria-hidden="true"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,9,14,0.42)_0%,rgba(7,11,17,0.39)_28%,rgba(8,12,18,0.23)_52%,rgba(8,12,18,0.09)_74%,rgba(8,12,18,0.04)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,17,0.05)_0%,rgba(8,12,18,0.025)_34%,rgba(8,11,17,0.19)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(209,19,58,0.05),transparent_28%),radial-gradient(circle_at_84%_22%,rgba(255,170,94,0.06),transparent_24%)]" />

                  <div className="relative z-10 flex w-full flex-col justify-between p-5 sm:p-6">
                    <div className="max-w-[15.25rem]">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D1133A]/35 bg-[#D1133A] text-white shadow-[0_0_18px_rgba(209,19,58,0.26)]">
                        <DollarSign size={16} strokeWidth={2.4} />
                      </span>
                      <p className="helper-intro-kicker mt-4 text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-white/78 sm:text-[0.88rem]">
                        Need help with
                      </p>
                      <p className="mt-2 text-[2rem] font-semibold leading-[0.92] tracking-[0.02em] text-white sm:text-[2.2rem]">
                        BUDGET?
                      </p>
                      <div className="mt-4 h-[2px] w-10 rounded-full bg-[#D1133A]" />
                      <p className="mt-4 text-sm leading-6 text-white/82 sm:text-[0.95rem]">
                        Start with a price range that feels right and we&apos;ll build from there.
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4 pt-6">
                      <span className="helper-intro-cta inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#D1133A] shadow-[0_12px_24px_rgba(0,0,0,0.22)] sm:text-[0.98rem]">
                        Start Budget Helper
                        <span aria-hidden="true" className="text-base leading-none">
                          →
                        </span>
                      </span>

                      <div className="w-full max-w-[8.5rem] rounded-[18px] border border-white/12 bg-black/22 px-3 py-2 backdrop-blur-sm">
                        <div className="relative h-1.5 rounded-full bg-white/18">
                          <div className="absolute inset-y-0 left-[20%] right-[14%] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_0%,rgba(209,19,58,0.88)_52%,rgba(255,227,195,0.56)_100%)]" />
                          <div className="absolute left-[68%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffb4c0]/70 bg-[#D1133A] shadow-[0_0_18px_rgba(209,19,58,0.38)]" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[0.68rem] font-semibold text-white/78">
                          <span>$120k</span>
                          <span>$250k</span>
                        </div>
                      </div>
                    </div>
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
