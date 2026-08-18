# Controlled Ingestion Adapter

## Purpose

This is the first reusable ingestion milestone. It replaces the hardcoded one-off ingestion test with a source-adapter boundary that can later support a permitted marketplace API, feed, export, or scraper.

For the complete operational process—from source fetch through admin work and go-live—see [Ingestion and Admin Process](./ingestion-and-admin-process.md). This document covers the adapter commands and safeguards only.

The adapter preserves source data in the existing raw ingestion tables. The manual Admin test also runs normalization so the records appear in **Imported**, but it never makes them buyer-visible.

## Safe Dry Run

```bash
npm run ingest:controlled
```

The default command validates `fixtures/ingestion/controlled-sample.json` and prints a summary. It does not write to Supabase.

To validate another compatible file:

```bash
npm run ingest:controlled -- path/to/source-file.json
```

## Local Database Write

With local Supabase running and the service-role key available in `.env.local`:

```bash
npm run ingest:controlled -- --write-db
```

Writing creates an inspectable ingestion run, upserts raw listings by source and stable source ID, and refreshes their raw image links. Re-running the same fixture updates the raw records instead of creating duplicate listings.

## Controlled Normalization

After the raw listings have been written, normalize them with:

```bash
npm run normalize:controlled
```

This parses clean fields such as year, make, model, price, and mileage. It also evaluates confidence and buyer eligibility. Listings with missing images or other important gaps remain in review and are not shown to buyers.

## Image Safety Gate

Source images remain blocked by default with `preview_allowed = false`. If written permission has not been verified, the UI must use the standard AI placeholder and disclose that it is not the actual vehicle. See `docs/image-rights-placeholder-process.md`.

## Before Adding a Live Source

Confirm that access is permitted and choose the source's stable listing ID, fetch cadence, attribution requirements, image-preview permission, and failure behavior. Then implement the `ListingSourceAdapter` contract in `lib/ingestion/sourceAdapter.ts`.

## Private TriniCars Test

The TriniCarsForSale adapter is intentionally restricted to a private development test of five listings. It reads the public list and detail pages once per run and keeps factual vehicle fields plus the public contact text shown on the source listing cards. That contact text is for internal admin review only. It must not be shown to buyers or used for automated outreach.

For Admin review only, the adapter may retain one remote TriniCars image URL. The Admin screen loads that image directly from TriniCars with no referrer and labels it as an admin-only source preview. The image remains marked `preview_allowed = false`, so it cannot replace the AI placeholder on buyer screens. This temporary test behavior is not permission for production republication.

Dry run:

```bash
npm run ingest:trinicars:test
```

Write the five records to local Supabase:

```bash
npm run ingest:trinicars:test -- --write-db
```

### Recommended manual test method

For normal local testing, use the Admin screen instead of Terminal:

1. Open **Admin → 1. Ingest**.
2. Choose and save **Manual** mode.
3. Select **Run test ingestion now**.

This fetches a maximum of five TriniCarsForSale records, stores them locally, normalizes the current source records into **Imported**, and refreshes Run history. It does not publish anything to buyers or contact sellers.

Do not use this adapter in production, schedule it, increase its five-listing limit, or publish its imported records without first agreeing access and attribution terms with TriniCarsForSale.
