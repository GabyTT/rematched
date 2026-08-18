import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import { previewTriniCarsForSaleListingsForDate } from "@/lib/ingestion/triniCarsForSaleAdapter";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  try {
    const { sourceId } = await context.params;
    const body = (await request.json()) as { sourceListingDate?: unknown };
    const sourceListingDate = typeof body.sourceListingDate === "string" ? body.sourceListingDate : "";

    const supabase = createLocalAdminClient();
    const { data: source, error: sourceError } = await supabase
      .from("listing_sources")
      .select("source_name, ingestion_enabled, ingestion_mode")
      .eq("id", sourceId)
      .single();

    if (sourceError) throw sourceError;

    if (source.source_name !== "TriniCarsForSale") {
      return NextResponse.json({ error: "This source check is only available for TriniCarsForSale." }, { status: 400 });
    }

    if (!source.ingestion_enabled || source.ingestion_mode !== "manual") {
      return NextResponse.json(
        { error: "Save Manual mode before checking source listings." },
        { status: 400 },
      );
    }

    const result = await previewTriniCarsForSaleListingsForDate({ sourceListingDate });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to check TriniCars source listings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check source listings." },
      { status: 500 },
    );
  }
}
