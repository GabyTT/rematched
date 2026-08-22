# Inventory Pipeline Validation

## Objective

Document that the current inventory pipeline successfully supports:

raw listing
-> manual normalization
-> buyer visibility eligibility
-> image linkage
-> frontend rendering
-> buyer interaction flow

## Context

This validation was done after:

- local Supabase was restored and running through Docker
- manual ingestion test had already run
- manual normalization test had already run
- the app was running locally through npm run dev

## What Was Verified

### 1. Supabase Connectivity

Local Supabase was running and accessible through Supabase Studio. This confirmed that the local database, API layer, and dashboard were available for inspection during validation.

### 2. Normalized Listing Eligibility

The normalized listing table included a test listing with:

- review_status = approved
- recommendation_state = eligible
- is_buyer_visible = true
- buyer_visibility_reason = Manual normalization test listing approved
- normalization_confidence = 0.850

These values confirmed that the listing had passed the basic buyer-visibility requirements for the MVP flow.

### 3. Image Linkage

The normalized_listing_images table included image records linked to normalized_listing_id, with:

- display_url values
- display_order values
- is_primary flags

This confirmed that the normalized listing had usable image records connected to it, rather than only text data.

### 4. Frontend Rendering

The buyer-facing Discover / Explore More area displayed the normalized listing as a car card.

Observed rendered listing:

- 2020 Toyota Corolla
- Sedan
- $118,000 TTD
- image rendered successfully
- appeared under Explore More / All
- showed existing interaction state as "The One"
- card actions rendered correctly, including View Details, Pass, and Back to Liked

## Validation Results Table

| Component | Result | Notes |
|---|---|---|
| Local Supabase connectivity | Passed | Supabase Studio was accessible |
| Manual ingestion | Passed | Raw listing flow had already been run |
| Manual normalization | Passed | Normalized listing was created |
| Buyer eligibility fields | Passed | Listing had approved + eligible + buyer-visible values |
| Image linkage | Passed | Normalized images were linked and renderable |
| Frontend rendering | Passed | Listing appeared in Discover / Explore More |
| Buyer interaction state | Passed | Listing displayed as liked/top-pick state in the UI |

## Known-Good Baseline

This is the known-good state before edge-case testing begins.

The baseline includes:

- Supabase running locally through Docker
- Next app running locally
- at least one approved buyer-visible normalized listing exists
- at least one linked image exists
- frontend can read and render the listing
- buyer flow can show interaction state

This means the full MVP inventory path has been proven once under controlled conditions. Future tests should compare failures against this state.

## Important Notes

- The Supabase dashboard showed local security/performance warnings, but these were not treated as blocking for this MVP validation.
- The next phase should not start from assumptions; it should use this document as the baseline.
- If edge-case tests break the pipeline, compare against this known-good state.

## Remaining Risks / Next Testing Areas

The current validation proves the happy path. The following areas still need stress-testing:

- duplicate listings
- missing mileage
- missing price
- inconsistent price formatting
- inconsistent make/model naming
- WhatsApp-only sellers
- dealer reposting
- missing images
- broken image URLs
- low normalization confidence
- visibility rule conflicts
- fallback to mock data happening unexpectedly

## Next Step

The next step is to create and run normalization edge-case tests to stress-test the ingestion and recommendation pipeline.
