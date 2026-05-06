import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import {
  readActivePreferenceProfile,
  readCurrentUserProfile,
  replaceSelectedPreferenceBrands,
  saveActivePreferenceProfile,
  saveCurrentUserProfile,
} from "../lib/phase1ProfilePreferences";

const testEmail = "phase1-helper-smoke@example.test";
const testPassword = "phase1-helper-smoke-password";

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

async function signInOrCreateTestUser(
  supabase: ReturnType<typeof createClient<Database>>,
) {
  const signInResult = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (!signInResult.error) {
    return signInResult.data.user;
  }

  const signUpResult = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpResult.error) {
    throw signUpResult.error;
  }

  const retrySignInResult = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (retrySignInResult.error) {
    throw retrySignInResult.error;
  }

  return retrySignInResult.data.user;
}

async function cleanupCurrentUserProfile(
  supabase: ReturnType<typeof createClient<Database>>,
) {
  const profile = await readCurrentUserProfile(supabase);

  if (!profile) {
    return;
  }

  const { error } = await supabase.from("profiles").delete().eq("id", profile.id);

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

  const user = await signInOrCreateTestUser(supabase);

  assert(user, "Expected a signed-in local test user.");

  await cleanupCurrentUserProfile(supabase);

  const savedProfile = await saveCurrentUserProfile(supabase, {
    display_name: "Phase 1 Helper Smoke",
    phone: "+18685550111",
    whatsapp_enabled: true,
  });

  assertEqual(savedProfile.auth_user_id, user.id, "Profile should belong to the test user");
  assertEqual(savedProfile.display_name, "Phase 1 Helper Smoke", "Profile display name should save");
  assertEqual(savedProfile.whatsapp_enabled, true, "WhatsApp preference should save");

  const readProfile = await readCurrentUserProfile(supabase);

  assert(readProfile, "Expected readCurrentUserProfile to return the saved profile.");
  assertEqual(readProfile.id, savedProfile.id, "Read profile should match saved profile");

  const savedPreferenceProfile = await saveActivePreferenceProfile(supabase, {
    budget_min: 90000,
    budget_max: 155000,
    vehicle_type: "suv",
    model_query: "RAV4",
  });

  assertEqual(savedPreferenceProfile.profile_id, savedProfile.id, "Preference profile should belong to saved profile");
  assertEqual(savedPreferenceProfile.is_active, true, "Preference profile should be active");
  assertEqual(savedPreferenceProfile.budget_min, 90000, "Minimum budget should save");
  assertEqual(savedPreferenceProfile.budget_max, 155000, "Maximum budget should save");
  assertEqual(savedPreferenceProfile.vehicle_type, "suv", "Vehicle type should save");
  assertEqual(savedPreferenceProfile.model_query, "RAV4", "Model query should save");

  const readPreferenceProfile = await readActivePreferenceProfile(supabase);

  assert(readPreferenceProfile, "Expected readActivePreferenceProfile to return the saved preference profile.");
  assertEqual(readPreferenceProfile.id, savedPreferenceProfile.id, "Read preference profile should match saved preference profile");

  const savedBrands = await replaceSelectedPreferenceBrands(supabase, savedPreferenceProfile.id, [
    "Toyota",
    "Honda",
    "Toyota",
    "  Nissan  ",
    "",
  ]);

  assertEqual(savedBrands.length, 3, "Replacing brands should trim blanks and remove duplicates");

  const readPreferenceProfileWithBrands = await readActivePreferenceProfile(supabase);

  assert(readPreferenceProfileWithBrands, "Expected preference profile after replacing brands.");

  const brandNames = readPreferenceProfileWithBrands.preference_profile_brands
    .map((brand) => brand.brand_name)
    .sort();

  assertEqual(brandNames.join(","), "Honda,Nissan,Toyota", "Read-back brands should match saved brands");

  await saveCurrentUserProfile(supabase, {
    display_name: "Phase 1 Helper Smoke Updated",
    phone: "+18685550222",
    whatsapp_enabled: false,
  });

  const updatedProfile = await readCurrentUserProfile(supabase);

  assert(updatedProfile, "Expected updated profile to be readable.");
  assertEqual(updatedProfile.display_name, "Phase 1 Helper Smoke Updated", "Profile update should save");
  assertEqual(updatedProfile.whatsapp_enabled, false, "WhatsApp update should save");

  await saveActivePreferenceProfile(supabase, {
    budget_min: 100000,
    budget_max: 165000,
    vehicle_type: "sedan",
    model_query: "Civic",
  });

  const updatedPreferenceProfile = await readActivePreferenceProfile(supabase);

  assert(updatedPreferenceProfile, "Expected updated preference profile to be readable.");
  assertEqual(updatedPreferenceProfile.id, savedPreferenceProfile.id, "Preference update should reuse active preference profile");
  assertEqual(updatedPreferenceProfile.budget_min, 100000, "Updated minimum budget should save");
  assertEqual(updatedPreferenceProfile.budget_max, 165000, "Updated maximum budget should save");
  assertEqual(updatedPreferenceProfile.vehicle_type, "sedan", "Updated vehicle type should save");
  assertEqual(updatedPreferenceProfile.model_query, "Civic", "Updated model query should save");

  await cleanupCurrentUserProfile(supabase);
  await supabase.auth.signOut();

  console.log("Phase 1 profile/preference helper integration smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
