"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { cars as mockCars, type Car } from "@/lib/cars";
import { clearGuestEngagement, trackGuestAction } from "@/lib/guestEngagement";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type UserRole = "seller" | "advertiser" | "admin";

function logRoleLoadingError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  // Next.js surfaces console.error calls as a full-page development overlay.
  // Role lookup failure is handled below by withholding elevated access, so keep
  // the diagnostic visible without treating it as an uncaught application error.
  console.warn("Unable to load account roles", {
    message: error.message ?? "Unknown Supabase error",
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

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
  isAuthReady: boolean;
  roles: UserRole[];
  hasRole: (role: UserRole) => boolean;
  isUnlockAlertsModalOpen: boolean;
  updateActiveInventoryCars: (cars: Car[]) => void;
  openUnlockAlertsModal: () => void;
  setCarState: (carId: string, state: CarJourneyState) => void;
  replaceEarliestTopPick: (carId: string) => void;
  resetBuyerJourney: () => Promise<void>;
  updateCarNotes: (carId: string, notes: string) => void;
  toggleCompareCar: (carId: string) => void;
  clearCompareCars: () => void;
  updatePreferences: (next: Partial<Preferences>) => void;
  closeUnlockAlertsModal: () => void;
  markAuthenticated: (user: User) => void;
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
const DEFINE_ATTENTION_KEY = "revmatched.define-attention";
const DISCOVER_PREFERENCES_HANDOFF_KEY = "revmatched.discover-preferences-handoff";
const MOCK_CAR_ORDER_BY_ID = new Map(mockCars.map((car, index) => [car.id, index]));

const createDefaultCarProgress = (): CarProgress => ({
  state: null,
  notes: "",
  matchedAt: null,
  likedAt: null,
  passedAt: null,
  topPickedAt: null,
});

const isAvailableForBuyerAction = (car: Car | undefined) => {
  const status = car?.availabilityStatus?.trim().toLowerCase();
  return !["sold", "unavailable", "inactive"].includes(status ?? "");
};

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

export function JourneyProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [activeInventoryCars, setActiveInventoryCars] = useState<Car[]>(mockCars);
  const [preferences, setPreferences] = useState(getStoredPreferences);
  const [carProgress, setCarProgress] = useState(getStoredProgress);
  const [compareCarIds, setCompareCarIds] = useState<string[]>(
    getStoredCompareCars,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isUnlockAlertsModalOpen, setIsUnlockAlertsModalOpen] = useState(false);
  const authSyncVersionRef = useRef(0);
  const activeCarOrderById = useMemo(
    () => new Map(activeInventoryCars.map((car, index) => [car.id, index])),
    [activeInventoryCars],
  );
  const activeInventoryCarIds = useMemo(
    () => new Set(activeInventoryCars.map((car) => car.id)),
    [activeInventoryCars],
  );
  const isActiveTopPick = useCallback(
    (carId: string) => {
      const car = activeInventoryCars.find((candidate) => candidate.id === carId);
      return isAvailableForBuyerAction(car);
    },
    [activeInventoryCars],
  );

  useEffect(() => {
    let isActive = true;

    const syncAuthState = async (sessionUser?: User | null) => {
      const syncVersion = ++authSyncVersionRef.current;
      const user =
        sessionUser === undefined
          ? (await supabase.auth.getUser()).data.user
          : sessionUser;

      if (!isActive || syncVersion !== authSyncVersionRef.current) return;
      setIsAuthenticated(Boolean(user));
      setIsUnlockAlertsModalOpen(false);

      if (!user) {
        setRoles([]);
        setIsAuthReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!isActive || syncVersion !== authSyncVersionRef.current) return;
      if (error) {
        logRoleLoadingError(error);
        setRoles([]);
        setIsAuthReady(true);
        return;
      }

      setRoles(
        (data ?? [])
          .map((assignment) => assignment.role)
          .filter((role): role is UserRole =>
            role === "seller" || role === "advertiser" || role === "admin",
          ),
      );
      setIsAuthReady(true);
    };

    void syncAuthState();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void syncAuthState(session?.user ?? null);
      }, 0);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const persistProgress = (next: Record<string, CarProgress>) => {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    const likedIds = Object.entries(next)
      .filter(([, value]) => value.state === "liked")
      .map(([carId]) => carId);
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds));
  };

  const updateActiveInventoryCars = useCallback((nextCars: Car[]) => {
    setActiveInventoryCars((currentCars) => {
      const inventorySignature = (cars: Car[]) =>
        cars
          .map((car) => `${car.id}:${car.availabilityStatus ?? "available"}:${car.soldAt ?? ""}`)
          .join("|");
      const currentSignature = inventorySignature(currentCars);
      const nextSignature = inventorySignature(nextCars);

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
    const targetCar = activeInventoryCars.find((car) => car.id === carId);
    if (
      (state === "liked" || state === "matched") &&
      !isAvailableForBuyerAction(targetCar)
    ) {
      return;
    }

    const previousState = carProgress[carId]?.state ?? null;
    const currentMatchedCount = Object.entries(carProgress).filter(
      ([id, value]) =>
        activeInventoryCarIds.has(id) &&
        isActiveTopPick(id) &&
        value.state === "matched" &&
        id !== carId,
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
    if (!isAvailableForBuyerAction(activeInventoryCars.find((car) => car.id === carId))) {
      return;
    }

    const previousState = carProgress[carId]?.state ?? null;
    const actionTimestamp = new Date().toISOString();
    const removedTopPickId =
      Object.entries(carProgress)
        .filter(
          ([id, value]) =>
            activeInventoryCarIds.has(id) &&
            isActiveTopPick(id) &&
            value.state === "matched" &&
            id !== carId,
        )
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

  const resetBuyerJourney = useCallback(async () => {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Buyer journey reset is available only in development.");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Sign in with a test account before resetting its buyer journey.");
    }

    const response = await fetch("/api/development/reset-buyer-journey", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to reset this buyer journey.");
    }

    const freshProgress = Object.fromEntries(
      activeInventoryCars.map((car) => [car.id, createDefaultCarProgress()]),
    ) as Record<string, CarProgress>;

    setPreferences(defaultPreferences);
    setCarProgress(freshProgress);
    setCompareCarIds([]);
    setIsUnlockAlertsModalOpen(false);
    window.localStorage.removeItem(PREFERENCES_KEY);
    window.localStorage.removeItem(PROGRESS_KEY);
    window.localStorage.removeItem(LIKES_KEY);
    window.localStorage.removeItem(COMPARE_KEY);
    window.sessionStorage.removeItem(DEFINE_ATTENTION_KEY);
    window.sessionStorage.removeItem(DISCOVER_PREFERENCES_HANDOFF_KEY);
    clearGuestEngagement();
  }, [activeInventoryCars, supabase]);

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

  const markAuthenticated = (user: User) => {
    // A completed sign-in supplies the authoritative user. Invalidate an
    // earlier anonymous lookup so it cannot overwrite the newly signed-in UI.
    authSyncVersionRef.current += 1;
    setIsAuthenticated(Boolean(user));
    setIsAuthReady(true);
    setIsUnlockAlertsModalOpen(false);
  };

  const logOut = () => {
    // The Supabase sign-out event updates account state.
    setIsUnlockAlertsModalOpen(false);
  };

  const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);

  return (
    <JourneyContext.Provider
      value={{
        activeInventoryCars,
        carProgress,
        compareCarIds,
        preferences,
        isAuthenticated,
        isAuthReady,
        roles,
        hasRole,
        isUnlockAlertsModalOpen,
        updateActiveInventoryCars,
        openUnlockAlertsModal,
        setCarState,
        replaceEarliestTopPick,
        resetBuyerJourney,
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
