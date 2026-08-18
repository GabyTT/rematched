import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import { runTriniCarsTestIngestion } from "@/lib/ingestion/runTriniCarsTestIngestion";

export const runtime = "nodejs";
export const maxDuration = 300;

let isTestRunInProgress = false;

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  if (isTestRunInProgress) {
    return NextResponse.json(
      { error: "A test ingestion is already running. Please wait for it to finish." },
      { status: 409 },
    );
  }

  try {
    const { sourceId } = await context.params;
    const supabase = createLocalAdminClient();
    const { data: source, error: sourceError } = await supabase
      .from("listing_sources")
      .select("source_name, ingestion_enabled, ingestion_mode")
      .eq("id", sourceId)
      .single();

    if (sourceError) throw sourceError;

    if (source.source_name !== "TriniCarsForSale") {
      return NextResponse.json({ error: "This manual test is only available for TriniCarsForSale." }, { status: 400 });
    }

    if (!source.ingestion_enabled) {
      return NextResponse.json({ error: "Ingestion is currently disabled for this source." }, { status: 400 });
    }

    if (source.ingestion_mode !== "manual") {
      return NextResponse.json(
        { error: "Save Manual mode before starting a test ingestion." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      sourceListingIds?: unknown;
      sourceListingDate?: unknown;
      sourceListingsFound?: unknown;
      manualImportType?: unknown;
    };
    const sourceListingIds = Array.isArray(body.sourceListingIds)
      ? [...new Set(body.sourceListingIds.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter(Boolean))]
      : [];

    if (sourceListingIds.length === 0) {
      return NextResponse.json(
        { error: "Check the source listings first, then confirm the import." },
        { status: 400 },
      );
    }

    const sourceListingDate =
      typeof body.sourceListingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.sourceListingDate)
        ? body.sourceListingDate
        : null;
    const sourceListingsFound =
      typeof body.sourceListingsFound === "number" &&
      Number.isInteger(body.sourceListingsFound) &&
      body.sourceListingsFound >= sourceListingIds.length
        ? body.sourceListingsFound
        : null;
    const manualImportType = body.manualImportType === "test" || body.manualImportType === "full"
      ? body.manualImportType
      : null;

    if (!sourceListingDate || sourceListingsFound === null || !manualImportType) {
      return NextResponse.json(
        { error: "The selected date and import details are missing. Check the source listings again." },
        { status: 400 },
      );
    }

    if (manualImportType === "test" && sourceListingIds.length > 5) {
      return NextResponse.json(
        { error: "A test import can include no more than five listings." },
        { status: 400 },
      );
    }

    isTestRunInProgress = true;
    const result = await runTriniCarsTestIngestion({
      sourceListingIds,
      sourceListingDate,
      sourceListingsFound,
      manualImportType,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to run TriniCars test ingestion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run test ingestion." },
      { status: 500 },
    );
  } finally {
    isTestRunInProgress = false;
  }
}
