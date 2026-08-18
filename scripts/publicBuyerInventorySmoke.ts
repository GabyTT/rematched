import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { readBuyerVisibleInventoryCars } from "../lib/buyerInventory.ts";
import type { Database } from "../lib/database.types.ts";

function loadLocalEnv() {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");

  for (const line of envFile.split("\n")) {
    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0 || line.trim().startsWith("#")) {
      continue;
    }

    process.env[line.slice(0, separatorIndex)] ??= line.slice(separatorIndex + 1);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  loadLocalEnv();

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const cars = await readBuyerVisibleInventoryCars(supabase);
  const kia = cars.find((car) => car.name === "2016 Kia Sorento");

  if (!kia) {
    assert(
      cars.length === 0,
      "Expected no public listings after test data cleanup, or the known Live Kia fixture.",
    );
    console.log("Public buyer inventory smoke test passed with no Live local listings.");
    return;
  }

  assert(!kia.imageIsPlaceholder, "The public buyer page should use the approved seller photo.");
  assert(kia.image.includes("seller-listing-media"), "The public buyer page should receive a seller-photo URL.");
  assert(kia.sellerContactName, "The Live Kia should include the seller-confirmed public name.");
  assert(kia.sellerContactPhone, "The Live Kia should include the seller-confirmed public phone.");
  assert(!("sourceName" in kia), "Buyer cards must not receive a source name.");
  assert(!("sourceListingUrl" in kia), "Buyer cards must not receive a source URL.");

  const { data: sourceRows, error: sourceError } = await supabase
    .from("normalized_listings")
    .select("source_listing_url")
    .eq("id", kia.id);

  assert(!sourceError, "The public source-field privacy check should not error.");
  assert(sourceRows?.length === 0, "Public buyers must not be able to read source URLs.");

  console.log("Public buyer inventory smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
