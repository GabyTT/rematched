import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

function readSourceListingIds(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];
}

/**
 * A full, date-scoped re-import is the only safe time to compare source IDs.
 * A test-five import is intentionally incomplete and must never flag a listing
 * as absent from the source.
 */
export async function flagMissingSourceListings(input: {
  supabase: TypedSupabaseClient;
  sourceName: string;
  sourceListingDate: string;
  currentRunId: string;
  currentSourceListingIds: string[];
  manualImportType: "test" | "full";
}) {
  if (input.manualImportType !== "full") {
    return { flaggedSourceListingIds: [], clearedSourceListingIds: [] };
  }

  const currentIds = [...new Set(input.currentSourceListingIds.map((id) => id.trim()))].filter(Boolean);
  if (currentIds.length === 0) {
    return { flaggedSourceListingIds: [], clearedSourceListingIds: [] };
  }

  const { data: source, error: sourceError } = await input.supabase
    .from("listing_sources")
    .select("id")
    .eq("source_name", input.sourceName)
    .single();

  if (sourceError) throw sourceError;

  const { data: priorRuns, error: priorRunsError } = await input.supabase
    .from("ingestion_runs")
    .select("source_listing_ids")
    .eq("listing_source_id", source.id)
    .eq("manual_import_type", "full")
    .eq("source_listing_date", input.sourceListingDate)
    .neq("id", input.currentRunId);

  if (priorRunsError) throw priorRunsError;

  const previousIds = new Set(
    (priorRuns ?? []).flatMap((run) => readSourceListingIds(run.source_listing_ids)),
  );
  const currentIdSet = new Set(currentIds);
  const missingIds = [...previousIds].filter((sourceListingId) => !currentIdSet.has(sourceListingId));

  // A returned record is no longer missing. Keep its review status untouched;
  // only clear this specific source-presence warning.
  const { error: clearError } = await input.supabase
    .from("normalized_listings")
    .update({ source_missing_at: null, source_missing_run_id: null })
    .eq("listing_source_id", source.id)
    .in("source_listing_id", currentIds);

  if (clearError) throw clearError;

  if (missingIds.length === 0) {
    return { flaggedSourceListingIds: [], clearedSourceListingIds: currentIds };
  }

  const { data: candidates, error: candidatesError } = await input.supabase
    .from("normalized_listings")
    .select("id, source_listing_id, workflow_status")
    .eq("listing_source_id", source.id)
    .in("source_listing_id", missingIds);

  if (candidatesError) throw candidatesError;

  // Do not reopen a listing the admin has already deliberately retired.
  const candidateIds = (candidates ?? [])
    .filter((listing) => listing.workflow_status !== "retired")
    .map((listing) => listing.id);

  if (candidateIds.length > 0) {
    const { error: flagError } = await input.supabase
      .from("normalized_listings")
      .update({
        source_missing_at: new Date().toISOString(),
        source_missing_run_id: input.currentRunId,
        review_status: "review_required",
        recommendation_state: "review_required",
      })
      .in("id", candidateIds);

    if (flagError) throw flagError;
  }

  return {
    flaggedSourceListingIds: (candidates ?? [])
      .filter((listing) => candidateIds.includes(listing.id))
      .map((listing) => listing.source_listing_id)
      .filter((id): id is string => Boolean(id)),
    clearedSourceListingIds: currentIds,
  };
}
