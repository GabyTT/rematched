import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { readBuyerVisibleInventoryCars } from "../lib/buyerInventory";
import type { Database } from "../lib/database.types";

const buyerEmail = "buyer-inventory-smoke@example.test";
const password = "buyer-inventory-smoke-password";

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
      display_name: "Buyer Inventory Smoke",
      role: "buyer",
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

  assert(buyerUser, "Expected buyer smoke-test user.");

  await saveBuyerProfile(supabase, buyerUser.id);

  const cars = await readBuyerVisibleInventoryCars(supabase);
  const smokeCars = cars.filter((car) => car.name.includes("Toyota Corolla"));

  assertEqual(smokeCars.length, 1, "Loader should return one buyer-visible smoke-test car");
  assertEqual(smokeCars[0]?.name, "2020 Toyota Corolla", "Loader should preserve display name");
  assertEqual(smokeCars[0]?.brand, "Toyota", "Loader should map listing brand");
  assertEqual(smokeCars[0]?.model, "Corolla", "Loader should map listing model");
  assertEqual(smokeCars[0]?.price, "$118,000 TTD", "Loader should format listing price");
  assertEqual(smokeCars[0]?.mileage, "65,000 km", "Loader should format listing mileage");
  assertEqual(smokeCars[0]?.vehicleType, "sedan", "Loader should normalize listing body type");
  assertEqual(
    smokeCars[0]?.image,
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80",
    "Loader should map the primary normalized listing image",
  );

  await supabase.auth.signOut();

  console.log("Buyer inventory loader smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
