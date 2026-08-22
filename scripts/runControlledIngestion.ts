import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types.ts";
import { createJsonSourceAdapter } from "../lib/ingestion/jsonSourceAdapter.ts";
import { persistRawIngestion } from "../lib/ingestion/persistRawIngestion.ts";
import { fetchValidatedListings } from "../lib/ingestion/sourceAdapter.ts";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    process.env[trimmed.slice(0, separator)] ??= trimmed.slice(separator + 1);
  }
}

function serviceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SERVICE_ROLE_KEY
  );
}

async function main() {
  const writeDatabase = process.argv.includes("--write-db");
  const pathArgument = process.argv.find((argument) => argument.endsWith(".json"));
  const fixturePath = resolve(
    process.cwd(),
    pathArgument ?? "fixtures/ingestion/controlled-sample.json",
  );
  const adapter = createJsonSourceAdapter(fixturePath);
  const listings = await fetchValidatedListings(adapter);

  console.log(`Validated ${listings.length} listings from ${adapter.source.name}.`);
  console.table(
    listings.map((listing) => ({
      source_listing_id: listing.sourceListingId,
      title: listing.title ?? "",
      price: listing.priceText ?? "",
      images: listing.images?.length ?? 0,
    })),
  );

  if (!writeDatabase) {
    console.log("Dry run only. Add --write-db to store these listings in local Supabase.");
    return;
  }

  loadLocalEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceRoleKey();

  if (!supabaseUrl || !key) {
    throw new Error(
      "Database write requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const result = await persistRawIngestion(supabase, adapter);
  console.log("Raw ingestion completed.", result);

  if (result.parserErrors > 0) {
    throw new Error(
      `Ingestion finished with ${result.parserErrors} listing error(s).`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
