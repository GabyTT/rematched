import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types.ts";
import { normalizeSourceInventory } from "../lib/normalization/normalizeSourceInventory.ts";
import {
  getLocalServiceRoleKey,
  loadLocalSupabaseEnv,
} from "./loadLocalSupabaseEnv.ts";

async function main() {
  loadLocalSupabaseEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getLocalServiceRoleKey();

  if (!supabaseUrl || !key) {
    throw new Error(
      "Normalization requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const sourceName =
    process.argv.find((argument) => argument.startsWith("--source="))?.slice(9) ??
    "controlled_sample";
  const supabase = createClient<Database>(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const result = await normalizeSourceInventory(supabase, sourceName);

  console.log(
    `Normalized ${result.normalized} of ${result.rawCount} raw listings from ${sourceName}.`,
  );
  console.table(result.results);

  if (result.errors > 0) {
    throw new Error(`Normalization finished with ${result.errors} listing error(s).`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
