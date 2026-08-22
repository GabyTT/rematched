import { strict as assert } from "node:assert";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Car } from "../lib/cars";
import { cars as mockCars } from "../lib/cars";
import type { Database } from "../lib/database.types";
import { loadInventoryWithFallback } from "../lib/inventoryProvider";

type TypedSupabaseClient = SupabaseClient<Database>;

const fakeSupabase = {} as TypedSupabaseClient;
const supabaseCar: Car = {
  id: "supabase-visible-car",
  name: "2020 Toyota Corolla",
  year: 2020,
  make: "Toyota",
  price: "$118,000 TTD",
  priceValue: 118000,
  mileage: "65,000 km",
  fuel: "Gasoline",
  transmission: "Automatic",
  location: "San Fernando",
  category: "Sedan",
  vehicleType: "sedan",
  brand: "Toyota",
  model: "Corolla",
  image: "https://example.test/corolla.jpg",
  ingestionListingId: "raw-supabase-visible-car",
};

async function main() {
  const supabaseResult = await loadInventoryWithFallback(fakeSupabase, {
    loader: async () => [supabaseCar],
  });

  assert.equal(supabaseResult.source, "supabase");
  assert.deepEqual(supabaseResult.cars, [supabaseCar]);
  assert.equal(supabaseResult.error, undefined);

  const emptyResult = await loadInventoryWithFallback(fakeSupabase, {
    loader: async () => [],
  });

  assert.equal(emptyResult.source, "mock");
  assert.equal(emptyResult.cars, mockCars);
  assert.equal(
    emptyResult.error,
    "Supabase inventory returned no buyer-visible cars.",
  );

  const errorResult = await loadInventoryWithFallback(fakeSupabase, {
    loader: async () => {
      throw new Error("Local Supabase is offline.");
    },
  });

  assert.equal(errorResult.source, "mock");
  assert.equal(errorResult.cars, mockCars);
  assert.equal(errorResult.error, "Local Supabase is offline.");

  const unavailableResult = await loadInventoryWithFallback(null);

  assert.equal(unavailableResult.source, "mock");
  assert.equal(unavailableResult.cars, mockCars);
  assert.equal(unavailableResult.error, "Supabase client unavailable.");

  console.log("Inventory provider fallback smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
