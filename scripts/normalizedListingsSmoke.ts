import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import { readBuyerVisibleNormalizedListings } from "../lib/normalizedListings";

const buyerEmail = "normalized-helper-buyer@example.test";
const password = "normalized-helper-password";

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
  displayName: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        display_name: displayName,
        role: "buyer",
      },
      {
        onConflict: "auth_user_id",
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
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

  await saveBuyerProfile(supabase, buyerUser.id, "Normalized Helper Buyer");

  const buyerVisibleListings = await readBuyerVisibleNormalizedListings(supabase);

  const smokeListings = buyerVisibleListings.filter(
    (listing) => listing.display_name === "2020 Toyota Corolla",
  );

  assertEqual(smokeListings.length, 1, "Buyer helper should return only one smoke-test listing");
  assertEqual(smokeListings[0]?.display_name, "2020 Toyota Corolla", "Visible listing display name should be readable");
  assert(!("source_listing_id" in (smokeListings[0] ?? {})), "Buyer helper must not expose a source listing ID");

  await supabase.auth.signOut();

  console.log("Normalized listing helper smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
