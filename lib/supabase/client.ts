"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

type SupabaseBrowserGlobal = typeof globalThis & {
  __revmatchedSupabaseBrowserClient?: SupabaseClient<Database>;
};

const browserSessionStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: (key: string) => window.localStorage.removeItem(key),
};

export function createSupabaseBrowserClient() {
  const browserGlobal = globalThis as SupabaseBrowserGlobal;

  if (browserGlobal.__revmatchedSupabaseBrowserClient) {
    return browserGlobal.__revmatchedSupabaseBrowserClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();

  browserGlobal.__revmatchedSupabaseBrowserClient = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: browserSessionStorage,
        storageKey: "revmatched.auth",
      },
    },
  );
  return browserGlobal.__revmatchedSupabaseBrowserClient;
}
