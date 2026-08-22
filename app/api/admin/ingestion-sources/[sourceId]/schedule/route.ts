import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";

const validModes = new Set(["manual", "automatic_daily"]);

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  try {
    const body: unknown = await request.json();
    const ingestionMode =
      typeof body === "object" && body !== null && "ingestionMode" in body
        ? (body as { ingestionMode?: unknown }).ingestionMode
        : null;
    const scheduledRunTime =
      typeof body === "object" && body !== null && "scheduledRunTime" in body
        ? (body as { scheduledRunTime?: unknown }).scheduledRunTime
        : null;

    if (typeof ingestionMode !== "string" || !validModes.has(ingestionMode)) {
      return NextResponse.json({ error: "Choose Manual or Automatic daily." }, { status: 400 });
    }

    if (typeof scheduledRunTime !== "string" || !isValidTime(scheduledRunTime)) {
      return NextResponse.json({ error: "Choose a valid daily run time." }, { status: 400 });
    }

    const { sourceId } = await context.params;
    const supabase = createLocalAdminClient();
    const { error } = await supabase
      .from("listing_sources")
      .update({
        ingestion_mode: ingestionMode,
        scheduled_run_time: scheduledRunTime,
      })
      .eq("id", sourceId);

    if (error) throw error;

    return NextResponse.json({ ingestionMode, scheduledRunTime });
  } catch (error) {
    console.error("Unable to update ingestion schedule:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save ingestion controls.",
      },
      { status: 500 },
    );
  }
}
