import { createTriniCarsForSaleTestAdapter } from "../lib/ingestion/triniCarsForSaleAdapter.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const detailHtml = `
  <html>
    <head>
      <meta property="og:image" content="http://www.trinicarsforsale.com/images/example.jpg" />
    </head>
    <body>
      <div>220001 PEC</div>
      <table>
        <tr><td>Make:</td><td>Hyundai</td></tr>
        <tr><td>Model:</td><td>Tucson</td></tr>
        <tr><td>Year:</td><td>2023</td></tr>
        <tr><td>Colour:</td><td>Amazon Gray</td></tr>
        <tr><td>Engine Size:</td><td>1600 cc Turbo</td></tr>
        <tr><td>Mileage:</td><td>61,000 km</td></tr>
        <tr><td>Transmission:</td><td>Tiptronic</td></tr>
        <tr><td>Features:</td><td>Air Condition, Bluetooth, Alloy Rims, Bluetooth</td></tr>
        <tr><td>Additional Info:</td><td>One owner. Recently serviced.</td></tr>
        <tr><td>Asking Price:</td><td>TT$180,000 negotiable</td></tr>
        <tr><td>Date Added:</td><td>22 Jul 2026</td></tr>
        <tr><td>Contact Name:</td><td>Jamie</td></tr>
        <tr><td>Contact Phone #'s:</td><td>555-1234</td></tr>
      </table>
    </body>
  </html>`;

async function main() {
  const adapter = createTriniCarsForSaleTestAdapter({
    sourceListingIds: ["220001-168001"],
    fetchImpl: async () => new Response(detailHtml, { status: 200 }),
  });

  const [listing] = await adapter.fetchListings();
  const features = listing.rawPayload.features;

  assert(listing.description === "One owner. Recently serviced.", "Additional Info should be retained as the raw source description.");
  assert(Array.isArray(features), "Source features should be retained as a list in the raw payload.");
  assert(features.length === 3, "Source features should be cleaned and de-duplicated.");
  assert(features[0] === "Air Condition", "Feature order should be preserved.");
  assert(listing.rawPayload.colour === "Amazon Gray", "Existing colour capture should remain intact.");
  assert(listing.rawPayload.engine_size === "1600 cc Turbo", "Existing engine capture should remain intact.");
  assert(listing.rawPayload.plate_series === "PEC", "Plate Series should be captured from the source header.");
  assert(listing.colourText === "Amazon Gray", "Colour should be persisted as a structured source field.");
  assert(listing.engineSizeText === "1600 cc Turbo", "Engine size should be persisted as a structured source field.");
  assert(listing.plateSeriesText === "PEC", "Plate Series should be persisted as a structured source field.");
  assert(listing.isNegotiable, "Negotiable pricing should be captured separately from the numeric price.");
  assert(listing.rawPayload.is_negotiable === true, "Negotiable pricing should be retained in the raw payload.");

  console.log("TriniCars source-field preservation smoke test passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
