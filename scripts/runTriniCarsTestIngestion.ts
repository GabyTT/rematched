import { runTriniCarsTestIngestion } from "../lib/ingestion/runTriniCarsTestIngestion.ts";
import { fetchValidatedListings } from "../lib/ingestion/sourceAdapter.ts";
import { createTriniCarsForSaleTestAdapter } from "../lib/ingestion/triniCarsForSaleAdapter.ts";

async function main() {
  if (!process.argv.includes("--write-db")) {
    const listings = await fetchValidatedListings(
      createTriniCarsForSaleTestAdapter({ limit: 5 }),
    );
    console.log(`Fetched and validated ${listings.length} private test listings.`);
    console.log("Dry run only. Add --write-db to store and normalize these records in local Supabase.");
    return;
  }

  const result = await runTriniCarsTestIngestion();
  console.log("Private TriniCars test ingestion completed.", result);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
