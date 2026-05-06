import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import {
  readCurrentUserProfile,
  saveProfileForAuthUser,
} from "../lib/phase1ProfilePreferences";
import { readBuyerVisibleNormalizedListings } from "../lib/normalizedListings";

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
  const email = `signup-profile-rls-${Date.now()}@example.test`;
  const password = "signup-profile-rls-password";

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    throw signUpError;
  }

  assert(signUpData.user?.id, "Expected sign-up to return an Auth user id.");

  if (signUpData.session) {
    await supabase.auth.setSession(signUpData.session);
  } else {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  assert(session?.user.id === signUpData.user.id, "Expected a valid session for the signed-up user.");

  await saveProfileForAuthUser(supabase, signUpData.user.id, {
    display_name: "Sign Up Profile RLS",
    phone: null,
    whatsapp_enabled: false,
  });

  const profile = await readCurrentUserProfile(supabase);

  assert(profile?.auth_user_id === signUpData.user.id, "Expected profile row for signed-up Auth user.");

  const listings = await readBuyerVisibleNormalizedListings(supabase);

  assert(
    listings.some((listing) => listing.source_listing_id === "normalized-helper-visible"),
    "Expected RLS to allow signed-up user to read buyer-visible normalized listings.",
  );

  await supabase.auth.signOut();

  console.log("Sign-up profile and inventory RLS smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
