import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { persistRawIngestion } from "@/lib/ingestion/persistRawIngestion";
import { flagMissingSourceListings } from "@/lib/ingestion/flagMissingSourceListings";
import { createTriniCarsForSaleTestAdapter } from "@/lib/ingestion/triniCarsForSaleAdapter";
import { normalizeSourceInventory } from "@/lib/normalization/normalizeSourceInventory";
import {
  getLocalServiceRoleKey,
  loadLocalSupabaseEnv,
} from "@/scripts/loadLocalSupabaseEnv";

export async function runTriniCarsTestIngestion(options?: {
  sourceListingIds?: string[];
  manualImportType?: "test" | "full";
  sourceListingDate?: string;
  sourceListingsFound?: number;
}) {
  loadLocalSupabaseEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getLocalServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "The local Supabase connection is not available. Start local Supabase, then try again.",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const adapter = createTriniCarsForSaleTestAdapter({
    limit: 5,
    sourceListingIds: options?.sourceListingIds,
  });
  const ingestion = await persistRawIngestion(
    supabase,
    adapter,
    options?.manualImportType && options.sourceListingDate && options.sourceListingsFound !== undefined
      ? {
          manualImportType: options.manualImportType,
          sourceListingDate: options.sourceListingDate,
          sourceListingsFound: options.sourceListingsFound,
          sourceListingIds: options.sourceListingIds ?? [],
        }
      : undefined,
  );

  if (ingestion.parserErrors > 0) {
    throw new Error(
      `The test run finished with ${ingestion.parserErrors} listing error(s). Check Run history before trying again.`,
    );
  }

  const normalization = await normalizeSourceInventory(supabase, "TriniCarsForSale");

  if (normalization.errors > 0) {
    throw new Error(
      `The source records were fetched, but ${normalization.errors} record(s) could not be normalized. Check Run history before trying again.`,
    );
  }

  const sourcePresenceReview =
    options?.manualImportType && options.sourceListingDate
      ? await flagMissingSourceListings({
          supabase,
          sourceName: "TriniCarsForSale",
          sourceListingDate: options.sourceListingDate,
          currentRunId: ingestion.run.id,
          currentSourceListingIds: options.sourceListingIds ?? [],
          manualImportType: options.manualImportType,
        })
      : { flaggedSourceListingIds: [], clearedSourceListingIds: [] };

  return {
    runId: ingestion.run.id,
    fetched: ingestion.fetched,
    stored: ingestion.stored,
    normalized: normalization.normalized,
    sourceListingsFlaggedForReview: sourcePresenceReview.flaggedSourceListingIds.length,
  };
}
