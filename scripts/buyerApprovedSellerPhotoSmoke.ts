import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { readBuyerVisibleInventoryCars } from "../lib/buyerInventory.ts";
import type { Database } from "../lib/database.types.ts";

const buyerEmail = "buyer-inventory-smoke@example.test";
const password = "buyer-inventory-smoke-password";

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
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: buyerEmail,
    password,
  });
  if (signInError) throw signInError;

  const cars = await readBuyerVisibleInventoryCars(supabase);
  const kia = cars.find((car) => car.name === "2016 Kia Sorento");

  assert(kia, "The Live Kia should be present in buyer inventory.");
  assert(!kia.imageIsPlaceholder, "The Live Kia should use an approved seller photo.");
  assert(
    kia.image.includes("seller-listing-media"),
    "The Live Kia should use a signed URL from the seller-photo bucket.",
  );
  assert(
    (kia.images?.length ?? 0) > 1,
    "The Live Kia should provide every approved seller photo to the buyer gallery.",
  );
  assert(kia.sellerContactName, "The Live Kia should include the seller-confirmed public name.");
  assert(kia.sellerContactPhone, "The Live Kia should include the seller-confirmed public phone.");

  await supabase.auth.signOut();
  console.log("Approved seller photo buyer-inventory smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
