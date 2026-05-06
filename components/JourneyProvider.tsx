"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cars as mockCars, type Car } from "@/lib/cars";
import { trackGuestAction } from "@/lib/guestEngagement";

export type Preferences = {
  minBudget: number | null;
  maxBudget: number | null;
  vehicleType: string;
  brand: string[];
  model: string;
};

export type CarJourneyState = null | "liked" | "matched" | "rejected";

type CarProgress = {
  state: CarJourneyState;
  notes: string;
  matchedAt: number | null;
  likedAt?: string | null;
  passedAt?: string | null;
  topPickedAt?: string | null;
};

type StoredCarJourneyState = CarJourneyState | "discover" | "none";

type StoredCarProgress = Omit<CarProgress, "state"> & {
  state: StoredCarJourneyState;
};

type JourneyContextValue = {
  activeInventoryCars: Car[];
  carProgress: Record<string, CarProgress>;
  compareCarIds: string[];
  preferences: Preferences;
  isAuthenticated: boolean;
  isUnlockAlertsModalOpen: boolean;
  updateActiveInventoryCars: (cars: Car[]) => void;
  openUnlockAlertsModal: () => void;
  setCarState: (carId: string, state: CarJourneyState) => void;
  replaceEarliestTopPick: (carId: string) => void;
  resetCarStatuses: () => void;
  resetJourneyData: () => void;
  updateCarNotes: (carId: string, notes: string) => void;
  toggleCompareCar: (carId: string) => void;
  clearCompareCars: () => void;
  updatePreferences: (next: Partial<Preferences>) => void;
  closeUnlockAlertsModal: () => void;
  markAuthenticated: () => void;
  logOut: () => void;
};

