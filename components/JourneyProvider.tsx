"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cars } from "@/lib/cars";

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
};

type StoredCarJourneyState = CarJourneyState | "discover" | "none";

type StoredCarProgress = Omit<CarProgress, "state"> & {
  state: StoredCarJourneyState;
};

type JourneyContextValue = {
  carProgress: Record<string, CarProgress>;
  compareCarIds: string[];
  preferences: Preferences;
  isAuthenticated: boolean;
  isUnlockAlertsModalOpen: boolean;
  setCarState: (carId: string, state: CarJourneyState) => void;
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
const SESSION_LIKE_COUNT_KEY = "revmatched.session-like-count";
const SESSION_UNLOCK_MODAL_SHOWN_KEY = "revmatched.session-unlock-modal-shown";

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
  cars.reduce<Record<string, CarProgress>>((result, car) => {
    result[car.id] = {
      state: null,
      notes: "",
    };
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
          state:
            value.state === "discover" || value.state === "none"
              ? null
              : value.state,
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

const getSessionLikeCount = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const savedLikeCount = window.sessionStorage.getItem(SESSION_LIKE_COUNT_KEY);
  return savedLikeCount ? Number(savedLikeCount) || 0 : 0;
};

const getSessionUnlockModalShown = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.sessionStorage.getItem(SESSION_UNLOCK_MODAL_SHOWN_KEY) === "true"
  );
};

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(getStoredPreferences);
  const [carProgress, setCarProgress] = useState(getStoredProgress);
  const [compareCarIds, setCompareCarIds] = useState<string[]>(
    getStoredCompareCars,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuthState);
  const [, setGuestSessionLikeCount] = useState(
    getSessionLikeCount,
  );
  const [hasShownUnlockAlertsModalThisSession, setHasShownUnlockAlertsModalThisSession] =
    useState(getSessionUnlockModalShown);
  const [isUnlockAlertsModalOpen, setIsUnlockAlertsModalOpen] = useState(false);

  const persistProgress = (next: Record<string, CarProgress>) => {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    const likedIds = Object.entries(next)
      .filter(([, value]) => value.state === "liked")
      .map(([carId]) => carId);
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds));
  };

  const setCarState = (carId: string, state: CarJourneyState) => {
    const previousState = carProgress[carId]?.state ?? null;

    setCarProgress((current) => {
      const currentMatchedCount = Object.entries(current).filter(
        ([id, value]) => value.state === "matched" && id !== carId,
      ).length;
      const nextState =
        state === "matched" && previousState !== "matched" && currentMatchedCount >= 3
          ? previousState
          : state;
      const next = {
        ...current,
        [carId]: {
          ...current[carId],
          state: nextState,
        },
      };
      persistProgress(next);
      return next;
    });

    setGuestSessionLikeCount((current) => {
      if (
        isAuthenticated ||
        state !== "liked" ||
        previousState === "liked"
      ) {
        return current;
      }

      const next = current + 1;
      window.sessionStorage.setItem(SESSION_LIKE_COUNT_KEY, String(next));

      if (next >= 4 && !hasShownUnlockAlertsModalThisSession) {
        setIsUnlockAlertsModalOpen(true);
        setHasShownUnlockAlertsModalThisSession(true);
        window.sessionStorage.setItem(SESSION_UNLOCK_MODAL_SHOWN_KEY, "true");
      }

      return next;
    });

    if (state === "liked" && previousState !== "liked") {
      window.dispatchEvent(new Event("revmatched:liked-step-pulse"));
    }

    if (state !== "matched") {
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

  const updateCarNotes = (carId: string, notes: string) => {
    setCarProgress((current) => {
      const next = {
        ...current,
        [carId]: {
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
        carProgress,
        compareCarIds,
        preferences,
        isAuthenticated,
        isUnlockAlertsModalOpen,
        setCarState,
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
