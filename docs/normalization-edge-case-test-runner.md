# Normalization Edge-Case Test Runner

## Purpose

The normalization edge-case test runner is a local verification utility for stress-testing RevMatched's inventory normalization layer.

It checks realistic Trinidad marketplace listings against expected normalized outputs before ingestion is scaled.

The runner verifies:

- parsing accuracy
- duplicate handling
- recommendation eligibility
- buyer visibility behavior
- normalization confidence scoring
- image linkage health

It does not change production app behavior.

## Files

The workflow uses two script files:

- `scripts/normalizationEdgeCaseDataset.ts`
- `scripts/normalizationEdgeCaseTestRunner.ts`

The dataset file contains the raw marketplace-style listings and expected outputs.

The runner file normalizes those cases, compares actual values against expected values, and prints a pass/fail summary.

## How To Run

Run the dry-run verification:

```bash
npm run test:normalization-edge-cases
```

This runs the fixture in memory and prints the verification report.

It does not write to Supabase.

To also insert the edge-case raw and normalized records into local Supabase, run:

```bash
npm run test:normalization-edge-cases -- --write-db
```

Use `--write-db` only when local Supabase is running and `.env.local` contains:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The database write mode uses the local `manual_edge_case` listing source. It clears previous records for that local test source before writing fresh edge-case rows.

## What Pass / Fail Means

`PASS` means the runner's actual normalized output matched the expected output for every verified field.

`FAIL` means at least one actual value differed from the expected value.

Failures are useful. They show where the normalization layer is not yet handling a real marketplace behavior correctly.

Examples:

- a price was parsed incorrectly
- mileage was not recovered from messy text
- a duplicate was not flagged
- a listing became buyer-visible when it should be hidden
- confidence scoring did not match the expected risk level

## Fields Being Verified

The runner compares the following fields for every edge case:

- `title`
- `price_amount`
- `year`
- `brand_name`
- `model_name`
- `body_type`
- `mileage_value`
- `location_label`
- `seller_type`
- `contact_method`
- `import_status`
- `review_status`
- `recommendation_state`
- `is_buyer_visible`
- `buyer_visibility_reason`
- `normalization_confidence`

For duplicate cases, it also verifies:

- `duplicate_group_id`
- `expected_duplicate_behavior`

The console output also shows:

- image health
- buyer visibility comparison
- recommendation state comparison
- confidence score comparison
- duplicate group comparison

## Verification Workflow

The intended workflow is:

1. Add or update an edge case in `scripts/normalizationEdgeCaseDataset.ts`.
2. Define the expected normalized output.
3. Run `npm run test:normalization-edge-cases`.
4. Review the console summary.
5. If the runner fails, decide whether the dataset expectation or the normalizer behavior should change.
6. Once the dry run passes, optionally run with `--write-db` to inspect the records in local Supabase Studio.

This gives RevMatched a repeatable safety check before new ingestion logic is trusted.

## Console Summary

The runner prints four main sections.

### Case Results

Shows each edge case, category, pass/fail status, recommendation state, buyer visibility, confidence score, duplicate group, and image health.

### Confidence Score Comparison

Shows expected vs actual confidence scores.

This helps confirm that the system is not treating weak, ambiguous, or duplicate-prone listings as overly trustworthy.

### Duplicate Detection Verification

Shows expected vs actual duplicate groups for duplicate scenarios.

This helps prevent buyers from seeing multiple cards for the same vehicle.

### Buyer Visibility Verification

Shows expected vs actual buyer visibility and recommendation state.

This is the most important product safety check because it determines what can appear in buyer-facing discovery.

## How To Add Future Edge Cases

Add a new object to `normalizationEdgeCaseDataset`.

Each case should include:

- a stable `id`, such as `edge-011`
- a `category`
- a short `scenario`
- messy raw listing fields
- expected normalized output
- notes explaining what the case is testing

Good future cases include:

- missing make or model
- price ranges, such as `95k to 100k`
- trade-in accepted language
- transfer included language
- multiple phone numbers
- dealer and private seller ambiguity
- sold or unavailable listings
- stale reposts
- reused photos across different sellers
- listings with no source URL

Do not add fake certainty just to make a case pass. If the listing is ambiguous, the expected output should preserve that ambiguity through lower confidence, `review_required`, `limited`, or `hidden`.

## Local Supabase Write Mode

The optional `--write-db` mode is for local inspection only.

It writes:

- raw listings
- raw listing images
- normalized listings
- normalized listing images
- one ingestion run summary

It does not modify production data.

Before using it, confirm local Supabase is running through Docker and that Supabase Studio is accessible.

## Next Step

Use the runner as the baseline while improving the real normalization pipeline.

When new parsing logic is added, this runner should be run before trusting the change in buyer-facing discovery.
