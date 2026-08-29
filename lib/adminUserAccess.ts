import "server-only";

import { createClient, type User } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getLocalServiceRoleKey, loadLocalSupabaseEnv } from "@/scripts/loadLocalSupabaseEnv";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

function getServiceRoleKey() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === "development") {
    loadLocalSupabaseEnv();
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    const localKey = process.env.NODE_ENV === "development" ? getLocalServiceRoleKey() : undefined;
    if (localKey) return localKey;
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  return key;
}

function getBearerToken(request: Request) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice("Bearer ".length) : null;
}

export function createAdminServiceClient() {
  const { supabaseUrl } = getSupabaseBrowserEnv();
  return createClient<Database>(supabaseUrl, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function requireAdminUser(request: Request): Promise<User> {
  const token = getBearerToken(request);
  if (!token) throw new Error("An authenticated admin session is required.");

  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);
  if (userError || !user) throw new Error("An authenticated admin session is required.");

  const serviceClient = createAdminServiceClient();
  const { data: assignment, error: roleError } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) throw roleError;
  if (!assignment) throw new Error("Admin access is required.");

  return user;
}