const defaultPreferences: Preferences = {
  minBudget: null,
  maxBudget: null,
  vehicleType: "",
  brand: [],
  model: "",
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

const PREFERENCES_KEY = "revmatched.preferences";
const LIKES_KEY = "revmatched.likes";
const PROGRESS_KEY = "revmatched.car-progress";
const COMPARE_KEY = "revmatched.compare";
const AUTH_KEY = "revmatched.authenticated";
const MOCK_CAR_ORDER_BY_ID = new Map(mockCars.map((car, index) => [car.id, index]));

const createDefaultCarProgress = (): CarProgress => ({
  state: null,
  notes: "",
  matchedAt: null,
  likedAt: null,
  passedAt: null,
  topPickedAt: null,
});

const getStoredPreferences = () => {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  const savedPreferences = window.localStorage.getItem(PREFERENCES_KEY);

  if (!savedPreferences) {
    return defaultPreferences;
  }

  const parsed = JSON.parse(savedPreferences) as Omit<Partial<Preferences>, "brand"> & {
    brand?: string | string[];
  };
  const minBudget =
    typeof parsed.minBudget === "number" && Number.isFinite(parsed.minBudget)
      ? parsed.minBudget
      : null;
  const maxBudget =
    typeof parsed.maxBudget === "number" && Number.isFinite(parsed.maxBudget)
      ? parsed.maxBudget
      : null;

  return {
    ...defaultPreferences,
    ...parsed,
    minBudget,
    maxBudget,
    brand: Array.isArray(parsed.brand)
      ? parsed.brand
      : typeof parsed.brand === "string" && parsed.brand.trim() !== ""
        ? [parsed.brand]
        : [],
  };
};

const getStoredLikes = () => {
  if (typeof window === "undefined") {
    return [];
  }

  const savedLikes = window.localStorage.getItem(LIKES_KEY);
  return savedLikes ? (JSON.parse(savedLikes) as string[]) : [];
};

const getDefaultProgress = () =>
  mockCars.reduce<Record<string, CarProgress>>((result, car) => {
    result[car.id] = createDefaultCarProgress();
    return result;
  }, {});

const getStoredProgress = () => {
  const defaults = getDefaultProgress();

  if (typeof window === "undefined") {
    return defaults;
  }

  const savedProgress = window.localStorage.getItem(PROGRESS_KEY);

  if (savedProgress) {
    const parsed = JSON.parse(savedProgress) as Record<string, StoredCarProgress>;
    const normalized = Object.fromEntries(
      Object.entries(parsed).map(([carId, value]) => [
        carId,
        {
          ...value,
          likedAt: typeof value.likedAt === "string" ? value.likedAt : null,
          matchedAt:
            typeof value.matchedAt === "number" &&
            Number.isFinite(value.matchedAt)
              ? value.matchedAt
              : null,
          passedAt: typeof value.passedAt === "string" ? value.passedAt : null,
          state:
            value.state === "discover" || value.state === "none"
              ? null
              : value.state,
          topPickedAt:
            typeof value.topPickedAt === "string" ? value.topPickedAt : null,
        },
      ]),
    ) as Record<string, CarProgress>;

    return {
      ...defaults,
      ...normalized,
    };
  }

  const legacyLikes = getStoredLikes();

  if (!legacyLikes.length) {
    return defaults;
  }

  return legacyLikes.reduce<Record<string, CarProgress>>((result, carId) => {
    if (result[carId]) {
      result[carId] = {
        ...result[carId],
        state: "liked",
      };
    }

    return result;
  }, defaults);
};

const getStoredCompareCars = () => {
  if (typeof window === "undefined") {
    return [];
  }

  const savedCompareIds = window.localStorage.getItem(COMPARE_KEY);
  return savedCompareIds ? (JSON.parse(savedCompareIds) as string[]) : [];
};

const getStoredAuthState = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTH_KEY) === "true";
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [activeInventoryCars, setActiveInventoryCars] = useState<Car[]>(mockCars);
  const [preferences, setPreferences] = useState(getStoredPreferences);
  const [carProgress, setCarProgress] = useState(getStoredProgress);
  const [compareCarIds, setCompareCarIds] = useState<string[]>(
    getStoredCompareCars,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuthState);
  const [isUnlockAlertsModalOpen, setIsUnlockAlertsModalOpen] = useState(false);
  const activeCarOrderById = useMemo(
    () => new Map(activeInventoryCars.map((car, index) => [car.id, index])),
    [activeInventoryCars],
  );

  const persistProgress = (next: Record<string, CarProgress>) => {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    const likedIds = Object.entries(next)
      .filter(([, value]) => value.state === "liked")
      .map(([carId]) => carId);
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds));
  };

  const updateActiveInventoryCars = useCallback((nextCars: Car[]) => {
    setActiveInventoryCars((currentCars) => {
      const currentSignature = currentCars.map((car) => car.id).join("|");
      const nextSignature = nextCars.map((car) => car.id).join("|");

      if (currentSignature === nextSignature) {
        return currentCars;
      }

      return nextCars;
    });

    setCarProgress((current) => {
      let changed = false;
      const next = { ...current };

      nextCars.forEach((car) => {
        if (!next[car.id]) {
          next[car.id] = createDefaultCarProgress();
          changed = true;
        }
      });

      if (changed) {
        persistProgress(next);
      }

      return changed ? next : current;
    });
  }, []);

  const setCarState = (carId: string, state: CarJourneyState) => {
    const previousState = carProgress[carId]?.state ?? null;
    const currentMatchedCount = Object.entries(carProgress).filter(
      ([id, value]) => value.state === "matched" && id !== carId,
    ).length;
    const nextState =
      state === "matched" && previousState !== "matched" && currentMatchedCount >= 3
        ? previousState
        : state;
    const actionTimestamp = new Date().toISOString();

    setCarProgress((current) => {
      const next = {
        ...current,
        [carId]: {
          ...createDefaultCarProgress(),
          ...current[carId],
          state: nextState,
          matchedAt:
            nextState === "matched"
              ? previousState === "matched"
                ? current[carId]?.matchedAt ?? Date.now()
                : Date.now()
              : null,
          likedAt:
            nextState === "liked" ? actionTimestamp : current[carId]?.likedAt ?? null,
          passedAt:
            nextState === "rejected" ? actionTimestamp : current[carId]?.passedAt ?? null,
          topPickedAt:
            nextState === "matched"
              ? actionTimestamp
              : current[carId]?.topPickedAt ?? null,
        },
      };
      persistProgress(next);
      return next;
    });

    if (nextState !== previousState) {
      if (!isAuthenticated) {
        trackGuestAction();
      }

      if (nextState === "liked" && previousState !== "liked") {
        window.dispatchEvent(
          new CustomEvent("revmatched:roadmap-transition", {
            detail: {
              from: previousState === "matched" ? "match" : "discover",
              to: "like",
            },
          }),
        );
      }

      if (nextState === "matched" && previousState === "liked") {
        window.dispatchEvent(
          new CustomEvent("revmatched:roadmap-transition", {
            detail: {
              from: "like",
              to: "match",
            },
          }),
        );
      }
    }

    if (nextState !== "matched") {
      setCompareCarIds((current) => {
        if (!current.includes(carId)) {
          return current;
        }

        const next = current.filter((id) => id !== carId);
        window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        return next;
      });
    }
  };

  const replaceEarliestTopPick = (carId: string) => {
    const previousState = carProgress[carId]?.state ?? null;
    const actionTimestamp = new Date().toISOString();
    const removedTopPickId =
      Object.entries(carProgress)
        .filter(([id, value]) => value.state === "matched" && id !== carId)
        .sort(([firstId, firstValue], [secondId, secondValue]) => {
          const firstMatchedAt = firstValue.matchedAt ?? Number.MAX_SAFE_INTEGER;
          const secondMatchedAt = secondValue.matchedAt ?? Number.MAX_SAFE_INTEGER;

          if (firstMatchedAt !== secondMatchedAt) {
            return firstMatchedAt - secondMatchedAt;
          }

          return (
            (activeCarOrderById.get(firstId) ??
              MOCK_CAR_ORDER_BY_ID.get(firstId) ??
              Number.MAX_SAFE_INTEGER) -
            (activeCarOrderById.get(secondId) ??
              MOCK_CAR_ORDER_BY_ID.get(secondId) ??
              Number.MAX_SAFE_INTEGER)
          );
        })[0]?.[0] ?? null;

    setCarProgress((current) => {
      const currentState = current[carId]?.state ?? null;

      if (currentState === "matched") {
        return current;
      }

      const next = {
        ...current,
      };

      if (removedTopPickId) {
        next[removedTopPickId] = {
          ...createDefaultCarProgress(),
          ...current[removedTopPickId],
          state: "liked",
          matchedAt: null,
          likedAt: actionTimestamp,
        };
      }

      next[carId] = {
        ...createDefaultCarProgress(),
        ...current[carId],
        state: "matched",
        matchedAt: Date.now(),
        topPickedAt: actionTimestamp,
      };

      persistProgress(next);
      return next;
    });

    if (removedTopPickId) {
      setCompareCarIds((current) => {
        if (!current.includes(removedTopPickId as string)) {
          return current;
        }

        const next = current.filter((id) => id !== removedTopPickId);
        window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        return next;
      });
    }

    if (previousState !== "matched") {
      if (!isAuthenticated) {
        trackGuestAction();
      }

      window.dispatchEvent(
        new CustomEvent("revmatched:roadmap-transition", {
          detail: {
            from: previousState === "liked" ? "like" : "discover",
            to: "match",
          },
        }),
      );
    }
  };

  const updateCarNotes = (carId: string, notes: string) => {
    setCarProgress((current) => {
      const next = {
        ...current,
        [carId]: {
          ...createDefaultCarProgress(),
          ...current[carId],
          notes,
        },
      };
      persistProgress(next);
      return next;
    });
  };

  const resetCarStatuses = () => {
    setCarProgress((current) => {
      const next = Object.fromEntries(
        Object.entries(current).map(([carId, value]) => [
          carId,
          {
            ...value,
            state: null,
            matchedAt: null,
          },
        ]),
      ) as Record<string, CarProgress>;

      persistProgress(next);
      return next;
    });

    setCompareCarIds(() => {
      window.localStorage.setItem(COMPARE_KEY, JSON.stringify([]));
      return [];
    });
  };

  const resetJourneyData = () => {
    resetCarStatuses();
    setPreferences(defaultPreferences);
    window.localStorage.removeItem(PREFERENCES_KEY);
  };

  const toggleCompareCar = (carId: string) => {
    setCompareCarIds((current) => {
      const next = current.includes(carId)
        ? current.filter((id) => id !== carId)
        : current.length < 3
          ? [...current, carId]
          : current;
      window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearCompareCars = () => {
    setCompareCarIds(() => {
      window.localStorage.setItem(COMPARE_KEY, JSON.stringify([]));
      return [];
    });
  };

  const updatePreferences = (next: Partial<Preferences>) => {
    setPreferences((current) => {
      const updated = { ...current, ...next };
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const closeUnlockAlertsModal = () => {
    setIsUnlockAlertsModalOpen(false);
  };

  const openUnlockAlertsModal = () => {
    setIsUnlockAlertsModalOpen(true);
  };

  const markAuthenticated = () => {
    setIsAuthenticated(true);
    window.localStorage.setItem(AUTH_KEY, "true");
    setIsUnlockAlertsModalOpen(false);
  };

  const logOut = () => {
    setIsAuthenticated(false);
    window.localStorage.removeItem(AUTH_KEY);
    setIsUnlockAlertsModalOpen(false);
  };

  return (
    <JourneyContext.Provider
      value={{
        activeInventoryCars,
        carProgress,
        compareCarIds,
        preferences,
        isAuthenticated,
        isUnlockAlertsModalOpen,
        updateActiveInventoryCars,
        openUnlockAlertsModal,
        setCarState,
        replaceEarliestTopPick,
        resetCarStatuses,
        resetJourneyData,
        updateCarNotes,
        toggleCompareCar,
        clearCompareCars,
        updatePreferences,
        closeUnlockAlertsModal,
        markAuthenticated,
        logOut,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);

  if (!context) {
    throw new Error("useJourney must be used within a JourneyProvider");
  }

  return context;
}
