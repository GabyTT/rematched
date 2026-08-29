import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Car } from "../lib/cars.ts";
import { readBuyerVisibleInventoryCars } from "../lib/buyerInventory.ts";
import type { Database } from "../lib/database.types.ts";
import { loadInventoryWithFallback } from "../lib/inventoryProvider.ts";

const buyerEmail = "inventory-provider-integration@example.test";
const password = "inventory-provider-integration-password";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    const value = trimmedLine.slice(separatorIndex + 1);

    process.env[key] ??= value;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}.`);
  }
}

function assertCarShape(car: Car) {
  assert(typeof car.id === "string" && car.id.length > 0, "Car id should be a non-empty string.");
  assert(typeof car.name === "string" && car.name.length > 0, "Car name should be a non-empty string.");
  assert(typeof car.year === "number", "Car year should be a number.");
  assert(typeof car.make === "string" && car.make.length > 0, "Car make should be a non-empty string.");
  assert(typeof car.price === "string" && car.price.length > 0, "Car price should be a non-empty string.");
  assert(typeof car.priceValue === "number", "Car priceValue should be a number.");
  assert(typeof car.mileage === "string" && car.mileage.length > 0, "Car mileage should be a non-empty string.");
  assert(typeof car.fuel === "string" && car.fuel.length > 0, "Car fuel should be a non-empty string.");
  assert(typeof car.transmission === "string" && car.transmission.length > 0, "Car transmission should be a non-empty string.");
  assert(typeof car.location === "string" && car.location.length > 0, "Car location should be a non-empty string.");
  assert(typeof car.category === "string" && car.category.length > 0, "Car category should be a non-empty string.");
  assert(typeof car.vehicleType === "string" && car.vehicleType.length > 0, "Car vehicleType should be a non-empty string.");
  assert(typeof car.brand === "string" && car.brand.length > 0, "Car brand should be a non-empty string.");
  assert(typeof car.model === "string" && car.model.length > 0, "Car model should be a non-empty string.");
  assert(typeof car.image === "string" && car.image.length > 0, "Car image should be a non-empty string.");
}

async function signInOrCreateUser(
  supabase: ReturnType<typeof createClient<Database>>,
  email: string,
) {
  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInResult.error) {
    return signInResult.data.user;
  }

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpResult.error) {
    throw signUpResult.error;
  }

  const retrySignInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (retrySignInResult.error) {
    throw retrySignInResult.error;
  }

  return retrySignInResult.data.user;
}

async function saveBuyerProfile(
  supabase: ReturnType<typeof createClient<Database>>,
  authUserId: string,
) {
  const { error } = await supabase.from("profiles").upsert(
    {
      auth_user_id: authUserId,
      display_name: "Inventory Provider Integration",
    },
    {
      onConflict: "auth_user_id",
    },
  );

  if (error) {
    throw error;
  }
}

async function main() {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assert(supabaseUrl, "Missing NEXT_PUBLIC_SUPABASE_URL.");
  assert(supabaseAnonKey, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const buyerUser = await signInOrCreateUser(supabase, buyerEmail);

  assert(buyerUser, "Expected buyer integration-test user.");

  await saveBuyerProfile(supabase, buyerUser.id);

  const loadedCars = await readBuyerVisibleInventoryCars(supabase);
  const loadedSmokeCars = loadedCars.filter((car) =>
    car.name.includes("Toyota Corolla"),
  );

  assertEqual(loadedSmokeCars.length, 1, "Direct loader should return one smoke-test car");
  assertCarShape(loadedSmokeCars[0]);

  const providerResult = await loadInventoryWithFallback(supabase);
  const providerSmokeCars = providerResult.cars.filter((car) =>
    car.name.includes("Toyota Corolla"),
  );

  assertEqual(providerResult.source, "supabase", "Provider should use Supabase inventory");
  assertEqual(providerResult.error, undefined, "Provider should not include an error when using Supabase");
  assertEqual(providerSmokeCars.length, 1, "Provider should return one smoke-test car");
  assertCarShape(providerSmokeCars[0]);
  assertEqual(providerSmokeCars[0]?.price, "$118,000 TTD", "Provider should return formatted Car price");
  assertEqual(providerSmokeCars[0]?.image, "/ai-car-placeholder.png", "Provider should not expose imported source imagery to buyers");

  await supabase.auth.signOut();

  console.log("Inventory provider Supabase integration test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
