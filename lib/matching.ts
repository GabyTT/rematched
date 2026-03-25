import type { CarJourneyState, Preferences } from "@/components/JourneyProvider";
import type { Car } from "@/lib/cars";

export const NEAR_BUDGET_BUFFER = 10000;

const normalize = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? "";
const normalizeBrands = (brands: string[] | null | undefined) =>
  (brands ?? []).map((brand) => normalize(brand)).filter(Boolean);

const hasAvailabilityField = (car: Car) =>
  "isActive" in car || "availability" in car || "status" in car;

export function hasValidBudgetRange(preferences: Preferences) {
  return (
    preferences.minBudget !== null &&
    preferences.maxBudget !== null &&
    preferences.minBudget <= preferences.maxBudget
  );
}

export function getBudgetDistanceFromRange(
  priceValue: number,
  preferences: Preferences,
) {
  if (!hasValidBudgetRange(preferences) || !Number.isFinite(priceValue)) {
    return Number.POSITIVE_INFINITY;
  }

  if (priceValue < preferences.minBudget!) {
    return preferences.minBudget! - priceValue;
  }

  if (priceValue > preferences.maxBudget!) {
    return priceValue - preferences.maxBudget!;
  }

  return 0;
}

export function carMatchesBudgetRange(car: Car, preferences: Preferences) {
  if (!hasValidBudgetRange(preferences)) {
    return true;
  }

  return (
    Number.isFinite(car.priceValue) &&
    car.priceValue >= preferences.minBudget! &&
    car.priceValue <= preferences.maxBudget!
  );
}

export function carMatchesNearBudgetRange(car: Car, preferences: Preferences) {
  if (!hasValidBudgetRange(preferences) || !Number.isFinite(car.priceValue)) {
    return false;
  }

  if (carMatchesBudgetRange(car, preferences)) {
    return false;
  }

  const lowerBound = Math.max(preferences.minBudget! - NEAR_BUDGET_BUFFER, 0);
  const upperBound = preferences.maxBudget! + NEAR_BUDGET_BUFFER;

  return car.priceValue >= lowerBound && car.priceValue <= upperBound;
}

export function carMatchesNonBudgetPreferences(
  car: Car,
  preferences: Preferences,
) {
  const normalizedVehicleType = normalize(preferences.vehicleType);
  const normalizedBrands = normalizeBrands(preferences.brand);
  const normalizedModel = normalize(preferences.model);
  const normalizedCarVehicleType = normalize(car.vehicleType);
  const normalizedCarBrand = normalize(car.brand);
  const normalizedCarModel = normalize(car.model);

  const matchesVehicleType =
    normalizedVehicleType === "" || normalizedVehicleType === "all"
      ? true
      : normalizedCarVehicleType === normalizedVehicleType;
  const matchesBrand =
    normalizedBrands.length === 0
      ? true
      : normalizedBrands.includes(normalizedCarBrand);
  const matchesModel =
    normalizedModel === "" ? true : normalizedCarModel.includes(normalizedModel);

  return matchesVehicleType && matchesBrand && matchesModel;
}

export function hasUsablePreferences(preferences: Preferences) {
  const normalizedVehicleType = normalize(preferences.vehicleType);
  const normalizedBrands = normalizeBrands(preferences.brand);
  const normalizedModel = normalize(preferences.model);

  return (
    hasValidBudgetRange(preferences) ||
    (normalizedVehicleType !== "" && normalizedVehicleType !== "all") ||
    normalizedBrands.length > 0 ||
    normalizedModel !== ""
  );
}

export function carIsAvailable(car: Car) {
  if (!hasAvailabilityField(car)) {
    return true;
  }

  const maybeActive = car as Car & {
    availability?: string | null;
    isActive?: boolean | null;
    status?: string | null;
  };

  if (maybeActive.isActive === false) {
    return false;
  }

  const availability = normalize(maybeActive.availability);
  const status = normalize(maybeActive.status);

  return !["inactive", "sold", "unavailable"].includes(availability) &&
    !["inactive", "sold", "unavailable"].includes(status);
}

export function carMatchesPreferences(car: Car, preferences: Preferences) {
  if (!hasUsablePreferences(preferences)) {
    return false;
  }

  return (
    carMatchesBudgetRange(car, preferences) &&
    carMatchesNonBudgetPreferences(car, preferences)
  );
}

export function getDiscoverableCars(
  allCars: Car[],
  preferences: Preferences,
  carProgress: Record<
    string,
    {
      state: CarJourneyState;
    }
  >,
) {
  return allCars.filter((car) => {
    if (!carIsAvailable(car)) {
      return false;
    }

    if (carProgress[car.id]?.state !== null) {
      return false;
    }

    return carMatchesPreferences(car, preferences);
  });
}
