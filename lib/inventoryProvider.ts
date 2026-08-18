import type { SupabaseClient } from "@supabase/supabase-js";

import { cars as mockCars, type Car } from "./cars.ts";
import type { Database } from "./database.types.ts";
import { readBuyerVisibleInventoryCars } from "./buyerInventory.ts";

type TypedSupabaseClient = SupabaseClient<Database>;
type InventoryLoader = (supabase: TypedSupabaseClient) => Promise<Car[]>;

export type InventoryLoadResult = {
  source: "supabase" | "mock";
  cars: Car[];
  error?: string;
};

type InventoryLoadOptions = {
  loader?: InventoryLoader;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unable to load Supabase inventory.";
}

export async function loadInventoryWithFallback(
  supabase: TypedSupabaseClient | null | undefined,
  options: InventoryLoadOptions = {},
): Promise<InventoryLoadResult> {
  if (!supabase) {
    return {
      source: "mock",
      cars: mockCars,
      error: "Supabase client unavailable.",
    };
  }

  const loader = options.loader ?? readBuyerVisibleInventoryCars;

  try {
    const supabaseCars = await loader(supabase);

    if (supabaseCars.length === 0) {
      return {
        source: "mock",
        cars: mockCars,
        error: "Supabase inventory returned no buyer-visible cars.",
      };
    }

    return {
      source: "supabase",
      cars: supabaseCars,
    };
  } catch (error) {
    return {
      source: "mock",
      cars: mockCars,
      error: getErrorMessage(error),
    };
  }
}
